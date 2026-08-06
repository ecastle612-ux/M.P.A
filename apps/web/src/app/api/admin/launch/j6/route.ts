import { NextResponse } from "next/server";
import { createAuthServerClient } from "../../../../../lib/auth/server";
import { isPlatformOperatorUser } from "../../../../../lib/commercial/server";
import { getMaintenanceReadiness } from "../../../../../lib/maintenance/maintenance-service";

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
    { data: workOrdersData },
    { data: updatesData },
    { data: vendorsData },
    { data: eventsData },
    { data: auditsData }
  ] = await Promise.all([
    getMaintenanceReadiness(supabase, organizationId),
    supabase
      .from("maintenance_work_orders")
      .select(
        "id, title, status, priority, assignee_type, technician_user_id, vendor_id, resident_id, property_id, submitted_at, completed_at, resident_confirmed_at, closed_at"
      )
      .eq("organization_id", organizationId)
      .order("submitted_at", { ascending: false })
      .limit(80),
    supabase
      .from("maintenance_work_order_updates")
      .select("id, work_order_id, actor_role, body, created_at")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false })
      .limit(80),
    supabase
      .from("vendor_vendors")
      .select("id, name, email, user_id, status")
      .eq("organization_id", organizationId),
    supabase
      .from("event_domain_events")
      .select("id, event_type, created_at")
      .eq("organization_id", organizationId)
      .in("event_type", [
        "work_order.created",
        "work_order.triaged",
        "work_order.assigned",
        "vendor.assigned",
        "work_order.started",
        "work_order.progressed",
        "work_order.completed",
        "work_order.resident_confirmed",
        "work_order.closed"
      ])
      .order("created_at", { ascending: false })
      .limit(80),
    supabase
      .from("audit_events")
      .select("id, action, created_at")
      .eq("organization_id", organizationId)
      .in("action", [
        "work_order.created",
        "work_order.triaged",
        "work_order.assigned",
        "vendor.assigned",
        "work_order.started",
        "work_order.progressed",
        "work_order.completed",
        "work_order.resident_confirmed",
        "work_order.closed"
      ])
      .order("created_at", { ascending: false })
      .limit(80)
  ]);

  type AnyRow = Record<string, unknown>;
  const workOrders = (workOrdersData ?? []) as AnyRow[];
  const updates = (updatesData ?? []) as AnyRow[];
  const vendors = (vendorsData ?? []) as AnyRow[];
  const events = (eventsData ?? []) as AnyRow[];
  const audits = (auditsData ?? []) as AnyRow[];

  const hasTechnicianAssignment = workOrders.some(
    (row) => row["assignee_type"] === "technician" && Boolean(row["technician_user_id"])
  );
  const hasVendorAssignment = workOrders.some(
    (row) => row["assignee_type"] === "vendor" && Boolean(row["vendor_id"])
  );
  const hasCompletion = workOrders.some((row) =>
    ["completed", "closed"].includes(String(row["status"]))
  );
  const hasResidentConfirm = workOrders.some((row) => Boolean(row["resident_confirmed_at"]));
  const hasClosed = workOrders.some((row) => row["status"] === "closed");

  const checks = {
    requestCreated: workOrders.length > 0,
    prioritized: workOrders.some((row) => Boolean(row["priority"])) &&
      (events.some((event) => event["event_type"] === "work_order.triaged") ||
        workOrders.some((row) => ["triaged", "assigned", "in_progress", "completed", "closed"].includes(String(row["status"])))),
    technicianAssigned: hasTechnicianAssignment,
    vendorAssigned: hasVendorAssignment,
    assignmentPresent: hasTechnicianAssignment || hasVendorAssignment,
    progressUpdated:
      updates.some((row) => ["technician", "vendor", "manager"].includes(String(row["actor_role"]))) ||
      events.some((event) =>
        ["work_order.started", "work_order.progressed"].includes(String(event["event_type"]))
      ),
    completed: hasCompletion,
    residentConfirmed: hasResidentConfirm,
    closed: hasClosed,
    timelineEvent: events.some(
      (event) =>
        event["event_type"] === "work_order.created" || event["event_type"] === "work_order.closed"
    ),
    auditEvent: audits.length > 0,
    vendorDirectory: vendors.length > 0 || hasVendorAssignment,
    maintenanceReady: readiness.maintenanceReady,
    assistantNextIsDailyOps: readiness.maintenanceReady
  };

  return NextResponse.json({
    organizationId,
    readiness,
    workOrders: workOrders.slice(0, 20),
    updates: updates.slice(0, 20),
    vendors: vendors.slice(0, 20),
    timelineEvents: events,
    auditEvents: audits,
    checks,
    assistantRecommendation: readiness.maintenanceReady
      ? "Review your daily operations."
      : "Submit your first maintenance request.",
    vendorNote:
      "Vendor assignment reuses vendor_vendors. technicianAssigned and vendorAssigned can both pass if both paths are exercised; Pass requires at least one assignment path plus closed lifecycle."
  });
}
