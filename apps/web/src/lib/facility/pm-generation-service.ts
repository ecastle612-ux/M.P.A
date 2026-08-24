import type { SupabaseClient } from "@supabase/supabase-js";
import {
  addUtcDays,
  advanceUntilOnOrAfter,
  compareDateOnly,
  dueAtTimestamp,
  nextOccurrenceDueOn,
  PM_MAX_GENERATIONS_PER_PLAN_PER_RUN,
  shouldGenerateOccurrence,
  utcToday,
  type PmRecurrenceKind,
  type WorkOrderCategory
} from "@mpa/shared";
import { createFacilityWorkOrder } from "../maintenance/maintenance-service";
import { getPmPlan, type FacilityPmPlanRow } from "./pm-plan-service";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = SupabaseClient<any>;

export type PmGenerationResult = {
  considered: number;
  generated: number;
  skipped: number;
  failed: number;
  workOrderIds: string[];
  errors: Array<{ planId: string; message: string }>;
};

function isUniqueViolation(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  return error.code === "23505" || /duplicate key|unique/i.test(error.message ?? "");
}

async function claimOccurrence(
  supabase: Db,
  organizationId: string,
  planId: string,
  occurrenceDueOn: string
): Promise<{ id: string; created: boolean; workOrderId: string | null }> {
  const inserted = await supabase
    .from("facility_pm_occurrences")
    .insert({
      organization_id: organizationId,
      plan_id: planId,
      occurrence_due_on: occurrenceDueOn
    })
    .select("id, work_order_id")
    .single();

  if (!inserted.error && inserted.data) {
    return { id: inserted.data.id as string, created: true, workOrderId: inserted.data.work_order_id as string | null };
  }
  if (!isUniqueViolation(inserted.error)) {
    throw new Error(inserted.error?.message ?? "Could not claim occurrence");
  }

  const existing = await supabase
    .from("facility_pm_occurrences")
    .select("id, work_order_id")
    .eq("organization_id", organizationId)
    .eq("plan_id", planId)
    .eq("occurrence_due_on", occurrenceDueOn)
    .maybeSingle();
  if (existing.error || !existing.data) {
    throw new Error(existing.error?.message ?? "Occurrence already exists");
  }
  return {
    id: existing.data.id as string,
    created: false,
    workOrderId: existing.data.work_order_id as string | null
  };
}

async function resolveLocation(supabase: Db, organizationId: string, plan: FacilityPmPlanRow) {
  if (plan.target_kind === "asset" && plan.facility_asset_id) {
    const { data, error } = await supabase
      .from("facility_assets")
      .select("id, name, property_property_id, floor_label, department_label, room_label, building_label")
      .eq("organization_id", organizationId)
      .eq("id", plan.facility_asset_id)
      .is("deleted_at", null)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data?.property_property_id) throw new Error("Asset is missing a building");
    return {
      propertyId: data.property_property_id as string,
      facilityAssetId: data.id as string,
      facilityAssetLabel: data.name as string,
      floorLabel: typeof data.floor_label === "string" ? data.floor_label : null,
      departmentLabel: typeof data.department_label === "string" ? data.department_label : null,
      roomLabel: typeof data.room_label === "string" ? data.room_label : null
    };
  }
  if (!plan.property_id) throw new Error("Plan is missing a building");
  const { data, error } = await supabase
    .from("property_properties")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("id", plan.property_id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Building not found for this organization");
  return {
    propertyId: plan.property_id,
    facilityAssetId: null as string | null,
    facilityAssetLabel: null as string | null,
    floorLabel: plan.floor_label,
    departmentLabel: plan.department_label,
    roomLabel: plan.room_label
  };
}

async function resolveFacilityManagerUserId(supabase: Db, organizationId: string): Promise<string> {
  const { data, error } = await supabase
    .from("organization_memberships")
    .select("user_id, roles")
    .eq("organization_id", organizationId)
    .eq("status", "active");
  if (error) throw new Error(error.message);
  const managerId = (data ?? [])
    .filter((row) => {
      const roles = (row.roles as string[]) ?? [];
      return roles.includes("organization_admin") || roles.includes("property_manager");
    })
    .map((row) => row.user_id)
    .find((id): id is string => typeof id === "string");
  if (!managerId) {
    throw new Error("No facility manager available to attribute generated work");
  }
  return managerId;
}

export async function generateDueWorkForPlan(
  supabase: Db,
  organizationId: string,
  plan: FacilityPmPlanRow,
  today = utcToday()
): Promise<{ workOrderId: string | null; skipped: boolean }> {
  if (plan.status !== "active") {
    return { workOrderId: null, skipped: true };
  }
  if (!shouldGenerateOccurrence({
    nextDueOn: plan.next_due_on,
    generateDaysBefore: plan.generate_days_before,
    today
  })) {
    return { workOrderId: null, skipped: true };
  }

  const occurrenceDueOn = plan.next_due_on;
  const claim = await claimOccurrence(supabase, organizationId, plan.id, occurrenceDueOn);
  if (claim.workOrderId) {
    await advancePlanAfterGeneration(supabase, organizationId, plan, occurrenceDueOn, today);
    return { workOrderId: claim.workOrderId, skipped: true };
  }

  const location = await resolveLocation(supabase, organizationId, plan);
  const createdByUserId = await resolveFacilityManagerUserId(supabase, organizationId);
  const description = plan.description.trim() || `Preventive Maintenance: ${plan.name}`;
  const category = (plan.category as WorkOrderCategory) || "preventive";
  try {
    const workOrder = await createFacilityWorkOrder(
      supabase,
      organizationId,
      null,
      {
        title: plan.name,
        description,
        category,
        priority: plan.priority,
        propertyId: location.propertyId,
        ...(location.facilityAssetId
          ? { facilityAssetId: location.facilityAssetId, facilityAssetLabel: location.facilityAssetLabel ?? undefined }
          : {}),
        dueAt: dueAtTimestamp(occurrenceDueOn, plan.due_time),
        ...(plan.template_id ? { templateId: plan.template_id } : {})
      },
      {
        createdByUserId,
        intakeChannel: "internal",
        originSource: "preventive",
        pmPlanId: plan.id,
        pmOccurrenceDueOn: occurrenceDueOn,
        floorLabel: location.floorLabel,
        departmentLabel: location.departmentLabel,
        roomLabel: location.roomLabel
      }
    );

    await supabase
      .from("facility_pm_occurrences")
      .update({ work_order_id: workOrder.id })
      .eq("id", claim.id)
      .eq("organization_id", organizationId);

    await advancePlanAfterGeneration(supabase, organizationId, plan, occurrenceDueOn, today);
    return { workOrderId: workOrder.id, skipped: false };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate work";
    if (/duplicate key|unique/i.test(message)) {
      const existing = await supabase
        .from("maintenance_work_orders")
        .select("id")
        .eq("organization_id", organizationId)
        .eq("pm_plan_id", plan.id)
        .eq("pm_occurrence_due_on", occurrenceDueOn)
        .maybeSingle();
      await advancePlanAfterGeneration(supabase, organizationId, plan, occurrenceDueOn, today);
      return { workOrderId: (existing.data?.id as string | undefined) ?? claim.workOrderId, skipped: true };
    }
    throw error;
  }
}

async function advancePlanAfterGeneration(
  supabase: Db,
  organizationId: string,
  plan: FacilityPmPlanRow,
  generatedDueOn: string,
  today: string
) {
  const next = nextOccurrenceDueOn({
    fromDueOn: generatedDueOn,
    kind: plan.recurrence_kind as PmRecurrenceKind,
    intervalN: plan.interval_n,
    anchorDayOfMonth: plan.anchor_day_of_month
  });
  const recovered = compareDateOnly(next, today) < 0
    ? advanceUntilOnOrAfter({
        fromDueOn: next,
        kind: plan.recurrence_kind as PmRecurrenceKind,
        intervalN: plan.interval_n,
        anchorDayOfMonth: plan.anchor_day_of_month,
        onOrAfter: today
      })
    : { nextDueOn: next, skipped: 0 };

  await supabase
    .from("facility_pm_plans")
    .update({
      last_generated_due_on: generatedDueOn,
      next_due_on: recovered.nextDueOn,
      missed_occurrence_count: plan.missed_occurrence_count + recovered.skipped,
      updated_at: new Date().toISOString()
    })
    .eq("organization_id", organizationId)
    .eq("id", plan.id);
}

export async function generateDuePreventiveWork(
  supabase: Db,
  options?: { organizationId?: string; planId?: string; now?: Date }
): Promise<PmGenerationResult> {
  const today = utcToday(options?.now);
  let query = supabase
    .from("facility_pm_plans")
    .select("*")
    .eq("status", "active")
    .lte("next_due_on", addUtcDays(today, 90));
  if (options?.organizationId) query = query.eq("organization_id", options.organizationId);
  if (options?.planId) query = query.eq("id", options.planId);
  const { data, error } = await query;
  if (error) throw new Error(error.message);

  const result: PmGenerationResult = {
    considered: (data ?? []).length,
    generated: 0,
    skipped: 0,
    failed: 0,
    workOrderIds: [],
    errors: []
  };

  for (const raw of data ?? []) {
    const plan = raw as FacilityPmPlanRow;
    const createdThisPlan: string[] = [];
    try {
      while (createdThisPlan.length < PM_MAX_GENERATIONS_PER_PLAN_PER_RUN) {
        const latest = (await getPmPlan(supabase, plan.organization_id, plan.id)) ?? plan;
        const outcome = await generateDueWorkForPlan(supabase, plan.organization_id, latest, today);
        if (outcome.skipped || !outcome.workOrderId) {
          result.skipped += 1;
          break;
        }
        createdThisPlan.push(outcome.workOrderId);
        result.generated += 1;
        result.workOrderIds.push(outcome.workOrderId);
      }
    } catch (error) {
      result.failed += 1;
      result.errors.push({
        planId: plan.id,
        message: error instanceof Error ? error.message : "Plan failed"
      });
    }
  }

  return result;
}
