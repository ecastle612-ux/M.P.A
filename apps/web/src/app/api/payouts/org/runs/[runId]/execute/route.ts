import { NextResponse } from "next/server";
import { createAuthServerClient } from "../../../../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../../../../lib/organization/server";
import { apiError, apiInternalError } from "../../../../../../../lib/api/http";
import { executePayoutRun } from "../../../../../../../lib/owner-payouts/transfers";

/** POST — execute queued run (balance preflight + idempotent createTransfer). */
export async function POST(
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
    if (!evaluatePermission(authorization, "payout:manage")) {
      return apiError(403, "FORBIDDEN", "Forbidden");
    }

    const result = await executePayoutRun({
      organizationId,
      runId,
      actorUserId: user.id,
      client: supabase
    });

    return NextResponse.json({ result }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    if (
      message.includes("FIN003_TRANSFERS_ENABLED") ||
      message.includes("not executable") ||
      message.includes("preflight") ||
      message.includes("ownership")
    ) {
      return apiError(400, "EXECUTE_REJECTED", message);
    }
    return apiInternalError();
  }
}
