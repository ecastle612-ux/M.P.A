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
  "pm.finance:payment.refund": "Issue payment refunds (S2+)",
  "pm.finance:late_fee.manage": "Configure and post late fees (S3+)",
  "pm.finance:vendor_invoice.review": "Approve or reject vendor invoices (S4+)",
  "pm.finance:vendor_payment.release": "Release vendor payments (S5+)",
  "pm.finance:reports.read": "Read property and owner financial reports (S6+)",
  "pm.finance:settings.manage": "Manage FO settings and Connect readiness"
};

/** Default role grants for S0 foundation (read + settings for managers). */
export const FINANCE_ROLE_GRANTS: ReadonlyArray<{
  role: "property_manager" | "property_owner" | "tenant" | "vendor";
  capabilities: readonly FinanceCapability[];
}> = [
  {
    role: "property_manager",
    capabilities: [
      "pm.finance:read",
      "pm.finance:charge.write",
      "pm.finance:payment.refund",
      "pm.finance:late_fee.manage",
      "pm.finance:vendor_invoice.review",
      "pm.finance:vendor_payment.release",
      "pm.finance:reports.read",
      "pm.finance:settings.manage"
    ]
  },
  {
    role: "property_owner",
    capabilities: ["pm.finance:read", "pm.finance:reports.read"]
  },
  {
    role: "tenant",
    capabilities: ["pm.finance:read"]
  },
  {
    role: "vendor",
    capabilities: ["pm.finance:read"]
  }
];

export function hasFinanceCapability(
  grantedCapabilities: readonly string[],
  required: FinanceCapability
): boolean {
  return evaluateCapability(grantedCapabilities, required as PermissionCapability);
}

/** S0 surfaces require read; write capabilities reserved for later slices. */
export const FINANCE_S0_REQUIRED_CAPABILITY: FinanceCapability = "pm.finance:read";
