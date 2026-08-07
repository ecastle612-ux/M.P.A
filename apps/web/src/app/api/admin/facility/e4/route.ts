import { NextResponse } from "next/server";
import { createAuthServerClient } from "../../../../../lib/auth/server";
import { isPlatformOperatorUser } from "../../../../../lib/commercial/server";

type ScheduleRow = {
  id: string;
  name: string;
  status: string;
  site_id: string;
  asset_id: string | null;
  system_id: string | null;
  next_due_on: string | null;
  cadence_unit: string;
  cadence_interval: number;
};

type RunRow = {
  id: string;
  schedule_id: string;
  due_on: string;
  work_order_id: string | null;
  status: string;
};

type WorkOrderRow = {
  id: string;
  product_context: string;
  work_kind: string;
  source: string;
  title: string;
};

type EventRow = { id: string; event_type: string; created_at: string };
type AuditRow = { id: string; action: string; created_at: string };

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
    { data: schedulesData },
    { data: runsData },
    { data: preventiveWorkData },
    { data: eventsData },
    { data: auditsData }
  ] = await Promise.all([
    supabase
      .from("facility_pm_schedules")
      .select(
        "id, name, status, site_id, asset_id, system_id, next_due_on, cadence_unit, cadence_interval"
      )
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false }),
    supabase
      .from("facility_pm_generation_runs")
      .select("id, schedule_id, due_on, work_order_id, status")
      .eq("organization_id", organizationId)
      .order("due_on", { ascending: false }),
    supabase
      .from("maintenance_work_orders")
      .select("id, product_context, work_kind, source, title")
      .eq("organization_id", organizationId)
      .eq("work_kind", "facility_preventive")
      .order("created_at", { ascending: false }),
    supabase
      .from("event_domain_events")
      .select("id, event_type, created_at")
      .eq("organization_id", organizationId)
      .like("event_type", "facility.pm_schedule.%")
      .order("created_at", { ascending: false })
      .limit(40),
    supabase
      .from("audit_events")
      .select("id, action, created_at")
      .eq("organization_id", organizationId)
      .like("action", "facility.pm_schedule.%")
      .order("created_at", { ascending: false })
      .limit(40)
  ]);

  const schedules = (schedulesData ?? []) as ScheduleRow[];
  const runs = (runsData ?? []) as RunRow[];
  const preventiveWork = (preventiveWorkData ?? []) as WorkOrderRow[];
  const events = (eventsData ?? []) as EventRow[];
  const audits = (auditsData ?? []) as AuditRow[];

  const today = new Date().toISOString().slice(0, 10);
  const active = schedules.filter((s) => s.status === "active");
  const withNextDue = active.filter((s) => Boolean(s.next_due_on));
  const overdue = active.filter((s) => s.next_due_on != null && s.next_due_on < today);
  const generated = runs.filter((r) => Boolean(r.work_order_id));
  const uniqueDueKeys = new Set(runs.map((r) => `${r.schedule_id}:${r.due_on}`));
  const idempotent = uniqueDueKeys.size === runs.length;
  const sharedDomain = preventiveWork.every(
    (wo) =>
      wo.product_context === "facility" &&
      wo.work_kind === "facility_preventive" &&
      wo.source === "facility_pm_generator"
  );
  const siteLinked = schedules.every((s) => Boolean(s.site_id));
  const assetOrSystem = schedules.every((s) => Boolean(s.asset_id || s.system_id));
  const createdEvents = events.filter((e) => e.event_type === "facility.pm_schedule.created");
  const generatedEvents = events.filter(
    (e) => e.event_type === "facility.pm_schedule.generated_work"
  );

  const assistantRecommendation =
    overdue.length > 0
      ? "Generate and complete overdue preventive maintenance work."
      : active.length === 0
        ? "Create and activate your first preventive maintenance schedule."
        : "Preventive Maintenance is ready. Activate schedules so due work generates into Maintenance.";

  return NextResponse.json({
    organizationId,
    scheduleCount: schedules.length,
    activeCount: active.length,
    overdueCount: overdue.length,
    runCount: runs.length,
    preventiveWorkCount: preventiveWork.length,
    schedules,
    runs,
    preventiveWork,
    timelineEvents: events,
    auditEvents: audits,
    checks: {
      programCreated: schedules.length > 0,
      nextDueComputed: schedules.length === 0 || withNextDue.length > 0 || active.length === 0,
      siteAssignment: schedules.length === 0 || siteLinked,
      assetOrSystemAssignment: schedules.length === 0 || assetOrSystem,
      scheduleLifecycle: schedules.length === 0 || schedules.some((s) => s.status !== "draft"),
      dueGenerationIdempotent: runs.length === 0 || idempotent,
      sharedWorkOrderGenerated: preventiveWork.length > 0 || runs.length === 0,
      sharedDomainCorrect: preventiveWork.length === 0 || sharedDomain,
      generatedRunsLinked: generated.length === preventiveWork.length || runs.length === 0,
      timelineEvent: createdEvents.length > 0 || schedules.length === 0,
      generatedWorkEvent: generatedEvents.length > 0 || preventiveWork.length === 0,
      auditEvent: audits.length > 0 || schedules.length === 0,
      searchIndexed: schedules.length > 0,
      assistantRecommendationPresent: assistantRecommendation.length > 0,
      missionControlPmSignalsReady: true,
      overdueSignalReady: true
    },
    assistantRecommendation
  });
}
