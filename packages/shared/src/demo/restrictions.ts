/**
 * Demo boundary controls — anything that leaves the demo must be blocked.
 */

export const DEMO_RESTRICTIONS = {
  exportCustomerData: false,
  sendEmail: false,
  sendSms: false,
  processPayments: false,
  createRealOrganization: false,
  callProductionProvisioning: false,
  generateProductionNotifications: false,
  uploadFiles: false,
  liveStripeCharges: false,
  indexSearchEngines: false,
  mutateProductionDatabase: false
} as const;

export type DemoRestrictionKey = keyof typeof DEMO_RESTRICTIONS;

export type DemoBoundaryAction =
  | "export"
  | "email"
  | "sms"
  | "payment"
  | "provision"
  | "notify_production"
  | "upload"
  | "create_org";

const ACTION_TO_RESTRICTION: Record<DemoBoundaryAction, DemoRestrictionKey> = {
  export: "exportCustomerData",
  email: "sendEmail",
  sms: "sendSms",
  payment: "processPayments",
  provision: "callProductionProvisioning",
  notify_production: "generateProductionNotifications",
  upload: "uploadFiles",
  create_org: "createRealOrganization"
};

export function isDemoActionAllowed(action: DemoBoundaryAction): boolean {
  return DEMO_RESTRICTIONS[ACTION_TO_RESTRICTION[action]] === true;
}

export function assertDemoBoundary(action: DemoBoundaryAction): {
  allowed: boolean;
  reason: string;
} {
  if (isDemoActionAllowed(action)) {
    return { allowed: true, reason: "allowed" };
  }
  return {
    allowed: false,
    reason: `Blocked in Live Demo: ${action} cannot leave the demo boundary.`
  };
}

/** Isolation plane marker — demo never uses production DB connection names. */
export const DEMO_ISOLATION = {
  plane: "demo_overlay" as const,
  productionDbAccess: false,
  sharedSnapshotMutable: false,
  tenancyModel: "shared_snapshot_plus_session_overlay" as const
};
