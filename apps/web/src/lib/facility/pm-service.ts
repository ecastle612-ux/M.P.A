import type { SupabaseClient } from "@supabase/supabase-js";
import {
  advancePmDueDate,
  todayUtcDate,
  type CreatePmScheduleInput,
  type PmCadenceUnit,
  type TransitionPmScheduleInput
} from "@mpa/shared";
import { emitFacilityEvent, writeFacilityAudit, writeFacilityNotification } from "./events-audit";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = SupabaseClient<any>;

const SELECT_SCHEDULE = `
  *,
  facility_sites ( id, name, property_id ),
  facility_assets ( id, name, criticality ),
  facility_systems ( id, name, criticality )
`;

export type PmScheduleRow = {
  id: string;
  organization_id: string;
  site_id: string;
  asset_id: string | null;
  system_id: string | null;
  name: string;
  title_template: string;
  description_template: string;
  category: string;
  priority: string;
  cadence_unit: PmCadenceUnit;
  cadence_interval: number;
  is_one_shot: boolean;
  next_due_on: string | null;
  last_completed_on: string | null;
  status: string;
  criticality: string;
  created_at: string;
  updated_at: string;
  facility_sites?: { id: string; name: string; property_id: string | null } | null;
  facility_assets?: { id: string; name: string; criticality: string } | null;
  facility_systems?: { id: string; name: string; criticality: string } | null;
};

export type PmGenerationRunRow = {
  id: string;
  organization_id: string;
  schedule_id: string;
  due_on: string;
  work_order_id: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

async function recordPm(
  supabase: Db,
  args: {
    organizationId: string;
    actorId: string | null;
    scheduleId: string;
    eventType: string;
    payload?: Record<string, unknown>;
    alsoAssetId?: string | null;
    alsoSystemId?: string | null;
    alsoSiteId?: string | null;
  }
) {
  const payload = args.payload ?? {};
  await emitFacilityEvent({
    supabase,
    organizationId: args.organizationId,
    actorId: args.actorId,
    eventType: args.eventType,
    aggregateType: "facility_pm_schedules",
    aggregateId: args.scheduleId,
    payload
  });
  if (args.alsoSiteId) {
    await emitFacilityEvent({
      supabase,
      organizationId: args.organizationId,
      actorId: args.actorId,
      eventType: args.eventType,
      aggregateType: "facility_sites",
      aggregateId: args.alsoSiteId,
      payload: { ...payload, scheduleId: args.scheduleId }
    });
  }
  if (args.alsoAssetId) {
    await emitFacilityEvent({
      supabase,
      organizationId: args.organizationId,
      actorId: args.actorId,
      eventType: args.eventType,
      aggregateType: "facility_assets",
      aggregateId: args.alsoAssetId,
      payload: { ...payload, scheduleId: args.scheduleId }
    });
  }
  if (args.alsoSystemId) {
    await emitFacilityEvent({
      supabase,
      organizationId: args.organizationId,
      actorId: args.actorId,
      eventType: args.eventType,
      aggregateType: "facility_systems",
      aggregateId: args.alsoSystemId,
      payload: { ...payload, scheduleId: args.scheduleId }
    });
  }
  await writeFacilityAudit({
    supabase,
    organizationId: args.organizationId,
    actorId: args.actorId,
    action: args.eventType,
    entityType: "facility_pm_schedules",
    entityId: args.scheduleId,
    payload
  });
}

async function notifyFacilityManagers(
  supabase: Db,
  organizationId: string,
  args: {
    siteId: string;
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

export async function listPmSchedules(supabase: Db, organizationId: string) {
  const { data, error } = await supabase
    .from("facility_pm_schedules")
    .select(SELECT_SCHEDULE)
    .eq("organization_id", organizationId)
    .order("next_due_on", { ascending: true, nullsFirst: false });
  if (error) {
    throw new Error(error.message);
  }
  return (data ?? []) as PmScheduleRow[];
}

export async function getPmSchedule(supabase: Db, organizationId: string, scheduleId: string) {
  const { data, error } = await supabase
    .from("facility_pm_schedules")
    .select(SELECT_SCHEDULE)
    .eq("organization_id", organizationId)
    .eq("id", scheduleId)
    .maybeSingle();
  if (error) {
    throw new Error(error.message);
  }
  return (data as PmScheduleRow | null) ?? null;
}

export async function listPmGenerationRuns(
  supabase: Db,
  organizationId: string,
  scheduleId?: string
) {
  let query = supabase
    .from("facility_pm_generation_runs")
    .select("*")
    .eq("organization_id", organizationId)
    .order("due_on", { ascending: false })
    .limit(50);
  if (scheduleId) {
    query = query.eq("schedule_id", scheduleId);
  }
  const { data, error } = await query;
  if (error) {
    throw new Error(error.message);
  }
  return (data ?? []) as PmGenerationRunRow[];
}

export async function listPmScheduleTimeline(
  supabase: Db,
  organizationId: string,
  scheduleId: string
) {
  const { data, error } = await supabase
    .from("event_domain_events")
    .select("id, event_type, payload, created_at")
    .eq("organization_id", organizationId)
    .eq("aggregate_type", "facility_pm_schedules")
    .eq("aggregate_id", scheduleId)
    .order("created_at", { ascending: false })
    .limit(40);
  if (error) {
    throw new Error(error.message);
  }
  return data ?? [];
}

export async function createPmSchedule(
  supabase: Db,
  organizationId: string,
  actorUserId: string,
  input: CreatePmScheduleInput
) {
  const { data: site, error: siteError } = await supabase
    .from("facility_sites")
    .select("id, name, status")
    .eq("organization_id", organizationId)
    .eq("id", input.siteId)
    .maybeSingle();
  if (siteError) {
    throw new Error(siteError.message);
  }
  if (!site) {
    throw new Error("Facility site not found");
  }
  if (site.status !== "active") {
    throw new Error("Activate the facility site before creating PM programs");
  }

  let criticality = input.criticality;
  if (input.assetId) {
    const { data: asset, error } = await supabase
      .from("facility_assets")
      .select("id, site_id, criticality")
      .eq("organization_id", organizationId)
      .eq("id", input.assetId)
      .maybeSingle();
    if (error) {
      throw new Error(error.message);
    }
    if (!asset) {
      throw new Error("Asset not found");
    }
    if (asset.site_id !== input.siteId) {
      throw new Error("Asset must belong to the selected facility site");
    }
    if (!input.criticality || input.criticality === "medium") {
      criticality = (asset.criticality as typeof criticality) ?? criticality;
    }
  }
  if (input.systemId) {
    const { data: system, error } = await supabase
      .from("facility_systems")
      .select("id, site_id, criticality")
      .eq("organization_id", organizationId)
      .eq("id", input.systemId)
      .maybeSingle();
    if (error) {
      throw new Error(error.message);
    }
    if (!system) {
      throw new Error("Building system not found");
    }
    if (system.site_id !== input.siteId) {
      throw new Error("Building system must belong to the selected facility site");
    }
  }

  const nextDueOn = input.nextDueOn ?? todayUtcDate();
  const status = input.activateNow ? "active" : "draft";

  const { data, error } = await supabase
    .from("facility_pm_schedules")
    .insert({
      organization_id: organizationId,
      site_id: input.siteId,
      asset_id: input.assetId ?? null,
      system_id: input.systemId ?? null,
      name: input.name,
      title_template: input.titleTemplate,
      description_template: input.descriptionTemplate ?? "",
      category: input.category,
      priority: input.priority,
      cadence_unit: input.cadenceUnit,
      cadence_interval: input.cadenceInterval,
      is_one_shot: input.isOneShot,
      next_due_on: nextDueOn,
      status,
      criticality
    })
    .select(SELECT_SCHEDULE)
    .single();
  if (error) {
    throw new Error(error.message);
  }

  const schedule = data as PmScheduleRow;
  await recordPm(supabase, {
    organizationId,
    actorId: actorUserId,
    scheduleId: schedule.id,
    eventType: "facility.pm_schedule.created",
    alsoSiteId: schedule.site_id,
    alsoAssetId: schedule.asset_id,
    alsoSystemId: schedule.system_id,
    payload: {
      name: schedule.name,
      status: schedule.status,
      next_due_on: schedule.next_due_on,
      site_id: schedule.site_id,
      asset_id: schedule.asset_id,
      system_id: schedule.system_id
    }
  });
  if (status === "active") {
    await recordPm(supabase, {
      organizationId,
      actorId: actorUserId,
      scheduleId: schedule.id,
      eventType: "facility.pm_schedule.activated",
      alsoSiteId: schedule.site_id,
      alsoAssetId: schedule.asset_id,
      alsoSystemId: schedule.system_id,
      payload: { next_due_on: schedule.next_due_on }
    });
  }
  return schedule;
}

export async function transitionPmSchedule(
  supabase: Db,
  organizationId: string,
  actorUserId: string,
  input: TransitionPmScheduleInput
) {
  const existing = await getPmSchedule(supabase, organizationId, input.scheduleId);
  if (!existing) {
    throw new Error("PM schedule not found");
  }

  let nextStatus = existing.status;
  let eventType = "facility.pm_schedule.activated";
  if (input.action === "activate" || input.action === "resume") {
    if (existing.status === "retired") {
      throw new Error("Retired schedules cannot be reactivated");
    }
    nextStatus = "active";
    eventType =
      input.action === "resume" ? "facility.pm_schedule.resumed" : "facility.pm_schedule.activated";
  } else if (input.action === "pause") {
    if (existing.status !== "active") {
      throw new Error("Only active schedules can be paused");
    }
    nextStatus = "paused";
    eventType = "facility.pm_schedule.paused";
  } else if (input.action === "retire") {
    nextStatus = "retired";
    eventType = "facility.pm_schedule.retired";
  }

  const patch: Record<string, unknown> = {
    status: nextStatus,
    updated_at: new Date().toISOString()
  };
  if ((input.action === "activate" || input.action === "resume") && !existing.next_due_on) {
    patch["next_due_on"] = todayUtcDate();
  }

  const { data, error } = await supabase
    .from("facility_pm_schedules")
    .update(patch)
    .eq("organization_id", organizationId)
    .eq("id", input.scheduleId)
    .select(SELECT_SCHEDULE)
    .single();
  if (error) {
    throw new Error(error.message);
  }

  const schedule = data as PmScheduleRow;
  await recordPm(supabase, {
    organizationId,
    actorId: actorUserId,
    scheduleId: schedule.id,
    eventType,
    alsoSiteId: schedule.site_id,
    alsoAssetId: schedule.asset_id,
    alsoSystemId: schedule.system_id,
    payload: { status: schedule.status, next_due_on: schedule.next_due_on }
  });
  return schedule;
}

async function createPreventiveWorkOrder(
  supabase: Db,
  organizationId: string,
  actorUserId: string,
  schedule: PmScheduleRow,
  dueOn: string
) {
  const propertyId = schedule.facility_sites?.property_id ?? null;
  const { data: workOrder, error } = await supabase
    .from("maintenance_work_orders")
    .insert({
      organization_id: organizationId,
      property_id: propertyId,
      requested_by_user_id: actorUserId,
      product_context: "facility",
      work_kind: "facility_preventive",
      source: "facility_pm_generator",
      site_id: schedule.site_id,
      asset_id: schedule.asset_id,
      system_id: schedule.system_id,
      title: schedule.title_template,
      description:
        schedule.description_template ||
        `Preventive maintenance for ${schedule.name} (due ${dueOn}).`,
      category: schedule.category,
      priority: schedule.priority,
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
    body: `Generated from PM schedule ${schedule.name} for due date ${dueOn}`,
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
      work_kind: "facility_preventive",
      source: "facility_pm_generator",
      schedule_id: schedule.id,
      due_on: dueOn,
      title: schedule.title_template,
      site_id: schedule.site_id,
      asset_id: schedule.asset_id,
      system_id: schedule.system_id
    }
  });

  return workOrder as { id: string; title: string; status: string };
}

/** Generate shared WOs for active schedules with next_due_on <= asOf (idempotent per due_on). */
export async function generateDuePmWork(
  supabase: Db,
  organizationId: string,
  actorUserId: string,
  asOf: string = todayUtcDate()
) {
  const schedules = await listPmSchedules(supabase, organizationId);
  const dueSchedules = schedules.filter(
    (schedule) =>
      schedule.status === "active" &&
      schedule.next_due_on != null &&
      schedule.next_due_on <= asOf
  );

  const generated: Array<{
    scheduleId: string;
    runId: string;
    workOrderId: string;
    dueOn: string;
    created: boolean;
  }> = [];

  for (const schedule of dueSchedules) {
    const dueOn = schedule.next_due_on!;
    const { data: existingRun } = await supabase
      .from("facility_pm_generation_runs")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("schedule_id", schedule.id)
      .eq("due_on", dueOn)
      .maybeSingle();

    if (existingRun?.work_order_id) {
      generated.push({
        scheduleId: schedule.id,
        runId: existingRun.id as string,
        workOrderId: existingRun.work_order_id as string,
        dueOn,
        created: false
      });
      continue;
    }

    let runId = existingRun?.id as string | undefined;
    if (!existingRun) {
      const { data: run, error: runError } = await supabase
        .from("facility_pm_generation_runs")
        .insert({
          organization_id: organizationId,
          schedule_id: schedule.id,
          due_on: dueOn,
          status: "due"
        })
        .select("*")
        .single();
      if (runError) {
        // Unique race — re-read
        const { data: raced } = await supabase
          .from("facility_pm_generation_runs")
          .select("*")
          .eq("schedule_id", schedule.id)
          .eq("due_on", dueOn)
          .maybeSingle();
        if (raced?.work_order_id) {
          generated.push({
            scheduleId: schedule.id,
            runId: raced.id as string,
            workOrderId: raced.work_order_id as string,
            dueOn,
            created: false
          });
          continue;
        }
        if (!raced) {
          throw new Error(runError.message);
        }
        runId = raced.id as string;
      } else {
        runId = run.id as string;
        await recordPm(supabase, {
          organizationId,
          actorId: actorUserId,
          scheduleId: schedule.id,
          eventType: "facility.pm_schedule.due",
          alsoSiteId: schedule.site_id,
          alsoAssetId: schedule.asset_id,
          alsoSystemId: schedule.system_id,
          payload: { due_on: dueOn, run_id: runId }
        });
      }
    }

    const workOrder = await createPreventiveWorkOrder(
      supabase,
      organizationId,
      actorUserId,
      schedule,
      dueOn
    );

    const { error: updateRunError } = await supabase
      .from("facility_pm_generation_runs")
      .update({
        work_order_id: workOrder.id,
        status: "work_created",
        updated_at: new Date().toISOString()
      })
      .eq("id", runId!)
      .eq("organization_id", organizationId);
    if (updateRunError) {
      throw new Error(updateRunError.message);
    }

    await recordPm(supabase, {
      organizationId,
      actorId: actorUserId,
      scheduleId: schedule.id,
      eventType: "facility.pm_schedule.generated_work",
      alsoSiteId: schedule.site_id,
      alsoAssetId: schedule.asset_id,
      alsoSystemId: schedule.system_id,
      payload: {
        due_on: dueOn,
        run_id: runId,
        work_order_id: workOrder.id,
        product_context: "facility",
        work_kind: "facility_preventive",
        source: "facility_pm_generator"
      }
    });

    const notificationKey =
      dueOn < asOf ? "facility.pm_schedule.overdue" : "facility.pm_schedule.generated_work";
    await notifyFacilityManagers(supabase, organizationId, {
      siteId: schedule.site_id,
      key: notificationKey,
      title: dueOn < asOf ? "Overdue PM work generated" : "PM work generated",
      body: `${schedule.name} → ${workOrder.title}`,
      href: `/facility/operations?workOrderId=${workOrder.id}`
    });

    generated.push({
      scheduleId: schedule.id,
      runId: runId!,
      workOrderId: workOrder.id,
      dueOn,
      created: true
    });
  }

  return {
    asOf,
    considered: dueSchedules.length,
    generated
  };
}

/** On facility preventive WO close: acknowledge run and advance (or retire) schedule. */
export async function acknowledgePmRunForWorkOrder(
  supabase: Db,
  organizationId: string,
  actorUserId: string,
  workOrderId: string
) {
  const { data: run, error } = await supabase
    .from("facility_pm_generation_runs")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("work_order_id", workOrderId)
    .maybeSingle();
  if (error) {
    throw new Error(error.message);
  }
  if (!run) {
    return null;
  }

  const now = new Date().toISOString();
  const completedAt = todayUtcDate();

  await supabase
    .from("facility_pm_generation_runs")
    .update({
      status: "work_completed",
      updated_at: now
    })
    .eq("id", run.id)
    .eq("organization_id", organizationId);

  const schedule = await getPmSchedule(supabase, organizationId, run.schedule_id as string);
  if (!schedule) {
    return null;
  }

  const patch: Record<string, unknown> = {
    last_completed_on: completedAt,
    updated_at: now
  };

  if (schedule.is_one_shot) {
    patch["status"] = "retired";
    patch["next_due_on"] = null;
  } else {
    const baseDue = (run.due_on as string) || completedAt;
    patch["next_due_on"] = advancePmDueDate(
      baseDue,
      schedule.cadence_unit,
      schedule.cadence_interval
    );
  }

  const { data: updatedSchedule, error: scheduleError } = await supabase
    .from("facility_pm_schedules")
    .update(patch)
    .eq("id", schedule.id)
    .eq("organization_id", organizationId)
    .select(SELECT_SCHEDULE)
    .single();
  if (scheduleError) {
    throw new Error(scheduleError.message);
  }

  await supabase
    .from("facility_pm_generation_runs")
    .update({
      status: "acknowledged",
      updated_at: now
    })
    .eq("id", run.id)
    .eq("organization_id", organizationId);

  await recordPm(supabase, {
    organizationId,
    actorId: actorUserId,
    scheduleId: schedule.id,
    eventType: "facility.pm_schedule.acknowledged",
    alsoSiteId: schedule.site_id,
    alsoAssetId: schedule.asset_id,
    alsoSystemId: schedule.system_id,
    payload: {
      run_id: run.id,
      work_order_id: workOrderId,
      due_on: run.due_on,
      next_due_on: (updatedSchedule as PmScheduleRow).next_due_on,
      status: (updatedSchedule as PmScheduleRow).status
    }
  });

  if (schedule.is_one_shot) {
    await recordPm(supabase, {
      organizationId,
      actorId: actorUserId,
      scheduleId: schedule.id,
      eventType: "facility.pm_schedule.retired",
      alsoSiteId: schedule.site_id,
      alsoAssetId: schedule.asset_id,
      alsoSystemId: schedule.system_id,
      payload: { reason: "one_shot_acknowledged" }
    });
  }

  return updatedSchedule as PmScheduleRow;
}

export async function searchPmSchedules(supabase: Db, organizationId: string, query: string) {
  const q = query.trim();
  if (q.length < 2) {
    return [];
  }
  const { data, error } = await supabase
    .from("facility_pm_schedules")
    .select("id, name, status, next_due_on")
    .eq("organization_id", organizationId)
    .or(`name.ilike.%${q}%,title_template.ilike.%${q}%`)
    .order("name", { ascending: true })
    .limit(20);
  if (error) {
    throw new Error(error.message);
  }
  return (data ?? []).map((row) => ({
    id: row.id as string,
    label: `${row.name as string} · ${row.status as string}`,
    href: `/facility/preventive-maintenance?scheduleId=${row.id as string}`,
    group: "Preventive Maintenance"
  }));
}

export function summarizePmSchedules(schedules: readonly PmScheduleRow[], asOf = todayUtcDate()) {
  const active = schedules.filter((s) => s.status === "active");
  const due = active.filter((s) => s.next_due_on === asOf);
  const overdue = active.filter((s) => s.next_due_on != null && s.next_due_on < asOf);
  const upcoming = active
    .filter((s) => s.next_due_on != null && s.next_due_on > asOf)
    .slice()
    .sort((a, b) => (a.next_due_on ?? "").localeCompare(b.next_due_on ?? ""));
  return {
    total: schedules.length,
    activeCount: active.length,
    dueCount: due.length,
    overdueCount: overdue.length,
    upcoming,
    firstDueOrOverdueId: overdue[0]?.id ?? due[0]?.id ?? null
  };
}

export function buildPmAssistantRecommendation(summary: {
  overdueCount: number;
  dueCount: number;
  activeCount: number;
}) {
  if (summary.overdueCount > 0) {
    return "Generate and complete overdue preventive maintenance work.";
  }
  if (summary.dueCount > 0) {
    return "Generate preventive work orders that are due today.";
  }
  if (summary.activeCount <= 0) {
    return "Create and activate your first preventive maintenance schedule.";
  }
  return "Preventive Maintenance is ready. Activate schedules so due work generates into Maintenance.";
}
