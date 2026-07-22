import { NextResponse } from "next/server";
import { createAuthServerClient } from "../../../../../lib/auth/server";
import { requireMasterAdminApiAccess } from "../../../../../lib/master-admin/access";
import { notify } from "../../../../../lib/notifications/service";
import { userHasActivePushDevice } from "../../../../../lib/notifications/enrollment";
import { apiError } from "../../../../../lib/api/http";

/**
 * PUSH-001 — Master Admin send-test to a target user in the active organization.
 */
export async function POST(request: Request) {
  try {
    const access = await requireMasterAdminApiAccess();
    if (!access.ok) return access.response;

    const body = (await request.json().catch(() => ({}))) as { targetUserId?: string };
    const targetUserId = body.targetUserId?.trim();
    if (!targetUserId) {
      return apiError(400, "TARGET_REQUIRED", "targetUserId is required");
    }

    const supabase = await createAuthServerClient();
    const { data: membership, error: membershipError } = await supabase
      .from("organization_memberships")
      .select("user_id")
      .eq("organization_id", access.organizationId)
      .eq("user_id", targetUserId)
      .eq("status", "active")
      .maybeSingle();
    if (membershipError) throw new Error(membershipError.message);
    if (!membership) {
      return apiError(404, "USER_NOT_IN_ORG", "Target user is not an active member of this organization");
    }

    const hasDevice = await userHasActivePushDevice(access.organizationId, targetUserId, supabase);
    if (!hasDevice) {
      return apiError(400, "NO_DEVICE", "Target user has no active push device");
    }

    const records = await notify(
      {
        organizationId: access.organizationId,
        category: "system",
        priority: "normal",
        title: "Test notification",
        body: "Master Admin sent a test push. Delivery is working for this device.",
        href: "/settings/notifications",
        eventKey: `push_test:ma:${targetUserId}:${Date.now()}`,
        recipientUserIds: [targetUserId],
        actorUserId: access.user.id,
        sourceEntityType: "push_test",
        sourceEntityId: targetUserId,
        metadata: { testNotification: true, sentByMasterAdmin: true }
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
      "MA_TEST_NOTIFY_FAILED",
      error instanceof Error ? error.message : "Test notification failed"
    );
  }
}
