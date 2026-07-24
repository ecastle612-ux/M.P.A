import { NextResponse } from "next/server";
import { createAuthServerClient } from "../../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../../lib/organization/server";
import { apiError, apiInternalError } from "../../../../../lib/api/http";
import {
  getOwnerConnectStatus,
  refreshConnectAccountStatus
} from "../../../../../lib/owner-payouts/service";

export async function GET(request: Request) {
  try {
    const supabase = await createAuthServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) return apiError(401, "UNAUTHENTICATED", "Unauthenticated");

    const organizationId = await resolveActiveOrganizationIdForUser(user.id);
    if (!organizationId) return apiError(400, "NO_ACTIVE_ORGANIZATION", "No active organization");

    const authorization = await resolveAuthorizationContext(user, organizationId);
    const canRead =
      evaluatePermission(authorization, "financial:read") ||
      evaluatePermission(authorization, "payout:onboard");
    if (!canRead) return apiError(403, "FORBIDDEN", "Forbidden");

    const url = new URL(request.url);
    const refresh = url.searchParams.get("refresh") === "1";
    const canOnboard = evaluatePermission(authorization, "payout:onboard");

    const status = refresh
      ? await refreshConnectAccountStatus({
          organizationId,
          purpose: "owner",
          ownerUserId: user.id,
          actorUserId: user.id,
          client: supabase
        })
      : await getOwnerConnectStatus({
          organizationId,
          ownerUserId: user.id,
          canOnboard,
          client: supabase
        });

    return NextResponse.json({ status }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Status failed";
    if (message.toLowerCase().includes("not allowed")) {
      return apiError(400, "INVALID_RETURN_URL", message);
    }
    return apiInternalError();
  }
}
