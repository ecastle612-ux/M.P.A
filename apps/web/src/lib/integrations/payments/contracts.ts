/**
 * PaymentProvider abstraction (API-005).
 * Business modules must never import Stripe / Plaid / Finix SDKs — only BillingService.
 */

export type CreateCustomerInput = {
  organizationId: string;
  tenantId: string;
  email?: string | null;
  name?: string | null;
  metadata?: Record<string, unknown>;
};

export type CustomerRef = {
  externalCustomerId: string;
};

export type AttachMethodInput = {
  externalCustomerId: string;
  /** Provider payment method token from hosted fields / SetupIntent */
  externalPaymentMethodId: string;
  setDefault?: boolean;
  metadata?: Record<string, unknown>;
};

export type PaymentMethodRef = {
  externalMethodId: string;
  methodType: "card" | "debit" | "ach" | "other";
  brand?: string | null;
  last4?: string | null;
  expMonth?: number | null;
  expYear?: number | null;
  bankName?: string | null;
};

export type CreatePaymentAttemptInput = {
  organizationId: string;
  attemptId: string;
  attemptNumber: string;
  externalCustomerId: string;
  externalPaymentMethodId?: string | null;
  amountCents: number;
  currency: string;
  description?: string;
  metadata?: Record<string, unknown>;
  confirm?: boolean;
  returnUrl?: string;
};

export type PaymentAttemptRef = {
  externalAttemptId: string;
  status: "requires_action" | "processing" | "succeeded" | "failed" | "canceled";
  clientSecret?: string | null;
  failureCode?: string | null;
  failureMessage?: string | null;
};

export type PaymentAttemptStatus = {
  externalAttemptId: string;
  status: "requires_action" | "processing" | "succeeded" | "failed" | "canceled" | "refunded";
  amountCents?: number;
  failureCode?: string | null;
  failureMessage?: string | null;
};

export type RefundInput = {
  externalAttemptId: string;
  amountCents?: number;
  reason?: string;
  metadata?: Record<string, unknown>;
};

export type RefundRef = {
  externalRefundId: string;
  status: "pending" | "succeeded" | "failed";
  amountCents: number;
};

export type NormalizedPaymentEvent = {
  externalEventId: string;
  externalPaymentId: string | null;
  type:
    | "processing"
    | "succeeded"
    | "failed"
    | "requires_action"
    | "refunded"
    | "partially_refunded"
    | "canceled"
    | "dispute"
    | "ignored";
  amountCents?: number | null;
  currency?: string | null;
  occurredAt: string;
  failureCode?: string | null;
  message?: string | null;
  payloadDigest?: string | null;
  ignored?: boolean;
};

export type PaymentProvider = {
  readonly id: string;
  createCustomer(input: CreateCustomerInput): Promise<CustomerRef>;
  attachPaymentMethod(input: AttachMethodInput): Promise<PaymentMethodRef>;
  detachPaymentMethod(ref: PaymentMethodRef): Promise<void>;
  createPaymentAttempt(input: CreatePaymentAttemptInput): Promise<PaymentAttemptRef>;
  getPaymentAttempt(ref: PaymentAttemptRef): Promise<PaymentAttemptStatus>;
  cancelPaymentAttempt(ref: PaymentAttemptRef): Promise<void>;
  refund(input: RefundInput): Promise<RefundRef>;
  parseWebhook(payload: unknown, headers: Record<string, string>): Promise<NormalizedPaymentEvent[]>;
};
