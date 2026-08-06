/**
 * FIN-OPS-001 notification type registration (`finance.*`).
 * S0 registers keys; delivery wiring for operational events starts later slices.
 */

export const FINANCE_NOTIFICATION_TYPES = [
  "finance.foundation.ready",
  "finance.charge.created",
  "finance.charge.due_soon",
  "finance.charge.past_due",
  "finance.payment.pending",
  "finance.payment.succeeded",
  "finance.payment.failed",
  "finance.late_fee.applied",
  "finance.vendor_invoice.submitted",
  "finance.vendor_invoice.approved",
  "finance.vendor_invoice.rejected",
  "finance.vendor_payment.paid",
  "finance.dispute.opened"
] as const;

export type FinanceNotificationType = (typeof FINANCE_NOTIFICATION_TYPES)[number];

export type FinanceNotificationDefinition = {
  key: FinanceNotificationType;
  label: string;
  defaultChannels: readonly ("in_app" | "email")[];
  audience: readonly ("staff" | "resident" | "vendor" | "owner" | "operator")[];
  slice: "S0" | "S1" | "S2" | "S3" | "S4" | "S5" | "S7";
};

export const FINANCE_NOTIFICATION_CATALOG: readonly FinanceNotificationDefinition[] = [
  {
    key: "finance.foundation.ready",
    label: "Financial Operations foundation ready",
    defaultChannels: ["in_app"],
    audience: ["staff", "operator"],
    slice: "S0"
  },
  {
    key: "finance.charge.created",
    label: "Charge created",
    defaultChannels: ["in_app", "email"],
    audience: ["resident", "staff"],
    slice: "S1"
  },
  {
    key: "finance.charge.due_soon",
    label: "Charge due soon",
    defaultChannels: ["in_app", "email"],
    audience: ["resident"],
    slice: "S7"
  },
  {
    key: "finance.charge.past_due",
    label: "Charge past due",
    defaultChannels: ["in_app", "email"],
    audience: ["resident", "staff"],
    slice: "S7"
  },
  {
    key: "finance.payment.pending",
    label: "Payment processing",
    defaultChannels: ["in_app"],
    audience: ["resident", "staff"],
    slice: "S2"
  },
  {
    key: "finance.payment.succeeded",
    label: "Payment succeeded",
    defaultChannels: ["in_app", "email"],
    audience: ["resident", "staff"],
    slice: "S2"
  },
  {
    key: "finance.payment.failed",
    label: "Payment failed",
    defaultChannels: ["in_app", "email"],
    audience: ["resident", "staff"],
    slice: "S2"
  },
  {
    key: "finance.late_fee.applied",
    label: "Late fee posted",
    defaultChannels: ["in_app", "email"],
    audience: ["resident"],
    slice: "S2"
  },
  {
    key: "finance.vendor_invoice.submitted",
    label: "Vendor invoice submitted",
    defaultChannels: ["in_app"],
    audience: ["staff"],
    slice: "S2"
  },
  {
    key: "finance.vendor_invoice.approved",
    label: "Vendor invoice approved",
    defaultChannels: ["in_app", "email"],
    audience: ["vendor", "staff"],
    slice: "S2"
  },
  {
    key: "finance.vendor_invoice.rejected",
    label: "Vendor invoice rejected",
    defaultChannels: ["in_app", "email"],
    audience: ["vendor", "staff"],
    slice: "S2"
  },
  {
    key: "finance.vendor_payment.paid",
    label: "Vendor payment recorded",
    defaultChannels: ["in_app", "email"],
    audience: ["vendor", "staff"],
    slice: "S2"
  },
  {
    key: "finance.dispute.opened",
    label: "Payment dispute opened",
    defaultChannels: ["in_app", "email"],
    audience: ["staff", "operator"],
    slice: "S7"
  }
];

export function isFinanceNotificationType(value: string): value is FinanceNotificationType {
  return (FINANCE_NOTIFICATION_TYPES as readonly string[]).includes(value);
}
