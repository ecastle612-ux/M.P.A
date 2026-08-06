/**
 * FIN-OPS-001 audit action registration.
 * S0 wires foundation audit actions; operational mutations audit in later slices.
 */

export const FINANCE_AUDIT_ACTIONS = [
  "finance.foundation.registered",
  "finance.connect.status_changed",
  "finance.settings.updated",
  "finance.charge.created",
  "finance.charge.voided",
  "finance.payment.succeeded",
  "finance.payment.failed",
  "finance.payment.refunded",
  "finance.late_fee.applied",
  "finance.vendor_invoice.submitted",
  "finance.vendor_invoice.approved",
  "finance.vendor_invoice.rejected",
  "finance.vendor_payment.paid",
  "finance.summary.generated",
  "finance.break_glass.viewed"
] as const;

export type FinanceAuditAction = (typeof FINANCE_AUDIT_ACTIONS)[number];

export type FinanceAuditDefinition = {
  action: FinanceAuditAction;
  entityType: string;
  description: string;
  slice: "S0" | "S1" | "S2" | "S3" | "S4" | "S5" | "S6" | "S7";
};

export const FINANCE_AUDIT_CATALOG: readonly FinanceAuditDefinition[] = [
  {
    action: "finance.foundation.registered",
    entityType: "financial_domain",
    description: "FO foundation registered / Command Center opened context",
    slice: "S0"
  },
  {
    action: "finance.connect.status_changed",
    entityType: "financial_connect_account",
    description: "Connect account linkage status updated",
    slice: "S0"
  },
  {
    action: "finance.settings.updated",
    entityType: "financial_module_settings",
    description: "FO module settings changed",
    slice: "S0"
  },
  {
    action: "finance.charge.created",
    entityType: "financial_charge",
    description: "Charge created",
    slice: "S1"
  },
  {
    action: "finance.charge.voided",
    entityType: "financial_charge",
    description: "Charge voided",
    slice: "S1"
  },
  {
    action: "finance.payment.succeeded",
    entityType: "financial_payment",
    description: "Payment succeeded",
    slice: "S2"
  },
  {
    action: "finance.payment.failed",
    entityType: "financial_payment",
    description: "Payment failed",
    slice: "S2"
  },
  {
    action: "finance.payment.refunded",
    entityType: "financial_payment",
    description: "Payment refunded",
    slice: "S2"
  },
  {
    action: "finance.late_fee.applied",
    entityType: "financial_charge",
    description: "Late fee applied",
    slice: "S3"
  },
  {
    action: "finance.vendor_invoice.submitted",
    entityType: "financial_vendor_invoice",
    description: "Vendor invoice submitted",
    slice: "S4"
  },
  {
    action: "finance.vendor_invoice.approved",
    entityType: "financial_vendor_invoice",
    description: "Vendor invoice approved",
    slice: "S4"
  },
  {
    action: "finance.vendor_invoice.rejected",
    entityType: "financial_vendor_invoice",
    description: "Vendor invoice rejected",
    slice: "S4"
  },
  {
    action: "finance.vendor_payment.paid",
    entityType: "financial_vendor_payment",
    description: "Vendor payment released",
    slice: "S5"
  },
  {
    action: "finance.summary.generated",
    entityType: "financial_summary",
    description: "Summary generated",
    slice: "S6"
  },
  {
    action: "finance.break_glass.viewed",
    entityType: "financial_domain",
    description: "Operator break-glass finance view",
    slice: "S7"
  }
];

export function isFinanceAuditAction(value: string): value is FinanceAuditAction {
  return (FINANCE_AUDIT_ACTIONS as readonly string[]).includes(value);
}
