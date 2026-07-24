import { NextResponse } from "next/server";
import { createAuthServerClient } from "../../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../../lib/organization/server";
import { apiError, apiInternalError } from "../../../../../lib/api/http";
import { listOrgPayoutRunSummaries } from "../../../../../lib/owner-payouts/projections";
import { createPayoutRun } from "../../../../../lib/owner-payouts/transfers";

/** GET — recent payout run summaries for PM console (FIN-003 Phase D). */
export async function GET() {
  try {
    const supabase = await createAuthServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) return apiError(401, "UNAUTHENTICATED", "Unauthenticated");

    const organizationId = await resolveActiveOrganizationIdForUser(user.id);
    if (!organizationId) return apiError(400, "NO_ACTIVE_ORGANIZATION", "No active organization");

    const authorization = await resolveAuthorizationContext(user, organizationId);
    if (
      !evaluatePermission(authorization, "payout:manage") &&
      !evaluatePermission(authorization, "financial:read")
    ) {
      return apiError(403, "FORBIDDEN", "Forbidden");
    }

    const runs = await listOrgPayoutRunSummaries({
      organizationId,
      client: supabase
    });
    return NextResponse.json({ runs }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return apiInternalError();
  }
}

/** POST — create ad-hoc payout run (allocation + eligible intents). Does not execute transfers. */
export async function POST(request: Request) {
  try {
    const supabase = await createAuthServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) return apiError(401, "UNAUTHENTICATED", "Unauthenticated");

    const organizationId = await resolveActiveOrganizationIdForUser(user.id);
    if (!organizationId) return apiError(400, "NO_ACTIVE_ORGANIZATION", "No active organization");

    const authorization = await resolveAuthorizationContext(user, organizationId);
    if (!evaluatePermission(authorization, "payout:manage")) {
      return apiError(403, "FORBIDDEN", "Forbidden");
    }

    const body = (await request.json()) as {
      propertyIds?: string[];
      periodStart?: string;
      periodEnd?: string;
    };
    if (!body.propertyIds?.length || !body.periodStart || !body.periodEnd) {
      return apiError(400, "INVALID_BODY", "propertyIds, periodStart, periodEnd required");
    }

    const result = await createPayoutRun({
      organizationId,
      propertyIds: body.propertyIds,
      periodStart: body.periodStart,
      periodEnd: body.periodEnd,
      actorUserId: user.id,
      client: supabase
    });

    return NextResponse.json({ run: result }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    if (
      message.includes("Active or completed") ||
      message.includes("settlement") ||
      message.includes("period")
    ) {
      return apiError(400, "PAYOUT_RUN_REJECTED", message);
    }
    return apiInternalError();
  }
}
