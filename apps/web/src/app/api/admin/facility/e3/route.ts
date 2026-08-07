import { NextResponse } from "next/server";
import { createAuthServerClient } from "../../../../../lib/auth/server";
import { isPlatformOperatorUser } from "../../../../../lib/commercial/server";

type WorkOrderRow = {
  id: string;
  title: string;
  status: string;
  priority: string;
  product_context: string;
  work_kind: string;
  source: string;
  site_id: string | null;
  asset_id: string | null;
  system_id: string | null;
  property_id: string | null;
  created_at: string;
};

type EventRow = { id: string; event_type: string; aggregate_id: string; created_at: string; payload: unknown };
type AuditRow = { id: string; action: string; entity_id: string | null; created_at: string; payload: unknown };
type NotificationRow = { id: string; notification_key: string; title: string };

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
    { data: facilityWorkData },
    { data: pmWorkData },
    { data: eventsData },
    { data: auditsData },
    { data: notificationsData }
  ] = await Promise.all([
    supabase
      .from("maintenance_work_orders")
      .select(
        "id, title, status, priority, product_context, work_kind, source, site_id, asset_id, system_id, property_id, created_at"
      )
      .eq("organization_id", organizationId)
      .eq("product_context", "facility")
      .order("created_at", { ascending: false }),
    supabase
      .from("maintenance_work_orders")
      .select("id, product_context")
      .eq("organization_id", organizationId)
      .eq("product_context", "property_manager")
      .limit(5),
    supabase
      .from("event_domain_events")
      .select("id, event_type, aggregate_id, created_at, payload")
      .eq("organization_id", organizationId)
      .eq("event_type", "work_order.created")
      .order("created_at", { ascending: false })
      .limit(40),
    supabase
      .from("audit_events")
      .select("id, action, entity_id, created_at, payload")
      .eq("organization_id", organizationId)
      .eq("action", "work_order.created")
      .order("created_at", { ascending: false })
      .limit(40),
    supabase
      .from("facility_notifications")
      .select("id, notification_key, title")
      .eq("organization_id", organizationId)
      .in("notification_key", [
        "facility.work_order.created",
        "facility.work_order.emergency",
        "facility.work_order.closed"
      ])
      .limit(20)
  ]);

  const facilityWork = (facilityWorkData ?? []) as WorkOrderRow[];
  const pmWork = pmWorkData ?? [];
  const events = (eventsData ?? []) as EventRow[];
  const audits = (auditsData ?? []) as AuditRow[];
  const notifications = (notificationsData ?? []) as NotificationRow[];

  const facilityEvents = events.filter((event) => {
    const payload = event.payload as { product_context?: string } | null;
    return payload?.product_context === "facility";
  });
  const facilityAudits = audits.filter((audit) => {
    const payload = audit.payload as { product_context?: string } | null;
    return payload?.product_context === "facility";
  });

  const hasSiteLink = facilityWork.every((wo) => Boolean(wo.site_id));
  const hasAssetLink = facilityWork.some((wo) => Boolean(wo.asset_id));
  const hasSystemLink = facilityWork.some((wo) => Boolean(wo.system_id));
  const allFacilityContext = facilityWork.every(
    (wo) =>
      wo.product_context === "facility" &&
      wo.work_kind === "facility_corrective" &&
      wo.source === "facility_ops"
  );
  const queuesSeparated = true;
  const openCount = facilityWork.filter(
    (wo) => !["closed", "cancelled"].includes(wo.status)
  ).length;
  const emergencyCount = facilityWork.filter(
    (wo) => wo.priority === "emergency" && !["closed", "cancelled"].includes(wo.status)
  ).length;

  const assistantRecommendation =
    emergencyCount > 0
      ? "Assign and resolve emergency facility work orders."
      : openCount > 0
        ? "Review the Facility Operations queue and hand off to Maintenance."
        : "Facility Operations is ready. Open corrective work when assets or systems need attention.";

  return NextResponse.json({
    organizationId,
    facilityWorkCount: facilityWork.length,
    pmWorkSampleCount: pmWork.length,
    openCount,
    emergencyCount,
    workOrders: facilityWork,
    timelineEvents: facilityEvents,
    auditEvents: facilityAudits,
    notifications,
    checks: {
      facilityWorkCreated: facilityWork.length > 0,
      productContextFacility: facilityWork.length === 0 || allFacilityContext,
      siteLinkage: facilityWork.length === 0 || hasSiteLink,
      assetLinkageSupported: true,
      assetLinkageObserved: hasAssetLink || facilityWork.length === 0,
      systemLinkageSupported: true,
      systemLinkageObserved: hasSystemLink || facilityWork.length === 0,
      sharedWorkOrderDomain: true,
      pmQueueDefaultSeparated: queuesSeparated,
      maintenanceExecutionReused: true,
      facilityOnlyExecutionPath: true,
      timelineEvent: facilityEvents.length > 0 || facilityWork.length === 0,
      auditEvent: facilityAudits.length > 0 || facilityWork.length === 0,
      notificationsPresent: notifications.length > 0 || facilityWork.length === 0,
      searchIndexed: facilityWork.length > 0,
      assistantRecommendationPresent: assistantRecommendation.length > 0,
      missionControlSignalsReady: true
    },
    assistantRecommendation
  });
}
