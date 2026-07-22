import { createHmac, timingSafeEqual } from "node:crypto";
import type {
  CheckoutSessionRef,
  CreateCheckoutSessionInput,
  CreatePortalSessionInput,
  EnsureSaasCustomerInput,
  NormalizedSaasEvent,
  NormalizedSaasInvoice,
  NormalizedSubscription,
  PortalSessionRef,
  SaasBillingInterval,
  SaasBillingProvider,
  SaasCustomerRef,
  SaasPlanCode,
  SaasSubscriptionStatus
} from "./contracts";
import { resolvePlanFromPriceId } from "./plan-catalog";

/**
 * Stripe Billing adapter (BILL-001).
 * REST only — no Stripe SDK. Uses STRIPE_SAAS_WEBHOOK_SECRET (not payments secret).
 * Never touches PaymentIntents / Connect account APIs.
 */

function env(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

function isSandboxMode(): boolean {
  if (env("STRIPE_MODE") === "sandbox" || env("STRIPE_MODE") === "test") return true;
  const key = env("STRIPE_SECRET_KEY");
  // sk_test_… or restricted claimable-sandbox keys (rkcs_test_…)
  return !key || key.startsWith("sk_test_") || key.startsWith("rkcs_test_") || key.startsWith("rk_test_");
}

function secretKey(): string | undefined {
  return env("STRIPE_SECRET_KEY");
}

function baseUrl(): string {
  return env("STRIPE_API_BASE_URL") ?? "https://api.stripe.com/v1";
}

async function stripeFetch(path: string, init?: RequestInit): Promise<Response> {
  const key = secretKey();
  if (!key) throw new Error("STRIPE_SECRET_KEY is not configured");
  return fetch(`${baseUrl()}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/x-www-form-urlencoded",
      ...(init?.headers ?? {})
    }
  });
}

function formBody(params: Record<string, string | undefined | null>): string {
  const body = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value != null && value !== "") body.set(key, value);
  }
  return body.toString();
}

function verifySaasStripeSignature(headers: Record<string, string>, rawBody: string): boolean {
  const secret = env("STRIPE_SAAS_WEBHOOK_SECRET") ?? env("STRIPE_WEBHOOK_SECRET");
  if (!secret) {
    return isSandboxMode() || headers["x-mpa-simulate"] === "1";
  }
  const header = headers["stripe-signature"] ?? headers["Stripe-Signature"] ?? "";
  if (!header) return false;

  const parts = Object.fromEntries(
    header.split(",").map((part) => {
      const [k, v] = part.split("=");
      return [k?.trim() ?? "", v?.trim() ?? ""];
    })
  );
  const timestamp = parts["t"];
  const signature = parts["v1"];
  if (!timestamp || !signature) return false;

  const skewMs = Math.abs(Date.now() - Number(timestamp) * 1000);
  if (Number.isFinite(skewMs) && skewMs > 5 * 60 * 1000) return false;

  const signed = `${timestamp}.${rawBody}`;
  const digest = createHmac("sha256", secret).update(signed).digest("hex");
  try {
    return timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
  } catch {
    return false;
  }
}

function mapStatus(status: string | undefined): SaasSubscriptionStatus {
  switch (status) {
    case "incomplete":
    case "incomplete_expired":
    case "trialing":
    case "active":
    case "past_due":
    case "canceled":
    case "unpaid":
    case "paused":
      return status;
    default:
      return "incomplete";
  }
}

function unixToIso(value: unknown): string | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return new Date(value * 1000).toISOString();
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function firstPriceId(subscription: Record<string, unknown>): string | null {
  const items = asRecord(subscription["items"]);
  const data = Array.isArray(items["data"]) ? items["data"] : [];
  const first = asRecord(data[0]);
  const price = asRecord(first["price"]);
  return typeof price["id"] === "string" ? price["id"] : null;
}

function planFromMetaOrPrice(
  subscription: Record<string, unknown>,
  priceId: string | null
): { planCode: SaasPlanCode | null; billingInterval: SaasBillingInterval | null } {
  const meta = asRecord(subscription["metadata"]);
  const metaPlan = typeof meta["plan_code"] === "string" ? meta["plan_code"] : null;
  const resolved = resolvePlanFromPriceId(priceId);
  const planCode =
    metaPlan && ["trial", "founder", "professional", "business", "enterprise"].includes(metaPlan)
      ? (metaPlan as SaasPlanCode)
      : resolved?.planCode ?? null;
  const interval =
    typeof meta["billing_interval"] === "string" &&
    (meta["billing_interval"] === "month" || meta["billing_interval"] === "year")
      ? (meta["billing_interval"] as SaasBillingInterval)
      : resolved?.billingInterval ?? null;
  return { planCode, billingInterval: interval };
}

function firstItemPeriod(subscription: Record<string, unknown>): {
  start: unknown;
  end: unknown;
} {
  const items = asRecord(subscription["items"]);
  const data = Array.isArray(items["data"]) ? items["data"] : [];
  const first = asRecord(data[0]);
  return {
    start: first["current_period_start"] ?? subscription["current_period_start"],
    end: first["current_period_end"] ?? subscription["current_period_end"]
  };
}

function normalizeSubscription(raw: Record<string, unknown>): NormalizedSubscription {
  const priceId = firstPriceId(raw);
  const { planCode, billingInterval } = planFromMetaOrPrice(raw, priceId);
  const customer = raw["customer"];
  const period = firstItemPeriod(raw);
  return {
    externalSubscriptionId: String(raw["id"] ?? ""),
    externalCustomerId: typeof customer === "string" ? customer : String(asRecord(customer)["id"] ?? ""),
    externalPriceId: priceId,
    status: mapStatus(typeof raw["status"] === "string" ? raw["status"] : undefined),
    planCode,
    billingInterval,
    trialEndsAt: unixToIso(raw["trial_end"]),
    currentPeriodStart: unixToIso(period.start),
    currentPeriodEnd: unixToIso(period.end),
    cancelAtPeriodEnd: Boolean(raw["cancel_at_period_end"]),
    canceledAt: unixToIso(raw["canceled_at"]),
    endedAt: unixToIso(raw["ended_at"])
  };
}

function invoiceSubscriptionId(raw: Record<string, unknown>): string | null {
  const legacy = raw["subscription"];
  if (typeof legacy === "string" && legacy) return legacy;
  const legacyId = asRecord(legacy)["id"];
  if (typeof legacyId === "string" && legacyId) return legacyId;

  // Stripe Billing API 2025+: subscription lives under parent.subscription_details
  const parent = asRecord(raw["parent"]);
  const details = asRecord(parent["subscription_details"]);
  if (typeof details["subscription"] === "string" && details["subscription"]) {
    return details["subscription"];
  }

  const lines = asRecord(raw["lines"]);
  const data = Array.isArray(lines["data"]) ? lines["data"] : [];
  const first = asRecord(data[0]);
  const lineParent = asRecord(first["parent"]);
  const itemDetails = asRecord(lineParent["subscription_item_details"]);
  if (typeof itemDetails["subscription"] === "string" && itemDetails["subscription"]) {
    return itemDetails["subscription"];
  }
  return null;
}

function invoiceOrganizationId(raw: Record<string, unknown>): string | null {
  const meta = asRecord(raw["metadata"]);
  if (typeof meta["organization_id"] === "string") return meta["organization_id"];

  const parent = asRecord(raw["parent"]);
  const details = asRecord(parent["subscription_details"]);
  const parentMeta = asRecord(details["metadata"]);
  if (typeof parentMeta["organization_id"] === "string") return parentMeta["organization_id"];

  const lines = asRecord(raw["lines"]);
  const data = Array.isArray(lines["data"]) ? lines["data"] : [];
  const lineMeta = asRecord(asRecord(data[0])["metadata"]);
  if (typeof lineMeta["organization_id"] === "string") return lineMeta["organization_id"];
  return null;
}

function normalizeInvoice(raw: Record<string, unknown>): NormalizedSaasInvoice {
  const customer = raw["customer"];
  return {
    externalInvoiceId: String(raw["id"] ?? ""),
    externalSubscriptionId: invoiceSubscriptionId(raw),
    externalCustomerId:
      typeof customer === "string" ? customer : String(asRecord(customer)["id"] ?? "") || null,
    status: (["draft", "open", "paid", "void", "uncollectible"].includes(String(raw["status"]))
      ? String(raw["status"])
      : "open") as NormalizedSaasInvoice["status"],
    currency: typeof raw["currency"] === "string" ? raw["currency"] : "usd",
    amountDueCents: typeof raw["amount_due"] === "number" ? raw["amount_due"] : 0,
    amountPaidCents: typeof raw["amount_paid"] === "number" ? raw["amount_paid"] : 0,
    hostedInvoiceUrl: typeof raw["hosted_invoice_url"] === "string" ? raw["hosted_invoice_url"] : null,
    invoicePdf: typeof raw["invoice_pdf"] === "string" ? raw["invoice_pdf"] : null,
    periodStart: unixToIso(raw["period_start"]),
    periodEnd: unixToIso(raw["period_end"]),
    paidAt: unixToIso(raw["status_transitions"] ? asRecord(raw["status_transitions"])["paid_at"] : null)
  };
}

export const stripeSaasBillingProvider: SaasBillingProvider = {
  id: "stripe",

  async ensureCustomer(input: EnsureSaasCustomerInput): Promise<SaasCustomerRef> {
    if (isSandboxMode() && !secretKey()) {
      return { externalCustomerId: `cus_saas_sandbox_${input.organizationId.slice(0, 8)}` };
    }
    const res = await stripeFetch("/customers", {
      method: "POST",
      body: formBody({
        email: input.email ?? undefined,
        name: input.name ?? undefined,
        "metadata[organization_id]": input.organizationId,
        "metadata[mpa_rail]": "saas"
      })
    });
    if (!res.ok) throw new Error(`Stripe SaaS createCustomer failed: ${await res.text()}`);
    const json = (await res.json()) as { id: string };
    return { externalCustomerId: json.id };
  },

  async createCheckoutSession(input: CreateCheckoutSessionInput): Promise<CheckoutSessionRef> {
    if (isSandboxMode() && !secretKey()) {
      const sessionId = `cs_saas_sandbox_${Date.now()}`;
      return {
        sessionId,
        url: `${input.successUrl}${input.successUrl.includes("?") ? "&" : "?"}session_id=${sessionId}`
      };
    }

    const params: Record<string, string | undefined | null> = {
      mode: "subscription",
      customer: input.externalCustomerId,
      success_url: input.successUrl,
      cancel_url: input.cancelUrl,
      "line_items[0][price]": input.priceId,
      "line_items[0][quantity]": "1",
      "metadata[organization_id]": input.organizationId,
      "metadata[plan_code]": input.planCode,
      "metadata[billing_interval]": input.billingInterval,
      "metadata[mpa_rail]": "saas",
      "subscription_data[metadata][organization_id]": input.organizationId,
      "subscription_data[metadata][plan_code]": input.planCode,
      "subscription_data[metadata][billing_interval]": input.billingInterval,
      "subscription_data[metadata][mpa_rail]": "saas"
    };
    if (input.trialPeriodDays != null && input.trialPeriodDays > 0) {
      params["subscription_data[trial_period_days]"] = String(input.trialPeriodDays);
    }

    const res = await stripeFetch("/checkout/sessions", {
      method: "POST",
      body: formBody(params)
    });
    if (!res.ok) throw new Error(`Stripe Checkout Session failed: ${await res.text()}`);
    const json = (await res.json()) as { id: string; url?: string };
    if (!json.url) throw new Error("Stripe Checkout Session missing url");
    return { sessionId: json.id, url: json.url };
  },

  async createPortalSession(input: CreatePortalSessionInput): Promise<PortalSessionRef> {
    if (isSandboxMode() && !secretKey()) {
      return { url: `${input.returnUrl}${input.returnUrl.includes("?") ? "&" : "?"}portal=sandbox` };
    }
    const res = await stripeFetch("/billing_portal/sessions", {
      method: "POST",
      body: formBody({
        customer: input.externalCustomerId,
        return_url: input.returnUrl
      })
    });
    if (!res.ok) throw new Error(`Stripe Portal Session failed: ${await res.text()}`);
    const json = (await res.json()) as { url?: string };
    if (!json.url) throw new Error("Stripe Portal Session missing url");
    return { url: json.url };
  },

  async getSubscription(externalSubscriptionId: string): Promise<NormalizedSubscription> {
    if (isSandboxMode() && !secretKey()) {
      const now = new Date();
      return {
        externalSubscriptionId,
        externalCustomerId: "cus_saas_sandbox",
        externalPriceId: "price_saas_sandbox",
        status: "active",
        planCode: "professional",
        billingInterval: "month",
        trialEndsAt: null,
        currentPeriodStart: now.toISOString(),
        currentPeriodEnd: new Date(now.getTime() + 30 * 86400000).toISOString(),
        cancelAtPeriodEnd: false,
        canceledAt: null,
        endedAt: null
      };
    }
    const res = await stripeFetch(`/subscriptions/${externalSubscriptionId}`);
    if (!res.ok) throw new Error(`Stripe getSubscription failed: ${await res.text()}`);
    return normalizeSubscription((await res.json()) as Record<string, unknown>);
  },

  async parseWebhook(payload: unknown, headers: Record<string, string>): Promise<NormalizedSaasEvent[]> {
    const rawBody = headers["x-mpa-raw-body"] ?? JSON.stringify(payload ?? {});
    if (!verifySaasStripeSignature(headers, rawBody)) {
      throw new Error("Invalid Stripe SaaS webhook signature");
    }

    const body = asRecord(payload);
    const eventType = typeof body["type"] === "string" ? body["type"] : "";
    const externalEventId = typeof body["id"] === "string" ? body["id"] : `saas_${Date.now()}`;
    const dataObject = asRecord(asRecord(body["data"])["object"]);
    const occurredAt = unixToIso(body["created"]) ?? new Date().toISOString();
    const meta = asRecord(dataObject["metadata"]);
    let organizationId =
      typeof meta["organization_id"] === "string" ? meta["organization_id"] : null;
    if (!organizationId && eventType.startsWith("invoice.")) {
      organizationId = invoiceOrganizationId(dataObject);
    }

    if (eventType === "checkout.session.completed") {
      const mode = dataObject["mode"];
      if (mode !== "subscription") {
        return [{ externalEventId, type: "ignored", occurredAt, message: "non-subscription checkout" }];
      }
      const subId =
        typeof dataObject["subscription"] === "string"
          ? dataObject["subscription"]
          : String(asRecord(dataObject["subscription"])["id"] ?? "");
      const customerId =
        typeof dataObject["customer"] === "string"
          ? dataObject["customer"]
          : String(asRecord(dataObject["customer"])["id"] ?? "");
      return [
        {
          externalEventId,
          type: "checkout_completed",
          organizationId,
          externalCustomerId: customerId || null,
          externalSubscriptionId: subId || null,
          occurredAt
        }
      ];
    }

    if (
      eventType === "customer.subscription.created" ||
      eventType === "customer.subscription.updated"
    ) {
      const subscription = normalizeSubscription(dataObject);
      return [
        {
          externalEventId,
          type: "subscription_upsert",
          organizationId,
          externalCustomerId: subscription.externalCustomerId,
          externalSubscriptionId: subscription.externalSubscriptionId,
          subscription,
          occurredAt
        }
      ];
    }

    if (eventType === "customer.subscription.deleted") {
      const subscription = normalizeSubscription({ ...dataObject, status: "canceled" });
      return [
        {
          externalEventId,
          type: "subscription_deleted",
          organizationId,
          externalCustomerId: subscription.externalCustomerId,
          externalSubscriptionId: subscription.externalSubscriptionId,
          subscription,
          occurredAt
        }
      ];
    }

    if (
      eventType === "invoice.paid" ||
      eventType === "invoice.finalized" ||
      eventType === "invoice.updated"
    ) {
      const invoice = normalizeInvoice(dataObject);
      return [
        {
          externalEventId,
          type: "invoice_upsert",
          organizationId,
          externalCustomerId: invoice.externalCustomerId,
          externalSubscriptionId: invoice.externalSubscriptionId,
          invoice,
          occurredAt
        }
      ];
    }

    if (eventType === "invoice.payment_failed") {
      const invoice = normalizeInvoice(dataObject);
      return [
        {
          externalEventId,
          type: "invoice_payment_failed",
          organizationId,
          externalCustomerId: invoice.externalCustomerId,
          externalSubscriptionId: invoice.externalSubscriptionId,
          invoice,
          occurredAt,
          message: "invoice.payment_failed"
        }
      ];
    }

    return [{ externalEventId, type: "ignored", occurredAt, message: eventType || "unknown" }];
  }
};
