import { createHmac, timingSafeEqual } from "node:crypto";
import type {
  AttachMethodInput,
  CreateCustomerInput,
  CreatePaymentAttemptInput,
  CustomerRef,
  NormalizedPaymentEvent,
  PaymentAttemptRef,
  PaymentAttemptStatus,
  PaymentMethodRef,
  PaymentProvider,
  RefundInput,
  RefundRef
} from "./contracts";

/**
 * Stripe adapter (API-005 Phase 1 primary).
 * Uses Stripe REST only — Stripe SDK is not imported so business modules stay clean
 * and CI works without the package. Secret keys never leave this module.
 */

function env(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

function isSandboxMode(): boolean {
  if (env("STRIPE_MODE") === "sandbox" || env("STRIPE_MODE") === "test") return true;
  const key = env("STRIPE_SECRET_KEY");
  return !key || key.startsWith("sk_test_");
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

function verifyStripeSignature(headers: Record<string, string>, rawBody: string): boolean {
  const secret = env("STRIPE_WEBHOOK_SECRET");
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

function mapIntentStatus(status: string): PaymentAttemptRef["status"] {
  switch (status) {
    case "succeeded":
      return "succeeded";
    case "requires_action":
    case "requires_confirmation":
    case "requires_source_action":
      return "requires_action";
    case "canceled":
      return "canceled";
    case "requires_payment_method":
      return "failed";
    default:
      return "processing";
  }
}

function mapEventType(type: string): NormalizedPaymentEvent["type"] {
  if (type.includes("payment_intent.succeeded") || type === "charge.succeeded") return "succeeded";
  if (type.includes("payment_intent.payment_failed") || type.includes("charge.failed")) return "failed";
  if (type.includes("requires_action") || type.includes("requires_source_action")) return "requires_action";
  if (type.includes("canceled")) return "canceled";
  if (type.includes("charge.refunded") || type.includes("refund")) return "refunded";
  if (type.includes("dispute")) return "dispute";
  if (type.includes("processing") || type.includes("payment_intent.created")) return "processing";
  return "ignored";
}

/**
 * StripeProvider — Q1 primary PaymentProvider.
 * Sandbox without keys returns deterministic fake IDs for local/CI.
 */
export const stripePaymentProvider: PaymentProvider = {
  id: "stripe",

  async createCustomer(input: CreateCustomerInput): Promise<CustomerRef> {
    if (isSandboxMode() && !secretKey()) {
      return { externalCustomerId: `cus_sandbox_${input.tenantId.slice(0, 8)}` };
    }
    const res = await stripeFetch("/customers", {
      method: "POST",
      body: formBody({
        email: input.email ?? undefined,
        name: input.name ?? undefined,
        "metadata[organization_id]": input.organizationId,
        "metadata[tenant_id]": input.tenantId
      })
    });
    if (!res.ok) throw new Error(`Stripe createCustomer failed: ${await res.text()}`);
    const json = (await res.json()) as { id: string };
    return { externalCustomerId: json.id };
  },

  async attachPaymentMethod(input: AttachMethodInput): Promise<PaymentMethodRef> {
    if (isSandboxMode() && !secretKey()) {
      const isAch = input.externalPaymentMethodId.includes("ach");
      return {
        externalMethodId: input.externalPaymentMethodId.startsWith("pm_")
          ? input.externalPaymentMethodId
          : `pm_sandbox_${input.externalPaymentMethodId.slice(0, 8)}`,
        methodType: isAch ? "ach" : "card",
        brand: isAch ? null : "visa",
        last4: "4242",
        expMonth: isAch ? null : 12,
        expYear: isAch ? null : 2030,
        bankName: isAch ? "Stripe Test Bank" : null
      };
    }

    await stripeFetch(`/payment_methods/${input.externalPaymentMethodId}/attach`, {
      method: "POST",
      body: formBody({ customer: input.externalCustomerId })
    });

    const res = await stripeFetch(`/payment_methods/${input.externalPaymentMethodId}`);
    if (!res.ok) throw new Error(`Stripe retrieve payment method failed: ${await res.text()}`);
    const json = (await res.json()) as {
      id: string;
      type: string;
      card?: { brand?: string; last4?: string; exp_month?: number; exp_year?: number; funding?: string };
      us_bank_account?: { last4?: string; bank_name?: string };
    };

    if (json.type === "us_bank_account") {
      return {
        externalMethodId: json.id,
        methodType: "ach",
        last4: json.us_bank_account?.last4 ?? null,
        bankName: json.us_bank_account?.bank_name ?? null
      };
    }

    const funding = json.card?.funding;
    return {
      externalMethodId: json.id,
      methodType: funding === "debit" ? "debit" : "card",
      brand: json.card?.brand ?? null,
      last4: json.card?.last4 ?? null,
      expMonth: json.card?.exp_month ?? null,
      expYear: json.card?.exp_year ?? null
    };
  },

  async detachPaymentMethod(ref: PaymentMethodRef): Promise<void> {
    if (isSandboxMode() && !secretKey()) return;
    await stripeFetch(`/payment_methods/${ref.externalMethodId}/detach`, { method: "POST" });
  },

  async createPaymentAttempt(input: CreatePaymentAttemptInput): Promise<PaymentAttemptRef> {
    if (isSandboxMode() && !secretKey()) {
      return {
        externalAttemptId: `pi_sandbox_${input.attemptNumber}`,
        status: "processing",
        clientSecret: `pi_sandbox_${input.attemptNumber}_secret_test`
      };
    }

    const params: Record<string, string | undefined | null> = {
      amount: String(input.amountCents),
      currency: input.currency,
      customer: input.externalCustomerId,
      description: input.description ?? undefined,
      confirm: input.confirm === false ? "false" : "true",
      "metadata[organization_id]": input.organizationId,
      "metadata[attempt_id]": input.attemptId,
      "metadata[attempt_number]": input.attemptNumber,
      "automatic_payment_methods[enabled]": "true"
    };
    if (input.externalPaymentMethodId) params["payment_method"] = input.externalPaymentMethodId;
    if (input.returnUrl) params["return_url"] = input.returnUrl;

    const res = await stripeFetch("/payment_intents", {
      method: "POST",
      body: formBody(params)
    });
    if (!res.ok) throw new Error(`Stripe createPaymentAttempt failed: ${await res.text()}`);
    const json = (await res.json()) as {
      id: string;
      status: string;
      client_secret?: string;
      last_payment_error?: { code?: string; message?: string };
    };
    return {
      externalAttemptId: json.id,
      status: mapIntentStatus(json.status),
      clientSecret: json.client_secret ?? null,
      failureCode: json.last_payment_error?.code ?? null,
      failureMessage: json.last_payment_error?.message ?? null
    };
  },

  async getPaymentAttempt(ref: PaymentAttemptRef): Promise<PaymentAttemptStatus> {
    if (isSandboxMode() && !secretKey()) {
      return { externalAttemptId: ref.externalAttemptId, status: "processing" };
    }
    const res = await stripeFetch(`/payment_intents/${ref.externalAttemptId}`);
    if (!res.ok) throw new Error(`Stripe getPaymentAttempt failed: ${await res.text()}`);
    const json = (await res.json()) as {
      id: string;
      status: string;
      amount?: number;
      last_payment_error?: { code?: string; message?: string };
    };
    return {
      externalAttemptId: json.id,
      status: mapIntentStatus(json.status),
      ...(json.amount !== undefined ? { amountCents: json.amount } : {}),
      failureCode: json.last_payment_error?.code ?? null,
      failureMessage: json.last_payment_error?.message ?? null
    };
  },

  async cancelPaymentAttempt(ref: PaymentAttemptRef): Promise<void> {
    if (isSandboxMode() && !secretKey()) return;
    await stripeFetch(`/payment_intents/${ref.externalAttemptId}/cancel`, { method: "POST" });
  },

  async refund(input: RefundInput): Promise<RefundRef> {
    if (isSandboxMode() && !secretKey()) {
      return {
        externalRefundId: `re_sandbox_${Date.now()}`,
        status: "succeeded",
        amountCents: input.amountCents ?? 0
      };
    }
    const res = await stripeFetch("/refunds", {
      method: "POST",
      body: formBody({
        payment_intent: input.externalAttemptId,
        amount: input.amountCents != null ? String(input.amountCents) : undefined,
        reason: input.reason ?? undefined
      })
    });
    if (!res.ok) throw new Error(`Stripe refund failed: ${await res.text()}`);
    const json = (await res.json()) as { id: string; status: string; amount: number };
    return {
      externalRefundId: json.id,
      status: json.status === "succeeded" ? "succeeded" : json.status === "failed" ? "failed" : "pending",
      amountCents: json.amount
    };
  },

  async parseWebhook(payload: unknown, headers: Record<string, string>): Promise<NormalizedPaymentEvent[]> {
    const rawBody = headers["x-mpa-raw-body"] ?? JSON.stringify(payload ?? {});
    if (!verifyStripeSignature(headers, rawBody)) {
      throw new Error("Invalid Stripe webhook signature");
    }

    const body = (payload ?? {}) as Record<string, unknown>;
    const type = String(body["type"] ?? "ignored");
    const dataObject =
      body["data"] && typeof body["data"] === "object"
        ? ((body["data"] as { object?: Record<string, unknown> }).object ?? {})
        : (body as Record<string, unknown>);

    const externalPaymentId =
      typeof dataObject["id"] === "string"
        ? dataObject["id"]
        : typeof dataObject["payment_intent"] === "string"
          ? dataObject["payment_intent"]
          : null;

    const externalEventId =
      typeof body["id"] === "string" ? body["id"] : `stripe-${Date.now()}-${type}`;

    const amount =
      typeof dataObject["amount"] === "number"
        ? dataObject["amount"]
        : typeof dataObject["amount_received"] === "number"
          ? dataObject["amount_received"]
          : null;

    return [
      {
        externalEventId,
        externalPaymentId,
        type: mapEventType(type),
        amountCents: amount,
        currency: typeof dataObject["currency"] === "string" ? dataObject["currency"] : "usd",
        occurredAt: new Date().toISOString(),
        failureCode:
          dataObject["last_payment_error"] && typeof dataObject["last_payment_error"] === "object"
            ? String((dataObject["last_payment_error"] as { code?: string }).code ?? "") || null
            : null,
        message:
          dataObject["last_payment_error"] && typeof dataObject["last_payment_error"] === "object"
            ? String((dataObject["last_payment_error"] as { message?: string }).message ?? "") || null
            : null,
        payloadDigest: externalEventId
      }
    ];
  }
};
