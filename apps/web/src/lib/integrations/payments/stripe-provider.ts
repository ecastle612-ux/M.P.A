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

/**
 * Exported for certification tests — locked destination charge form fields.
 * Does not call Stripe.
 */
export function buildStripeDestinationChargeParams(
  input: CreatePaymentAttemptInput,
  prefix: "" | "payment_intent_data" = ""
): Record<string, string> {
  const routing = input.destinationRouting;
  if (!routing || routing.fundingMode !== "destination") return {};
  if (!routing.settlementAccountId.startsWith("acct_")) {
    throw new Error("PAY-001 destinationRouting.settlementAccountId must be an acct_… id");
  }
  const destKey =
    prefix === "payment_intent_data"
      ? "payment_intent_data[transfer_data][destination]"
      : "transfer_data[destination]";
  const feeKey =
    prefix === "payment_intent_data"
      ? "payment_intent_data[application_fee_amount]"
      : "application_fee_amount";
  const params: Record<string, string> = {
    [destKey]: routing.settlementAccountId,
    ...(prefix === ""
      ? {
          "metadata[organization_id]": input.organizationId,
          "metadata[settlement_account_id]": routing.settlementAccountId,
          "metadata[mpa_rail]": "resident_rent",
          "metadata[funding_mode]": "destination",
          "metadata[payment_attempt_id]": routing.paymentAttemptId || input.attemptId,
          "metadata[attempt_id]": input.attemptId,
          "metadata[attempt_number]": input.attemptNumber
        }
      : {
          "payment_intent_data[metadata][organization_id]": input.organizationId,
          "payment_intent_data[metadata][settlement_account_id]": routing.settlementAccountId,
          "payment_intent_data[metadata][mpa_rail]": "resident_rent",
          "payment_intent_data[metadata][funding_mode]": "destination",
          "payment_intent_data[metadata][payment_attempt_id]":
            routing.paymentAttemptId || input.attemptId,
          "payment_intent_data[metadata][attempt_id]": input.attemptId,
          "payment_intent_data[metadata][attempt_number]": input.attemptNumber
        })
  };
  if (routing.propertyId) {
    if (prefix === "payment_intent_data") {
      params["payment_intent_data[metadata][property_id]"] = routing.propertyId;
      params["metadata[property_id]"] = routing.propertyId;
    } else {
      params["metadata[property_id]"] = routing.propertyId;
    }
  }
  if (routing.applicationFeeAmountCents > 0) {
    params[feeKey] = String(routing.applicationFeeAmountCents);
  }
  if (prefix === "payment_intent_data") {
    params["metadata[organization_id]"] = input.organizationId;
    params["metadata[settlement_account_id]"] = routing.settlementAccountId;
    params["metadata[mpa_rail]"] = "resident_rent";
    params["metadata[funding_mode]"] = "destination";
    params["metadata[payment_attempt_id]"] = routing.paymentAttemptId || input.attemptId;
    params["metadata[attempt_id]"] = input.attemptId;
    params["metadata[attempt_number]"] = input.attemptNumber;
  }
  return params;
}


/**
 * Retrieve transfer_data.destination from a live PaymentIntent (settle-time verify).
 */
export async function retrieveStripePaymentIntentDestination(
  externalPaymentIntentId: string
): Promise<string | null> {
  if (!externalPaymentIntentId.startsWith("pi_")) return null;
  if (!secretKey()) {
    throw new Error("STRIPE_SECRET_KEY is required to retrieve PaymentIntent destination");
  }
  const res = await stripeFetch(`/payment_intents/${externalPaymentIntentId}`);
  if (!res.ok) throw new Error(`Stripe retrieve PaymentIntent failed: ${await res.text()}`);
  const json = (await res.json()) as {
    transfer_data?: { destination?: string | null } | null;
  };
  const dest = json.transfer_data?.destination;
  return typeof dest === "string" && dest.startsWith("acct_") ? dest : null;
}

/**
 * Retrieve Connect Express available (and optionally pending) balance in USD cents.
 * Cash SoT for money-in / refund preflight — never invent balances.
 */
export async function retrieveConnectAvailableBalanceCents(
  connectedAccountId: string,
  options?: { includePending?: boolean }
): Promise<{ availableCents: number; pendingCents: number }> {
  if (!connectedAccountId.startsWith("acct_")) {
    throw new Error("retrieveConnectAvailableBalanceCents requires acct_… id");
  }
  if (!secretKey()) {
    throw new Error("STRIPE_SECRET_KEY is required to retrieve Connect balance");
  }
  const res = await fetch(`${baseUrl()}/balance`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${secretKey()}`,
      "Stripe-Account": connectedAccountId
    }
  });
  if (!res.ok) throw new Error(`Stripe Connect balance retrieve failed: ${await res.text()}`);
  const json = (await res.json()) as {
    available?: Array<{ amount?: number; currency?: string }>;
    pending?: Array<{ amount?: number; currency?: string }>;
  };
  const sumUsd = (rows: Array<{ amount?: number; currency?: string }> | undefined) =>
    (rows ?? [])
      .filter((r) => (r.currency ?? "usd").toLowerCase() === "usd")
      .reduce((sum, r) => sum + (typeof r.amount === "number" ? r.amount : 0), 0);
  const availableCents = sumUsd(json.available);
  const pendingCents = options?.includePending ? sumUsd(json.pending) : 0;
  return { availableCents, pendingCents };
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
  // Prefer PaymentIntent / Checkout settlement. `charge.succeeded` is a duplicate
  // success signal for the same PI and must not re-apply rent settlement.
  if (type.includes("payment_intent.succeeded") || type === "checkout.session.completed") {
    return "succeeded";
  }
  if (type === "charge.succeeded") {
    return "ignored";
  }
  if (type === "charge.dispute.created" || type.endsWith("dispute.created")) return "dispute_opened";
  if (
    type === "charge.dispute.closed" ||
    type.includes("dispute.closed") ||
    type.includes("dispute.funds_withdrawn") ||
    type.includes("dispute.funds_reinstated")
  ) {
    // Outcome refined in parseWebhook from dispute status
    return "dispute";
  }
  if (type.includes("payment_intent.payment_failed") || type.includes("charge.failed")) return "failed";
  if (type.includes("requires_action") || type.includes("requires_source_action")) return "requires_action";
  if (type.includes("canceled") || type === "checkout.session.expired") return "canceled";
  // C2 — refund.* and charge.refunded refined in parseWebhook (amount_refunded / refund amount).
  if (
    type.includes("charge.refund.updated") ||
    type.includes("refund.updated") ||
    type.includes("refund.created") ||
    type === "charge.refunded" ||
    type.includes("charge.refunded")
  ) {
    return "partially_refunded";
  }
  if (type.includes("refund")) return "partially_refunded";
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
    const idempotencyKey = `pay001-attempt-${input.attemptId}`;

    // C1: keyless sandbox cannot apply transfer_data — refuse destination fiction.
    if (input.destinationRouting?.fundingMode === "destination" && !secretKey()) {
      throw new Error(
        "PAY-001 destination charges require STRIPE_SECRET_KEY so transfer_data.destination can be applied"
      );
    }

    if (isSandboxMode() && !secretKey()) {
      return {
        externalAttemptId: `pi_sandbox_${input.attemptNumber}`,
        status: "processing",
        clientSecret: `pi_sandbox_${input.attemptNumber}_secret_test`,
        checkoutUrl: input.useCheckout
          ? `https://checkout.stripe.com/c/pay/cs_test_sandbox_${input.attemptNumber}`
          : null,
        checkoutSessionId: input.useCheckout ? `cs_test_sandbox_${input.attemptNumber}` : null
      };
    }

    // Hosted Checkout when no saved method (commercial cert + production resident pay).
    if (input.useCheckout || (!input.externalPaymentMethodId && input.checkoutSuccessUrl)) {
      const successUrl =
        input.checkoutSuccessUrl ??
        `${env("NEXT_PUBLIC_APP_URL") ?? "http://localhost:3000"}/portal/tenant/payments?paid=1`;
      const cancelUrl =
        input.checkoutCancelUrl ??
        `${env("NEXT_PUBLIC_APP_URL") ?? "http://localhost:3000"}/portal/tenant/payments?canceled=1`;

      const res = await stripeFetch("/checkout/sessions", {
        method: "POST",
        headers: { "Idempotency-Key": idempotencyKey },
        body: formBody({
          mode: "payment",
          customer: input.externalCustomerId,
          success_url: `${successUrl}${successUrl.includes("?") ? "&" : "?"}session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: cancelUrl,
          client_reference_id: input.attemptId,
          "line_items[0][quantity]": "1",
          "line_items[0][price_data][currency]": input.currency,
          "line_items[0][price_data][unit_amount]": String(input.amountCents),
          "line_items[0][price_data][product_data][name]":
            input.description ?? `MPA payment ${input.attemptNumber}`,
          "payment_intent_data[description]": input.description ?? `MPA payment ${input.attemptNumber}`,
          "payment_intent_data[metadata][organization_id]": input.organizationId,
          "payment_intent_data[metadata][attempt_id]": input.attemptId,
          "payment_intent_data[metadata][attempt_number]": input.attemptNumber,
          "metadata[organization_id]": input.organizationId,
          "metadata[attempt_id]": input.attemptId,
          "metadata[attempt_number]": input.attemptNumber,
          "metadata[mpa_flow]": "resident_rent_checkout",
          ...buildStripeDestinationChargeParams(input, "payment_intent_data")
        })
      });
      if (!res.ok) throw new Error(`Stripe Checkout Session failed: ${await res.text()}`);
      const json = (await res.json()) as {
        id: string;
        url?: string | null;
        payment_intent?: string | { id?: string } | null;
        status?: string;
      };
      const paymentIntentId =
        typeof json.payment_intent === "string"
          ? json.payment_intent
          : json.payment_intent && typeof json.payment_intent === "object"
            ? json.payment_intent.id ?? null
            : null;
      if (!json.url) throw new Error("Stripe Checkout Session missing url");
      return {
        externalAttemptId: paymentIntentId ?? json.id,
        status: "requires_action",
        clientSecret: null,
        checkoutUrl: json.url,
        checkoutSessionId: json.id
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
      "automatic_payment_methods[enabled]": "true",
      ...buildStripeDestinationChargeParams(input, "")
    };
    if (input.externalPaymentMethodId) params["payment_method"] = input.externalPaymentMethodId;
    if (input.returnUrl) params["return_url"] = input.returnUrl;

    const res = await stripeFetch("/payment_intents", {
      method: "POST",
      headers: { "Idempotency-Key": idempotencyKey },
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
      checkoutUrl: null,
      checkoutSessionId: null,
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

    const metadata =
      dataObject["metadata"] && typeof dataObject["metadata"] === "object"
        ? (dataObject["metadata"] as Record<string, unknown>)
        : {};

    let externalPaymentId: string | null = null;
    if (type === "checkout.session.completed") {
      const pi = dataObject["payment_intent"];
      externalPaymentId =
        typeof pi === "string" ? pi : pi && typeof pi === "object" ? String((pi as { id?: string }).id ?? "") || null : null;
      // Fallback: BillingService can resolve by attempt_id in metadata / client_reference_id.
      if (!externalPaymentId && typeof dataObject["id"] === "string") {
        externalPaymentId = dataObject["id"];
      }
    } else if (typeof dataObject["payment_intent"] === "string") {
      externalPaymentId = dataObject["payment_intent"];
    } else if (typeof dataObject["id"] === "string" && String(dataObject["id"]).startsWith("pi_")) {
      externalPaymentId = dataObject["id"];
    } else if (typeof dataObject["id"] === "string" && type.includes("charge")) {
      externalPaymentId =
        typeof dataObject["payment_intent"] === "string" ? dataObject["payment_intent"] : dataObject["id"];
    } else if (typeof dataObject["id"] === "string") {
      externalPaymentId = dataObject["id"];
    }

    const externalEventId =
      typeof body["id"] === "string" ? body["id"] : `stripe-${Date.now()}-${type}`;

    const amountTotal =
      typeof dataObject["amount_total"] === "number" ? dataObject["amount_total"] : null;
    let amount: number | null =
      typeof dataObject["amount"] === "number"
        ? dataObject["amount"]
        : typeof dataObject["amount_received"] === "number"
          ? dataObject["amount_received"]
          : amountTotal;

    const attemptId =
      typeof metadata["attempt_id"] === "string"
        ? metadata["attempt_id"]
        : typeof metadata["payment_attempt_id"] === "string"
          ? metadata["payment_attempt_id"]
          : typeof dataObject["client_reference_id"] === "string"
            ? dataObject["client_reference_id"]
            : null;

    let mappedType =
      type === "checkout.session.completed" && dataObject["payment_status"] === "unpaid"
        ? ("processing" as const)
        : mapEventType(type);

    const failureCode =
      dataObject["last_payment_error"] && typeof dataObject["last_payment_error"] === "object"
        ? String((dataObject["last_payment_error"] as { code?: string }).code ?? "") || null
        : typeof dataObject["failure_code"] === "string"
          ? dataObject["failure_code"]
          : null;

    // ACH return: bank debit failure / charge failed with ACH-ish codes after prior success path.
    const failureCodeLower = (failureCode ?? "").toLowerCase();
    if (
      mappedType === "failed" &&
      (failureCodeLower.includes("insufficient_funds") ||
        failureCodeLower.includes("debit_not_authorized") ||
        failureCodeLower.includes("account_closed") ||
        failureCodeLower.includes("bank_account") ||
        failureCodeLower === "nsf" ||
        type.includes("charge.failed"))
    ) {
      const paymentMethodDetails = dataObject["payment_method_details"];
      const isAchObject =
        paymentMethodDetails &&
        typeof paymentMethodDetails === "object" &&
        ("us_bank_account" in (paymentMethodDetails as object) ||
          "ach_debit" in (paymentMethodDetails as object));
      if (isAchObject || failureCodeLower.includes("ach") || failureCodeLower === "nsf") {
        mappedType = "ach_return";
      }
    }

    // Dispute closed → won/lost from Stripe dispute status.
    if (mappedType === "dispute" && (type.includes("dispute.closed") || type.includes("dispute.funds"))) {
      const status = String(dataObject["status"] ?? "");
      if (status === "won") mappedType = "dispute_won";
      else if (status === "lost") mappedType = "dispute_lost";
      else mappedType = "dispute_opened";
    }

    // C2 — refund amounts: never use Charge.amount as refund size.
    const objectId = typeof dataObject["id"] === "string" ? String(dataObject["id"]) : "";
    const isRefundObject = objectId.startsWith("re_") || type.includes("refund.created") || type.includes("refund.updated");
    const isChargeRefunded = type === "charge.refunded" || type.includes("charge.refunded");
    if (isChargeRefunded) {
      const amountRefunded =
        typeof dataObject["amount_refunded"] === "number" ? dataObject["amount_refunded"] : null;
      const chargeAmount = typeof dataObject["amount"] === "number" ? dataObject["amount"] : null;
      // amountCents carries cumulative amount_refunded for apply-path delta math.
      amount = amountRefunded ?? amount;
      if (amountRefunded != null && chargeAmount != null && amountRefunded < chargeAmount) {
        mappedType = "partially_refunded";
      } else if (amountRefunded != null && chargeAmount != null && amountRefunded >= chargeAmount) {
        mappedType = "refunded";
      }
    } else if (isRefundObject) {
      amount = typeof dataObject["amount"] === "number" ? dataObject["amount"] : amount;
      // Single refund object — apply path treats as delta; status refined via cumulative.
      mappedType = "partially_refunded";
    }

    const externalCorrectionId =
      objectId.startsWith("dp_") || objectId.startsWith("re_")
        ? objectId
        : isChargeRefunded && objectId.startsWith("ch_")
          ? `ch_refunded:${objectId}:${amount ?? 0}`
          : null;

    // Dispute objects nest charge → payment_intent
    if (!externalPaymentId && dataObject["charge"] && typeof dataObject["charge"] === "object") {
      const charge = dataObject["charge"] as { payment_intent?: string };
      if (typeof charge.payment_intent === "string") externalPaymentId = charge.payment_intent;
    }

    return [
      {
        externalEventId,
        externalPaymentId,
        type: mappedType,
        amountCents: amount,
        currency: typeof dataObject["currency"] === "string" ? dataObject["currency"] : "usd",
        occurredAt: new Date().toISOString(),
        failureCode,
        message: attemptId ? `attempt_id:${attemptId}` : null,
        payloadDigest: externalEventId,
        externalCorrectionId
      }
    ];
  }
};
