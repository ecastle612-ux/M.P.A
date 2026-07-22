/**
 * SaasBillingProvider abstraction (BILL-001).
 * Separate from PaymentProvider (API-005) and ConnectProvider (FIN-003).
 * Business modules must never import Stripe SDKs — only SubscriptionService.
 */

export type SaasPlanCode = "trial" | "founder" | "professional" | "business" | "enterprise";

export type SaasBillingInterval = "month" | "year";

export type SaasSubscriptionStatus =
  | "incomplete"
  | "incomplete_expired"
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "unpaid"
  | "paused";

export type EnsureSaasCustomerInput = {
  organizationId: string;
  email?: string | null;
  name?: string | null;
  metadata?: Record<string, unknown>;
};

export type SaasCustomerRef = {
  externalCustomerId: string;
};

export type CreateCheckoutSessionInput = {
  organizationId: string;
  externalCustomerId: string;
  priceId: string;
  planCode: SaasPlanCode;
  billingInterval: SaasBillingInterval;
  successUrl: string;
  cancelUrl: string;
  trialPeriodDays?: number | null;
  metadata?: Record<string, unknown>;
};

export type CheckoutSessionRef = {
  sessionId: string;
  url: string;
};

export type CreatePortalSessionInput = {
  externalCustomerId: string;
  returnUrl: string;
};

export type PortalSessionRef = {
  url: string;
};

export type NormalizedSubscription = {
  externalSubscriptionId: string;
  externalCustomerId: string;
  externalPriceId: string | null;
  status: SaasSubscriptionStatus;
  planCode: SaasPlanCode | null;
  billingInterval: SaasBillingInterval | null;
  trialEndsAt: string | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  canceledAt: string | null;
  endedAt: string | null;
};

export type NormalizedSaasInvoice = {
  externalInvoiceId: string;
  externalSubscriptionId: string | null;
  externalCustomerId: string | null;
  status: "draft" | "open" | "paid" | "void" | "uncollectible";
  currency: string;
  amountDueCents: number;
  amountPaidCents: number;
  hostedInvoiceUrl: string | null;
  invoicePdf: string | null;
  periodStart: string | null;
  periodEnd: string | null;
  paidAt: string | null;
};

export type NormalizedSaasEvent = {
  externalEventId: string;
  type:
    | "checkout_completed"
    | "subscription_upsert"
    | "subscription_deleted"
    | "invoice_upsert"
    | "invoice_payment_failed"
    | "ignored";
  organizationId?: string | null;
  externalCustomerId?: string | null;
  externalSubscriptionId?: string | null;
  subscription?: NormalizedSubscription | null;
  invoice?: NormalizedSaasInvoice | null;
  occurredAt: string;
  message?: string | null;
};

export type SaasBillingProvider = {
  readonly id: string;
  ensureCustomer(input: EnsureSaasCustomerInput): Promise<SaasCustomerRef>;
  createCheckoutSession(input: CreateCheckoutSessionInput): Promise<CheckoutSessionRef>;
  createPortalSession(input: CreatePortalSessionInput): Promise<PortalSessionRef>;
  getSubscription(externalSubscriptionId: string): Promise<NormalizedSubscription>;
  parseWebhook(payload: unknown, headers: Record<string, string>): Promise<NormalizedSaasEvent[]>;
};
