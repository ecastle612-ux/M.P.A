import { NextResponse } from "next/server";
import { createAuthServerClient } from "../../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../../lib/organization/server";
import { apiError, apiInternalError } from "../../../../../lib/api/http";
import {
  getOrgSettlementConnectStatus,
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
    const canManage = evaluatePermission(authorization, "payout:manage");
    const canRead =
      canManage ||
      evaluatePermission(authorization, "financial:read") ||
      evaluatePermission(authorization, "financial:admin");
    if (!canRead) return apiError(403, "FORBIDDEN", "Forbidden");

    const url = new URL(request.url);
    const refresh = url.searchParams.get("refresh") === "1";

    const status = refresh
      ? await refreshConnectAccountStatus({
          organizationId,
          purpose: "org_settlement",
          actorUserId: user.id,
          client: supabase
        })
      : await getOrgSettlementConnectStatus({
          organizationId,
          canManage,
          client: supabase
        });

    return NextResponse.json({ status }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return apiInternalError();
  }
}
