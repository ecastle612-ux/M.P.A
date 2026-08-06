/**
 * CORE-004 Phase 4 — Resident Operations canonical state machine (pure).
 *
 * Permanent rules:
 * - Exactly one resident lifecycle
 * - Exactly one resident identity (tenants row) referenced by all domains
 */

export const RESIDENT_WORKFLOW_STAGES = [
  "applicant",
  "approved",
  "lease_signed",
  "move_in_scheduled",
  "move_in_complete",
  "active_resident",
  "community_participation",
  "maintenance",
  "payments",
  "renewal",
  "move_out_scheduled",
  "former_resident",
  "archive"
] as const;

export type ResidentWorkflowStage = (typeof RESIDENT_WORKFLOW_STAGES)[number];

/** Documented edges only — no side workflows. */
export const RESIDENT_WORKFLOW_TRANSITIONS: Record<
  ResidentWorkflowStage,
  readonly ResidentWorkflowStage[]
> = {
  applicant: ["approved"],
  approved: ["lease_signed"],
  lease_signed: ["move_in_scheduled"],
  move_in_scheduled: ["move_in_complete"],
  move_in_complete: ["active_resident"],
  active_resident: [
    "community_participation",
    "maintenance",
    "payments",
    "renewal",
    "move_out_scheduled"
  ],
  community_participation: ["active_resident"],
  maintenance: ["active_resident"],
  payments: ["active_resident"],
  renewal: ["active_resident", "move_out_scheduled"],
  move_out_scheduled: ["former_resident"],
  former_resident: ["archive"],
  archive: []
};

export type ResidentWorkflowStageDefinition = {
  stage: ResidentWorkflowStage;
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
  dashboardUpdates: string[];
};

export const RESIDENT_WORKFLOW_DEFINITIONS: Record<
  ResidentWorkflowStage,
  ResidentWorkflowStageDefinition
> = {
  applicant: {
    stage: "applicant",
    label: "Applicant",
    entryCriteria: ["Tenant identity created from applicant / intake handoff"],
    exitCriteria: ["Application approved in Leasing Operations"],
    requiredRole: ["leasing_agent", "property_manager", "system"],
    requiredApprovals: [],
    notifications: ["Today: resident identity pending approval"],
    auditEvents: ["resident.workflow.transitioned"],
    timelineUpdates: ["Resident identity opened from applicant"],
    assistantRecommendations: ["Complete leasing approval to continue"],
    waitingOnMe: ["Confirm approval handoff"],
    waitingOnOthers: ["Awaiting leasing approval"],
    dashboardUpdates: ["Resident pipeline +1 applicant"]
  },
  approved: {
    stage: "approved",
    label: "Approved",
    entryCriteria: ["Leasing approval recorded"],
    exitCriteria: ["Lease executed via SignWell"],
    requiredRole: ["leasing_agent", "property_manager", "system"],
    requiredApprovals: ["leasing.approval"],
    notifications: ["Today: approved — await SignWell"],
    auditEvents: ["resident.workflow.transitioned"],
    timelineUpdates: ["Approved for residency"],
    assistantRecommendations: ["Track SignWell package to lease signed"],
    waitingOnMe: ["Send / track lease signature"],
    waitingOnOthers: ["Applicant signing"],
    dashboardUpdates: ["Approved residents queue"]
  },
  lease_signed: {
    stage: "lease_signed",
    label: "Lease Signed",
    entryCriteria: ["SignWell lease agreement completed"],
    exitCriteria: ["Move-in date scheduled; portal activation path ready"],
    requiredRole: ["leasing_agent", "property_manager", "system"],
    requiredApprovals: [],
    notifications: ["Welcome — lease executed", "Manager: resident activated"],
    auditEvents: ["resident.workflow.transitioned", "resident.activated"],
    timelineUpdates: ["Lease signed · resident activation"],
    assistantRecommendations: ["Schedule move-in and seed checklist"],
    waitingOnMe: ["Schedule move-in"],
    waitingOnOthers: [],
    dashboardUpdates: ["Lease signed · Property Command Center update"]
  },
  move_in_scheduled: {
    stage: "move_in_scheduled",
    label: "Move-In Scheduled",
    entryCriteria: ["Move-in date set; checklist seeded"],
    exitCriteria: ["Move-in acknowledgement / checklist complete"],
    requiredRole: ["property_manager", "leasing_agent", "resident", "system"],
    requiredApprovals: [],
    notifications: ["Move-in checklist ready"],
    auditEvents: ["resident.workflow.transitioned"],
    timelineUpdates: ["Move-in scheduled"],
    assistantRecommendations: ["Complete keys, utilities, welcome packet"],
    waitingOnMe: ["Finish move-in prep"],
    waitingOnOthers: ["Resident acknowledgement"],
    dashboardUpdates: ["Upcoming move-ins"]
  },
  move_in_complete: {
    stage: "move_in_complete",
    label: "Move-In Complete",
    entryCriteria: ["Move-in acknowledgement signed / checklist done"],
    exitCriteria: ["Resident marked active for day-to-day ops"],
    requiredRole: ["property_manager", "system"],
    requiredApprovals: [],
    notifications: ["Welcome to your home"],
    auditEvents: ["resident.workflow.transitioned", "resident.move_in_completed"],
    timelineUpdates: ["Move-in complete"],
    assistantRecommendations: ["Open Active Resident home"],
    waitingOnMe: ["Confirm active residency"],
    waitingOnOthers: [],
    dashboardUpdates: ["Move-ins completed"]
  },
  active_resident: {
    stage: "active_resident",
    label: "Active Resident",
    entryCriteria: ["Move-in complete; portal enabled"],
    exitCriteria: ["Enter domain focus, renewal, or move-out"],
    requiredRole: ["resident", "property_manager"],
    requiredApprovals: [],
    notifications: ["Operational home active"],
    auditEvents: ["resident.workflow.transitioned"],
    timelineUpdates: ["Active residency"],
    assistantRecommendations: ["Review Waiting on Me · payments · maintenance"],
    waitingOnMe: ["Handle open resident tasks"],
    waitingOnOthers: [],
    dashboardUpdates: ["Active residents · Property occupancy"]
  },
  community_participation: {
    stage: "community_participation",
    label: "Community Participation",
    entryCriteria: ["Active resident engages community / amenities"],
    exitCriteria: ["Return to active residency"],
    requiredRole: ["resident"],
    requiredApprovals: [],
    notifications: ["Community updates"],
    auditEvents: ["resident.workflow.transitioned"],
    timelineUpdates: ["Community engagement"],
    assistantRecommendations: ["Review community posts and amenities"],
    waitingOnMe: ["Respond to community items"],
    waitingOnOthers: [],
    dashboardUpdates: ["Community engagement"]
  },
  maintenance: {
    stage: "maintenance",
    label: "Maintenance",
    entryCriteria: ["Resident has open maintenance work (Phase 2 workflow)"],
    exitCriteria: ["Return to active residency when focus clears"],
    requiredRole: ["resident", "property_manager", "technician"],
    requiredApprovals: [],
    notifications: ["Maintenance updates (Phase 2)"],
    auditEvents: ["resident.workflow.transitioned"],
    timelineUpdates: ["Maintenance focus"],
    assistantRecommendations: ["Track or confirm open work orders"],
    waitingOnMe: ["Confirm completed work if requested"],
    waitingOnOthers: ["Technician / vendor"],
    dashboardUpdates: ["Residents in maintenance focus"]
  },
  payments: {
    stage: "payments",
    label: "Payments",
    entryCriteria: ["Resident has payment attention (balance / due / failed)"],
    exitCriteria: ["Return to active residency when focus clears"],
    requiredRole: ["resident", "property_manager"],
    requiredApprovals: [],
    notifications: ["Payment reminders (Financial)"],
    auditEvents: ["resident.workflow.transitioned"],
    timelineUpdates: ["Payments focus"],
    assistantRecommendations: ["Pay balance or review autopay"],
    waitingOnMe: ["Resolve outstanding balance"],
    waitingOnOthers: [],
    dashboardUpdates: ["Residents in payments focus"]
  },
  renewal: {
    stage: "renewal",
    label: "Renewal",
    entryCriteria: ["Lease in renewal window (Leasing Operations)"],
    exitCriteria: ["Renewed → active, or notice → move-out"],
    requiredRole: ["property_manager", "leasing_agent", "resident"],
    requiredApprovals: [],
    notifications: ["Renewal offered / pending"],
    auditEvents: ["resident.workflow.transitioned"],
    timelineUpdates: ["Renewal in progress"],
    assistantRecommendations: ["Complete renewal decision"],
    waitingOnMe: ["Process renewal"],
    waitingOnOthers: ["Resident decision"],
    dashboardUpdates: ["Renewals queue"]
  },
  move_out_scheduled: {
    stage: "move_out_scheduled",
    label: "Move-Out Scheduled",
    entryCriteria: ["Notice given or move-out date set"],
    exitCriteria: ["Move-out complete → former"],
    requiredRole: ["property_manager", "resident"],
    requiredApprovals: [],
    notifications: ["Move-out checklist"],
    auditEvents: ["resident.workflow.transitioned"],
    timelineUpdates: ["Move-out scheduled"],
    assistantRecommendations: ["Complete move-out checklist and inspection"],
    waitingOnMe: ["Finalize move-out"],
    waitingOnOthers: ["Resident move-out tasks"],
    dashboardUpdates: ["Upcoming move-outs"]
  },
  former_resident: {
    stage: "former_resident",
    label: "Former Resident",
    entryCriteria: ["Move-out completed; portal access ended"],
    exitCriteria: ["Archive when retention complete"],
    requiredRole: ["property_manager", "organization_admin"],
    requiredApprovals: [],
    notifications: ["Former resident on file"],
    auditEvents: ["resident.workflow.transitioned"],
    timelineUpdates: ["Former resident"],
    assistantRecommendations: ["Close remaining balances / documents"],
    waitingOnMe: ["Closeout financials / docs"],
    waitingOnOthers: [],
    dashboardUpdates: ["Former residents"]
  },
  archive: {
    stage: "archive",
    label: "Archive",
    entryCriteria: ["Retention complete; no open ops"],
    exitCriteria: ["Terminal"],
    requiredRole: ["organization_admin", "property_manager"],
    requiredApprovals: [],
    notifications: [],
    auditEvents: ["resident.workflow.transitioned", "resident.archived"],
    timelineUpdates: ["Archived"],
    assistantRecommendations: ["Review property turnover"],
    waitingOnMe: [],
    waitingOnOthers: [],
    dashboardUpdates: ["Archived residents"]
  }
};

export function isResidentWorkflowStage(value: unknown): value is ResidentWorkflowStage {
  return typeof value === "string" && RESIDENT_WORKFLOW_STAGES.includes(value as ResidentWorkflowStage);
}

export function canTransitionResidentWorkflow(
  from: ResidentWorkflowStage,
  to: ResidentWorkflowStage
): boolean {
  return RESIDENT_WORKFLOW_TRANSITIONS[from].includes(to);
}

export function toResidentWorkflowLabel(stage: ResidentWorkflowStage): string {
  return RESIDENT_WORKFLOW_DEFINITIONS[stage].label;
}

export function primaryNextResidentStage(
  stage: ResidentWorkflowStage
): ResidentWorkflowStage | null {
  return RESIDENT_WORKFLOW_TRANSITIONS[stage][0] ?? null;
}

/** Map canonical workflow → legacy lifecycle_status. */
export function workflowStageToLegacyLifecycleStatus(
  stage: ResidentWorkflowStage
):
  | "awaiting_move_in"
  | "awaiting_signature"
  | "active"
  | "notice_given"
  | "moving_out"
  | "former" {
  switch (stage) {
    case "applicant":
    case "approved":
      return "awaiting_signature";
    case "lease_signed":
      return "awaiting_signature";
    case "move_in_scheduled":
    case "move_in_complete":
      return "awaiting_move_in";
    case "active_resident":
    case "community_participation":
    case "maintenance":
    case "payments":
      return "active";
    case "renewal":
      return "notice_given";
    case "move_out_scheduled":
      return "moving_out";
    case "former_resident":
    case "archive":
      return "former";
    default:
      return "awaiting_move_in";
  }
}

export function legacyLifecycleStatusToWorkflowStage(
  lifecycleStatus: string
): ResidentWorkflowStage {
  switch (lifecycleStatus) {
    case "awaiting_signature":
      return "lease_signed";
    case "awaiting_move_in":
      return "move_in_scheduled";
    case "active":
      return "active_resident";
    case "notice_given":
      return "renewal";
    case "moving_out":
      return "move_out_scheduled";
    case "former":
      return "former_resident";
    default:
      return "applicant";
  }
}

/** Map workflow → CRM status. */
export function workflowStageToTenantStatus(
  stage: ResidentWorkflowStage
): "active" | "inactive" | "archived" {
  if (stage === "archive") return "archived";
  if (stage === "former_resident") return "inactive";
  return "active";
}

export type ResidentAdvanceGateContext = {
  hasProperty: boolean;
  hasUnit: boolean;
  leaseSigned: boolean;
  moveInDateSet: boolean;
  moveInAcknowledged: boolean;
  hasOpenMaintenance: boolean;
  hasPaymentAttention: boolean;
};

export function evaluateResidentAdvanceGates(
  to: ResidentWorkflowStage,
  ctx: ResidentAdvanceGateContext
): { ok: true } | { ok: false; message: string } {
  if (
    (to === "lease_signed" || to === "move_in_scheduled" || to === "active_resident") &&
    (!ctx.hasProperty || !ctx.hasUnit)
  ) {
    return { ok: false, message: "Property and unit are required for residency stages." };
  }
  if (to === "lease_signed" && !ctx.leaseSigned) {
    return { ok: false, message: "Complete SignWell lease signature before Lease Signed." };
  }
  if (to === "move_in_scheduled" && !ctx.moveInDateSet && !ctx.leaseSigned) {
    return { ok: false, message: "Set a move-in date (or complete lease signature) before scheduling." };
  }
  if (to === "move_in_complete" && !ctx.moveInAcknowledged && !ctx.moveInDateSet) {
    return { ok: false, message: "Complete move-in acknowledgement or checklist before Move-In Complete." };
  }
  if (to === "maintenance" && !ctx.hasOpenMaintenance) {
    return { ok: false, message: "Open maintenance work is required before Maintenance focus." };
  }
  if (to === "payments" && !ctx.hasPaymentAttention) {
    return { ok: false, message: "Payment attention (balance/due/failed) is required before Payments focus." };
  }
  return { ok: true };
}
