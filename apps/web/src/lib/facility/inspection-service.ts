import type { SupabaseClient } from "@supabase/supabase-js";
import {
  advancePmDueDate,
  deriveInspectionRunOutcome,
  todayUtcDate,
  type CancelInspectionRunInput,
  type CompleteInspectionRunInput,
  type CreateInspectionProgramInput,
  type InspectionCadenceUnit,
  type InspectionChecklistItem,
  type InspectionProgramStatus,
  type InspectionResultItem,
  type InspectionRunStatus,
  type PmCadenceUnit,
  type StartInspectionRunInput
} from "@mpa/shared";
import { emitFacilityEvent, writeFacilityAudit, writeFacilityNotification } from "./events-audit";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = SupabaseClient<any>;

const SELECT_PROGRAM = `
  *,
  facility_sites ( id, name, property_id ),
  facility_assets ( id, name ),
  facility_systems ( id, name )
`;

const SELECT_RUN = `
  *,
  facility_inspection_programs ( id, name, checklist_template ),
  facility_sites ( id, name, property_id )
`;

export type InspectionProgramRow = {
  id: string;
  organization_id: string;
  site_id: string;
  asset_id: string | null;
  system_id: string | null;
  name: string;
  scope_type: string;
  cadence_unit: InspectionCadenceUnit;
  cadence_interval: number;
  next_due_on: string | null;
  checklist_template: InspectionChecklistItem[];
  status: InspectionProgramStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
  facility_sites?: { id: string; name: string; property_id: string | null } | null;
  facility_assets?: { id: string; name: string } | null;
  facility_systems?: { id: string; name: string } | null;
};

export type InspectionRunRow = {
  id: string;
  organization_id: string;
  program_id: string;
  site_id: string;
  asset_id: string | null;
  system_id: string | null;
  status: InspectionRunStatus;
  due_on: string | null;
  started_at: string | null;
  completed_at: string | null;
  actor_user_id: string | null;
  results: InspectionResultItem[];
  cancel_reason: string | null;
  completion_notes: string | null;
  created_at: string;
  updated_at: string;
  facility_inspection_programs?: {
    id: string;
    name: string;
    checklist_template: InspectionChecklistItem[];
  } | null;
  facility_sites?: { id: string; name: string; property_id: string | null } | null;
  workOrderIds?: string[];
};

async function recordInspection(
  supabase: Db,
  args: {
    organizationId: string;
    actorId: string | null;
    aggregateType: string;
    aggregateId: string;
    eventType: string;
    payload?: Record<string, unknown>;
  }
) {
  const payload = args.payload ?? {};
  await emitFacilityEvent({
    supabase,
    organizationId: args.organizationId,
    actorId: args.actorId,
    eventType: args.eventType,
    aggregateType: args.aggregateType,
    aggregateId: args.aggregateId,
    payload
  });
  await writeFacilityAudit({
    supabase,
    organizationId: args.organizationId,
    actorId: args.actorId,
    action: args.eventType,
    entityType: args.aggregateType,
    entityId: args.aggregateId,
    payload
  });
}

async function notifyManagers(
  supabase: Db,
  organizationId: string,
  args: {
    siteId: string | null;
    key: string;
    title: string;
    body: string;
    href: string;
  }
) {
  const { data: memberships } = await supabase
    .from("organization_memberships")
    .select("user_id, roles")
    .eq("organization_id", organizationId)
    .eq("status", "active");
  const managerIds = (memberships ?? [])
    .filter(
      (row) =>
        Array.isArray(row.roles) &&
        (row.roles.includes("organization_admin") || row.roles.includes("property_manager"))
    )
    .map((row) => row.user_id as string);
  await Promise.all(
    managerIds.map((userId) =>
      writeFacilityNotification({
        supabase,
        organizationId,
        userId,
        siteId: args.siteId,
        notificationKey: args.key,
        title: args.title,
        body: args.body,
        href: args.href
      })
    )
  );
}

function advanceInspectionDueDate(
  dueOn: string,
  cadenceUnit: InspectionCadenceUnit,
  cadenceInterval: number
): string | null {
  if (cadenceUnit === "one_shot") {
    return null;
  }
  return advancePmDueDate(dueOn, cadenceUnit as PmCadenceUnit, cadenceInterval);
}

function initializeResultsFromTemplate(
  template: readonly InspectionChecklistItem[]
): InspectionResultItem[] {
  return template.map((item) => ({
    key: item.key,
    label: item.label,
    outcome: "not_checked",
    spawnWorkOrder: false
  }));
}

function shouldSpawnCorrectiveWorkOrder(item: InspectionResultItem): boolean {
  if (item.outcome === "fail") {
    return true;
  }
  return item.spawnWorkOrder && item.outcome === "needs_attention";
}

async function loadRunWorkOrderIds(
  supabase: Db,
  organizationId: string,
  runId: string
): Promise<string[]> {
  const { data, error } = await supabase
    .from("facility_inspection_run_work_orders")
    .select("work_order_id")
    .eq("organization_id", organizationId)
    .eq("run_id", runId);
  if (error) {
    throw new Error(error.message);
  }
  return (data ?? []).map((row) => row.work_order_id as string);
}

async function createInspectionCorrectiveWorkOrder(
  supabase: Db,
  organizationId: string,
  actorUserId: string,
  run: InspectionRunRow,
  item: InspectionResultItem,
  propertyId: string | null
) {
  const { data: workOrder, error } = await supabase
    .from("maintenance_work_orders")
    .insert({
      organization_id: organizationId,
      property_id: propertyId,
      requested_by_user_id: actorUserId,
      product_context: "facility",
      work_kind: "facility_inspection_corrective",
      source: "facility_inspection",
      site_id: run.site_id,
      asset_id: run.asset_id,
      system_id: run.system_id,
      title: `Inspection finding: ${item.label}`,
      description:
        item.notes?.trim() ||
        `Corrective work for inspection item "${item.label}" (${item.outcome}).`,
      category: "general",
      priority: "normal",
      status: "submitted",
      assignee_type: "unassigned"
    })
    .select("id, title, status, priority, product_context, work_kind, source")
    .single();
  if (error) {
    throw new Error(error.message);
  }

  await supabase.from("maintenance_work_order_updates").insert({
    organization_id: organizationId,
    work_order_id: workOrder.id,
    actor_user_id: actorUserId,
    actor_role: "system",
    body: `Spawned from inspection run ${run.id} for item ${item.key}`,
    status_from: null,
    status_to: "submitted"
  });

  await emitFacilityEvent({
    supabase,
    organizationId,
    actorId: actorUserId,
    eventType: "work_order.created",
    aggregateType: "maintenance_work_orders",
    aggregateId: workOrder.id as string,
    payload: {
      product_context: "facility",
      work_kind: "facility_inspection_corrective",
      source: "facility_inspection",
      run_id: run.id,
      program_id: run.program_id,
      checklist_item_key: item.key,
      title: workOrder.title,
      site_id: run.site_id,
      asset_id: run.asset_id,
      system_id: run.system_id
    }
  });

  return workOrder as { id: string; title: string; status: string };
}

export async function listInspectionPrograms(supabase: Db, organizationId: string) {
  const { data, error } = await supabase
    .from("facility_inspection_programs")
    .select(SELECT_PROGRAM)
    .eq("organization_id", organizationId)
    .order("next_due_on", { ascending: true, nullsFirst: false });
  if (error) {
    throw new Error(error.message);
  }
  return (data ?? []) as InspectionProgramRow[];
}

export async function getInspectionProgram(
  supabase: Db,
  organizationId: string,
  programId: string
) {
  const { data, error } = await supabase
    .from("facility_inspection_programs")
    .select(SELECT_PROGRAM)
    .eq("organization_id", organizationId)
    .eq("id", programId)
    .maybeSingle();
  if (error) {
    throw new Error(error.message);
  }
  return (data as InspectionProgramRow | null) ?? null;
}

export async function activateInspectionProgram(
  supabase: Db,
  organizationId: string,
  actorUserId: string,
  programId: string
) {
  const existing = await getInspectionProgram(supabase, organizationId, programId);
  if (!existing) {
    throw new Error("Inspection program not found");
  }
  if (existing.status === "retired") {
    throw new Error("Retired inspection programs cannot be activated");
  }
  if (existing.status === "active") {
    return existing;
  }

  const patch: Record<string, unknown> = {
    status: "active",
    updated_at: new Date().toISOString()
  };
  if (!existing.next_due_on) {
    patch["next_due_on"] = todayUtcDate();
  }

  const { data, error } = await supabase
    .from("facility_inspection_programs")
    .update(patch)
    .eq("organization_id", organizationId)
    .eq("id", programId)
    .select(SELECT_PROGRAM)
    .single();
  if (error) {
    throw new Error(error.message);
  }

  const program = data as InspectionProgramRow;
  await recordInspection(supabase, {
    organizationId,
    actorId: actorUserId,
    aggregateType: "facility_inspection_programs",
    aggregateId: program.id,
    eventType: "facility.inspection.program_activated",
    payload: {
      name: program.name,
      next_due_on: program.next_due_on,
      site_id: program.site_id
    }
  });
  return program;
}

export async function createInspectionProgram(
  supabase: Db,
  organizationId: string,
  actorUserId: string,
  input: CreateInspectionProgramInput
) {
  const { data: site, error: siteError } = await supabase
    .from("facility_sites")
    .select("id, status")
    .eq("organization_id", organizationId)
    .eq("id", input.siteId)
    .maybeSingle();
  if (siteError) {
    throw new Error(siteError.message);
  }
  if (!site || site.status !== "active") {
    throw new Error("Active facility site required for inspection programs");
  }

  if (input.assetId) {
    const { data: asset, error } = await supabase
      .from("facility_assets")
      .select("id, site_id")
      .eq("organization_id", organizationId)
      .eq("id", input.assetId)
      .maybeSingle();
    if (error) {
      throw new Error(error.message);
    }
    if (!asset || asset.site_id !== input.siteId) {
      throw new Error("Asset must belong to the selected facility site");
    }
  }
  if (input.systemId) {
    const { data: system, error } = await supabase
      .from("facility_systems")
      .select("id, site_id")
      .eq("organization_id", organizationId)
      .eq("id", input.systemId)
      .maybeSingle();
    if (error) {
      throw new Error(error.message);
    }
    if (!system || system.site_id !== input.siteId) {
      throw new Error("Building system must belong to the selected facility site");
    }
  }

  const nextDueOn = input.nextDueOn ?? todayUtcDate();
  const status = input.activate ? "active" : "draft";

  const { data, error } = await supabase
    .from("facility_inspection_programs")
    .insert({
      organization_id: organizationId,
      site_id: input.siteId,
      asset_id: input.assetId ?? null,
      system_id: input.systemId ?? null,
      name: input.name,
      scope_type: input.scopeType,
      cadence_unit: input.cadenceUnit,
      cadence_interval: input.cadenceInterval,
      next_due_on: nextDueOn,
      checklist_template: input.checklistTemplate,
      notes: input.notes ?? null,
      status
    })
    .select(SELECT_PROGRAM)
    .single();
  if (error) {
    throw new Error(error.message);
  }

  const program = data as InspectionProgramRow;
  await recordInspection(supabase, {
    organizationId,
    actorId: actorUserId,
    aggregateType: "facility_inspection_programs",
    aggregateId: program.id,
    eventType: "facility.inspection.program_created",
    payload: {
      name: program.name,
      status: program.status,
      next_due_on: program.next_due_on,
      site_id: program.site_id,
      scope_type: program.scope_type
    }
  });

  if (input.activate) {
    await recordInspection(supabase, {
      organizationId,
      actorId: actorUserId,
      aggregateType: "facility_inspection_programs",
      aggregateId: program.id,
      eventType: "facility.inspection.program_activated",
      payload: { next_due_on: program.next_due_on }
    });
  }

  return program;
}

export async function listInspectionRuns(
  supabase: Db,
  organizationId: string,
  options?: { programId?: string; status?: InspectionRunStatus; limit?: number }
) {
  let query = supabase
    .from("facility_inspection_runs")
    .select(SELECT_RUN)
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(options?.limit ?? 50);
  if (options?.programId) {
    query = query.eq("program_id", options.programId);
  }
  if (options?.status) {
    query = query.eq("status", options.status);
  }
  const { data, error } = await query;
  if (error) {
    throw new Error(error.message);
  }
  return (data ?? []) as InspectionRunRow[];
}

export async function getInspectionRun(
  supabase: Db,
  organizationId: string,
  runId: string
): Promise<InspectionRunRow | null> {
  const { data, error } = await supabase
    .from("facility_inspection_runs")
    .select(SELECT_RUN)
    .eq("organization_id", organizationId)
    .eq("id", runId)
    .maybeSingle();
  if (error) {
    throw new Error(error.message);
  }
  if (!data) {
    return null;
  }
  const workOrderIds = await loadRunWorkOrderIds(supabase, organizationId, runId);
  return { ...(data as InspectionRunRow), workOrderIds };
}

export async function startInspectionRun(
  supabase: Db,
  organizationId: string,
  actorUserId: string,
  input: StartInspectionRunInput
) {
  const program = await getInspectionProgram(supabase, organizationId, input.programId);
  if (!program) {
    throw new Error("Inspection program not found");
  }
  if (program.status !== "active") {
    throw new Error("Only active inspection programs can be started");
  }

  const dueOn = input.dueOn ?? program.next_due_on ?? todayUtcDate();
  const now = new Date().toISOString();
  const results = initializeResultsFromTemplate(program.checklist_template);

  const { data, error } = await supabase
    .from("facility_inspection_runs")
    .insert({
      organization_id: organizationId,
      program_id: program.id,
      site_id: program.site_id,
      asset_id: program.asset_id,
      system_id: program.system_id,
      status: "in_progress",
      due_on: dueOn,
      started_at: now,
      actor_user_id: actorUserId,
      results
    })
    .select(SELECT_RUN)
    .single();
  if (error) {
    throw new Error(error.message);
  }

  const run = data as InspectionRunRow;
  await recordInspection(supabase, {
    organizationId,
    actorId: actorUserId,
    aggregateType: "facility_inspection_runs",
    aggregateId: run.id,
    eventType: "facility.inspection.started",
    payload: {
      program_id: program.id,
      program_name: program.name,
      due_on: dueOn,
      site_id: run.site_id,
      item_count: results.length
    }
  });
  return { ...run, workOrderIds: [] as string[] };
}

export async function completeInspectionRun(
  supabase: Db,
  organizationId: string,
  actorUserId: string,
  input: CompleteInspectionRunInput
) {
  const existing = await getInspectionRun(supabase, organizationId, input.runId);
  if (!existing) {
    throw new Error("Inspection run not found");
  }
  if (existing.status !== "in_progress") {
    throw new Error("Only in-progress inspection runs can be completed");
  }

  const program = await getInspectionProgram(supabase, organizationId, existing.program_id);
  if (!program) {
    throw new Error("Inspection program not found");
  }

  const outcomeStatus = deriveInspectionRunOutcome(input.results);
  const now = new Date().toISOString();
  const propertyId = existing.facility_sites?.property_id ?? program.facility_sites?.property_id ?? null;

  const spawnedWorkOrders: Array<{ workOrderId: string; checklistItemKey: string }> = [];
  for (const item of input.results) {
    if (!shouldSpawnCorrectiveWorkOrder(item)) {
      continue;
    }
    const workOrder = await createInspectionCorrectiveWorkOrder(
      supabase,
      organizationId,
      actorUserId,
      existing,
      item,
      propertyId
    );
    const { error: linkError } = await supabase.from("facility_inspection_run_work_orders").insert({
      organization_id: organizationId,
      run_id: existing.id,
      work_order_id: workOrder.id,
      checklist_item_key: item.key
    });
    if (linkError) {
      throw new Error(linkError.message);
    }
    spawnedWorkOrders.push({ workOrderId: workOrder.id, checklistItemKey: item.key });
  }

  const { data, error } = await supabase
    .from("facility_inspection_runs")
    .update({
      status: outcomeStatus,
      results: input.results,
      completion_notes: input.completionNotes ?? null,
      completed_at: now,
      updated_at: now
    })
    .eq("organization_id", organizationId)
    .eq("id", input.runId)
    .select(SELECT_RUN)
    .single();
  if (error) {
    throw new Error(error.message);
  }

  const run = data as InspectionRunRow;
  const completionPayload = {
    program_id: program.id,
    program_name: program.name,
    outcome: outcomeStatus,
    due_on: run.due_on,
    site_id: run.site_id,
    spawned_work_order_ids: spawnedWorkOrders.map((row) => row.workOrderId),
    failed_item_count: input.results.filter((item) => item.outcome === "fail").length
  };

  await recordInspection(supabase, {
    organizationId,
    actorId: actorUserId,
    aggregateType: "facility_inspection_runs",
    aggregateId: run.id,
    eventType: "facility.inspection.completed",
    payload: completionPayload
  });

  if (outcomeStatus === "completed_fail") {
    await recordInspection(supabase, {
      organizationId,
      actorId: actorUserId,
      aggregateType: "facility_inspection_runs",
      aggregateId: run.id,
      eventType: "facility.inspection.failed",
      payload: completionPayload
    });
    await notifyManagers(supabase, organizationId, {
      siteId: run.site_id,
      key: "facility.inspection.failed",
      title: `Inspection failed: ${program.name}`,
      body: `${completionPayload.failed_item_count} item(s) failed — corrective work spawned`,
      href: `/facility/inspections?runId=${run.id}`
    });
  }

  const programPatch: Record<string, unknown> = {
    updated_at: now
  };
  const baseDue = run.due_on ?? todayUtcDate();
  if (program.cadence_unit === "one_shot") {
    programPatch["status"] = "retired";
    programPatch["next_due_on"] = null;
  } else {
    programPatch["next_due_on"] = advanceInspectionDueDate(
      baseDue,
      program.cadence_unit,
      program.cadence_interval
    );
  }
  const { error: programError } = await supabase
    .from("facility_inspection_programs")
    .update(programPatch)
    .eq("organization_id", organizationId)
    .eq("id", program.id);
  if (programError) {
    throw new Error(programError.message);
  }

  return {
    ...run,
    workOrderIds: spawnedWorkOrders.map((row) => row.workOrderId),
    spawnedWorkOrders
  };
}

export async function cancelInspectionRun(
  supabase: Db,
  organizationId: string,
  actorUserId: string,
  input: CancelInspectionRunInput
) {
  const existing = await getInspectionRun(supabase, organizationId, input.runId);
  if (!existing) {
    throw new Error("Inspection run not found");
  }
  if (!["scheduled", "in_progress"].includes(existing.status)) {
    throw new Error("Only scheduled or in-progress runs can be cancelled");
  }

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("facility_inspection_runs")
    .update({
      status: "cancelled",
      cancel_reason: input.reason,
      updated_at: now
    })
    .eq("organization_id", organizationId)
    .eq("id", input.runId)
    .select(SELECT_RUN)
    .single();
  if (error) {
    throw new Error(error.message);
  }

  const run = data as InspectionRunRow;
  await recordInspection(supabase, {
    organizationId,
    actorId: actorUserId,
    aggregateType: "facility_inspection_runs",
    aggregateId: run.id,
    eventType: "facility.inspection.cancelled",
    payload: {
      program_id: run.program_id,
      reason: input.reason,
      site_id: run.site_id
    }
  });

  const workOrderIds = await loadRunWorkOrderIds(supabase, organizationId, run.id);
  return { ...run, workOrderIds };
}

export async function searchInspections(supabase: Db, organizationId: string, query: string) {
  const q = query.trim();
  if (q.length < 2) {
    return [];
  }
  const [programs, runs] = await Promise.all([
    supabase
      .from("facility_inspection_programs")
      .select("id, name, status, next_due_on")
      .eq("organization_id", organizationId)
      .ilike("name", `%${q}%`)
      .order("name", { ascending: true })
      .limit(10),
    supabase
      .from("facility_inspection_runs")
      .select("id, status, due_on, facility_inspection_programs ( name )")
      .eq("organization_id", organizationId)
      .in("status", ["in_progress", "completed_fail", "completed_pass"])
      .order("created_at", { ascending: false })
      .limit(10)
  ]);
  if (programs.error) {
    throw new Error(programs.error.message);
  }
  if (runs.error) {
    throw new Error(runs.error.message);
  }

  const programResults = (programs.data ?? []).map((row) => ({
    id: row.id as string,
    label: `${row.name as string} · ${row.status as string}`,
    href: `/facility/inspections?programId=${row.id as string}`,
    group: "Inspection Programs"
  }));

  const runResults = (runs.data ?? [])
    .filter((row) => {
      const program = Array.isArray(row.facility_inspection_programs)
        ? row.facility_inspection_programs[0]
        : row.facility_inspection_programs;
      const name = (program?.name as string | undefined)?.toLowerCase() ?? "";
      return name.includes(q.toLowerCase()) || (row.status as string).includes(q.toLowerCase());
    })
    .map((row) => {
      const program = Array.isArray(row.facility_inspection_programs)
        ? row.facility_inspection_programs[0]
        : row.facility_inspection_programs;
      return {
        id: row.id as string,
        label: `${(program?.name as string) ?? "Inspection"} · ${row.status as string}`,
        href: `/facility/inspections?runId=${row.id as string}`,
        group: "Inspection Runs"
      };
    });

  return [...programResults, ...runResults];
}

export function summarizeInspections(
  programs: readonly InspectionProgramRow[],
  runs: readonly InspectionRunRow[],
  asOf = todayUtcDate()
) {
  const activePrograms = programs.filter((program) => program.status === "active");
  const duePrograms = activePrograms.filter(
    (program) => program.next_due_on != null && program.next_due_on <= asOf
  );
  const inProgressRuns = runs.filter((run) => run.status === "in_progress");
  const failedRuns = runs.filter((run) => run.status === "completed_fail");
  return {
    programCount: programs.length,
    activeProgramCount: activePrograms.length,
    dueProgramCount: duePrograms.length,
    inProgressRunCount: inProgressRuns.length,
    failedRunCount: failedRuns.length,
    firstDueProgramId: duePrograms[0]?.id ?? null,
    firstInProgressRunId: inProgressRuns[0]?.id ?? null
  };
}

export function buildInspectionAssistant(summary: {
  dueProgramCount: number;
  inProgressRunCount: number;
  failedRunCount: number;
  activeProgramCount: number;
}) {
  if (summary.inProgressRunCount > 0) {
    return "Complete in-progress inspection runs and capture checklist outcomes.";
  }
  if (summary.failedRunCount > 0) {
    return "Review failed inspection runs and track corrective work orders.";
  }
  if (summary.dueProgramCount > 0) {
    return "Start inspection runs for programs that are due.";
  }
  if (summary.activeProgramCount <= 0) {
    return "Create and activate your first inspection program with a checklist template.";
  }
  return "Inspections are ready. Start runs when programs are due and complete checklists on site.";
}
