import type {
  CheckoutSessionRef,
  CreateCheckoutSessionInput,
  CreatePortalSessionInput,
  EnsureSaasCustomerInput,
  NormalizedSaasEvent,
  NormalizedSubscription,
  PortalSessionRef,
  SaasBillingProvider,
  SaasCustomerRef
} from "./contracts";

/**
 * Local/CI SaaS billing provider — no external network.
 */
export const noopSaasBillingProvider: SaasBillingProvider = {
  id: "noop",

  async ensureCustomer(input: EnsureSaasCustomerInput): Promise<SaasCustomerRef> {
    return { externalCustomerId: `noop_cus_saas_${input.organizationId.slice(0, 8)}` };
  },

  async createCheckoutSession(input: CreateCheckoutSessionInput): Promise<CheckoutSessionRef> {
    const sessionId = `noop_cs_${Date.now()}`;
    const url = `${input.successUrl}${input.successUrl.includes("?") ? "&" : "?"}session_id=${sessionId}&plan=${input.planCode}`;
    return { sessionId, url };
  },

  async createPortalSession(input: CreatePortalSessionInput): Promise<PortalSessionRef> {
    return { url: `${input.returnUrl}${input.returnUrl.includes("?") ? "&" : "?"}portal=noop` };
  },

  async getSubscription(externalSubscriptionId: string): Promise<NormalizedSubscription> {
    const now = new Date();
    const end = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    return {
      externalSubscriptionId,
      externalCustomerId: "noop_cus_saas",
      externalPriceId: "noop_price_professional_month",
      status: "active",
      planCode: "professional",
      billingInterval: "month",
      trialEndsAt: null,
      currentPeriodStart: now.toISOString(),
      currentPeriodEnd: end.toISOString(),
      cancelAtPeriodEnd: false,
      canceledAt: null,
      endedAt: null
    };
  },

  async parseWebhook(payload: unknown): Promise<NormalizedSaasEvent[]> {
    const body = (payload ?? {}) as Record<string, unknown>;
    const typeRaw = String(body["type"] ?? "subscription_upsert");
    const externalEventId =
      typeof body["id"] === "string" ? body["id"] : `noop_evt_${Date.now()}`;
    const externalSubscriptionId =
      typeof body["externalSubscriptionId"] === "string"
        ? body["externalSubscriptionId"]
        : typeof body["subscriptionId"] === "string"
          ? body["subscriptionId"]
          : `noop_sub_${Date.now()}`;
    const externalCustomerId =
      typeof body["externalCustomerId"] === "string"
        ? body["externalCustomerId"]
        : "noop_cus_saas";
    const organizationId =
      typeof body["organizationId"] === "string" ? body["organizationId"] : null;
    const now = new Date().toISOString();

    if (typeRaw === "invoice_payment_failed" || typeRaw.includes("invoice.payment_failed")) {
      return [
        {
          externalEventId,
          type: "invoice_payment_failed",
          organizationId,
          externalCustomerId,
          externalSubscriptionId,
          invoice: {
            externalInvoiceId:
              typeof body["externalInvoiceId"] === "string"
                ? body["externalInvoiceId"]
                : `noop_in_${Date.now()}`,
            externalSubscriptionId,
            externalCustomerId,
            status: "open",
            currency: "usd",
            amountDueCents: typeof body["amountDueCents"] === "number" ? body["amountDueCents"] : 9900,
            amountPaidCents: 0,
            hostedInvoiceUrl: null,
            invoicePdf: null,
            periodStart: null,
            periodEnd: null,
            paidAt: null
          },
          occurredAt: now
        }
      ];
    }

    if (typeRaw === "subscription_deleted" || typeRaw.includes("subscription.deleted")) {
      return [
        {
          externalEventId,
          type: "subscription_deleted",
          organizationId,
          externalCustomerId,
          externalSubscriptionId,
          subscription: {
            externalSubscriptionId,
            externalCustomerId,
            externalPriceId: null,
            status: "canceled",
            planCode: "professional",
            billingInterval: "month",
            trialEndsAt: null,
            currentPeriodStart: null,
            currentPeriodEnd: null,
            cancelAtPeriodEnd: false,
            canceledAt: now,
            endedAt: now
          },
          occurredAt: now
        }
      ];
    }

    const status =
      typeRaw === "trialing" || body["status"] === "trialing" ? "trialing" : "active";
    const planCode =
      typeof body["planCode"] === "string" &&
      ["trial", "founder", "professional", "business", "enterprise"].includes(body["planCode"])
        ? (body["planCode"] as NormalizedSubscription["planCode"])
        : "professional";

    return [
      {
        externalEventId,
        type: "subscription_upsert",
        organizationId,
        externalCustomerId,
        externalSubscriptionId,
        subscription: {
          externalSubscriptionId,
          externalCustomerId,
          externalPriceId:
            typeof body["externalPriceId"] === "string"
              ? body["externalPriceId"]
              : "noop_price_professional_month",
          status,
          planCode,
          billingInterval: "month",
          trialEndsAt: status === "trialing" ? new Date(Date.now() + 14 * 86400000).toISOString() : null,
          currentPeriodStart: now,
          currentPeriodEnd: new Date(Date.now() + 30 * 86400000).toISOString(),
          cancelAtPeriodEnd: false,
          canceledAt: null,
          endedAt: null
        },
        occurredAt: now
      }
    ];
  }
};
