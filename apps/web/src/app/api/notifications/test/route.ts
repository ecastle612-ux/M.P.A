import { NextResponse } from "next/server";
import { createAuthServerClient } from "../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../lib/organization/server";
import { notify } from "../../../../lib/notifications/service";
import { userHasActivePushDevice } from "../../../../lib/notifications/enrollment";
import { apiError } from "../../../../lib/api/http";

/**
 * Send a test notification to the authenticated user via NotificationService.
 */
export async function POST() {
  try {
    const supabase = await createAuthServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) return apiError(401, "UNAUTHENTICATED", "Unauthenticated");

    const organizationId = await resolveActiveOrganizationIdForUser(user.id);
    if (!organizationId) return apiError(400, "NO_ORGANIZATION", "No active organization");

    const authorization = await resolveAuthorizationContext(user, organizationId);
    if (!evaluatePermission(authorization, "notification:update")) {
      return apiError(403, "FORBIDDEN", "Forbidden");
    }

    const hasDevice = await userHasActivePushDevice(organizationId, user.id, supabase);
    if (!hasDevice) {
      return apiError(400, "NO_DEVICE", "Register a push device before sending a test notification");
    }

    const records = await notify(
      {
        organizationId,
        category: "system",
        priority: "normal",
        title: "Test notification",
        body: "Push delivery is working. You can manage notifications in Settings.",
        href: "/settings/notifications",
        eventKey: `push_test:${user.id}:${Date.now()}`,
        recipientUserIds: [user.id],
        actorUserId: user.id,
        sourceEntityType: "push_test",
        sourceEntityId: user.id,
        metadata: { testNotification: true }
      },
      supabase
    );

    return NextResponse.json(
      { ok: true, notifications: records },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    return apiError(
      500,
      "TEST_NOTIFY_FAILED",
      error instanceof Error ? error.message : "Test notification failed"
    );
  }
}
