/**
 * CORE-004 Phase 5 — Vendor Operations canonical state machine (pure).
 *
 * Permanent rules:
 * - Exactly one vendor lifecycle
 * - Exactly one vendor identity (vendors row) for all domains
 * - Maintenance work stays on Phase 2 machine; this machine owns vendor identity
 */

export const VENDOR_WORKFLOW_STAGES = [
  "prospective_vendor",
  "invited",
  "application_submitted",
  "compliance_review",
  "insurance_verification",
  "approved",
  "available",
  "assigned",
  "work_in_progress",
  "invoice_submitted",
  "payment_pending",
  "paid",
  "performance_review",
  "preferred_vendor",
  "suspended",
  "inactive",
  "archived"
] as const;

export type VendorWorkflowStage = (typeof VENDOR_WORKFLOW_STAGES)[number];

/** Documented edges only — no side workflows. */
export const VENDOR_WORKFLOW_TRANSITIONS: Record<
  VendorWorkflowStage,
  readonly VendorWorkflowStage[]
> = {
  prospective_vendor: ["invited"],
  invited: ["application_submitted"],
  application_submitted: ["compliance_review"],
  compliance_review: ["insurance_verification"],
  insurance_verification: ["approved"],
  approved: ["available"],
  available: ["assigned", "preferred_vendor", "suspended", "inactive"],
  assigned: ["work_in_progress", "available", "suspended"],
  work_in_progress: ["invoice_submitted", "assigned", "suspended"],
  invoice_submitted: ["payment_pending", "work_in_progress"],
  payment_pending: ["paid", "invoice_submitted"],
  paid: ["performance_review"],
  performance_review: ["available", "preferred_vendor"],
  preferred_vendor: ["assigned", "available", "suspended", "inactive"],
  suspended: ["available", "inactive"],
  inactive: ["archived", "available"],
  archived: []
};

/** Stages that may receive new maintenance assignments. */
export const VENDOR_ASSIGNABLE_STAGES: readonly VendorWorkflowStage[] = [
  "available",
  "preferred_vendor"
];

export type VendorWorkflowStageDefinition = {
  stage: VendorWorkflowStage;
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

function def(
  stage: VendorWorkflowStage,
  label: string,
  partial: Omit<VendorWorkflowStageDefinition, "stage" | "label">
): VendorWorkflowStageDefinition {
  return { stage, label, ...partial };
}

export const VENDOR_WORKFLOW_DEFINITIONS: Record<
  VendorWorkflowStage,
  VendorWorkflowStageDefinition
> = {
  prospective_vendor: def("prospective_vendor", "Prospective Vendor", {
    entryCriteria: ["Vendor identity created / referred"],
    exitCriteria: ["Invitation sent"],
    requiredRole: ["property_manager", "maintenance_coordinator", "system"],
    requiredApprovals: [],
    notifications: ["Today: prospective vendor"],
    auditEvents: ["vendor.workflow.transitioned"],
    timelineUpdates: ["Prospective vendor opened"],
    assistantRecommendations: ["Send vendor invitation"],
    waitingOnMe: ["Invite vendor"],
    waitingOnOthers: [],
    dashboardUpdates: ["Vendor pipeline +1"]
  }),
  invited: def("invited", "Invited", {
    entryCriteria: ["Invite delivered"],
    exitCriteria: ["Application submitted"],
    requiredRole: ["property_manager", "vendor", "system"],
    requiredApprovals: [],
    notifications: ["Invite pending"],
    auditEvents: ["vendor.workflow.transitioned"],
    timelineUpdates: ["Vendor invited"],
    assistantRecommendations: ["Follow up on invite"],
    waitingOnMe: [],
    waitingOnOthers: ["Vendor application"],
    dashboardUpdates: ["Invited vendors"]
  }),
  application_submitted: def("application_submitted", "Application Submitted", {
    entryCriteria: ["Vendor application received"],
    exitCriteria: ["Compliance review started"],
    requiredRole: ["property_manager", "organization_admin"],
    requiredApprovals: [],
    notifications: ["Application ready for review"],
    auditEvents: ["vendor.workflow.transitioned"],
    timelineUpdates: ["Application submitted"],
    assistantRecommendations: ["Start compliance review"],
    waitingOnMe: ["Open compliance review"],
    waitingOnOthers: [],
    dashboardUpdates: ["Applications queue"]
  }),
  compliance_review: def("compliance_review", "Compliance Review", {
    entryCriteria: ["Application ready"],
    exitCriteria: ["Compliance gates passed"],
    requiredRole: ["property_manager", "organization_admin"],
    requiredApprovals: ["vendor.compliance"],
    notifications: ["Compliance in review"],
    auditEvents: ["vendor.workflow.transitioned"],
    timelineUpdates: ["Compliance review"],
    assistantRecommendations: ["Verify licenses and tax docs"],
    waitingOnMe: ["Complete compliance checklist"],
    waitingOnOthers: ["Missing documents from vendor"],
    dashboardUpdates: ["Compliance queue"]
  }),
  insurance_verification: def("insurance_verification", "Insurance Verification", {
    entryCriteria: ["Compliance cleared"],
    exitCriteria: ["Insurance current and on file"],
    requiredRole: ["property_manager", "organization_admin"],
    requiredApprovals: ["vendor.insurance"],
    notifications: ["Insurance verification"],
    auditEvents: ["vendor.workflow.transitioned"],
    timelineUpdates: ["Insurance verification"],
    assistantRecommendations: ["Confirm COI expiration"],
    waitingOnMe: ["Verify insurance"],
    waitingOnOthers: ["Vendor insurance upload"],
    dashboardUpdates: ["Insurance queue"]
  }),
  approved: def("approved", "Approved", {
    entryCriteria: ["Compliance + insurance verified"],
    exitCriteria: ["Marked available for assignments"],
    requiredRole: ["property_manager", "organization_admin", "system"],
    requiredApprovals: ["vendor.approval"],
    notifications: ["Vendor approved"],
    auditEvents: ["vendor.workflow.transitioned", "vendor.approved"],
    timelineUpdates: ["Vendor approved"],
    assistantRecommendations: ["Make vendor available"],
    waitingOnMe: ["Activate availability"],
    waitingOnOthers: [],
    dashboardUpdates: ["Approved vendors"]
  }),
  available: def("available", "Available", {
    entryCriteria: ["Approved for work"],
    exitCriteria: ["Assigned, preferred, suspended, or inactivated"],
    requiredRole: ["property_manager", "maintenance_coordinator"],
    requiredApprovals: [],
    notifications: ["Available for assignments"],
    auditEvents: ["vendor.workflow.transitioned"],
    timelineUpdates: ["Vendor available"],
    assistantRecommendations: ["Assign to open work when needed"],
    waitingOnMe: ["Match to open work"],
    waitingOnOthers: [],
    dashboardUpdates: ["Available vendors · Maintenance assign pool"]
  }),
  assigned: def("assigned", "Assigned", {
    entryCriteria: ["Assigned to a maintenance work order (Phase 2)"],
    exitCriteria: ["Work started or returned to available"],
    requiredRole: ["property_manager", "maintenance_coordinator", "vendor", "system"],
    requiredApprovals: [],
    notifications: ["Assignment pending acceptance"],
    auditEvents: ["vendor.workflow.transitioned"],
    timelineUpdates: ["Vendor assigned"],
    assistantRecommendations: ["Track acceptance via vendor job link"],
    waitingOnMe: ["Follow up if no accept"],
    waitingOnOthers: ["Vendor acceptance"],
    dashboardUpdates: ["Assigned jobs"]
  }),
  work_in_progress: def("work_in_progress", "Work In Progress", {
    entryCriteria: ["Vendor accepted / started job"],
    exitCriteria: ["Invoice submitted or reassigned"],
    requiredRole: ["vendor", "property_manager", "technician"],
    requiredApprovals: [],
    notifications: ["Work in progress"],
    auditEvents: ["vendor.workflow.transitioned"],
    timelineUpdates: ["Vendor work in progress"],
    assistantRecommendations: ["Monitor field progress and photos"],
    waitingOnMe: [],
    waitingOnOthers: ["Vendor field completion"],
    dashboardUpdates: ["WIP vendor jobs"]
  }),
  invoice_submitted: def("invoice_submitted", "Invoice Submitted", {
    entryCriteria: ["Vendor invoice uploaded"],
    exitCriteria: ["Invoice approved into payment"],
    requiredRole: ["property_manager", "organization_admin"],
    requiredApprovals: ["vendor.invoice"],
    notifications: ["Invoice awaiting review"],
    auditEvents: ["vendor.workflow.transitioned"],
    timelineUpdates: ["Invoice submitted"],
    assistantRecommendations: ["Review invoice in Financial Operations"],
    waitingOnMe: ["Approve or reject invoice"],
    waitingOnOthers: [],
    dashboardUpdates: ["Invoices queue"]
  }),
  payment_pending: def("payment_pending", "Payment Pending", {
    entryCriteria: ["Invoice approved"],
    exitCriteria: ["Payment recorded"],
    requiredRole: ["property_manager", "organization_admin", "system"],
    requiredApprovals: [],
    notifications: ["Payment pending"],
    auditEvents: ["vendor.workflow.transitioned"],
    timelineUpdates: ["Payment pending"],
    assistantRecommendations: ["Schedule / mark payment"],
    waitingOnMe: ["Complete payment"],
    waitingOnOthers: [],
    dashboardUpdates: ["Payment pending"]
  }),
  paid: def("paid", "Paid", {
    entryCriteria: ["Payment recorded in Financial Operations"],
    exitCriteria: ["Performance review"],
    requiredRole: ["property_manager", "system"],
    requiredApprovals: [],
    notifications: ["Vendor paid"],
    auditEvents: ["vendor.workflow.transitioned", "vendor.paid"],
    timelineUpdates: ["Vendor paid"],
    assistantRecommendations: ["Capture performance feedback"],
    waitingOnMe: ["Start performance review"],
    waitingOnOthers: [],
    dashboardUpdates: ["Paid this period"]
  }),
  performance_review: def("performance_review", "Performance Review", {
    entryCriteria: ["Job paid / cycle complete"],
    exitCriteria: ["Return to available or preferred"],
    requiredRole: ["property_manager", "maintenance_coordinator"],
    requiredApprovals: [],
    notifications: ["Performance review due"],
    auditEvents: ["vendor.workflow.transitioned"],
    timelineUpdates: ["Performance review"],
    assistantRecommendations: ["Rate vendor and decide preferred status"],
    waitingOnMe: ["Complete review"],
    waitingOnOthers: [],
    dashboardUpdates: ["Performance reviews"]
  }),
  preferred_vendor: def("preferred_vendor", "Preferred Vendor", {
    entryCriteria: ["Marked preferred after strong performance"],
    exitCriteria: ["Assigned or returned to available"],
    requiredRole: ["property_manager"],
    requiredApprovals: [],
    notifications: ["Preferred vendor"],
    auditEvents: ["vendor.workflow.transitioned"],
    timelineUpdates: ["Preferred vendor"],
    assistantRecommendations: ["Prioritize for matching work"],
    waitingOnMe: ["Assign preferred work"],
    waitingOnOthers: [],
    dashboardUpdates: ["Preferred vendors"]
  }),
  suspended: def("suspended", "Suspended", {
    entryCriteria: ["Compliance failure, insurance lapse, or policy hold"],
    exitCriteria: ["Restored to available or inactivated"],
    requiredRole: ["property_manager", "organization_admin"],
    requiredApprovals: ["vendor.suspend"],
    notifications: ["Vendor suspended"],
    auditEvents: ["vendor.workflow.transitioned", "vendor.suspended"],
    timelineUpdates: ["Vendor suspended"],
    assistantRecommendations: ["Resolve hold reason before reactivating"],
    waitingOnMe: ["Resolve suspension"],
    waitingOnOthers: ["Vendor remediation"],
    dashboardUpdates: ["Suspended vendors"]
  }),
  inactive: def("inactive", "Inactive", {
    entryCriteria: ["No longer used for new work"],
    exitCriteria: ["Archive or reactivate to available"],
    requiredRole: ["property_manager", "organization_admin"],
    requiredApprovals: [],
    notifications: ["Vendor inactive"],
    auditEvents: ["vendor.workflow.transitioned"],
    timelineUpdates: ["Vendor inactive"],
    assistantRecommendations: ["Archive when retention complete"],
    waitingOnMe: ["Archive or reactivate"],
    waitingOnOthers: [],
    dashboardUpdates: ["Inactive vendors"]
  }),
  archived: def("archived", "Archived", {
    entryCriteria: ["Retention complete"],
    exitCriteria: ["Terminal"],
    requiredRole: ["organization_admin", "property_manager"],
    requiredApprovals: [],
    notifications: [],
    auditEvents: ["vendor.workflow.transitioned", "vendor.archived"],
    timelineUpdates: ["Vendor archived"],
    assistantRecommendations: [],
    waitingOnMe: [],
    waitingOnOthers: [],
    dashboardUpdates: ["Archived vendors"]
  })
};

export function isVendorWorkflowStage(value: unknown): value is VendorWorkflowStage {
  return typeof value === "string" && VENDOR_WORKFLOW_STAGES.includes(value as VendorWorkflowStage);
}

export function canTransitionVendorWorkflow(
  from: VendorWorkflowStage,
  to: VendorWorkflowStage
): boolean {
  return VENDOR_WORKFLOW_TRANSITIONS[from].includes(to);
}

export function toVendorWorkflowLabel(stage: VendorWorkflowStage): string {
  return VENDOR_WORKFLOW_DEFINITIONS[stage].label;
}

export function primaryNextVendorStage(stage: VendorWorkflowStage): VendorWorkflowStage | null {
  return VENDOR_WORKFLOW_TRANSITIONS[stage][0] ?? null;
}

export function isVendorAssignableStage(stage: VendorWorkflowStage): boolean {
  return VENDOR_ASSIGNABLE_STAGES.includes(stage);
}

/** Map canonical workflow → legacy CRM status. */
export function workflowStageToLegacyVendorStatus(
  stage: VendorWorkflowStage
): "active" | "inactive" | "archived" {
  if (stage === "archived") return "archived";
  if (stage === "inactive" || stage === "suspended") return "inactive";
  return "active";
}

export function legacyVendorStatusToWorkflowStage(
  status: string,
  preferredVendor?: boolean | null
): VendorWorkflowStage {
  switch (status) {
    case "archived":
      return "archived";
    case "inactive":
      return "inactive";
    case "active":
      return preferredVendor ? "preferred_vendor" : "available";
    default:
      return "prospective_vendor";
  }
}

export type VendorAdvanceGateContext = {
  hasBusinessName: boolean;
  hasContact: boolean;
  insuranceOnFile: boolean;
  insuranceCurrent: boolean;
  complianceComplete: boolean;
  hasOpenAssignment: boolean;
  invoiceSubmitted: boolean;
  invoiceApproved: boolean;
  paymentRecorded: boolean;
};

export function evaluateVendorAdvanceGates(
  to: VendorWorkflowStage,
  ctx: VendorAdvanceGateContext
): { ok: true } | { ok: false; message: string } {
  if ((to === "invited" || to === "application_submitted") && !ctx.hasBusinessName) {
    return { ok: false, message: "Business name is required before invitation/application." };
  }
  if (to === "compliance_review" && !ctx.hasContact) {
    return { ok: false, message: "Vendor contact (email or phone) is required before compliance." };
  }
  if (to === "insurance_verification" && !ctx.complianceComplete && !ctx.hasContact) {
    return { ok: false, message: "Complete compliance basics before insurance verification." };
  }
  if (to === "approved" && !ctx.insuranceOnFile && !ctx.insuranceCurrent) {
    return { ok: false, message: "Insurance verification is required before approval." };
  }
  if (to === "assigned" && !ctx.hasOpenAssignment) {
    return { ok: false, message: "Link a maintenance assignment before Assigned." };
  }
  if (to === "invoice_submitted" && !ctx.invoiceSubmitted && !ctx.hasOpenAssignment) {
    return { ok: false, message: "Submit a vendor invoice (or finish work) before Invoice Submitted." };
  }
  if (to === "payment_pending" && !ctx.invoiceApproved && !ctx.invoiceSubmitted) {
    return { ok: false, message: "Approve the invoice before Payment Pending." };
  }
  if (to === "paid" && !ctx.paymentRecorded && !ctx.invoiceApproved) {
    return { ok: false, message: "Record payment before Paid." };
  }
  return { ok: true };
}
