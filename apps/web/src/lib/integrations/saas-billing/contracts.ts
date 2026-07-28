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
  /** May be omitted for pre-organization (public self-serve) Checkout. */
  organizationId?: string | null;
  email?: string | null;
  name?: string | null;
  metadata?: Record<string, unknown>;
};

export type SaasCustomerRef = {
  externalCustomerId: string;
};

export type CreateCheckoutSessionInput = {
  /** Null/omitted for public ACQ Checkout before org exists. */
  organizationId?: string | null;
  /** When set, Checkout attaches this Stripe customer. */
  externalCustomerId?: string | null;
  /** Used when no externalCustomerId (new public buyer). */
  customerEmail?: string | null;
  priceId: string;
  planCode: SaasPlanCode;
  billingInterval: SaasBillingInterval;
  successUrl: string;
  cancelUrl: string;
  trialPeriodDays?: number | null;
  /** Flat string metadata merged onto session + subscription_data. */
  metadata?: Record<string, string>;
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

/** AUTH-001 / COM-001 — optional activation hints when checkout creates a new org. */
export type SaasActivationHints = {
  buyerCompanyName?: string | null;
  buyerContactEmail?: string | null;
  buyerLegalName?: string | null;
  planCode?: SaasPlanCode | null;
  organizationType?: string | null;
  /** COM-001 Slice A — link checkout to pipeline opportunity. */
  opportunityId?: string | null;
  salesOwnerId?: string | null;
  implementationPreference?: "professional" | "ai_guided" | null;
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
  /** Present on checkout_completed when metadata carries provision inputs. */
  activation?: SaasActivationHints | null;
  subscription?: NormalizedSubscription | null;
  invoice?: NormalizedSaasInvoice | null;
  occurredAt: string;
  message?: string | null;
};

export type CancelSubscriptionAtPeriodEndInput = {
  externalSubscriptionId: string;
};

export type SaasBillingProvider = {
  readonly id: string;
  ensureCustomer(input: EnsureSaasCustomerInput): Promise<SaasCustomerRef>;
  createCheckoutSession(input: CreateCheckoutSessionInput): Promise<CheckoutSessionRef>;
  createPortalSession(input: CreatePortalSessionInput): Promise<PortalSessionRef>;
  getSubscription(externalSubscriptionId: string): Promise<NormalizedSubscription>;
  /** COM-001 Slice D / BILL-001 — stop future charges at period end (no parallel money rail). */
  cancelSubscriptionAtPeriodEnd(
    input: CancelSubscriptionAtPeriodEndInput
  ): Promise<NormalizedSubscription>;
  parseWebhook(payload: unknown, headers: Record<string, string>): Promise<NormalizedSaasEvent[]>;
};
