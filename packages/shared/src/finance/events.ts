/**
 * FIN-OPS-001 financial domain event catalog.
 * S0 registers the model; emission begins with operational slices.
 */

export const FINANCE_EVENT_TYPES = [
  "finance.charge.created",
  "finance.charge.voided",
  "finance.payment.pending",
  "finance.payment.succeeded",
  "finance.payment.failed",
  "finance.late_fee.applied",
  "finance.vendor_invoice.submitted",
  "finance.vendor_invoice.approved",
  "finance.vendor_invoice.rejected",
  "finance.vendor_payment.paid",
  "finance.summary.generated",
  "finance.foundation.registered",
  "finance.connect.status_changed"
] as const;

export type FinanceEventType = (typeof FINANCE_EVENT_TYPES)[number];

export type FinanceEventDefinition = {
  type: FinanceEventType;
  aggregateType: string;
  description: string;
  /** Earliest slice that may emit this event. */
  slice: "S0" | "S1" | "S2" | "S3" | "S4" | "S5" | "S6";
  notificationKey?: string;
  auditAction?: string;
};

export const FINANCE_EVENT_CATALOG: readonly FinanceEventDefinition[] = [
  {
    type: "finance.foundation.registered",
    aggregateType: "financial_domain",
    description: "Financial Operations foundation registered for an organization context",
    slice: "S0",
    notificationKey: "finance.foundation.ready",
    auditAction: "finance.foundation.registered"
  },
  {
    type: "finance.connect.status_changed",
    aggregateType: "financial_connect_account",
    description: "Stripe Connect linkage status changed (no payment execution)",
    slice: "S0",
    auditAction: "finance.connect.status_changed"
  },
  {
    type: "finance.charge.created",
    aggregateType: "financial_charge",
    description: "Resident charge opened",
    slice: "S1",
    notificationKey: "finance.charge.created",
    auditAction: "finance.charge.created"
  },
  {
    type: "finance.charge.voided",
    aggregateType: "financial_charge",
    description: "Charge voided via reversing entry",
    slice: "S1",
    auditAction: "finance.charge.voided"
  },
  {
    type: "finance.payment.pending",
    aggregateType: "financial_payment",
    description: "Stripe checkout/payment started",
    slice: "S2",
    notificationKey: "finance.payment.pending"
  },
  {
    type: "finance.payment.succeeded",
    aggregateType: "financial_payment",
    description: "Webhook confirmed successful payment",
    slice: "S2",
    notificationKey: "finance.payment.succeeded",
    auditAction: "finance.payment.succeeded"
  },
  {
    type: "finance.payment.failed",
    aggregateType: "financial_payment",
    description: "Webhook confirmed failed payment",
    slice: "S2",
    notificationKey: "finance.payment.failed",
    auditAction: "finance.payment.failed"
  },
  {
    type: "finance.late_fee.applied",
    aggregateType: "financial_charge",
    description: "Late fee charge posted",
    slice: "S2",
    notificationKey: "finance.late_fee.applied",
    auditAction: "finance.late_fee.applied"
  },
  {
    type: "finance.vendor_invoice.submitted",
    aggregateType: "financial_vendor_invoice",
    description: "Vendor invoice submitted",
    slice: "S2",
    notificationKey: "finance.vendor_invoice.submitted",
    auditAction: "finance.vendor_invoice.submitted"
  },
  {
    type: "finance.vendor_invoice.approved",
    aggregateType: "financial_vendor_invoice",
    description: "Vendor invoice approved",
    slice: "S2",
    notificationKey: "finance.vendor_invoice.approved",
    auditAction: "finance.vendor_invoice.approved"
  },
  {
    type: "finance.vendor_invoice.rejected",
    aggregateType: "financial_vendor_invoice",
    description: "Vendor invoice rejected",
    slice: "S2",
    notificationKey: "finance.vendor_invoice.rejected",
    auditAction: "finance.vendor_invoice.rejected"
  },
  {
    type: "finance.vendor_payment.paid",
    aggregateType: "financial_vendor_payment",
    description: "Vendor payment marked paid",
    slice: "S2",
    notificationKey: "finance.vendor_payment.paid",
    auditAction: "finance.vendor_payment.paid"
  },
  {
    type: "finance.summary.generated",
    aggregateType: "financial_summary",
    description: "Property or owner summary generated",
    slice: "S6",
    auditAction: "finance.summary.generated"
  }
] as const;

export function isFinanceEventType(value: string): value is FinanceEventType {
  return (FINANCE_EVENT_TYPES as readonly string[]).includes(value);
}

export function financeEventsForSlice(slice: FinanceEventDefinition["slice"]): FinanceEventDefinition[] {
  return FINANCE_EVENT_CATALOG.filter((event) => event.slice === slice);
}
