import { createAuthServerComponentClient, createServiceRoleServerClient } from "../auth/server";
import { createWorkOrder } from "../maintenance/server";
import { notify } from "../notifications/service";
import type { Json } from "@mpa/supabase";
import {
  advanceDueDate,
  isPmCadence,
  type CreatePmScheduleInput,
  type FacilityPmOccurrence,
  type FacilityPmSchedule,
  type FacilityPmScheduleListItem,
  type PmCadence,
  type PmOccurrenceStatus,
  type UpdatePmScheduleInput
} from "./pm-contracts";

type SupabaseClientType = Awaited<ReturnType<typeof createAuthServerComponentClient>>;

type ScheduleRow = {
  id: string;
  organization_id: string;
  property_id: string;
  asset_id: string | null;
  title: string;
  cadence: string;
  custom_interval_days: number | null;
  next_due: string;
  default_assignee_user_id: string | null;
  active: boolean;
  metadata: Json | null;
  created_by: string;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

type OccurrenceRow = {
  id: string;
  organization_id: string;
  schedule_id: string;
  due_on: string;
  status: string;
  work_order_id: string | null;
  metadata: Json | null;
  created_at: string;
  updated_at: string;
};

const SCHEDULE_SELECT =
  "id, organization_id, property_id, asset_id, title, cadence, custom_interval_days, next_due, default_assignee_user_id, active, metadata, created_by, updated_by, created_at, updated_at, deleted_at";

async function resolveClient(client?: SupabaseClientType): Promise<SupabaseClientType> {
  return client ?? (await createAuthServerComponentClient());
}

async function propertyNameMap(
  organizationId: string,
  propertyIds: string[],
  client: SupabaseClientType
): Promise<Map<string, string>> {
  const unique = [...new Set(propertyIds.filter(Boolean))];
  if (unique.length === 0) return new Map();
  const { data, error } = await client
    .from("properties")
    .select("id, name")
    .eq("organization_id", organizationId)
    .in("id", unique);
  if (error) return new Map();
  return new Map(((data ?? []) as Array<{ id: string; name: string }>).map((row) => [row.id, row.name]));
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function toMetadata(value: Json | null): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function toCadence(value: string): PmCadence {
  return isPmCadence(value) ? value : "monthly";
}

function toSchedule(row: ScheduleRow): FacilityPmSchedule {
  return {
    id: row.id,
    organizationId: row.organization_id,
    propertyId: row.property_id,
    assetId: row.asset_id,
    title: row.title,
    cadence: toCadence(row.cadence),
    customIntervalDays: row.custom_interval_days,
    nextDue: row.next_due.slice(0, 10),
    defaultAssigneeUserId: row.default_assignee_user_id,
    active: row.active,
    metadata: toMetadata(row.metadata),
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at
  };
}

function toListItem(row: ScheduleRow, propertyName: string | null): FacilityPmScheduleListItem {
  const schedule = toSchedule(row);
  return {
    ...schedule,
    propertyName,
    assetName: null,
    overdue: schedule.active && schedule.nextDue < todayKey()
  };
}

function toOccurrence(row: OccurrenceRow): FacilityPmOccurrence {
  const status = (
    ["pending", "materialized", "skipped", "cancelled"] as const
  ).includes(row.status as PmOccurrenceStatus)
    ? (row.status as PmOccurrenceStatus)
    : "pending";
  return {
    id: row.id,
    organizationId: row.organization_id,
    scheduleId: row.schedule_id,
    dueOn: row.due_on.slice(0, 10),
    status,
    workOrderId: row.work_order_id,
    metadata: toMetadata(row.metadata),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export async function listPmSchedules(
  organizationId: string,
  client?: SupabaseClientType
): Promise<FacilityPmScheduleListItem[]> {
  const supabase = await resolveClient(client);
  const { data, error } = await supabase
    .from("facility_pm_schedules")
    .select(SCHEDULE_SELECT)
    .eq("organization_id", organizationId)
    .is("deleted_at", null)
    .order("next_due", { ascending: true });
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as ScheduleRow[];
  const names = await propertyNameMap(
    organizationId,
    rows.map((row) => row.property_id),
    supabase
  );
  return rows.map((row) => toListItem(row, names.get(row.property_id) ?? null));
}

export async function getPmSchedule(
  organizationId: string,
  scheduleId: string,
  client?: SupabaseClientType
): Promise<FacilityPmScheduleListItem | null> {
  const supabase = await resolveClient(client);
  const { data, error } = await supabase
    .from("facility_pm_schedules")
    .select(SCHEDULE_SELECT)
    .eq("organization_id", organizationId)
    .eq("id", scheduleId)
    .is("deleted_at", null)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  const row = data as ScheduleRow;
  const names = await propertyNameMap(organizationId, [row.property_id], supabase);
  return toListItem(row, names.get(row.property_id) ?? null);
}

export async function createPmSchedule(
  organizationId: string,
  userId: string,
  input: CreatePmScheduleInput,
  client?: SupabaseClientType
): Promise<FacilityPmSchedule> {
  const supabase = await resolveClient(client);
  const { data, error } = await supabase
    .from("facility_pm_schedules")
    .insert({
      organization_id: organizationId,
      property_id: input.propertyId,
      asset_id: input.assetId ?? null,
      title: input.title,
      cadence: input.cadence,
      custom_interval_days: input.customIntervalDays ?? null,
      next_due: input.nextDue,
      default_assignee_user_id: input.defaultAssigneeUserId ?? null,
      active: input.active ?? true,
      created_by: userId,
      updated_by: userId
    })
    .select(
      "id, organization_id, property_id, asset_id, title, cadence, custom_interval_days, next_due, default_assignee_user_id, active, metadata, created_by, updated_by, created_at, updated_at, deleted_at"
    )
    .single();
  if (error) throw new Error(error.message);
  return toSchedule(data as ScheduleRow);
}

export async function updatePmSchedule(
  organizationId: string,
  scheduleId: string,
  userId: string,
  input: UpdatePmScheduleInput,
  client?: SupabaseClientType
): Promise<FacilityPmSchedule> {
  const supabase = await resolveClient(client);
  const patch = {
    updated_by: userId,
    ...(input.title !== undefined ? { title: input.title } : {}),
    ...(input.propertyId !== undefined ? { property_id: input.propertyId } : {}),
    ...(input.assetId !== undefined ? { asset_id: input.assetId } : {}),
    ...(input.cadence !== undefined ? { cadence: input.cadence } : {}),
    ...(input.customIntervalDays !== undefined
      ? { custom_interval_days: input.customIntervalDays }
      : {}),
    ...(input.nextDue !== undefined ? { next_due: input.nextDue } : {}),
    ...(input.defaultAssigneeUserId !== undefined
      ? { default_assignee_user_id: input.defaultAssigneeUserId }
      : {}),
    ...(input.active !== undefined ? { active: input.active } : {})
  };

  const { data, error } = await supabase
    .from("facility_pm_schedules")
    .update(patch)
    .eq("organization_id", organizationId)
    .eq("id", scheduleId)
    .is("deleted_at", null)
    .select(
      "id, organization_id, property_id, asset_id, title, cadence, custom_interval_days, next_due, default_assignee_user_id, active, metadata, created_by, updated_by, created_at, updated_at, deleted_at"
    )
    .single();
  if (error) throw new Error(error.message);
  return toSchedule(data as ScheduleRow);
}

export async function listPmOccurrences(
  organizationId: string,
  options: { from?: string; to?: string; limit?: number } = {},
  client?: SupabaseClientType
): Promise<FacilityPmOccurrence[]> {
  const supabase = await resolveClient(client);
  let query = supabase
    .from("facility_pm_occurrences")
    .select(
      "id, organization_id, schedule_id, due_on, status, work_order_id, metadata, created_at, updated_at"
    )
    .eq("organization_id", organizationId)
    .order("due_on", { ascending: true });
  if (options.from) query = query.gte("due_on", options.from);
  if (options.to) query = query.lte("due_on", options.to);
  if (options.limit !== undefined) query = query.limit(options.limit);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return ((data ?? []) as OccurrenceRow[]).map(toOccurrence);
}

async function listManagerUserIds(
  organizationId: string,
  client: SupabaseClientType
): Promise<string[]> {
  const { data, error } = await client
    .from("organization_memberships")
    .select("user_id, roles")
    .eq("organization_id", organizationId)
    .eq("status", "active");
  if (error) return [];
  return ((data ?? []) as Array<{ user_id: string; roles: string[] | null }>)
    .filter(
      (row) =>
        Array.isArray(row.roles) &&
        (row.roles.includes("property_manager") || row.roles.includes("organization_admin"))
    )
    .map((row) => row.user_id);
}

async function ensureOccurrence(
  schedule: FacilityPmSchedule,
  dueOn: string,
  client: SupabaseClientType
): Promise<FacilityPmOccurrence> {
  const { data: existing } = await client
    .from("facility_pm_occurrences")
    .select(
      "id, organization_id, schedule_id, due_on, status, work_order_id, metadata, created_at, updated_at"
    )
    .eq("organization_id", schedule.organizationId)
    .eq("schedule_id", schedule.id)
    .eq("due_on", dueOn)
    .maybeSingle();
  if (existing) return toOccurrence(existing as OccurrenceRow);

  const { data, error } = await client
    .from("facility_pm_occurrences")
    .insert({
      organization_id: schedule.organizationId,
      schedule_id: schedule.id,
      due_on: dueOn,
      status: "pending"
    })
    .select(
      "id, organization_id, schedule_id, due_on, status, work_order_id, metadata, created_at, updated_at"
    )
    .single();
  if (error) throw new Error(error.message);
  return toOccurrence(data as OccurrenceRow);
}

async function materializeOccurrence(
  schedule: FacilityPmSchedule,
  occurrence: FacilityPmOccurrence,
  actorUserId: string,
  client: SupabaseClientType
): Promise<{ occurrence: FacilityPmOccurrence; workOrderId: string | null; created: boolean }> {
  if (occurrence.status === "materialized" && occurrence.workOrderId) {
    return { occurrence, workOrderId: occurrence.workOrderId, created: false };
  }

  const workOrder = await createWorkOrder(
    schedule.organizationId,
    actorUserId,
    {
      propertyId: schedule.propertyId,
      unitId: null,
      tenantId: null,
      title: `PM: ${schedule.title}`,
      description: `Preventive maintenance occurrence due ${occurrence.dueOn}.`,
      category: "general",
      priority: "medium",
      status: "submitted",
      dueDate: occurrence.dueOn,
      assignedToUserId: schedule.defaultAssigneeUserId,
      internalNotes: null,
      tenantNotes: null,
      photoPlaceholder: null,
      documentPlaceholder: null,
      recurringMaintenancePlaceholder: null,
      preventiveMaintenancePlaceholder: `PM schedule ${schedule.id}`,
      metadata: {
        source: "preventive_maintenance",
        pmScheduleId: schedule.id,
        pmOccurrenceId: occurrence.id,
        assetId: schedule.assetId
      }
    },
    client
  );

  const { data, error } = await client
    .from("facility_pm_occurrences")
    .update({
      status: "materialized",
      work_order_id: workOrder.id
    })
    .eq("id", occurrence.id)
    .eq("organization_id", schedule.organizationId)
    .select(
      "id, organization_id, schedule_id, due_on, status, work_order_id, metadata, created_at, updated_at"
    )
    .single();
  if (error) throw new Error(error.message);

  const nextDue = advanceDueDate(occurrence.dueOn, schedule.cadence, schedule.customIntervalDays);
  await client
    .from("facility_pm_schedules")
    .update({ next_due: nextDue, updated_by: actorUserId })
    .eq("id", schedule.id)
    .eq("organization_id", schedule.organizationId);

  const recipients = new Set<string>();
  if (schedule.defaultAssigneeUserId) recipients.add(schedule.defaultAssigneeUserId);
  for (const managerId of await listManagerUserIds(schedule.organizationId, client)) {
    recipients.add(managerId);
  }
  recipients.delete(actorUserId);

  if (recipients.size > 0) {
    await notify(
      {
        organizationId: schedule.organizationId,
        actorUserId,
        eventKey: `facility.pm.materialized:${occurrence.id}`,
        recipientUserIds: [...recipients],
        category: "maintenance",
        priority: "normal",
        title: "Preventive maintenance due",
        body: `${workOrder.workOrderNumber}: ${workOrder.title}`,
        href: `/maintenance/${workOrder.id}`,
        sourceEntityType: "maintenance_work_order",
        sourceEntityId: workOrder.id,
        propertyId: workOrder.propertyId,
        unitId: workOrder.unitId
      },
      client
    ).catch(() => undefined);
  }

  return {
    occurrence: toOccurrence(data as OccurrenceRow),
    workOrderId: workOrder.id,
    created: true
  };
}

export type PmRunResult = {
  scanned: number;
  materialized: number;
  skipped: number;
  errors: Array<{ scheduleId: string; message: string }>;
};

/**
 * Materialize due PM schedules into work orders (idempotent per occurrence).
 * Uses service role when running across orgs / cron.
 */
export async function runDuePreventiveMaintenance(options: {
  organizationId?: string;
  asOf?: string;
  limit?: number;
  actorUserId?: string;
  client?: SupabaseClientType;
}): Promise<PmRunResult> {
  const asOf = (options.asOf ?? todayKey()).slice(0, 10);
  const limit = options.limit ?? 50;
  const supabase =
    options.client ??
    ((await createServiceRoleServerClient()) as unknown as SupabaseClientType);

  let query = supabase
    .from("facility_pm_schedules")
    .select(
      "id, organization_id, property_id, asset_id, title, cadence, custom_interval_days, next_due, default_assignee_user_id, active, metadata, created_by, updated_by, created_at, updated_at, deleted_at"
    )
    .eq("active", true)
    .is("deleted_at", null)
    .lte("next_due", asOf)
    .order("next_due", { ascending: true })
    .limit(limit);

  if (options.organizationId) {
    query = query.eq("organization_id", options.organizationId);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  const schedules = ((data ?? []) as ScheduleRow[]).map(toSchedule);
  const result: PmRunResult = { scanned: schedules.length, materialized: 0, skipped: 0, errors: [] };

  for (const schedule of schedules) {
    try {
      const actorUserId = options.actorUserId ?? schedule.createdBy;
      const occurrence = await ensureOccurrence(schedule, schedule.nextDue, supabase);
      const materialize = await materializeOccurrence(schedule, occurrence, actorUserId, supabase);
      if (materialize.created) result.materialized += 1;
      else result.skipped += 1;
    } catch (err) {
      result.errors.push({
        scheduleId: schedule.id,
        message: err instanceof Error ? err.message : "Materialize failed"
      });
    }
  }

  return result;
}
