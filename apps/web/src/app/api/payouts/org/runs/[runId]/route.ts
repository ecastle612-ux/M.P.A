import { NextResponse } from "next/server";
import { createAuthServerClient } from "../../../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../../../lib/organization/server";
import { apiError, apiInternalError } from "../../../../../../lib/api/http";
import { getPayoutRun } from "../../../../../../lib/owner-payouts/transfers";

export async function GET(
  _request: Request,
  context: { params: Promise<{ runId: string }> }
) {
  try {
    const { runId } = await context.params;
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

    const detail = await getPayoutRun({ organizationId, runId, client: supabase });
    return NextResponse.json(detail, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    if (message.includes("not found")) return apiError(404, "NOT_FOUND", message);
    return apiInternalError();
  }
}
