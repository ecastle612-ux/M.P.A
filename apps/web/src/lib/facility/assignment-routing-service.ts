import type { SupabaseClient } from "@supabase/supabase-js";
import {
  assigneeEligibilityFromMembership,
  assignmentRuleConditionsSchema,
  createAssignmentRuleInputSchema,
  describeAssignmentRule,
  firstMatchingAssignmentRule,
  invalidDestinationReasonCopy,
  updateAssignmentRuleInputSchema,
  type AssignmentEvalResult,
  type AssignmentEvalTrigger,
  type AssignmentRuleConditions,
  type AssignmentRuleStatus,
  type AssignmentWorkFacts,
  type CreateAssignmentRuleInput,
  type UpdateAssignmentRuleInput
} from "@mpa/shared";
import { assignWorkOrder, getWorkOrder, listTechnicians, type WorkOrderRow } from "../maintenance/maintenance-service";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = SupabaseClient<any>;

export class FacilityRoutingConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FacilityRoutingConflictError";
  }
}

export type FacilityAssignmentRuleRow = {
  id: string;
  organization_id: string;
  name: string;
  description: string;
  status: AssignmentRuleStatus;
  sort_order: number;
  assignee_user_id: string;
  conditions: AssignmentRuleConditions;
  created_by_user_id: string | null;
  updated_by_user_id: string | null;
  created_at: string;
  updated_at: string;
};

export type FacilityAssignmentEvaluationRow = {
  id: string;
  organization_id: string;
  work_order_id: string;
  rule_id: string | null;
  rule_snapshot: Record<string, unknown>;
  result: AssignmentEvalResult;
  assigned_user_id: string | null;
  reason: string;
  trigger: AssignmentEvalTrigger;
  evaluated_at: string;
};

export type RoutingContext = {
  requestFormId?: string | null;
  workTemplateId?: string | null;
};

export type RouteFacilityWorkOrderResult = {
  result: AssignmentEvalResult | "skipped";
  reason: string;
  ruleId: string | null;
  assignedUserId: string | null;
  workOrder: WorkOrderRow | null;
  evaluation: FacilityAssignmentEvaluationRow | null;
};

function parseConditions(value: unknown): AssignmentRuleConditions {
  return assignmentRuleConditionsSchema.parse(value);
}

function toEvaluable(row: FacilityAssignmentRuleRow) {
  return {
    id: row.id,
    name: row.name,
    sortOrder: row.sort_order,
    status: row.status,
    assigneeUserId: row.assignee_user_id,
    conditions: parseConditions(row.conditions)
  };
}

function snapshotRule(row: FacilityAssignmentRuleRow): Record<string, unknown> {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    status: row.status,
    sortOrder: row.sort_order,
    assigneeUserId: row.assignee_user_id,
    conditions: row.conditions
  };
}

async function nextSortOrder(supabase: Db, organizationId: string): Promise<number> {
  const { data, error } = await supabase
    .from("facility_assignment_rules")
    .select("sort_order")
    .eq("organization_id", organizationId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return typeof data?.sort_order === "number" ? data.sort_order + 1 : 1;
}

export async function assertEligibleAssignee(
  supabase: Db,
  organizationId: string,
  userId: string
) {
  const { data, error } = await supabase
    .from("organization_memberships")
    .select("user_id, organization_id, status, roles, operating_scope")
    .eq("organization_id", organizationId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  const eligibility = assigneeEligibilityFromMembership({
    userId,
    organizationId,
    membership: data as
      | {
          user_id: string;
          organization_id: string;
          status: string;
          roles: unknown;
          operating_scope?: string | null;
        }
      | null
  });
  if (!eligibility.eligible) {
    throw new Error(invalidDestinationReasonCopy(eligibility.reason));
  }
  return eligibility;
}

export async function listAssignmentRules(supabase: Db, organizationId: string) {
  const { data, error } = await supabase
    .from("facility_assignment_rules")
    .select("*")
    .eq("organization_id", organizationId)
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as FacilityAssignmentRuleRow[];
}

export async function listAssignmentEvaluations(
  supabase: Db,
  organizationId: string,
  options?: { workOrderId?: string; ruleId?: string; limit?: number }
) {
  let query = supabase
    .from("facility_assignment_rule_evaluations")
    .select("*")
    .eq("organization_id", organizationId)
    .order("evaluated_at", { ascending: false })
    .limit(options?.limit ?? 40);
  if (options?.workOrderId) query = query.eq("work_order_id", options.workOrderId);
  if (options?.ruleId) query = query.eq("rule_id", options.ruleId);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as FacilityAssignmentEvaluationRow[];
}

export async function loadAssignmentRulesCatalog(supabase: Db, organizationId: string) {
  const [rules, technicians, properties, assets, forms, templates] = await Promise.all([
    listAssignmentRules(supabase, organizationId),
    listTechnicians(supabase, organizationId),
    supabase
      .from("property_properties")
      .select("id, name")
      .eq("organization_id", organizationId)
      .order("name", { ascending: true }),
    supabase
      .from("facility_assets")
      .select("id, name, asset_type, asset_code")
      .eq("organization_id", organizationId)
      .is("deleted_at", null)
      .order("name", { ascending: true }),
    supabase
      .from("facility_request_forms")
      .select("id, name, status")
      .eq("organization_id", organizationId)
      .order("name", { ascending: true }),
    supabase
      .from("facility_work_templates")
      .select("id, name, status")
      .eq("organization_id", organizationId)
      .neq("status", "archived")
      .order("name", { ascending: true })
  ]);
  if (properties.error) throw new Error(properties.error.message);
  if (assets.error) throw new Error(assets.error.message);
  if (forms.error) throw new Error(forms.error.message);
  if (templates.error) throw new Error(templates.error.message);
  return {
    rules,
    technicians,
    properties: properties.data ?? [],
    assets: assets.data ?? [],
    forms: forms.data ?? [],
    templates: templates.data ?? []
  };
}

export async function createAssignmentRule(
  supabase: Db,
  organizationId: string,
  actorUserId: string,
  input: CreateAssignmentRuleInput
) {
  const parsed = createAssignmentRuleInputSchema.parse(input);
  await assertEligibleAssignee(supabase, organizationId, parsed.assigneeUserId);
  const sortOrder = await nextSortOrder(supabase, organizationId);
  const { data, error } = await supabase
    .from("facility_assignment_rules")
    .insert({
      organization_id: organizationId,
      name: parsed.name,
      description: parsed.description ?? "",
      status: parsed.status ?? "inactive",
      sort_order: sortOrder,
      assignee_user_id: parsed.assigneeUserId,
      conditions: parsed.conditions,
      created_by_user_id: actorUserId,
      updated_by_user_id: actorUserId
    })
    .select("*")
    .single();
  if (error) {
    if (/unique|duplicate/i.test(error.message)) {
      throw new FacilityRoutingConflictError("Another rule already uses that priority.");
    }
    throw new Error(error.message);
  }
  return data as FacilityAssignmentRuleRow;
}

export async function updateAssignmentRule(
  supabase: Db,
  organizationId: string,
  actorUserId: string,
  ruleId: string,
  input: UpdateAssignmentRuleInput
) {
  const parsed = updateAssignmentRuleInputSchema.parse(input);
  const { data: existing, error: existingError } = await supabase
    .from("facility_assignment_rules")
    .select("*")
    .eq("id", ruleId)
    .eq("organization_id", organizationId)
    .maybeSingle();
  if (existingError) throw new Error(existingError.message);
  if (!existing) throw new Error("Assignment rule not found");
  if (parsed.assigneeUserId) {
    await assertEligibleAssignee(supabase, organizationId, parsed.assigneeUserId);
  }
  const patch: {
    updated_by_user_id: string;
    updated_at: string;
    name?: string;
    description?: string;
    assignee_user_id?: string;
    conditions?: AssignmentRuleConditions;
    status?: AssignmentRuleStatus;
  } = {
    updated_by_user_id: actorUserId,
    updated_at: new Date().toISOString()
  };
  if (parsed.name !== undefined) patch.name = parsed.name;
  if (parsed.description !== undefined) patch.description = parsed.description ?? "";
  if (parsed.assigneeUserId !== undefined) patch.assignee_user_id = parsed.assigneeUserId;
  if (parsed.conditions !== undefined) patch.conditions = parsed.conditions;
  if (parsed.status !== undefined) patch.status = parsed.status;
  const { data, error } = await supabase
    .from("facility_assignment_rules")
    .update(patch)
    .eq("id", ruleId)
    .eq("organization_id", organizationId)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data as FacilityAssignmentRuleRow;
}

export async function setAssignmentRuleStatus(
  supabase: Db,
  organizationId: string,
  actorUserId: string,
  ruleId: string,
  status: AssignmentRuleStatus
) {
  return updateAssignmentRule(supabase, organizationId, actorUserId, ruleId, { status });
}

export async function archiveAssignmentRule(
  supabase: Db,
  organizationId: string,
  actorUserId: string,
  ruleId: string
) {
  const { count, error } = await supabase
    .from("facility_assignment_rule_evaluations")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .eq("rule_id", ruleId);
  if (error) throw new Error(error.message);
  if ((count ?? 0) > 0) {
    return setAssignmentRuleStatus(supabase, organizationId, actorUserId, ruleId, "inactive");
  }
  const { error: deleteError } = await supabase
    .from("facility_assignment_rules")
    .delete()
    .eq("id", ruleId)
    .eq("organization_id", organizationId);
  if (deleteError) throw new Error(deleteError.message);
  return { deleted: true as const };
}

export async function reorderAssignmentRules(
  supabase: Db,
  organizationId: string,
  actorUserId: string,
  orderedIds: string[]
) {
  const rules = await listAssignmentRules(supabase, organizationId);
  const existingIds = new Set(rules.map((rule) => rule.id));
  if (orderedIds.length !== rules.length || orderedIds.some((id) => !existingIds.has(id))) {
    throw new FacilityRoutingConflictError("Reorder must include every assignment rule exactly once.");
  }
  const unique = new Set(orderedIds);
  if (unique.size !== orderedIds.length) {
    throw new FacilityRoutingConflictError("Each rule can appear only once.");
  }

  for (const [index, id] of orderedIds.entries()) {
    const { error } = await supabase
      .from("facility_assignment_rules")
      .update({
        sort_order: 100000 + index + 1,
        updated_by_user_id: actorUserId,
        updated_at: new Date().toISOString()
      })
      .eq("id", id)
      .eq("organization_id", organizationId);
    if (error) throw new Error(error.message);
  }
  for (const [index, id] of orderedIds.entries()) {
    const { error } = await supabase
      .from("facility_assignment_rules")
      .update({
        sort_order: index + 1,
        updated_by_user_id: actorUserId,
        updated_at: new Date().toISOString()
      })
      .eq("id", id)
      .eq("organization_id", organizationId);
    if (error) {
      if (/unique|duplicate/i.test(error.message)) {
        throw new FacilityRoutingConflictError("Another rule already uses that priority.");
      }
      throw new Error(error.message);
    }
  }
  return listAssignmentRules(supabase, organizationId);
}

async function loadRoutingFacts(
  supabase: Db,
  organizationId: string,
  workOrder: WorkOrderRow,
  context?: RoutingContext
): Promise<AssignmentWorkFacts> {
  let assetType: AssignmentWorkFacts["assetType"] = null;
  if (workOrder.facility_asset_id) {
    const { data: asset } = await supabase
      .from("facility_assets")
      .select("asset_type")
      .eq("id", workOrder.facility_asset_id)
      .eq("organization_id", organizationId)
      .is("deleted_at", null)
      .maybeSingle();
    if (typeof asset?.asset_type === "string") {
      assetType = asset.asset_type as AssignmentWorkFacts["assetType"];
    }
  }

  let requestFormId = context?.requestFormId ?? null;
  if (!requestFormId) {
    const { data: submission } = await supabase
      .from("facility_request_submissions")
      .select("form_id")
      .eq("organization_id", organizationId)
      .eq("work_order_id", workOrder.id)
      .maybeSingle();
    requestFormId = (submission?.form_id as string | undefined) ?? null;
  }

  let workTemplateId = context?.workTemplateId ?? null;
  if (!workTemplateId && workOrder.pm_plan_id) {
    const { data: plan } = await supabase
      .from("facility_pm_plans")
      .select("template_id")
      .eq("id", workOrder.pm_plan_id)
      .eq("organization_id", organizationId)
      .maybeSingle();
    workTemplateId = (plan?.template_id as string | undefined) ?? null;
  }

  return {
    category: workOrder.category as AssignmentWorkFacts["category"],
    priority: workOrder.priority,
    propertyId: workOrder.property_id,
    assetId: workOrder.facility_asset_id,
    assetType,
    originSource: workOrder.origin_source ?? (workOrder.request_number ? "public_request" : "manual"),
    floorLabel: workOrder.floor_label ?? null,
    departmentLabel: workOrder.department_label ?? null,
    roomLabel: workOrder.room_label ?? null,
    requestFormId,
    workTemplateId
  };
}

async function insertEvaluation(
  supabase: Db,
  organizationId: string,
  input: {
    workOrderId: string;
    ruleId: string | null;
    ruleSnapshot: Record<string, unknown>;
    result: AssignmentEvalResult;
    assignedUserId: string | null;
    reason: string;
    trigger: AssignmentEvalTrigger;
  }
): Promise<FacilityAssignmentEvaluationRow | null> {
  const { data, error } = await supabase
    .from("facility_assignment_rule_evaluations")
    .insert({
      organization_id: organizationId,
      work_order_id: input.workOrderId,
      rule_id: input.ruleId,
      rule_snapshot: input.ruleSnapshot,
      result: input.result,
      assigned_user_id: input.assignedUserId,
      reason: input.reason,
      trigger: input.trigger
    })
    .select("*")
    .maybeSingle();
  if (error) {
    if (/unique|duplicate/i.test(error.message) && input.trigger === "initial_create") {
      return null;
    }
    throw new Error(error.message);
  }
  return data as FacilityAssignmentEvaluationRow;
}

export function previewAssignmentRules(
  rules: FacilityAssignmentRuleRow[],
  facts: AssignmentWorkFacts,
  assigneeLabel = "the selected staff member"
) {
  const match = firstMatchingAssignmentRule(rules.map(toEvaluable), facts);
  if (!match) {
    return {
      result: "no_match" as const,
      ruleId: null,
      assigneeUserId: null,
      summary: "No active rule matches. The work order stays Unassigned."
    };
  }
  const row = rules.find((rule) => rule.id === match.id);
  return {
    result: "matched" as const,
    ruleId: match.id,
    assigneeUserId: match.assigneeUserId,
    summary: describeAssignmentRule(match, assigneeLabel),
    ruleName: row?.name ?? match.name,
    sortOrder: match.sortOrder
  };
}

export async function routeFacilityWorkOrder(
  supabase: Db,
  organizationId: string,
  workOrderId: string,
  options: {
    trigger: AssignmentEvalTrigger;
    actorUserId?: string | null;
    context?: RoutingContext;
  }
): Promise<RouteFacilityWorkOrderResult> {
  const workOrder = await getWorkOrder(supabase, organizationId, workOrderId);
  if (!workOrder || workOrder.work_surface !== "facility") {
    return {
      result: "skipped",
      reason: "Work order is not a facility work order.",
      ruleId: null,
      assignedUserId: null,
      workOrder: workOrder ?? null,
      evaluation: null
    };
  }

  if (options.trigger === "initial_create") {
    const { data: existing } = await supabase
      .from("facility_assignment_rule_evaluations")
      .select("id, result, assigned_user_id, reason, rule_id")
      .eq("organization_id", organizationId)
      .eq("work_order_id", workOrderId)
      .eq("trigger", "initial_create")
      .maybeSingle();
    if (existing) {
      return {
        result: "skipped",
        reason: "Initial routing already ran for this work order.",
        ruleId: (existing.rule_id as string | null) ?? null,
        assignedUserId: (existing.assigned_user_id as string | null) ?? null,
        workOrder,
        evaluation: null
      };
    }
  }

  if (workOrder.assignee_type !== "unassigned" || workOrder.technician_user_id) {
    return {
      result: "skipped",
      reason:
        options.trigger === "manager_rerun"
          ? "Work is already assigned. Assignment rules do not override a person."
          : "Work is already assigned.",
      ruleId: null,
      assignedUserId: workOrder.technician_user_id,
      workOrder,
      evaluation: null
    };
  }

  const rules = await listAssignmentRules(supabase, organizationId);
  const facts = await loadRoutingFacts(supabase, organizationId, workOrder, options.context);
  const match = firstMatchingAssignmentRule(rules.map(toEvaluable), facts);
  if (!match) {
    const evaluation = await insertEvaluation(supabase, organizationId, {
      workOrderId,
      ruleId: null,
      ruleSnapshot: {},
      result: "no_match",
      assignedUserId: null,
      reason: "No active assignment rule matched. Work stays Unassigned.",
      trigger: options.trigger
    });
    return {
      result: "no_match",
      reason: "No active assignment rule matched. Work stays Unassigned.",
      ruleId: null,
      assignedUserId: null,
      workOrder,
      evaluation
    };
  }

  const matchedRow = rules.find((rule) => rule.id === match.id)!;
  const eligibility = await assertEligibleAssignee(supabase, organizationId, match.assigneeUserId).catch(
    (error: unknown) => ({
      eligible: false as const,
      reason: error instanceof Error ? error.message : invalidDestinationReasonCopy("missing_user")
    })
  );

  if (!("eligible" in eligibility) || eligibility.eligible !== true) {
    const reason =
      "reason" in eligibility && typeof eligibility.reason === "string"
        ? eligibility.reason.startsWith("The assignee")
          ? `${matchedRow.name} matched, but ${eligibility.reason.charAt(0).toLowerCase()}${eligibility.reason.slice(1)} Work stays Unassigned.`
          : eligibility.reason
        : `${matchedRow.name} matched, but the assignee is not eligible. Work stays Unassigned.`;
    const evaluation = await insertEvaluation(supabase, organizationId, {
      workOrderId,
      ruleId: matchedRow.id,
      ruleSnapshot: snapshotRule(matchedRow),
      result: "invalid_destination",
      assignedUserId: null,
      reason,
      trigger: options.trigger
    });
    return {
      result: "invalid_destination",
      reason,
      ruleId: matchedRow.id,
      assignedUserId: null,
      workOrder,
      evaluation
    };
  }

  const actorUserId = options.actorUserId ?? workOrder.requested_by_user_id ?? matchedRow.assignee_user_id;
  let assigned: { workOrder: WorkOrderRow };
  try {
    assigned = await assignWorkOrder(supabase, organizationId, actorUserId, {
      workOrderId,
      assigneeType: "technician",
      technicianUserId: match.assigneeUserId,
      note: `Assigned by assignment rule: ${matchedRow.name}`
    });
  } catch (error) {
    const reason = `Matched ${matchedRow.name}, but assignment could not be saved. Work stays Unassigned.`;
    const evaluation = await insertEvaluation(supabase, organizationId, {
      workOrderId,
      ruleId: matchedRow.id,
      ruleSnapshot: snapshotRule(matchedRow),
      result: "invalid_destination",
      assignedUserId: null,
      reason,
      trigger: options.trigger
    });
    return {
      result: "invalid_destination",
      reason: error instanceof Error ? `${reason} ${error.message}` : reason,
      ruleId: matchedRow.id,
      assignedUserId: null,
      workOrder,
      evaluation
    };
  }

  const evaluation = await insertEvaluation(supabase, organizationId, {
    workOrderId,
    ruleId: matchedRow.id,
    ruleSnapshot: snapshotRule(matchedRow),
    result: "matched",
    assignedUserId: match.assigneeUserId,
    reason: `Matched ${matchedRow.name} (priority ${matchedRow.sort_order}).`,
    trigger: options.trigger
  });

  return {
    result: "matched",
    reason: `Matched ${matchedRow.name} (priority ${matchedRow.sort_order}).`,
    ruleId: matchedRow.id,
    assignedUserId: match.assigneeUserId,
    workOrder: assigned.workOrder,
    evaluation
  };
}
