/**
 * CORE-004 Phase 3 — Leasing Operations canonical state machine (pure).
 *
 * Permanent rule: every leasing path (website, phone, referral, manual, import,
 * existing resident) converges into this lifecycle. No parallel workflows.
 */

export const LEASING_WORKFLOW_STAGES = [
  "prospect",
  "inquiry",
  "lead_qualification",
  "tour_scheduling",
  "property_showing",
  "application",
  "screening",
  "approval",
  "lease_generation",
  "signwell_signature",
  "move_in_preparation",
  "move_in",
  "resident",
  "renewal",
  "move_out",
  "archive"
] as const;

export type LeasingWorkflowStage = (typeof LEASING_WORKFLOW_STAGES)[number];

/** Documented edges only — no side workflows. */
export const LEASING_WORKFLOW_TRANSITIONS: Record<
  LeasingWorkflowStage,
  readonly LeasingWorkflowStage[]
> = {
  prospect: ["inquiry"],
  inquiry: ["lead_qualification"],
  lead_qualification: ["tour_scheduling"],
  tour_scheduling: ["property_showing"],
  property_showing: ["application"],
  application: ["screening"],
  screening: ["approval"],
  approval: ["lease_generation"],
  lease_generation: ["signwell_signature"],
  signwell_signature: ["move_in_preparation"],
  move_in_preparation: ["move_in"],
  move_in: ["resident"],
  resident: ["renewal", "move_out"],
  renewal: ["resident", "move_out"],
  move_out: ["archive"],
  archive: []
};

/** Stages carried on applicants.workflow_stage */
export const LEASING_APPLICANT_STAGES: readonly LeasingWorkflowStage[] = [
  "prospect",
  "inquiry",
  "lead_qualification",
  "tour_scheduling",
  "property_showing",
  "application",
  "screening",
  "approval"
];

/** Stages carried on leases.workflow_stage */
export const LEASING_LEASE_STAGES: readonly LeasingWorkflowStage[] = [
  "lease_generation",
  "signwell_signature",
  "move_in_preparation",
  "move_in",
  "resident",
  "renewal",
  "move_out",
  "archive"
];

export type LeasingWorkflowStageDefinition = {
  stage: LeasingWorkflowStage;
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

export const LEASING_WORKFLOW_DEFINITIONS: Record<
  LeasingWorkflowStage,
  LeasingWorkflowStageDefinition
> = {
  prospect: {
    stage: "prospect",
    label: "Prospect",
    entryCriteria: ["Website, phone, referral, manual, or import creates a prospect"],
    exitCriteria: ["Prospect acknowledged; inquiry opened"],
    requiredRole: ["leasing_agent", "property_manager", "system"],
    requiredApprovals: [],
    notifications: ["Today: new prospect"],
    auditEvents: ["leasing.prospect.created", "leasing.workflow.transitioned"],
    timelineUpdates: ["Prospect opened"],
    assistantRecommendations: ["Open inquiry with this prospect"],
    waitingOnMe: ["Start inquiry"],
    waitingOnOthers: [],
    dashboardUpdates: ["Leasing pipeline +1 prospect"]
  },
  inquiry: {
    stage: "inquiry",
    label: "Inquiry",
    entryCriteria: ["Prospect recorded"],
    exitCriteria: ["Inquiry details captured (property interest, contact)"],
    requiredRole: ["leasing_agent", "property_manager", "prospect"],
    requiredApprovals: [],
    notifications: ["Today: inquiry pending"],
    auditEvents: ["leasing.workflow.transitioned"],
    timelineUpdates: ["Inquiry started"],
    assistantRecommendations: ["Qualify this inquiry"],
    waitingOnMe: ["Complete inquiry"],
    waitingOnOthers: ["Waiting for prospect response"],
    dashboardUpdates: ["Inquiry queue"]
  },
  lead_qualification: {
    stage: "lead_qualification",
    label: "Lead Qualification",
    entryCriteria: ["Inquiry complete"],
    exitCriteria: ["Lead qualified or disqualified"],
    requiredRole: ["leasing_agent", "property_manager"],
    requiredApprovals: [],
    notifications: ["Today: qualify lead"],
    auditEvents: ["leasing.workflow.transitioned"],
    timelineUpdates: ["Lead qualified"],
    assistantRecommendations: ["Schedule a tour"],
    waitingOnMe: ["Qualify lead"],
    waitingOnOthers: [],
    dashboardUpdates: ["Qualified leads"]
  },
  tour_scheduling: {
    stage: "tour_scheduling",
    label: "Tour Scheduling",
    entryCriteria: ["Lead qualified"],
    exitCriteria: ["Tour date/time set for a property/unit"],
    requiredRole: ["leasing_agent", "property_manager", "prospect"],
    requiredApprovals: [],
    notifications: ["Today: tour to schedule"],
    auditEvents: ["leasing.workflow.transitioned"],
    timelineUpdates: ["Tour scheduled"],
    assistantRecommendations: ["Confirm showing"],
    waitingOnMe: ["Schedule tour"],
    waitingOnOthers: ["Waiting for prospect availability"],
    dashboardUpdates: ["Tours scheduled"]
  },
  property_showing: {
    stage: "property_showing",
    label: "Property Showing",
    entryCriteria: ["Tour scheduled"],
    exitCriteria: ["Showing completed; interest confirmed"],
    requiredRole: ["leasing_agent", "property_manager"],
    requiredApprovals: [],
    notifications: ["Today: showing today"],
    auditEvents: ["leasing.workflow.transitioned"],
    timelineUpdates: ["Showing completed"],
    assistantRecommendations: ["Invite application"],
    waitingOnMe: ["Complete showing notes"],
    waitingOnOthers: [],
    dashboardUpdates: ["Showings completed"]
  },
  application: {
    stage: "application",
    label: "Application",
    entryCriteria: ["Showing complete; applicant invited"],
    exitCriteria: ["Application submitted with required fields"],
    requiredRole: ["applicant", "leasing_agent"],
    requiredApprovals: [],
    notifications: ["Today: application in progress"],
    auditEvents: ["leasing.workflow.transitioned", "leasing.application.submitted"],
    timelineUpdates: ["Application submitted"],
    assistantRecommendations: ["Start screening"],
    waitingOnMe: ["Review application completeness"],
    waitingOnOthers: ["Waiting for applicant documents"],
    dashboardUpdates: ["Applications"]
  },
  screening: {
    stage: "screening",
    label: "Screening",
    entryCriteria: ["Application submitted"],
    exitCriteria: ["Screening result ready for decision"],
    requiredRole: ["leasing_agent", "property_manager", "system"],
    requiredApprovals: [],
    notifications: ["Today: screening in progress"],
    auditEvents: ["leasing.workflow.transitioned", "leasing.screening.completed"],
    timelineUpdates: ["Screening in progress"],
    assistantRecommendations: ["Review screening for approval"],
    waitingOnMe: ["Review screening results"],
    waitingOnOthers: ["Waiting for screening provider"],
    dashboardUpdates: ["Screening queue"]
  },
  approval: {
    stage: "approval",
    label: "Approval",
    entryCriteria: ["Screening complete"],
    exitCriteria: ["Approved (or declined terminal outside happy path)"],
    requiredRole: ["property_manager", "organization_admin"],
    requiredApprovals: ["lease:update or applicant approval capability"],
    notifications: ["Critical: approval decision needed"],
    auditEvents: ["leasing.workflow.transitioned", "leasing.application.approved"],
    timelineUpdates: ["Application approved"],
    assistantRecommendations: ["Generate lease package"],
    waitingOnMe: ["Approve or decline"],
    waitingOnOthers: [],
    dashboardUpdates: ["Awaiting approval"]
  },
  lease_generation: {
    stage: "lease_generation",
    label: "Lease Generation",
    entryCriteria: ["Application approved; draft lease available"],
    exitCriteria: ["Lease document package ready for SignWell"],
    requiredRole: ["leasing_agent", "property_manager"],
    requiredApprovals: [],
    notifications: ["Today: generate lease"],
    auditEvents: ["leasing.workflow.transitioned", "leasing.lease.generated"],
    timelineUpdates: ["Lease generated"],
    assistantRecommendations: ["Send SignWell package"],
    waitingOnMe: ["Finalize lease terms"],
    waitingOnOthers: [],
    dashboardUpdates: ["Leases to send"]
  },
  signwell_signature: {
    stage: "signwell_signature",
    label: "SignWell Signature",
    entryCriteria: ["Lease package generated"],
    exitCriteria: ["All required signatures complete (SignWell webhook)"],
    requiredRole: ["applicant", "property_manager", "system"],
    requiredApprovals: ["signature:send"],
    notifications: ["Today: awaiting signatures"],
    auditEvents: ["leasing.workflow.transitioned", "leasing.signature.completed"],
    timelineUpdates: ["Sent for signature / Signed"],
    assistantRecommendations: ["Follow up unsigned parties"],
    waitingOnMe: ["Resend or chase signatures"],
    waitingOnOthers: ["Waiting for SignWell completion"],
    dashboardUpdates: ["Signatures pending"]
  },
  move_in_preparation: {
    stage: "move_in_preparation",
    label: "Move-In Preparation",
    entryCriteria: ["Lease fully signed"],
    exitCriteria: ["Move-in checklist ready (keys, utilities, orientation)"],
    requiredRole: ["leasing_agent", "property_manager"],
    requiredApprovals: [],
    notifications: ["Today: prepare move-in"],
    auditEvents: ["leasing.workflow.transitioned"],
    timelineUpdates: ["Move-in preparation"],
    assistantRecommendations: ["Complete move-in checklist"],
    waitingOnMe: ["Prepare unit for move-in"],
    waitingOnOthers: ["Waiting for utilities / keys"],
    dashboardUpdates: ["Move-ins preparing"]
  },
  move_in: {
    stage: "move_in",
    label: "Move-In",
    entryCriteria: ["Preparation complete"],
    exitCriteria: ["Move-in date executed; occupancy started"],
    requiredRole: ["leasing_agent", "property_manager", "resident"],
    requiredApprovals: [],
    notifications: ["Today: move-in"],
    auditEvents: ["leasing.workflow.transitioned", "leasing.move_in.completed"],
    timelineUpdates: ["Moved in"],
    assistantRecommendations: ["Activate resident home"],
    waitingOnMe: ["Confirm move-in"],
    waitingOnOthers: [],
    dashboardUpdates: ["Move-ins today"]
  },
  resident: {
    stage: "resident",
    label: "Resident",
    entryCriteria: ["Move-in complete; lease active"],
    exitCriteria: ["Renewal offered or move-out started"],
    requiredRole: ["resident", "property_manager"],
    requiredApprovals: [],
    notifications: [],
    auditEvents: ["leasing.workflow.transitioned"],
    timelineUpdates: ["Resident active"],
    assistantRecommendations: ["Monitor renewal window"],
    waitingOnMe: [],
    waitingOnOthers: [],
    dashboardUpdates: ["Active residents"]
  },
  renewal: {
    stage: "renewal",
    label: "Renewal",
    entryCriteria: ["Resident lease in renewal window"],
    exitCriteria: ["Renewed (return to resident) or proceed to move-out"],
    requiredRole: ["property_manager", "leasing_agent", "resident"],
    requiredApprovals: [],
    notifications: ["Today: renewal decision"],
    auditEvents: ["leasing.workflow.transitioned", "leasing.renewal.completed"],
    timelineUpdates: ["Renewal in progress"],
    assistantRecommendations: ["Send renewal / SignWell renewal"],
    waitingOnMe: ["Advance renewal"],
    waitingOnOthers: ["Waiting for resident renewal decision"],
    dashboardUpdates: ["Renewals"]
  },
  move_out: {
    stage: "move_out",
    label: "Move-Out",
    entryCriteria: ["Notice given or non-renewal"],
    exitCriteria: ["Move-out complete; unit ready for turnover handoff"],
    requiredRole: ["property_manager", "resident"],
    requiredApprovals: [],
    notifications: ["Today: move-out"],
    auditEvents: ["leasing.workflow.transitioned", "leasing.move_out.completed"],
    timelineUpdates: ["Move-out"],
    assistantRecommendations: ["Complete move-out and archive"],
    waitingOnMe: ["Finalize move-out"],
    waitingOnOthers: ["Waiting for resident move-out tasks"],
    dashboardUpdates: ["Move-outs"]
  },
  archive: {
    stage: "archive",
    label: "Archive",
    entryCriteria: ["Move-out complete"],
    exitCriteria: ["Record archived (terminal)"],
    requiredRole: ["property_manager", "system"],
    requiredApprovals: [],
    notifications: [],
    auditEvents: ["leasing.workflow.transitioned", "leasing.lease.archived"],
    timelineUpdates: ["Archived"],
    assistantRecommendations: ["Review turnover on Property Lifecycle"],
    waitingOnMe: [],
    waitingOnOthers: [],
    dashboardUpdates: ["Archived leases"]
  }
};

export function isLeasingWorkflowStage(value: unknown): value is LeasingWorkflowStage {
  return typeof value === "string" && LEASING_WORKFLOW_STAGES.includes(value as LeasingWorkflowStage);
}

export function isLeasingApplicantStage(stage: LeasingWorkflowStage): boolean {
  return LEASING_APPLICANT_STAGES.includes(stage);
}

export function isLeasingLeaseStage(stage: LeasingWorkflowStage): boolean {
  return LEASING_LEASE_STAGES.includes(stage);
}

export function canTransitionLeasingWorkflow(
  from: LeasingWorkflowStage,
  to: LeasingWorkflowStage
): boolean {
  return LEASING_WORKFLOW_TRANSITIONS[from].includes(to);
}

export function toLeasingWorkflowLabel(stage: LeasingWorkflowStage): string {
  return LEASING_WORKFLOW_DEFINITIONS[stage].label;
}

export function primaryNextLeasingStage(
  stage: LeasingWorkflowStage
): LeasingWorkflowStage | null {
  return LEASING_WORKFLOW_TRANSITIONS[stage][0] ?? null;
}

/** Map canonical workflow → legacy applicant status. */
export function workflowStageToLegacyApplicantStatus(
  stage: LeasingWorkflowStage
):
  | "draft"
  | "submitted"
  | "awaiting_documents"
  | "screening_in_progress"
  | "pending_review"
  | "approved"
  | "converted_to_resident" {
  switch (stage) {
    case "prospect":
    case "inquiry":
    case "lead_qualification":
    case "tour_scheduling":
    case "property_showing":
      return "draft";
    case "application":
      return "submitted";
    case "screening":
      return "screening_in_progress";
    case "approval":
      return "pending_review";
    case "lease_generation":
    case "signwell_signature":
    case "move_in_preparation":
      return "approved";
    default:
      return "converted_to_resident";
  }
}

export function legacyApplicantStatusToWorkflowStage(status: string): LeasingWorkflowStage {
  switch (status) {
    case "submitted":
    case "awaiting_documents":
      return "application";
    case "screening_in_progress":
      return "screening";
    case "pending_review":
      return "approval";
    case "approved":
      return "approval";
    case "converted_to_resident":
      return "resident";
    case "declined":
    case "withdrawn":
      return "archive";
    default:
      return "prospect";
  }
}

/** Map canonical workflow → legacy lease status. */
export function workflowStageToLegacyLeaseStatus(
  stage: LeasingWorkflowStage
): "draft" | "signed" | "active" | "expired" | "terminated" {
  switch (stage) {
    case "lease_generation":
      return "draft";
    case "signwell_signature":
    case "move_in_preparation":
      return "signed";
    case "move_in":
    case "resident":
    case "renewal":
      return "active";
    case "move_out":
      return "expired";
    case "archive":
      return "terminated";
    default:
      return "draft";
  }
}

export function legacyLeaseStatusToWorkflowStage(
  status: string,
  renewalStatus?: string | null
): LeasingWorkflowStage {
  if (renewalStatus === "offered" || renewalStatus === "pending") return "renewal";
  switch (status) {
    case "signed":
      return "signwell_signature";
    case "active":
      return "resident";
    case "expired":
      return "move_out";
    case "terminated":
      return "archive";
    default:
      return "lease_generation";
  }
}

export type LeasingAdvanceGateContext = {
  hasProperty: boolean;
  hasUnit: boolean;
  hasApplicantContact: boolean;
  applicationSubmitted: boolean;
  screeningComplete: boolean;
  approved: boolean;
  leaseId: string | null;
  signatureComplete: boolean;
  moveInDateSet: boolean;
};

export function evaluateLeasingAdvanceGates(
  to: LeasingWorkflowStage,
  ctx: LeasingAdvanceGateContext
): { ok: true } | { ok: false; message: string } {
  if (
    (to === "tour_scheduling" || to === "property_showing" || to === "application") &&
    !ctx.hasProperty
  ) {
    return { ok: false, message: "Link a property before advancing to tours or application." };
  }
  if (to === "application" && !ctx.hasApplicantContact) {
    return { ok: false, message: "Applicant contact (email or phone) is required before application." };
  }
  if (to === "screening" && !ctx.applicationSubmitted) {
    return { ok: false, message: "Submit the application before screening." };
  }
  if (to === "approval" && !ctx.screeningComplete && !ctx.applicationSubmitted) {
    return { ok: false, message: "Screening must be started before approval." };
  }
  if (to === "lease_generation" && !ctx.approved) {
    return { ok: false, message: "Application must be approved before lease generation." };
  }
  if (to === "signwell_signature" && !ctx.leaseId) {
    return { ok: false, message: "Create or link a draft lease before SignWell." };
  }
  if (to === "move_in_preparation" && !ctx.signatureComplete && !ctx.leaseId) {
    return { ok: false, message: "Complete SignWell signatures before move-in preparation." };
  }
  if (to === "move_in" && !ctx.moveInDateSet) {
    return { ok: false, message: "Set a move-in date before recording move-in." };
  }
  return { ok: true };
}
