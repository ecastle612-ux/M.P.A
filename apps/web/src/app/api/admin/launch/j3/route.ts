import { NextResponse } from "next/server";
import { createAuthServerClient } from "../../../../../lib/auth/server";
import { isPlatformOperatorUser } from "../../../../../lib/commercial/server";

type ResidentRow = {
  id: string;
  display_name: string;
  email: string;
  status: string;
  portal_status: string;
  property_id: string;
  unit_id: string;
  created_at: string;
};

type EventRow = {
  id: string;
  event_type: string;
  aggregate_type: string;
  aggregate_id: string;
  created_at: string;
};

type AuditRow = {
  id: string;
  action: string;
  entity_id: string | null;
  created_at: string;
};

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

  const [{ data: residentsData }, { data: eventsData }, { data: auditsData }] = await Promise.all([
    supabase
      .from("pm_residents")
      .select("id, display_name, email, status, portal_status, property_id, unit_id, created_at")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false }),
    supabase
      .from("event_domain_events")
      .select("id, event_type, aggregate_type, aggregate_id, created_at")
      .eq("organization_id", organizationId)
      .in("event_type", [
        "resident.created",
        "resident.property_assigned",
        "resident.unit_assigned",
        "resident.portal_provisioned"
      ])
      .order("created_at", { ascending: false })
      .limit(40),
    supabase
      .from("audit_events")
      .select("id, action, entity_id, created_at")
      .eq("organization_id", organizationId)
      .in("action", [
        "resident.created",
        "resident.property_assigned",
        "resident.unit_assigned",
        "resident.portal_provisioned"
      ])
      .order("created_at", { ascending: false })
      .limit(40)
  ]);

  const residents = (residentsData ?? []) as ResidentRow[];
  const events = (eventsData ?? []) as EventRow[];
  const audits = (auditsData ?? []) as AuditRow[];
  const first = residents[0] ?? null;
  const residentReady = residents.length > 0;

  return NextResponse.json({
    organizationId,
    residents,
    timelineEvents: events,
    auditEvents: audits,
    checks: {
      residentCreated: residents.length > 0,
      propertyAssigned: residents.some((row) => Boolean(row.property_id)),
      unitAssigned: residents.some((row) => Boolean(row.unit_id)),
      statusPendingLease: residents.some((row) => row.status === "pending_lease"),
      portalPendingActivation: residents.some((row) => row.portal_status === "pending_activation"),
      timelineEvent: events.some((event) => event.event_type === "resident.created"),
      propertyTimelineEvent: events.some(
        (event) =>
          event.event_type === "resident.property_assigned" &&
          event.aggregate_type === "property_properties"
      ),
      auditEvent: audits.some((event) => event.action === "resident.created"),
      residentReady,
      assistantNextIsCreateLease: residentReady
    },
    firstResident: first
      ? {
          id: first.id,
          displayName: first.display_name,
          status: first.status,
          portalStatus: first.portal_status,
          propertyId: first.property_id,
          unitId: first.unit_id
        }
      : null,
    assistantRecommendation: residentReady
      ? "Create your first lease."
      : "Add your first resident."
  });
}
