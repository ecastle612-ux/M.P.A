import { NextResponse } from "next/server";
import { requireNotificationCenterActor } from "../../../../../lib/communications/conversation-authz";
import {
  listUnifiedNotifications,
  markNotificationRead
} from "../../../../../lib/communications/communications-service";

export const dynamic = "force-dynamic";

export async function GET() {
  const authz = await requireNotificationCenterActor();
  if ("error" in authz) {
    return authz.error;
  }

  try {
    const notifications = await listUnifiedNotifications(
      authz.supabase,
      authz.organizationId,
      authz.user.id
    );
    return NextResponse.json({
      notifications,
      unreadCount: notifications.filter((item) => !item.readAt).length
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load notifications" },
      { status: 400 }
    );
  }
}

export async function PATCH(request: Request) {
  const authz = await requireNotificationCenterActor();
  if ("error" in authz) {
    return authz.error;
  }

  try {
    const body = (await request.json()) as { notificationId?: string };
    if (!body.notificationId) {
      return NextResponse.json({ error: "notificationId is required" }, { status: 400 });
    }
    await markNotificationRead(
      authz.supabase,
      authz.organizationId,
      authz.user.id,
      body.notificationId
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to mark read" },
      { status: 400 }
    );
  }
}
