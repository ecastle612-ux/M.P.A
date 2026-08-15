import { evaluateCapability, type PermissionCapability } from "../auth/permissions";

/**
 * FIN-OPS-001 permission model (`pm.finance:*`).
 * Entitlement `pm.financial_operations` gates product access; these capabilities
 * gate actions within the module.
 */
export const FINANCE_CAPABILITIES = [
  "pm.finance:read",
  "pm.finance:charge.write",
  "pm.finance:payment.refund",
  "pm.finance:late_fee.manage",
  "pm.finance:vendor_invoice.review",
  "pm.finance:vendor_payment.release",
  "pm.finance:reports.read",
  "pm.finance:settings.manage"
] as const;

export type FinanceCapability = (typeof FINANCE_CAPABILITIES)[number];

export const FINANCE_CAPABILITY_DESCRIPTIONS: Record<FinanceCapability, string> = {
  "pm.finance:read": "Read Financial Operations surfaces, queues, and summaries",
  "pm.finance:charge.write": "Create and void resident charges (S1+)",
  "pm.finance:payment.refund": "Issue payment refunds (post-S2; not in S2 scope)",
  "pm.finance:late_fee.manage": "Configure and post late fees (S2)",
  "pm.finance:vendor_invoice.review": "Approve or reject vendor invoices (S2)",
  "pm.finance:vendor_payment.release": "Schedule and mark vendor payments paid (S2)",
  "pm.finance:reports.read": "Read property and owner financial summaries (S3)",
  "pm.finance:settings.manage": "Manage FO settings and Connect readiness"
};

const ALL_FINANCE_CAPABILITIES: readonly FinanceCapability[] = FINANCE_CAPABILITIES;

/** PLAT-006 approved role grants. Tenant/vendor are intentionally empty. */
export const FINANCE_ROLE_GRANTS: ReadonlyArray<{
  role:
    | "organization_admin"
    | "property_manager"
    | "leasing_agent"
    | "property_owner"
    | "maintenance_technician"
    | "tenant"
    | "vendor";
  capabilities: readonly FinanceCapability[];
}> = [
  { role: "organization_admin", capabilities: ALL_FINANCE_CAPABILITIES },
  { role: "property_manager", capabilities: ALL_FINANCE_CAPABILITIES },
  { role: "leasing_agent", capabilities: ["pm.finance:read"] },
  { role: "property_owner", capabilities: ["pm.finance:read", "pm.finance:reports.read"] },
  { role: "maintenance_technician", capabilities: [] },
  { role: "tenant", capabilities: [] },
  { role: "vendor", capabilities: [] }
];

export function hasFinanceCapability(
  grantedCapabilities: readonly string[],
  required: FinanceCapability
): boolean {
  return evaluateCapability(grantedCapabilities, required as PermissionCapability);
}

/** S0 surfaces require read; write capabilities reserved for later slices. */
export const FINANCE_S0_REQUIRED_CAPABILITY: FinanceCapability = "pm.finance:read";
