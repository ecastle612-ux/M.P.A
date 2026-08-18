import { z } from "zod";
import { WORK_ORDER_CATEGORIES, WORK_ORDER_PRIORITIES } from "../maintenance/schemas";
import { FACILITY_ASSET_TYPES } from "./schemas";
import { FACILITY_MANAGER_ROLES } from "./schemas";
import { PM_ORIGIN_SOURCES } from "./preventive-maintenance";
import type { UserRole } from "../types/roles";

export const FACILITY_ROUTING_ENTITLEMENT = "facility.routing" as const;

export const ASSIGNMENT_RULE_STATUSES = ["active", "inactive"] as const;
export type AssignmentRuleStatus = (typeof ASSIGNMENT_RULE_STATUSES)[number];

export const ASSIGNMENT_EVAL_RESULTS = ["matched", "no_match", "invalid_destination"] as const;
export type AssignmentEvalResult = (typeof ASSIGNMENT_EVAL_RESULTS)[number];

export const ASSIGNMENT_EVAL_TRIGGERS = ["initial_create", "manager_rerun"] as const;
export type AssignmentEvalTrigger = (typeof ASSIGNMENT_EVAL_TRIGGERS)[number];

export const ASSIGNMENT_RULE_CONDITION_KEYS = [
  "category",
  "priority",
  "propertyId",
  "assetId",
  "assetType",
  "originSource",
  "locationLabel",
  "requestFormId",
  "workTemplateId"
] as const;
export type AssignmentRuleConditionKey = (typeof ASSIGNMENT_RULE_CONDITION_KEYS)[number];

export const ASSIGNMENT_RULE_CONDITION_LABELS: Record<AssignmentRuleConditionKey, string> = {
  category: "Category",
  priority: "Priority",
  propertyId: "Building",
  assetId: "Specific asset",
  assetType: "Asset category",
  originSource: "Origin",
  locationLabel: "Department / floor / room",
  requestFormId: "Request form",
  workTemplateId: "Work template"
};

export const ORIGIN_SOURCE_LABELS: Record<(typeof PM_ORIGIN_SOURCES)[number], string> = {
  manual: "Manual",
  preventive: "Preventive Maintenance",
  public_request: "Public request"
};

export function memberCanAdministerAssignmentRules(roles: readonly string[]): boolean {
  return roles.some((role) => (FACILITY_MANAGER_ROLES as readonly string[]).includes(role as UserRole));
}

export function normalizeLocationLabel(value: string): string {
  return value.trim();
}

export const assignmentRuleConditionsSchema = z
  .object({
    category: z.enum(WORK_ORDER_CATEGORIES).optional(),
    priority: z.enum(WORK_ORDER_PRIORITIES).optional(),
    propertyId: z.string().uuid().optional(),
    assetId: z.string().uuid().optional(),
    assetType: z.enum(FACILITY_ASSET_TYPES).optional(),
    originSource: z.enum(PM_ORIGIN_SOURCES).optional(),
    locationLabel: z
      .string()
      .trim()
      .min(1)
      .max(80)
      .optional(),
    requestFormId: z.string().uuid().optional(),
    workTemplateId: z.string().uuid().optional()
  })
  .strict()
  .refine((value) => Object.values(value).some((entry) => entry !== undefined && entry !== ""), {
    message: "Add at least one condition"
  });

export type AssignmentRuleConditions = z.infer<typeof assignmentRuleConditionsSchema>;

export const createAssignmentRuleInputSchema = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(400).optional().nullable(),
  assigneeUserId: z.string().uuid(),
  conditions: assignmentRuleConditionsSchema,
  status: z.enum(ASSIGNMENT_RULE_STATUSES).optional()
});
export type CreateAssignmentRuleInput = z.infer<typeof createAssignmentRuleInputSchema>;

export const updateAssignmentRuleInputSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  description: z.string().trim().max(400).optional().nullable(),
  assigneeUserId: z.string().uuid().optional(),
  conditions: assignmentRuleConditionsSchema.optional(),
  status: z.enum(ASSIGNMENT_RULE_STATUSES).optional()
});
export type UpdateAssignmentRuleInput = z.infer<typeof updateAssignmentRuleInputSchema>;

export const reorderAssignmentRulesInputSchema = z.object({
  orderedIds: z.array(z.string().uuid()).min(1)
});
export type ReorderAssignmentRulesInput = z.infer<typeof reorderAssignmentRulesInputSchema>;

export const assignmentWorkFactsSchema = z.object({
  category: z.enum(WORK_ORDER_CATEGORIES),
  priority: z.enum(WORK_ORDER_PRIORITIES),
  propertyId: z.string().uuid().nullable().optional(),
  assetId: z.string().uuid().nullable().optional(),
  assetType: z.enum(FACILITY_ASSET_TYPES).nullable().optional(),
  originSource: z.enum(PM_ORIGIN_SOURCES).nullable().optional(),
  floorLabel: z.string().nullable().optional(),
  departmentLabel: z.string().nullable().optional(),
  roomLabel: z.string().nullable().optional(),
  requestFormId: z.string().uuid().nullable().optional(),
  workTemplateId: z.string().uuid().nullable().optional()
});
export type AssignmentWorkFacts = z.infer<typeof assignmentWorkFactsSchema>;

export const previewAssignmentRulesInputSchema = assignmentWorkFactsSchema;
export type PreviewAssignmentRulesInput = AssignmentWorkFacts;

export type EvaluableAssignmentRule = {
  id: string;
  name: string;
  sortOrder: number;
  status: AssignmentRuleStatus;
  assigneeUserId: string;
  conditions: AssignmentRuleConditions;
};

export function locationLabelsForFacts(facts: AssignmentWorkFacts): string[] {
  return [facts.floorLabel, facts.departmentLabel, facts.roomLabel]
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    .map(normalizeLocationLabel);
}

export function ruleConditionsMatch(
  conditions: AssignmentRuleConditions,
  facts: AssignmentWorkFacts
): boolean {
  if (conditions.category && conditions.category !== facts.category) return false;
  if (conditions.priority && conditions.priority !== facts.priority) return false;
  if (conditions.propertyId && conditions.propertyId !== facts.propertyId) return false;
  if (conditions.assetId && conditions.assetId !== facts.assetId) return false;
  if (conditions.assetType && conditions.assetType !== facts.assetType) return false;
  if (conditions.originSource && conditions.originSource !== facts.originSource) return false;
  if (conditions.requestFormId && conditions.requestFormId !== facts.requestFormId) return false;
  if (conditions.workTemplateId && conditions.workTemplateId !== facts.workTemplateId) return false;
  if (conditions.locationLabel) {
    const expected = normalizeLocationLabel(conditions.locationLabel);
    if (!locationLabelsForFacts(facts).includes(expected)) return false;
  }
  return true;
}

export function firstMatchingAssignmentRule<T extends EvaluableAssignmentRule>(
  rules: readonly T[],
  facts: AssignmentWorkFacts
): T | null {
  const ordered = [...rules]
    .filter((rule) => rule.status === "active")
    .sort((left, right) => left.sortOrder - right.sortOrder || left.id.localeCompare(right.id));
  for (const rule of ordered) {
    if (ruleConditionsMatch(rule.conditions, facts)) {
      return rule;
    }
  }
  return null;
}

export function describeAssignmentRule(
  rule: Pick<EvaluableAssignmentRule, "name" | "conditions">,
  assigneeLabel: string
): string {
  const parts: string[] = [];
  const conditions = rule.conditions;
  if (conditions.category) parts.push(`Category is ${conditions.category}`);
  if (conditions.priority) parts.push(`Priority is ${conditions.priority}`);
  if (conditions.propertyId) parts.push("Building matches");
  if (conditions.assetType) parts.push(`Asset category is ${conditions.assetType}`);
  if (conditions.assetId) parts.push("Specific asset matches");
  if (conditions.originSource) parts.push(`Origin is ${ORIGIN_SOURCE_LABELS[conditions.originSource]}`);
  if (conditions.locationLabel) parts.push(`Location label is “${normalizeLocationLabel(conditions.locationLabel)}”`);
  if (conditions.requestFormId) parts.push("Request form matches");
  if (conditions.workTemplateId) parts.push("Work template matches");
  const when = parts.length > 0 ? parts.join(" and ") : "the work matches this rule";
  return `If ${when}, assign to ${assigneeLabel}.`;
}

export function assignmentRuleHref(ruleId?: string): string {
  return ruleId
    ? `/facility/settings/assignment-rules?ruleId=${encodeURIComponent(ruleId)}`
    : "/facility/settings/assignment-rules";
}

export type AssigneeEligibilityReason =
  | "eligible"
  | "missing_user"
  | "inactive_membership"
  | "cross_org"
  | "role_not_assignable"
  | "lost_facility_access";

export function assigneeEligibilityFromMembership(input: {
  userId: string | null | undefined;
  organizationId: string;
  membership:
    | {
        user_id: string;
        organization_id: string;
        status: string;
        roles: unknown;
        operating_scope?: string | null;
      }
    | null
    | undefined;
}): { eligible: boolean; reason: AssigneeEligibilityReason } {
  if (!input.userId) {
    return { eligible: false, reason: "missing_user" };
  }
  if (!input.membership) {
    return { eligible: false, reason: "cross_org" };
  }
  if (input.membership.organization_id !== input.organizationId || input.membership.user_id !== input.userId) {
    return { eligible: false, reason: "cross_org" };
  }
  if (input.membership.status !== "active") {
    return { eligible: false, reason: "inactive_membership" };
  }
  const roles = Array.isArray(input.membership.roles) ? input.membership.roles.map(String) : [];
  const canReceive =
    roles.includes("maintenance_technician") ||
    roles.includes("property_manager") ||
    roles.includes("organization_admin");
  if (!canReceive) {
    return { eligible: false, reason: "role_not_assignable" };
  }
  if (input.membership.operating_scope === "property_operations") {
    return { eligible: false, reason: "lost_facility_access" };
  }
  return { eligible: true, reason: "eligible" };
}

export function invalidDestinationReasonCopy(reason: AssigneeEligibilityReason): string {
  switch (reason) {
    case "missing_user":
      return "The rule has no assignee.";
    case "inactive_membership":
      return "The assignee is no longer an active organization member.";
    case "cross_org":
      return "The assignee is not in this organization.";
    case "role_not_assignable":
      return "The assignee is not allowed to receive facility work.";
    case "lost_facility_access":
      return "The assignee no longer has Facility Operations access.";
    default:
      return "The assignee is not eligible.";
  }
}
