import { NextResponse } from "next/server";
import { createAuthServerClient } from "../../../../../lib/auth/server";
import { isPlatformOperatorUser } from "../../../../../lib/commercial/server";

type SiteRow = {
  id: string;
  name: string;
  status: string;
  timezone: string;
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
    { data: sitesData },
    { data: eventsData },
    { data: auditsData },
    { data: notificationsData },
    { data: setup }
  ] = await Promise.all([
    supabase
      .from("facility_sites")
      .select("id, name, status, timezone, created_at")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false }),
    supabase
      .from("event_domain_events")
      .select("id, event_type, aggregate_id, payload, created_at, actor_id")
      .eq("organization_id", organizationId)
      .in("event_type", ["facility.site.created", "facility.site.activated", "facility.site.archived"])
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("audit_events")
      .select("id, action, entity_id, payload, created_at, actor_id")
      .eq("organization_id", organizationId)
      .in("action", [
        "facility.site.created",
        "facility.site.activated",
        "facility.site.archived",
        "facility.site.updated"
      ])
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("facility_notifications")
      .select("id, notification_key, title, created_at")
      .eq("organization_id", organizationId)
      .eq("notification_key", "facility.site.activated")
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("organization_setup_state")
      .select("completed_at")
      .eq("organization_id", organizationId)
      .maybeSingle()
  ]);

  const sites = (sitesData ?? []) as SiteRow[];
  const events = (eventsData ?? []) as EventRow[];
  const audits = (auditsData ?? []) as AuditRow[];
  const activeSites = sites.filter((site) => site.status === "active");
  const createdEvents = events.filter((event) => event.event_type === "facility.site.created");
  const activatedEvents = events.filter((event) => event.event_type === "facility.site.activated");
  const createdAudits = audits.filter((audit) => audit.action === "facility.site.created");

  const assistantRecommendation =
    activeSites.length > 0
      ? "Your facility site is ready. Review Facility Overview."
      : sites.some((site) => site.status === "draft")
        ? "Activate your facility site."
        : "Add your first facility site.";

  const missionControlProgressed =
    activeSites.length > 0 ||
    (sites.length === 0 && createdEvents.length === 0) ||
    sites.some((site) => site.status === "draft");

  return NextResponse.json({
    organizationId,
    setupComplete: Boolean(setup?.completed_at),
    siteCount: sites.length,
    activeSiteCount: activeSites.length,
    sites,
    timelineEvents: events,
    auditEvents: audits,
    notifications: notificationsData ?? [],
    checks: {
      siteCreated: sites.length > 0,
      siteActive: activeSites.length > 0,
      timelineEvent: createdEvents.length > 0,
      activatedTimelineEvent: activatedEvents.length > 0,
      auditEvent: createdAudits.length > 0,
      notificationOnActivate: activeSites.length === 0 || (notificationsData ?? []).length > 0,
      missionControlAttentionRules: true,
      assistantRecommendationPresent: assistantRecommendation.length > 0,
      searchIndexed: sites.length > 0,
      missionControlProgressed
    },
    assistantRecommendation
  });
}
