import type { SupabaseClient } from "@supabase/supabase-js";
import {
  advanceUntilOnOrAfter,
  createPmPlanInputSchema,
  isPlanDueSoon,
  isPlanOverdue,
  parseDateOnly,
  recurrenceLabel,
  updatePmPlanInputSchema,
  utcToday,
  type CreatePmPlanInput,
  type PmPlanStatus,
  type PmRecurrenceKind,
  type PmTargetKind,
  type UpdatePmPlanInput,
  type WorkOrderPriority
} from "@mpa/shared";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = SupabaseClient<any>;

export class FacilityPmConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FacilityPmConflictError";
  }
}

export type FacilityPmPlanRow = {
  id: string;
  organization_id: string;
  name: string;
  description: string;
  status: PmPlanStatus;
  target_kind: PmTargetKind;
  facility_asset_id: string | null;
  property_id: string | null;
  floor_label: string | null;
  department_label: string | null;
  room_label: string | null;
  priority: WorkOrderPriority;
  category: string;
  recurrence_kind: PmRecurrenceKind;
  interval_n: number;
  next_due_on: string;
  due_time: string | null;
  generate_days_before: number;
  anchor_day_of_month: number;
  template_id: string | null;
  last_generated_due_on: string | null;
  missed_occurrence_count: number;
  created_at: string;
  updated_at: string;
  facility_assets?: { id: string; name: string; asset_code: string } | null;
  property_properties?: { id: string; name: string } | null;
  facility_work_templates?: { id: string; name: string; status: string } | null;
};

export type FacilityPmOccurrenceRow = {
  id: string;
  organization_id: string;
  plan_id: string;
  occurrence_due_on: string;
  work_order_id: string | null;
  generated_at: string;
  maintenance_work_orders?: {
    id: string;
    title: string;
    status: string;
    completed_at: string | null;
    technician_user_id: string | null;
  } | null;
};

const PLAN_SELECT = `
  *,
  facility_assets ( id, name, asset_code ),
  property_properties ( id, name ),
  facility_work_templates ( id, name, status )
`;

function asSingle<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function normalizePlan(row: FacilityPmPlanRow): FacilityPmPlanRow {
  return {
    ...row,
    facility_assets: asSingle(row.facility_assets),
    property_properties: asSingle(row.property_properties),
    facility_work_templates: asSingle(row.facility_work_templates)
  };
}

export function planRecurrenceCopy(plan: Pick<FacilityPmPlanRow, "recurrence_kind" | "interval_n">): string {
  return recurrenceLabel(plan.recurrence_kind, plan.interval_n);
}

async function requireOrgProperty(supabase: Db, organizationId: string, propertyId: string) {
  const { data, error } = await supabase
    .from("property_properties")
    .select("id, name")
    .eq("organization_id", organizationId)
    .eq("id", propertyId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new FacilityPmConflictError("Building not found for this organization");
  return data as { id: string; name: string };
}

async function requireOrgAsset(supabase: Db, organizationId: string, assetId: string) {
  const { data, error } = await supabase
    .from("facility_assets")
    .select("id, name, property_property_id, floor_label, department_label, room_label")
    .eq("organization_id", organizationId)
    .eq("id", assetId)
    .is("deleted_at", null)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new FacilityPmConflictError("Asset not found for this organization");
  return data as {
    id: string;
    name: string;
    property_property_id: string | null;
    floor_label: string | null;
    department_label: string | null;
    room_label: string | null;
  };
}

async function requireOrgTemplate(supabase: Db, organizationId: string, templateId: string) {
  const { data, error } = await supabase
    .from("facility_work_templates")
    .select("id, status, current_version_id")
    .eq("organization_id", organizationId)
    .eq("id", templateId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data || data.status === "archived" || !data.current_version_id) {
    throw new FacilityPmConflictError("Work template is not available");
  }
  return data;
}

export async function listPmPlans(
  supabase: Db,
  organizationId: string,
  options?: { assetId?: string; status?: string }
) {
  let query = supabase
    .from("facility_pm_plans")
    .select(PLAN_SELECT)
    .eq("organization_id", organizationId)
    .order("next_due_on", { ascending: true });
  if (options?.assetId) query = query.eq("facility_asset_id", options.assetId);
  if (options?.status) query = query.eq("status", options.status);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return ((data ?? []) as FacilityPmPlanRow[]).map(normalizePlan);
}

export async function getPmPlan(supabase: Db, organizationId: string, planId: string) {
  const { data, error } = await supabase
    .from("facility_pm_plans")
    .select(PLAN_SELECT)
    .eq("organization_id", organizationId)
    .eq("id", planId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? normalizePlan(data as FacilityPmPlanRow) : null;
}

export async function listPmOccurrences(
  supabase: Db,
  organizationId: string,
  planId: string
) {
  const { data, error } = await supabase
    .from("facility_pm_occurrences")
    .select(
      "id, organization_id, plan_id, occurrence_due_on, work_order_id, generated_at, maintenance_work_orders ( id, title, status, completed_at, technician_user_id )"
    )
    .eq("organization_id", organizationId)
    .eq("plan_id", planId)
    .order("occurrence_due_on", { ascending: false })
    .limit(24);
  if (error) throw new Error(error.message);
  return ((data ?? []) as FacilityPmOccurrenceRow[]).map((row) => ({
    ...row,
    maintenance_work_orders: asSingle(row.maintenance_work_orders)
  }));
}

export async function createPmPlan(
  supabase: Db,
  organizationId: string,
  actorUserId: string,
  raw: CreatePmPlanInput
) {
  const input = createPmPlanInputSchema.parse(raw);
  let propertyId = input.propertyId ?? null;
  let floorLabel = input.floorLabel ?? null;
  let departmentLabel = input.departmentLabel ?? null;
  let roomLabel = input.roomLabel ?? null;

  if (input.targetKind === "asset" && input.facilityAssetId) {
    const asset = await requireOrgAsset(supabase, organizationId, input.facilityAssetId);
    propertyId = asset.property_property_id;
    if (!propertyId) throw new FacilityPmConflictError("Asset is missing a building");
    await requireOrgProperty(supabase, organizationId, propertyId);
  } else if (input.targetKind === "location" && input.propertyId) {
    await requireOrgProperty(supabase, organizationId, input.propertyId);
  }

  if (input.templateId) {
    await requireOrgTemplate(supabase, organizationId, input.templateId);
  }

  const anchor = parseDateOnly(input.nextDueOn).getUTCDate();
  const { data, error } = await supabase
    .from("facility_pm_plans")
    .insert({
      organization_id: organizationId,
      name: input.name,
      description: input.description ?? "",
      status: "active",
      target_kind: input.targetKind,
      facility_asset_id: input.targetKind === "asset" ? input.facilityAssetId : null,
      property_id: propertyId,
      floor_label: input.targetKind === "location" ? floorLabel : null,
      department_label: input.targetKind === "location" ? departmentLabel : null,
      room_label: input.targetKind === "location" ? roomLabel : null,
      priority: input.priority,
      category: input.category,
      recurrence_kind: input.recurrenceKind,
      interval_n: input.intervalN ?? 1,
      next_due_on: input.nextDueOn,
      due_time: input.dueTime ?? null,
      generate_days_before: input.generateDaysBefore,
      anchor_day_of_month: anchor,
      template_id: input.templateId ?? null,
      created_by_user_id: actorUserId,
      updated_by_user_id: actorUserId
    })
    .select(PLAN_SELECT)
    .single();
  if (error) throw new Error(error.message);
  return normalizePlan(data as FacilityPmPlanRow);
}

export async function updatePmPlan(
  supabase: Db,
  organizationId: string,
  actorUserId: string,
  planId: string,
  raw: UpdatePmPlanInput
) {
  const input = updatePmPlanInputSchema.parse(raw);
  const existing = await getPmPlan(supabase, organizationId, planId);
  if (!existing) throw new FacilityPmConflictError("Plan not found");

  const patch: Record<string, unknown> = {
    updated_by_user_id: actorUserId,
    updated_at: new Date().toISOString()
  };

  if (input.name) patch.name = input.name;
  if (input.description !== undefined) patch.description = input.description;
  if (input.priority) patch.priority = input.priority;
  if (input.category) patch.category = input.category;
  if (input.generateDaysBefore !== undefined) patch.generate_days_before = input.generateDaysBefore;
  if (input.dueTime !== undefined) patch.due_time = input.dueTime;
  if (input.floorLabel !== undefined) patch.floor_label = input.floorLabel;
  if (input.departmentLabel !== undefined) patch.department_label = input.departmentLabel;
  if (input.roomLabel !== undefined) patch.room_label = input.roomLabel;
  if (input.templateId !== undefined) {
    if (input.templateId) await requireOrgTemplate(supabase, organizationId, input.templateId);
    patch.template_id = input.templateId;
  }

  if (input.recurrenceKind) patch.recurrence_kind = input.recurrenceKind;
  if (input.intervalN) patch.interval_n = input.intervalN;
  if (input.nextDueOn) {
    patch.next_due_on = input.nextDueOn;
    patch.anchor_day_of_month = parseDateOnly(input.nextDueOn).getUTCDate();
  }

  if (input.action === "pause") {
    if (existing.status !== "active") throw new FacilityPmConflictError("Only an active plan can be paused");
    patch.status = "paused";
  }
  if (input.action === "deactivate") {
    patch.status = "inactive";
  }
  if (input.action === "resume") {
    if (existing.status !== "paused") throw new FacilityPmConflictError("Only a paused plan can be resumed");
    const today = utcToday();
    const nextKind = (input.recurrenceKind ?? existing.recurrence_kind) as PmRecurrenceKind;
    const nextInterval = input.intervalN ?? existing.interval_n;
    const fromDue = (input.nextDueOn ?? existing.next_due_on) as string;
    const advanced = advanceUntilOnOrAfter({
      fromDueOn: fromDue,
      kind: nextKind,
      intervalN: nextInterval,
      anchorDayOfMonth: existing.anchor_day_of_month,
      onOrAfter: today
    });
    patch.status = "active";
    patch.next_due_on = advanced.nextDueOn;
    if (advanced.skipped > 0) {
      patch.missed_occurrence_count = existing.missed_occurrence_count + advanced.skipped;
    }
  }

  const { data, error } = await supabase
    .from("facility_pm_plans")
    .update(patch)
    .eq("organization_id", organizationId)
    .eq("id", planId)
    .select(PLAN_SELECT)
    .single();
  if (error) throw new Error(error.message);
  return normalizePlan(data as FacilityPmPlanRow);
}

export function summarizePmPlans(plans: FacilityPmPlanRow[], today = utcToday()) {
  const active = plans.filter((plan) => plan.status === "active");
  return {
    activePlans: active.length,
    dueSoon: active.filter((plan) => isPlanDueSoon(plan.next_due_on, today)).length,
    overdue: active.filter((plan) => isPlanOverdue(plan.next_due_on, today)).length,
    paused: plans.filter((plan) => plan.status === "paused").length
  };
}
