import { NextResponse } from "next/server";
import { createAuthServerClient } from "../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../lib/organization/server";
import { apiError, apiInternalError, parseJsonBody } from "../../../lib/api/http";
import {
  createScreeningCase,
  getScreeningOpsSnapshot,
  listScreeningCases
} from "../../../lib/screening/server";

export async function GET(request: Request) {
  try {
    const supabase = await createAuthServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) return apiError(401, "UNAUTHENTICATED", "Unauthenticated");

    const organizationId = await resolveActiveOrganizationIdForUser(user.id);
    if (!organizationId) {
      return NextResponse.json({ items: [], ops: null }, { headers: { "Cache-Control": "no-store" } });
    }

    const authorization = await resolveAuthorizationContext(user, organizationId);
    if (!evaluatePermission(authorization, "screening:read")) {
      return apiError(403, "FORBIDDEN", "Forbidden");
    }

    const url = new URL(request.url);
    const applicantId = url.searchParams.get("applicantId") ?? undefined;
    const status = url.searchParams.get("status") ?? undefined;
    const includeOps = url.searchParams.get("ops") === "1";

    const items = await listScreeningCases(
      organizationId,
      {
        ...(applicantId ? { applicantId } : {}),
        ...(status ? { status } : {})
      },
      supabase
    );
    const ops = includeOps ? await getScreeningOpsSnapshot(organizationId, supabase) : null;

    return NextResponse.json({ items, ops }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return apiInternalError();
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createAuthServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) return apiError(401, "UNAUTHENTICATED", "Unauthenticated");

    const organizationId = await resolveActiveOrganizationIdForUser(user.id);
    if (!organizationId) return apiError(400, "NO_ACTIVE_ORGANIZATION", "No active organization selected");

    const authorization = await resolveAuthorizationContext(user, organizationId);
    if (!evaluatePermission(authorization, "screening:create")) {
      return apiError(403, "FORBIDDEN", "Forbidden");
    }

    const parsedBody = await parseJsonBody(request);
    if (!parsedBody.ok) return parsedBody.response;
    const payload = parsedBody.payload as Record<string, unknown>;
    const applicantId = typeof payload["applicantId"] === "string" ? payload["applicantId"] : null;
    if (!applicantId) return apiError(400, "INVALID_PAYLOAD", "applicantId is required");

    const screeningCase = await createScreeningCase(
      organizationId,
      user.id,
      {
        applicantId,
        ...(typeof payload["provider"] === "string" ? { provider: payload["provider"] } : {}),
        ...(typeof payload["packageCode"] === "string" ? { packageCode: payload["packageCode"] } : {}),
        ...(Array.isArray(payload["parties"])
          ? {
              parties: payload["parties"] as Array<{
                role: "primary" | "co_applicant" | "guarantor" | "co_signer" | "adult_occupant";
                fullName: string;
                email?: string | null;
                phone?: string | null;
                applicantId?: string | null;
              }>
            }
          : {})
      },
      supabase
    );

    return NextResponse.json({ screeningCase }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Screening case creation failed";
    return apiError(400, "SCREENING_CREATE_FAILED", message);
  }
}
