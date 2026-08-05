/**
 * CORE-004 Phase 2 — Maintenance Operations canonical state machine (pure).
 *
 * Permanent rule: every work order enters this lifecycle regardless of entry point
 * (resident, manager, inspection, automation, vendor).
 */

export const MAINTENANCE_WORKFLOW_STAGES = [
  "request",
  "intake",
  "triage",
  "priority_classification",
  "assignment",
  "scheduling",
  "dispatch",
  "field_execution",
  "vendor_escalation",
  "quality_review",
  "resident_confirmation",
  "completion",
  "analytics"
] as const;

export type MaintenanceWorkflowStage = (typeof MAINTENANCE_WORKFLOW_STAGES)[number];

/** Documented edges only — no side workflows. */
export const MAINTENANCE_WORKFLOW_TRANSITIONS: Record<
  MaintenanceWorkflowStage,
  readonly MaintenanceWorkflowStage[]
> = {
  request: ["intake"],
  intake: ["triage"],
  triage: ["priority_classification"],
  priority_classification: ["assignment"],
  assignment: ["scheduling"],
  scheduling: ["dispatch"],
  dispatch: ["field_execution", "vendor_escalation"],
  field_execution: ["quality_review", "vendor_escalation"],
  vendor_escalation: ["field_execution", "quality_review"],
  quality_review: ["resident_confirmation", "completion"],
  resident_confirmation: ["completion"],
  completion: ["analytics"],
  analytics: []
};

export type MaintenanceWorkflowStageDefinition = {
  stage: MaintenanceWorkflowStage;
  label: string;
  entryCriteria: string[];
  exitCriteria: string[];
  requiredRole: string[];
  requiredApprovals: string[];
  notifications: string[];
  auditEvents: string[];
  timelineUpdates: string[];
  assistantRecommendations: string[];
  waitingOnMe: string[];
  waitingOnOthers: string[];
};

export const MAINTENANCE_WORKFLOW_DEFINITIONS: Record<
  MaintenanceWorkflowStage,
  MaintenanceWorkflowStageDefinition
> = {
  request: {
    stage: "request",
    label: "Request",
    entryCriteria: ["Resident, manager, inspection, or automation creates a work order"],
    exitCriteria: ["Request accepted into intake"],
    requiredRole: ["resident", "property_manager", "system"],
    requiredApprovals: [],
    notifications: ["Today: new maintenance request"],
    auditEvents: ["maintenance.request.created", "maintenance.workflow.transitioned"],
    timelineUpdates: ["Request opened"],
    assistantRecommendations: ["Intake this request"],
    waitingOnMe: ["Intake new request"],
    waitingOnOthers: []
  },
  intake: {
    stage: "intake",
    label: "Intake",
    entryCriteria: ["Request recorded"],
    exitCriteria: ["Intake complete; ready for triage"],
    requiredRole: ["property_manager", "maintenance_coordinator"],
    requiredApprovals: [],
    notifications: ["Today: intake pending"],
    auditEvents: ["maintenance.workflow.transitioned"],
    timelineUpdates: ["Intake started"],
    assistantRecommendations: ["Complete intake details"],
    waitingOnMe: ["Finish intake"],
    waitingOnOthers: []
  },
  triage: {
    stage: "triage",
    label: "Triage",
    entryCriteria: ["Intake complete"],
    exitCriteria: ["Triage decision made"],
    requiredRole: ["property_manager", "maintenance_coordinator"],
    requiredApprovals: [],
    notifications: ["Today: triage needed"],
    auditEvents: ["maintenance.workflow.transitioned"],
    timelineUpdates: ["Triaged"],
    assistantRecommendations: ["Triage and classify priority"],
    waitingOnMe: ["Triage work order"],
    waitingOnOthers: []
  },
  priority_classification: {
    stage: "priority_classification",
    label: "Priority Classification",
    entryCriteria: ["Triaged"],
    exitCriteria: ["Priority confirmed (incl. emergency rules)"],
    requiredRole: ["property_manager", "maintenance_coordinator"],
    requiredApprovals: ["Emergency requires coordinator or manager"],
    notifications: ["Critical: emergency classified"],
    auditEvents: ["maintenance.workflow.transitioned"],
    timelineUpdates: ["Priority classified"],
    assistantRecommendations: ["Confirm priority before assignment"],
    waitingOnMe: ["Classify priority"],
    waitingOnOthers: []
  },
  assignment: {
    stage: "assignment",
    label: "Assignment",
    entryCriteria: ["Priority classified"],
    exitCriteria: ["Technician or vendor assigned"],
    requiredRole: ["property_manager", "maintenance_coordinator"],
    requiredApprovals: ["maintenance:assign"],
    notifications: ["Today: assignment pending / assigned"],
    auditEvents: ["maintenance.workflow.transitioned", "maintenance.vendor.assigned"],
    timelineUpdates: ["Assignee set"],
    assistantRecommendations: ["Assign technician or vendor"],
    waitingOnMe: ["Assign work"],
    waitingOnOthers: []
  },
  scheduling: {
    stage: "scheduling",
    label: "Scheduling",
    entryCriteria: ["Assignee selected"],
    exitCriteria: ["Due date / schedule set"],
    requiredRole: ["property_manager", "maintenance_coordinator", "technician"],
    requiredApprovals: [],
    notifications: ["Today: schedule needed"],
    auditEvents: ["maintenance.workflow.transitioned"],
    timelineUpdates: ["Scheduled"],
    assistantRecommendations: ["Set due date and schedule"],
    waitingOnMe: ["Schedule work"],
    waitingOnOthers: ["Waiting for resident availability"]
  },
  dispatch: {
    stage: "dispatch",
    label: "Dispatch",
    entryCriteria: ["Scheduled"],
    exitCriteria: ["Dispatched to field or vendor"],
    requiredRole: ["property_manager", "maintenance_coordinator"],
    requiredApprovals: [],
    notifications: ["Today: dispatch / en route"],
    auditEvents: ["maintenance.workflow.transitioned"],
    timelineUpdates: ["Dispatched"],
    assistantRecommendations: ["Dispatch now"],
    waitingOnMe: ["Dispatch job"],
    waitingOnOthers: []
  },
  field_execution: {
    stage: "field_execution",
    label: "Field Execution",
    entryCriteria: ["Dispatched"],
    exitCriteria: ["Work performed; ready for review or vendor help"],
    requiredRole: ["maintenance_technician", "vendor"],
    requiredApprovals: [],
    notifications: ["Today: in progress"],
    auditEvents: ["maintenance.workflow.transitioned", "maintenance.technician.arrived"],
    timelineUpdates: ["Field work in progress"],
    assistantRecommendations: ["Complete field checklist and photos"],
    waitingOnMe: ["Complete field work"],
    waitingOnOthers: ["Waiting for parts"]
  },
  vendor_escalation: {
    stage: "vendor_escalation",
    label: "Vendor Escalation",
    entryCriteria: ["Vendor required from dispatch or field"],
    exitCriteria: ["Vendor work done; return to field or quality review"],
    requiredRole: ["property_manager", "vendor"],
    requiredApprovals: ["vendor:assign"],
    notifications: ["Today: waiting for vendor"],
    auditEvents: ["maintenance.workflow.transitioned", "maintenance.vendor.assigned"],
    timelineUpdates: ["Vendor escalated"],
    assistantRecommendations: ["Follow up vendor or reassign"],
    waitingOnMe: [],
    waitingOnOthers: ["Waiting for vendor"]
  },
  quality_review: {
    stage: "quality_review",
    label: "Quality Review",
    entryCriteria: ["Field/vendor work reported complete"],
    exitCriteria: ["QA approved"],
    requiredRole: ["property_manager", "maintenance_coordinator"],
    requiredApprovals: ["maintenance:update"],
    notifications: ["Today: quality review"],
    auditEvents: ["maintenance.workflow.transitioned"],
    timelineUpdates: ["Quality review"],
    assistantRecommendations: ["Review photos and close quality check"],
    waitingOnMe: ["Quality review"],
    waitingOnOthers: []
  },
  resident_confirmation: {
    stage: "resident_confirmation",
    label: "Resident Confirmation",
    entryCriteria: ["Quality approved; resident linked"],
    exitCriteria: ["Resident confirms or feedback recorded"],
    requiredRole: ["resident", "property_manager"],
    requiredApprovals: [],
    notifications: ["Today: waiting for resident confirmation"],
    auditEvents: ["maintenance.workflow.transitioned"],
    timelineUpdates: ["Awaiting resident confirmation"],
    assistantRecommendations: ["Follow up resident confirmation"],
    waitingOnMe: [],
    waitingOnOthers: ["Waiting for resident"]
  },
  completion: {
    stage: "completion",
    label: "Completion",
    entryCriteria: ["QA done; resident confirmed or waived"],
    exitCriteria: ["Work order completed"],
    requiredRole: ["property_manager", "maintenance_coordinator"],
    requiredApprovals: ["maintenance:update"],
    notifications: ["Today: work completed"],
    auditEvents: ["maintenance.workflow.transitioned", "maintenance.work.completed"],
    timelineUpdates: ["Completed"],
    assistantRecommendations: ["Close and review analytics"],
    waitingOnMe: ["Finalize completion"],
    waitingOnOthers: []
  },
  analytics: {
    stage: "analytics",
    label: "Analytics",
    entryCriteria: ["Completion recorded"],
    exitCriteria: ["Outcome metrics captured (terminal)"],
    requiredRole: ["system", "property_manager"],
    requiredApprovals: [],
    notifications: [],
    auditEvents: ["maintenance.workflow.transitioned"],
    timelineUpdates: ["Analytics recorded"],
    assistantRecommendations: ["Review maintenance KPIs"],
    waitingOnMe: [],
    waitingOnOthers: []
  }
};

export function isMaintenanceWorkflowStage(value: unknown): value is MaintenanceWorkflowStage {
  return (
    typeof value === "string" &&
    MAINTENANCE_WORKFLOW_STAGES.includes(value as MaintenanceWorkflowStage)
  );
}

export function canTransitionMaintenanceWorkflow(
  from: MaintenanceWorkflowStage,
  to: MaintenanceWorkflowStage
): boolean {
  return MAINTENANCE_WORKFLOW_TRANSITIONS[from].includes(to);
}

export function toMaintenanceWorkflowLabel(stage: MaintenanceWorkflowStage): string {
  return MAINTENANCE_WORKFLOW_DEFINITIONS[stage].label;
}

export function primaryNextMaintenanceStage(
  stage: MaintenanceWorkflowStage
): MaintenanceWorkflowStage | null {
  return MAINTENANCE_WORKFLOW_TRANSITIONS[stage][0] ?? null;
}

/** Map canonical workflow → legacy status for backward-compatible surfaces. */
export function workflowStageToLegacyStatus(
  stage: MaintenanceWorkflowStage
):
  | "submitted"
  | "triaged"
  | "assigned"
  | "in_progress"
  | "vendor_on_site"
  | "awaiting_approval"
  | "completed" {
  switch (stage) {
    case "request":
    case "intake":
      return "submitted";
    case "triage":
    case "priority_classification":
      return "triaged";
    case "assignment":
    case "scheduling":
    case "dispatch":
      return "assigned";
    case "field_execution":
      return "in_progress";
    case "vendor_escalation":
      return "vendor_on_site";
    case "quality_review":
    case "resident_confirmation":
      return "awaiting_approval";
    case "completion":
    case "analytics":
      return "completed";
  }
}

export function legacyStatusToWorkflowStage(
  status: string
): MaintenanceWorkflowStage {
  switch (status) {
    case "triaged":
      return "triage";
    case "assigned":
      return "assignment";
    case "in_progress":
      return "field_execution";
    case "vendor_on_site":
      return "vendor_escalation";
    case "awaiting_approval":
      return "quality_review";
    case "on_hold":
      return "triage";
    case "completed":
    case "cancelled":
      return "completion";
    default:
      return "request";
  }
}

export type MaintenanceAdvanceGateContext = {
  hasAssignee: boolean;
  hasDueDate: boolean;
  hasVendor: boolean;
  hasResident: boolean;
  prioritySet: boolean;
};

export function evaluateMaintenanceAdvanceGates(
  to: MaintenanceWorkflowStage,
  ctx: MaintenanceAdvanceGateContext
): { ok: true } | { ok: false; message: string } {
  if (to === "assignment" || to === "scheduling") {
    if (to === "scheduling" && !ctx.hasAssignee && !ctx.hasVendor) {
      return { ok: false, message: "Assign a technician or vendor before scheduling." };
    }
  }
  if (to === "scheduling" && !ctx.prioritySet) {
    return { ok: false, message: "Classify priority before scheduling." };
  }
  if (to === "dispatch" && !ctx.hasDueDate) {
    return { ok: false, message: "Set a due date before dispatch." };
  }
  if (to === "dispatch" && !ctx.hasAssignee && !ctx.hasVendor) {
    return { ok: false, message: "Assign a technician or vendor before dispatch." };
  }
  if (to === "vendor_escalation" && !ctx.hasVendor) {
    return { ok: false, message: "Select a vendor before vendor escalation." };
  }
  if (to === "resident_confirmation" && !ctx.hasResident) {
    // Allow skip path via quality_review → completion when no resident
    return {
      ok: false,
      message: "No resident linked — advance to Completion instead of Resident Confirmation."
    };
  }
  return { ok: true };
}
