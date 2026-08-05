/**
 * CORE-004 Phase 1 — Property Lifecycle state machine (pure).
 * Operational system coordinating property existence in the platform.
 */

export const PROPERTY_LIFECYCLE_STAGES = [
  "prospect",
  "acquisition",
  "onboarding",
  "organization_assignment",
  "configuration",
  "activation",
  "operational",
  "occupancy",
  "turnover",
  "disposition",
  "archived"
] as const;

export type PropertyLifecycleStage = (typeof PROPERTY_LIFECYCLE_STAGES)[number];

/** Documented, enforced edges only. */
export const PROPERTY_LIFECYCLE_TRANSITIONS: Record<
  PropertyLifecycleStage,
  readonly PropertyLifecycleStage[]
> = {
  prospect: ["acquisition"],
  acquisition: ["onboarding"],
  onboarding: ["organization_assignment"],
  organization_assignment: ["configuration"],
  configuration: ["activation"],
  activation: ["operational"],
  operational: ["occupancy", "turnover", "disposition"],
  occupancy: ["operational", "turnover", "disposition"],
  turnover: ["operational", "occupancy", "disposition"],
  disposition: ["archived"],
  archived: ["operational"] // restore into active ops (capability-gated)
};

export type LifecycleStageDefinition = {
  stage: PropertyLifecycleStage;
  label: string;
  entryCriteria: string[];
  exitCriteria: string[];
  requiredData: string[];
  requiredApprovals: string[];
  responsibleRoles: string[];
  automation: string[];
  notifications: string[];
  auditEvents: string[];
  dashboardUpdates: string[];
  assistantRecommendations: string[];
};

export const PROPERTY_LIFECYCLE_DEFINITIONS: Record<
  PropertyLifecycleStage,
  LifecycleStageDefinition
> = {
  prospect: {
    stage: "prospect",
    label: "Prospect",
    entryCriteria: ["Operator creates a property prospect record"],
    exitCriteria: ["Acquisition intent confirmed"],
    requiredData: ["name", "address", "property type"],
    requiredApprovals: ["Property Manager or Org Admin"],
    responsibleRoles: ["property_manager", "org_admin"],
    automation: ["Seed lifecycle metadata", "Create timeline start"],
    notifications: ["Today: new prospect created"],
    auditEvents: ["property.lifecycle.transitioned", "property.created"],
    dashboardUpdates: ["Waiting: complete acquisition", "Insights: pipeline count"],
    assistantRecommendations: ["Advance to Acquisition"]
  },
  acquisition: {
    stage: "acquisition",
    label: "Acquisition",
    entryCriteria: ["Prospect accepted into acquisition"],
    exitCriteria: ["Owner/contact intent captured"],
    requiredData: ["ownership entity or owner contact"],
    requiredApprovals: ["Property Manager"],
    responsibleRoles: ["property_manager", "org_admin"],
    automation: ["Flag incomplete owner contact"],
    notifications: ["Today: acquisition incomplete"],
    auditEvents: ["property.lifecycle.transitioned"],
    dashboardUpdates: ["Waiting: capture owner details"],
    assistantRecommendations: ["Add owner contact", "Continue to Onboarding"]
  },
  onboarding: {
    stage: "onboarding",
    label: "Onboarding",
    entryCriteria: ["Acquisition complete"],
    exitCriteria: ["Core property profile complete"],
    requiredData: ["timezone preferred", "description or code recommended"],
    requiredApprovals: ["Property Manager"],
    responsibleRoles: ["property_manager"],
    automation: ["Generate onboarding checklist"],
    notifications: ["Today: onboarding checklist open"],
    auditEvents: ["property.lifecycle.transitioned"],
    dashboardUpdates: ["Waiting: finish onboarding checklist"],
    assistantRecommendations: ["Complete onboarding checklist"]
  },
  organization_assignment: {
    stage: "organization_assignment",
    label: "Organization Assignment",
    entryCriteria: ["Onboarding profile ready"],
    exitCriteria: ["Property confirmed under active org context"],
    requiredData: ["organization_id (always set at create)"],
    requiredApprovals: ["Org Admin"],
    responsibleRoles: ["org_admin", "property_manager"],
    automation: ["Confirm org entitlement for property_operations"],
    notifications: ["Today: confirm assignment"],
    auditEvents: ["property.lifecycle.transitioned"],
    dashboardUpdates: ["Waiting: confirm org assignment"],
    assistantRecommendations: ["Confirm organization assignment"]
  },
  configuration: {
    stage: "configuration",
    label: "Configuration",
    entryCriteria: ["Org assignment confirmed"],
    exitCriteria: ["At least one unit configured for activation"],
    requiredData: ["≥1 unit"],
    requiredApprovals: ["Property Manager"],
    responsibleRoles: ["property_manager"],
    automation: ["Block activation without units"],
    notifications: ["Today: add units before activation"],
    auditEvents: ["property.lifecycle.transitioned"],
    dashboardUpdates: ["Waiting: configure units"],
    assistantRecommendations: ["Add units", "Prepare for Activation"]
  },
  activation: {
    stage: "activation",
    label: "Activation",
    entryCriteria: ["Configuration complete (≥1 unit)"],
    exitCriteria: ["Property marked operational / active"],
    requiredData: ["address complete", "≥1 unit"],
    requiredApprovals: ["Property Manager or Org Admin"],
    responsibleRoles: ["property_manager", "org_admin"],
    automation: [
      "Sync status=active",
      "Initialize default folders metadata",
      "Initialize operational timeline marker",
      "Enable Assistant signals",
      "Initialize notification posture",
      "Generate activation checklist completion"
    ],
    notifications: ["Critical→Today: property activated"],
    auditEvents: ["property.lifecycle.transitioned", "property.activated"],
    dashboardUpdates: ["Insights: active portfolio", "Clear activation Waiting"],
    assistantRecommendations: ["Review operational readiness"]
  },
  operational: {
    stage: "operational",
    label: "Operational",
    entryCriteria: ["Activation complete"],
    exitCriteria: ["Move to occupancy, turnover, or disposition"],
    requiredData: ["status=active"],
    requiredApprovals: ["Property Manager"],
    responsibleRoles: ["property_manager"],
    automation: ["Portfolio KPIs include property"],
    notifications: [],
    auditEvents: ["property.lifecycle.transitioned"],
    dashboardUpdates: ["Insights: operational property"],
    assistantRecommendations: ["Monitor occupancy and maintenance"]
  },
  occupancy: {
    stage: "occupancy",
    label: "Occupancy",
    entryCriteria: ["Property operational; occupancy focus"],
    exitCriteria: ["Return to operational, start turnover, or dispose"],
    requiredData: ["unit occupancy statuses"],
    requiredApprovals: ["Property Manager"],
    responsibleRoles: ["property_manager", "leasing"],
    automation: ["Surface vacant / occupied insights"],
    notifications: ["Today: vacancy attention when vacant_not_ready"],
    auditEvents: ["property.lifecycle.transitioned"],
    dashboardUpdates: ["Insights: occupancy rate", "Waiting: fill vacancies"],
    assistantRecommendations: ["Review vacant units", "Start turnover if needed"]
  },
  turnover: {
    stage: "turnover",
    label: "Turnover",
    entryCriteria: ["Unit make-ready required between residents"],
    exitCriteria: ["Units ready; return to operational/occupancy or dispose"],
    requiredData: ["turnover checklist progress"],
    requiredApprovals: ["Property Manager"],
    responsibleRoles: ["property_manager", "maintenance"],
    automation: ["Seed turnover checklist", "Clear Waiting when ready"],
    notifications: ["Today: turnover in progress"],
    auditEvents: ["property.lifecycle.transitioned", "property.turnover.started"],
    dashboardUpdates: ["Waiting: complete turnover"],
    assistantRecommendations: ["Complete turnover checklist"]
  },
  disposition: {
    stage: "disposition",
    label: "Disposition",
    entryCriteria: ["Exit from active portfolio initiated"],
    exitCriteria: ["Archived"],
    requiredData: ["disposition reason"],
    requiredApprovals: ["Org Admin or Property Manager with archive"],
    responsibleRoles: ["org_admin", "property_manager"],
    automation: ["Sync status=inactive", "Remove from active ops emphasis"],
    notifications: ["Critical: disposition in progress"],
    auditEvents: ["property.lifecycle.transitioned", "property.disposition.started"],
    dashboardUpdates: ["Waiting: complete disposition / archive"],
    assistantRecommendations: ["Confirm disposition and archive"]
  },
  archived: {
    stage: "archived",
    label: "Archived",
    entryCriteria: ["Disposition complete"],
    exitCriteria: ["Restore to operational (rare)"],
    requiredData: ["archived_at"],
    requiredApprovals: ["property:archive"],
    responsibleRoles: ["org_admin", "property_manager"],
    automation: ["Sync status=archived", "Set archived_at"],
    notifications: ["Later: property archived"],
    auditEvents: ["property.lifecycle.transitioned", "property.archived"],
    dashboardUpdates: ["Remove from active Waiting / Insights"],
    assistantRecommendations: ["Restore only if re-entering portfolio"]
  }
};

export function isPropertyLifecycleStage(value: unknown): value is PropertyLifecycleStage {
  return typeof value === "string" && PROPERTY_LIFECYCLE_STAGES.includes(value as PropertyLifecycleStage);
}

export function canTransitionLifecycle(
  from: PropertyLifecycleStage,
  to: PropertyLifecycleStage
): boolean {
  return PROPERTY_LIFECYCLE_TRANSITIONS[from].includes(to);
}

export function lifecycleStageToLegacyStatus(
  stage: PropertyLifecycleStage
): "draft" | "active" | "inactive" | "archived" {
  if (stage === "archived") return "archived";
  if (stage === "disposition") return "inactive";
  if (
    stage === "operational" ||
    stage === "occupancy" ||
    stage === "turnover" ||
    stage === "activation"
  ) {
    // activation keeps draft until completed into operational — handled by transition target
    if (stage === "activation") return "draft";
    return "active";
  }
  return "draft";
}

export function legacyStatusToLifecycleStage(
  status: "draft" | "active" | "inactive" | "archived"
): PropertyLifecycleStage {
  switch (status) {
    case "active":
      return "operational";
    case "inactive":
      return "disposition";
    case "archived":
      return "archived";
    default:
      return "configuration";
  }
}

export function toLifecycleStageLabel(stage: PropertyLifecycleStage): string {
  return PROPERTY_LIFECYCLE_DEFINITIONS[stage].label;
}

/** Next forward stage along the primary spine (for Assistant “advance” CTAs). */
export function primaryNextStage(
  stage: PropertyLifecycleStage
): PropertyLifecycleStage | null {
  const next = PROPERTY_LIFECYCLE_TRANSITIONS[stage];
  if (stage === "operational") return "occupancy";
  if (stage === "occupancy") return "turnover";
  if (stage === "turnover") return "operational";
  if (stage === "archived") return null;
  return next[0] ?? null;
}

export type LifecycleGateContext = {
  unitCount: number;
  hasOwnerContact: boolean;
  addressComplete: boolean;
};

export function evaluateAdvanceGates(
  to: PropertyLifecycleStage,
  ctx: LifecycleGateContext
): { ok: true } | { ok: false; message: string } {
  if (to === "acquisition" || to === "onboarding") {
    if (!ctx.addressComplete) {
      return { ok: false, message: "Complete the property address before advancing." };
    }
  }
  if (to === "onboarding" || to === "organization_assignment") {
    if (!ctx.hasOwnerContact) {
      return {
        ok: false,
        message: "Add ownership entity or owner contact before advancing."
      };
    }
  }
  if (to === "activation" || to === "operational") {
    if (ctx.unitCount < 1) {
      return { ok: false, message: "Add at least one unit before activation." };
    }
    if (!ctx.addressComplete) {
      return { ok: false, message: "Complete the property address before activation." };
    }
  }
  return { ok: true };
}
