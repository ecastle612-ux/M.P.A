import { NextResponse } from "next/server";
import { createAuthServerClient } from "../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../lib/organization/server";
import { apiError, apiInternalError, parseJsonBody } from "../../../../lib/api/http";
import {
  addScreeningParty,
  auditScreeningAccess,
  completeAdverseAction,
  getScreeningCaseDetail,
  linkLeaseToScreening,
  recordDecision,
  retryProviderSubmission,
  startAdverseAction
} from "../../../../lib/screening/server";
import { isScreeningDecision } from "../../../../lib/screening/contracts";

type RouteContext = { params: Promise<{ caseId: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { caseId } = await context.params;
    const supabase = await createAuthServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) return apiError(401, "UNAUTHENTICATED", "Unauthenticated");

    const organizationId = await resolveActiveOrganizationIdForUser(user.id);
    if (!organizationId) return apiError(400, "NO_ACTIVE_ORGANIZATION", "No active organization");

    const authorization = await resolveAuthorizationContext(user, organizationId);
    if (!evaluatePermission(authorization, "screening:read")) {
      return apiError(403, "FORBIDDEN", "Forbidden");
    }

    const detail = await getScreeningCaseDetail(organizationId, caseId, supabase);
    if (!detail) return apiError(404, "NOT_FOUND", "Screening case not found");

    const canReadFull = evaluatePermission(authorization, "screening:read_full");
    await auditScreeningAccess(
      organizationId,
      caseId,
      user.id,
      canReadFull ? "view_full" : "view_summary",
      supabase
    );

    return NextResponse.json(
      {
        ...detail,
        // Never expose consent tokens to PM clients after creation list — strip if present
        parties: detail.parties.map((party: { id: string; consentToken: string | null; [key: string]: unknown }) => ({
          ...party,
          consentToken: party.consentToken,
          consentUrl: party.consentToken ? `/screening/consent/${party.consentToken}` : null
        })),
        canReadFull,
        canDecide: evaluatePermission(authorization, "screening:decide")
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return apiInternalError();
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { caseId } = await context.params;
    const supabase = await createAuthServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) return apiError(401, "UNAUTHENTICATED", "Unauthenticated");

    const organizationId = await resolveActiveOrganizationIdForUser(user.id);
    if (!organizationId) return apiError(400, "NO_ACTIVE_ORGANIZATION", "No active organization");

    const authorization = await resolveAuthorizationContext(user, organizationId);
    const parsedBody = await parseJsonBody(request);
    if (!parsedBody.ok) return parsedBody.response;
    const payload = parsedBody.payload as Record<string, unknown>;
    const action = typeof payload["action"] === "string" ? payload["action"] : null;

    if (action === "decide") {
      if (!evaluatePermission(authorization, "screening:decide")) {
        return apiError(403, "FORBIDDEN", "Forbidden");
      }
      if (!isScreeningDecision(payload["decision"])) {
        return apiError(400, "INVALID_PAYLOAD", "decision must be approve|reject|conditional");
      }
      const result = await recordDecision(
        organizationId,
        caseId,
        user.id,
        {
          decision: payload["decision"],
          reasonCodes: Array.isArray(payload["reasonCodes"])
            ? (payload["reasonCodes"] as string[])
            : [],
          notes: typeof payload["notes"] === "string" ? payload["notes"] : null,
          conditions: Array.isArray(payload["conditions"])
            ? (payload["conditions"] as Array<{
                conditionType: string;
                description: string;
                dueAt?: string | null;
              }>)
            : []
        },
        supabase
      );
      return NextResponse.json(result);
    }

    if (action === "complete_adverse_action") {
      if (!evaluatePermission(authorization, "screening:decide")) {
        return apiError(403, "FORBIDDEN", "Forbidden");
      }
      await completeAdverseAction(organizationId, caseId, user.id, supabase);
      return NextResponse.json({ ok: true });
    }

    if (action === "send_pre_adverse") {
      if (!evaluatePermission(authorization, "screening:decide")) {
        return apiError(403, "FORBIDDEN", "Forbidden");
      }
      const row = await startAdverseAction(organizationId, caseId, user.id, "pre_adverse", supabase);
      return NextResponse.json({ adverseAction: row });
    }

    if (action === "retry_provider") {
      if (!evaluatePermission(authorization, "screening:update")) {
        return apiError(403, "FORBIDDEN", "Forbidden");
      }
      await retryProviderSubmission(organizationId, caseId, user.id, supabase);
      return NextResponse.json({ ok: true });
    }

    if (action === "add_party") {
      if (!evaluatePermission(authorization, "screening:create")) {
        return apiError(403, "FORBIDDEN", "Forbidden");
      }
      const role = payload["role"];
      const fullName = payload["fullName"];
      if (typeof role !== "string" || typeof fullName !== "string") {
        return apiError(400, "INVALID_PAYLOAD", "role and fullName required");
      }
      const party = await addScreeningParty(
        organizationId,
        caseId,
        user.id,
        {
          role: role as "co_applicant" | "guarantor" | "co_signer" | "adult_occupant" | "primary",
          fullName,
          email: typeof payload["email"] === "string" ? payload["email"] : null,
          phone: typeof payload["phone"] === "string" ? payload["phone"] : null,
          applicantId: typeof payload["applicantId"] === "string" ? payload["applicantId"] : null
        },
        supabase
      );
      return NextResponse.json({ party }, { status: 201 });
    }

    if (action === "link_lease") {
      if (!evaluatePermission(authorization, "screening:decide")) {
        return apiError(403, "FORBIDDEN", "Forbidden");
      }
      const leaseId = typeof payload["leaseId"] === "string" ? payload["leaseId"] : null;
      if (!leaseId) return apiError(400, "INVALID_PAYLOAD", "leaseId required");
      const screeningCase = await linkLeaseToScreening(organizationId, caseId, leaseId, user.id, supabase);
      return NextResponse.json({ screeningCase });
    }

    return apiError(400, "INVALID_ACTION", "Unknown action");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Screening action failed";
    return apiError(400, "SCREENING_ACTION_FAILED", message);
  }
}
