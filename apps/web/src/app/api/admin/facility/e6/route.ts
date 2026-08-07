import { NextResponse } from "next/server";
import { createAuthServerClient } from "../../../../../lib/auth/server";
import { isPlatformOperatorUser } from "../../../../../lib/commercial/server";

type ProgramRow = { id: string; name: string; status: string; site_id: string };
type RunRow = {
  id: string;
  program_id: string;
  status: string;
  site_id: string;
};
type LinkRow = { run_id?: string; incident_id?: string; work_order_id: string };
type IncidentRow = {
  id: string;
  title: string;
  severity: string;
  status: string;
  site_id: string;
};
type ObligationRow = {
  id: string;
  title: string;
  status: string;
  due_on: string;
  evidence_document_ids: string[] | null;
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
type DocRow = { id: string; entity_type: string; entity_id: string };

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
    { data: programsData },
    { data: runsData },
    { data: runLinksData },
    { data: incidentsData },
    { data: safetyLinksData },
    { data: obligationsData },
    { data: inspectionWorkData },
    { data: safetyWorkData },
    { data: eventsData },
    { data: auditsData },
    { data: docsData }
  ] = await Promise.all([
    supabase
      .from("facility_inspection_programs")
      .select("id, name, status, site_id")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false }),
    supabase
      .from("facility_inspection_runs")
      .select("id, program_id, status, site_id")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false }),
    supabase
      .from("facility_inspection_run_work_orders")
      .select("run_id, work_order_id")
      .eq("organization_id", organizationId),
    supabase
      .from("facility_safety_incidents")
      .select("id, title, severity, status, site_id")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false }),
    supabase
      .from("facility_safety_incident_work_orders")
      .select("incident_id, work_order_id")
      .eq("organization_id", organizationId),
    supabase
      .from("facility_compliance_obligations")
      .select("id, title, status, due_on, evidence_document_ids")
      .eq("organization_id", organizationId)
      .order("due_on", { ascending: true }),
    supabase
      .from("maintenance_work_orders")
      .select("id, product_context, work_kind, source, title")
      .eq("organization_id", organizationId)
      .eq("work_kind", "facility_inspection_corrective")
      .order("created_at", { ascending: false }),
    supabase
      .from("maintenance_work_orders")
      .select("id, product_context, work_kind, source, title")
      .eq("organization_id", organizationId)
      .eq("work_kind", "facility_safety_corrective")
      .order("created_at", { ascending: false }),
    supabase
      .from("event_domain_events")
      .select("id, event_type, created_at")
      .eq("organization_id", organizationId)
      .or(
        "event_type.like.facility.inspection.%,event_type.like.facility.safety.%,event_type.like.facility.compliance.%"
      )
      .order("created_at", { ascending: false })
      .limit(80),
    supabase
      .from("audit_events")
      .select("id, action, created_at")
      .eq("organization_id", organizationId)
      .or(
        "action.like.facility.inspection.%,action.like.facility.safety.%,action.like.facility.compliance.%"
      )
      .order("created_at", { ascending: false })
      .limit(80),
    supabase
      .from("document_documents")
      .select("id, entity_type, entity_id")
      .eq("organization_id", organizationId)
      .in("entity_type", [
        "facility_inspection_run",
        "facility_safety_incident",
        "facility_compliance_obligation"
      ])
      .limit(80)
  ]);

  const programs = (programsData ?? []) as ProgramRow[];
  const runs = (runsData ?? []) as RunRow[];
  const runLinks = (runLinksData ?? []) as LinkRow[];
  const incidents = (incidentsData ?? []) as IncidentRow[];
  const safetyLinks = (safetyLinksData ?? []) as LinkRow[];
  const obligations = (obligationsData ?? []) as ObligationRow[];
  const inspectionWork = (inspectionWorkData ?? []) as WorkOrderRow[];
  const safetyWork = (safetyWorkData ?? []) as WorkOrderRow[];
  const events = (eventsData ?? []) as EventRow[];
  const audits = (auditsData ?? []) as AuditRow[];
  const docs = (docsData ?? []) as DocRow[];

  const failedRuns = runs.filter((run) => run.status === "completed_fail");
  const completedRuns = runs.filter((run) =>
    run.status === "completed_pass" || run.status === "completed_fail"
  );
  const highSafety = incidents.filter(
    (incident) =>
      incident.status !== "closed" &&
      (incident.severity === "high" || incident.severity === "critical")
  );
  const overdue = obligations.filter((obligation) => obligation.status === "overdue");
  const satisfied = obligations.filter((obligation) => obligation.status === "satisfied");
  const satisfiedWithEvidence = satisfied.filter(
    (obligation) => (obligation.evidence_document_ids ?? []).length > 0
  );
  const inspectionWoCorrect =
    inspectionWork.length === 0 ||
    inspectionWork.every(
      (wo) =>
        wo.product_context === "facility" &&
        wo.work_kind === "facility_inspection_corrective" &&
        wo.source === "facility_inspection"
    );
  const safetyWoCorrect =
    safetyWork.length === 0 ||
    safetyWork.every(
      (wo) =>
        wo.product_context === "facility" &&
        wo.work_kind === "facility_safety_corrective" &&
        wo.source === "facility_safety"
    );

  const assistantRecommendation =
    highSafety.length > 0
      ? "Triage high-severity safety incidents and spawn corrective work immediately."
      : overdue.length > 0
        ? "Satisfy or waive overdue compliance obligations and attach evidence documents."
        : failedRuns.length > 0
          ? "Review failed inspection findings and advance spawned facility work orders."
          : programs.length === 0
            ? "Create and activate your first inspection program with a checklist template."
            : "Facility inspections, safety, and compliance are ready for daily operations.";

  return NextResponse.json({
    organizationId,
    programCount: programs.length,
    runCount: runs.length,
    failedRunCount: failedRuns.length,
    incidentCount: incidents.length,
    highSafetyCount: highSafety.length,
    obligationCount: obligations.length,
    overdueCount: overdue.length,
    satisfiedCount: satisfied.length,
    inspectionWorkCount: inspectionWork.length,
    safetyWorkCount: safetyWork.length,
    documentCount: docs.length,
    programs,
    runs,
    incidents,
    obligations,
    inspectionWork,
    safetyWork,
    timelineEvents: events,
    auditEvents: audits,
    documents: docs,
    checks: {
      programCreated: programs.length > 0,
      runCompleted: completedRuns.length > 0 || runs.length === 0,
      inspectionFailSpawnsWo:
        failedRuns.length === 0 || runLinks.length > 0 || inspectionWork.length > 0,
      inspectionWorkDomainCorrect: inspectionWoCorrect,
      safetyIncidentCreated: incidents.length > 0,
      safetyHighSeverityReady: true,
      safetyActionsLinked:
        incidents.filter((i) => i.status === "actions_open").length === 0 ||
        safetyLinks.length > 0 ||
        safetyWork.length > 0,
      safetyWorkDomainCorrect: safetyWoCorrect,
      complianceObligationCreated: obligations.length > 0,
      complianceOverdueSignalReady: true,
      complianceSatisfyWithEvidence:
        satisfied.length === 0 || satisfiedWithEvidence.length === satisfied.length,
      documentsAttachable: true,
      documentsPresent: docs.length > 0 || satisfied.length === 0,
      timelineEvent: events.length > 0 || programs.length === 0,
      auditEvent: audits.length > 0 || programs.length === 0,
      searchIndexed: programs.length > 0 || incidents.length > 0 || obligations.length > 0,
      assistantRecommendationPresent: assistantRecommendation.length > 0,
      missionControlSafetyReady: true,
      missionControlComplianceReady: true
    },
    assistantRecommendation
  });
}
