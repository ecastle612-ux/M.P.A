/**
 * Billing domain contracts (API-005).
 * BillingService is the sole write path for online billing mutations.
 */

export const AUTOPAY_CONSENT_VERSION = "autopay-v1";

export const LEDGER_ENTRY_TYPES = [
  "charge",
  "payment",
  "payment_pending",
  "credit",
  "adjustment",
  "late_fee",
  "refund",
  "fee",
  "receipt",
  "waive"
] as const;

export const PAYMENT_ATTEMPT_STATUSES = [
  "requires_action",
  "processing",
  "succeeded",
  "failed",
  "canceled",
  "refunded",
  "partially_refunded",
  "awaiting_reconciliation"
] as const;

export const FRIENDLY_PAYMENT_ERRORS: Record<string, string> = {
  card_declined: "Your card was declined. Try another card or contact your bank.",
  insufficient_funds: "Insufficient funds. Try another method or pay a smaller amount.",
  expired_card: "This card has expired. Update your payment method and try again.",
  processing_error: "We couldn’t process this payment. Please try again in a moment.",
  authentication_required: "Additional verification is required to complete this payment.",
  generic_decline: "Payment didn’t go through. Please try another method.",
  NSF: "The bank account didn’t have enough funds. Update your method or try again later.",
  default: "Payment failed. Please try again or choose a different payment method."
};

export type LedgerEntryType = (typeof LEDGER_ENTRY_TYPES)[number];
export type PaymentAttemptStatus = (typeof PAYMENT_ATTEMPT_STATUSES)[number];
export type PaymentMethodType = "card" | "debit" | "ach" | "other";
export type AutopayStatus = "active" | "disabled" | "paused";
export type AdjustmentType = "credit" | "adjustment" | "waive";
export type InvoiceStatus = "draft" | "published" | "paid" | "partial" | "void" | "overdue";

export type BillingScheduleRecord = {
  id: string;
  organizationId: string;
  leaseId: string;
  tenantId: string;
  propertyId: string;
  unitId: string;
  amount: number;
  currency: string;
  dueDayOfMonth: number;
  graceDays: number;
  lateFeeAmount: number;
  lateFeeType: "flat" | "percent";
  lateFeePercent: number;
  active: boolean;
  nextPeriodStart: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type BillingInvoiceRecord = {
  id: string;
  organizationId: string;
  invoiceNumber: string;
  leaseId: string;
  tenantId: string;
  propertyId: string;
  unitId: string;
  status: InvoiceStatus;
  periodStart: string | null;
  periodEnd: string | null;
  dueDate: string;
  totalAmount: number;
  amountPaid: number;
  outstandingBalance: number;
  publishedAt: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type PaymentMethodRecord = {
  id: string;
  organizationId: string;
  tenantId: string;
  paymentCustomerId: string;
  provider: string;
  externalMethodId: string;
  methodType: PaymentMethodType;
  brand: string | null;
  last4: string | null;
  expMonth: number | null;
  expYear: number | null;
  bankName: string | null;
  isDefault: boolean;
  status: "active" | "detached" | "expired" | "failed";
  createdAt: string;
};

export type PaymentAttemptRecord = {
  id: string;
  organizationId: string;
  attemptNumber: string;
  tenantId: string;
  leaseId: string | null;
  paymentId: string | null;
  paymentMethodId: string | null;
  provider: string;
  externalAttemptId: string | null;
  amount: number;
  currency: string;
  status: PaymentAttemptStatus;
  source: "one_time" | "autopay" | "pm_recorded" | "retry";
  chargeIds: string[];
  failureCode: string | null;
  failureMessage: string | null;
  clientSecret: string | null;
  retryCount: number;
  reconciledAt: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type AutopayEnrollmentRecord = {
  id: string;
  organizationId: string;
  tenantId: string;
  leaseId: string;
  paymentMethodId: string;
  status: AutopayStatus;
  consentVersion: string;
  consentedAt: string;
  revokedAt: string | null;
  maxAmount: number | null;
  createdAt: string;
  updatedAt: string;
};

export type PaymentReceiptRecord = {
  id: string;
  organizationId: string;
  receiptNumber: string;
  paymentId: string | null;
  paymentAttemptId: string | null;
  tenantId: string;
  leaseId: string | null;
  amount: number;
  currency: string;
  methodSummary: string | null;
  contentHash: string;
  payload: Record<string, unknown>;
  issuedAt: string;
};

export type BillingLedgerEntryRecord = {
  id: string;
  organizationId: string;
  entryNumber: string;
  tenantId: string;
  leaseId: string | null;
  propertyId: string | null;
  entryType: LedgerEntryType;
  amount: number;
  balanceAfter: number | null;
  currency: string;
  relatedEntityType: string | null;
  relatedEntityId: string | null;
  summary: string;
  payload: Record<string, unknown>;
  createdAt: string;
};

export type BillingOpsSnapshot = {
  todaysPaymentsCount: number;
  todaysPaymentsAmount: number;
  failedPaymentsCount: number;
  outstandingBalance: number;
  upcomingLateFeesCount: number;
  collectionsQueueCount: number;
  autopayEnrollmentPercent: number;
  processingHealth: "healthy" | "degraded" | "critical";
  awaitingReconciliationCount: number;
  provider: string;
};

export type ResidentPaymentDashboard = {
  balanceDue: number;
  upcomingCharges: Array<{
    id: string;
    description: string;
    amount: number;
    outstandingBalance: number;
    dueDate: string;
    status: string;
    leaseId: string | null;
  }>;
  recentPayments: Array<{
    id: string;
    amount: number;
    status: string;
    paymentDate: string;
    paymentMethod: string;
  }>;
  receipts: PaymentReceiptRecord[];
  methods: PaymentMethodRecord[];
  autopay: AutopayEnrollmentRecord | null;
  alerts: string[];
};

export type CollectionsQueueItem = {
  tenantId: string;
  tenantName: string;
  leaseId: string | null;
  propertyId: string | null;
  outstandingBalance: number;
  overdueChargeCount: number;
  failedAttemptCount: number;
  status: "overdue" | "failed_autopay" | "in_collections";
};

export function friendlyPaymentError(code: string | null | undefined): string {
  const fallback = FRIENDLY_PAYMENT_ERRORS["default"] ?? "Payment failed. Please try again or choose a different payment method.";
  if (!code) return fallback;
  return FRIENDLY_PAYMENT_ERRORS[code] ?? fallback;
}

export function mapProviderFailureToCode(message: string | null | undefined): string {
  const lower = (message ?? "").toLowerCase();
  if (lower.includes("insufficient") || lower.includes("nsf")) return "insufficient_funds";
  if (lower.includes("expired")) return "expired_card";
  if (lower.includes("authenticat") || lower.includes("3ds")) return "authentication_required";
  if (lower.includes("declin")) return "card_declined";
  if (lower.includes("process")) return "processing_error";
  return "generic_decline";
}
