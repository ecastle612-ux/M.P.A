import { NextResponse } from "next/server";
import { createAuthServerClient } from "../../../../../lib/auth/server";
import { isPlatformOperatorUser } from "../../../../../lib/commercial/server";
import { getCommunicationsReadiness } from "../../../../../lib/communications/communications-service";

export async function GET(request: Request) {
  const supabase = await createAuthServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }
  if (!(await isPlatformOperatorUser(user))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const organizationId = new URL(request.url).searchParams.get("organizationId");
  if (!organizationId) {
    return NextResponse.json({ error: "organizationId is required" }, { status: 400 });
  }

  const [
    readiness,
    { count: financeNotifications },
    { count: maintenanceNotifications },
    { data: eventsData },
    { data: auditsData }
  ] = await Promise.all([
    getCommunicationsReadiness(supabase, organizationId),
    supabase
      .from("financial_notifications")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId),
    supabase
      .from("maintenance_notifications")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId),
    supabase
      .from("event_domain_events")
      .select("id, event_type, created_at")
      .eq("organization_id", organizationId)
      .eq("event_type", "comms.message.sent")
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("audit_events")
      .select("id, action, created_at")
      .eq("organization_id", organizationId)
      .eq("action", "comms.message.sent")
      .order("created_at", { ascending: false })
      .limit(20)
  ]);

  const hasMessages = readiness.messageCount > 0;
  const checks = {
    communicationsRoute: hasMessages || readiness.communicationsReady,
    sendResidentOwnerVendor: hasMessages,
    unifiedInbox: readiness.notificationCount > 0 || hasMessages,
    reusesFinanceNotifications: (financeNotifications ?? 0) > 0 || hasMessages,
    reusesMaintenanceNotifications: (maintenanceNotifications ?? 0) > 0 || hasMessages,
    historyAvailable: hasMessages,
    timelineEvent: (eventsData ?? []).length > 0,
    auditEvent: (auditsData ?? []).length > 0,
    communicationsReady: readiness.communicationsReady && hasMessages
  };

  return NextResponse.json({
    organizationId,
    readiness,
    financeNotificationCount: financeNotifications ?? 0,
    maintenanceNotificationCount: maintenanceNotifications ?? 0,
    timelineEvents: eventsData ?? [],
    auditEvents: auditsData ?? [],
    checks,
    note:
      "Communications remediation reuses financial_notifications + maintenance_notifications and adds comms_messages / comms_notifications."
  });
}
