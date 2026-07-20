import { NextResponse } from "next/server";
import { createAuthServerClient } from "../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../lib/organization/server";
import { getNotificationOpsMetrics } from "../../../../lib/notifications/server";
import { apiError, apiInternalError } from "../../../../lib/api/http";

export async function GET() {
  try {
    const supabase = await createAuthServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) return apiError(401, "UNAUTHENTICATED", "Unauthenticated");

    const organizationId = await resolveActiveOrganizationIdForUser(user.id);
    if (!organizationId) {
      return NextResponse.json(
        {
          unreadCount: 0,
          criticalCount: 0,
          emergencyCount: 0,
          recent: [],
          pushSent24h: 0,
          pushFailed24h: 0,
          providerKey: "noop",
          providerHealthy: true,
          registeredDevices: 0,
          activeSubscribers: 0,
          pendingRegistrations: 0,
          pushSuccessRate24h: null,
          failedDeliveries24h: 0,
          lastPushActivityAt: null
        },
        { headers: { "Cache-Control": "no-store" } }
      );
    }

    const authorization = await resolveAuthorizationContext(user, organizationId);
    if (!evaluatePermission(authorization, "notification:read")) {
      return apiError(403, "FORBIDDEN", "Forbidden");
    }

    const metrics = await getNotificationOpsMetrics(organizationId, user.id, supabase);
    return NextResponse.json(metrics, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return apiInternalError();
  }
}
