import { NextResponse } from "next/server";
import { createAuthServerClient } from "../../../../../lib/auth/server";
import { isPlatformOperatorUser } from "../../../../../lib/commercial/server";
import { scrubUnknown } from "../../../../../lib/observability/scrub";

type PropertyRow = {
  id: string;
  name: string;
  status: string;
  created_at: string;
};

type EventRow = {
  id: string;
  event_type: string;
  aggregate_id: string;
  payload: Record<string, unknown> | null;
  created_at: string;
  actor_id: string | null;
};

type AuditRow = {
  id: string;
  action: string;
  entity_id: string | null;
  payload: Record<string, unknown> | null;
  created_at: string;
  actor_id: string | null;
};

function scrubRowPayload<T extends { payload: Record<string, unknown> | null }>(row: T): T {
  const scrubbed = scrubUnknown(row.payload ?? {});
  const payload =
    scrubbed && typeof scrubbed === "object" && !Array.isArray(scrubbed)
      ? (scrubbed as Record<string, unknown>)
      : {};
  return { ...row, payload };
}

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

  const [{ data: propertiesData }, { data: eventsData }, { data: auditsData }, { data: setup }] =
    await Promise.all([
      supabase
        .from("property_properties")
        .select("id, name, status, created_at")
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false }),
      supabase
        .from("event_domain_events")
        .select("id, event_type, aggregate_id, payload, created_at, actor_id")
        .eq("organization_id", organizationId)
        .in("event_type", ["property.created", "property.activated"])
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("audit_events")
        .select("id, action, entity_id, payload, created_at, actor_id")
        .eq("organization_id", organizationId)
        .in("action", ["property.created", "property.activated"])
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("organization_setup_state")
        .select("completed_at")
        .eq("organization_id", organizationId)
        .maybeSingle()
    ]);

  const properties = (propertiesData ?? []) as PropertyRow[];
  const events = ((eventsData ?? []) as EventRow[]).map(scrubRowPayload);
  const audits = ((auditsData ?? []) as AuditRow[]).map(scrubRowPayload);
  const propertyCount = properties.length;
  const createdEvents = events.filter((event) => event.event_type === "property.created");
  const createdAudits = audits.filter((audit) => audit.action === "property.created");

  return NextResponse.json({
    organizationId,
    setupComplete: Boolean(setup?.completed_at),
    propertyCount,
    properties,
    timelineEvents: events,
    auditEvents: audits,
    checks: {
      propertyCreated: propertyCount > 0,
      propertyActive: properties.some((property) => property.status === "active"),
      timelineEvent: createdEvents.length > 0,
      auditEvent: createdAudits.length > 0,
      assistantNextIsInviteTeam: propertyCount > 0,
      missionControlProgressed: propertyCount > 0
    },
    assistantRecommendation: propertyCount > 0 ? "Invite your team." : "Add your first property."
  });
}
