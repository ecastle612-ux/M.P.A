import { createHmac, timingSafeEqual } from "node:crypto";
import type {
  AccountLinkRef,
  ConnectAccountRef,
  ConnectAccountSnapshot,
  ConnectBalanceSnapshot,
  ConnectProvider,
  ConnectTransferRef,
  CreateAccountLinkInput,
  CreateConnectAccountInput,
  CreateConnectTransferInput,
  NormalizedConnectAccountEvent,
  NormalizedConnectTransferEvent
} from "./contracts";
import { deriveConnectAccountStatus } from "./eligibility";

/**
 * Stripe Connect adapter (FIN-003 Phase A + Phase C transfers).
 * Uses Stripe REST only — no Stripe SDK. Separate webhook secret from payments/SaaS rails.
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

/** Connect rail secret — never reuse STRIPE_WEBHOOK_SECRET (payments) or SaaS secret. */
function verifyConnectSignature(headers: Record<string, string>, rawBody: string): boolean {
  const secret = env("STRIPE_CONNECT_WEBHOOK_SECRET");
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

function mapStripeAccount(
  json: Record<string, unknown>,
  purposeHint?: "org_settlement" | "owner"
): ConnectAccountSnapshot {
  const requirements = (json["requirements"] ?? {}) as Record<string, unknown>;
  const currentlyDue = Array.isArray(requirements["currently_due"])
    ? (requirements["currently_due"] as unknown[]).map(String)
    : [];
  const pastDue = Array.isArray(requirements["past_due"])
    ? (requirements["past_due"] as unknown[]).map(String)
    : [];
  const disabledReason =
    typeof json["disabled_reason"] === "string"
      ? json["disabled_reason"]
      : typeof requirements["disabled_reason"] === "string"
        ? String(requirements["disabled_reason"])
        : null;

  const metadata = (json["metadata"] ?? {}) as Record<string, unknown>;
  const purpose: "org_settlement" | "owner" =
    purposeHint ??
    (metadata["mpa_purpose"] === "org_settlement" ? "org_settlement" : "owner");

  const detailsSubmitted = Boolean(json["details_submitted"]);
  const chargesEnabled = Boolean(json["charges_enabled"]);
  const payoutsEnabled = Boolean(json["payouts_enabled"]);

  return {
    externalAccountId: String(json["id"] ?? ""),
    status: deriveConnectAccountStatus({
      detailsSubmitted,
      chargesEnabled,
      payoutsEnabled,
      currentlyDue,
      pastDue,
      disabledReason,
      purpose
    }),
    chargesEnabled,
    payoutsEnabled,
    detailsSubmitted,
    currentlyDue,
    pastDue,
    disabledReason,
    rawRequirements: requirements
  };
}

export const stripeConnectProvider: ConnectProvider = {
  id: "stripe",

  async createExpressAccount(input: CreateConnectAccountInput): Promise<ConnectAccountRef> {
    if (isSandboxMode() && !secretKey()) {
      const subject =
        input.purpose === "owner"
          ? (input.ownerUserId ?? "owner").slice(0, 8)
          : input.organizationId.slice(0, 8);
      return {
        externalAccountId: `acct_sandbox_${input.purpose}_${subject}`,
        purpose: input.purpose
      };
    }

    const res = await stripeFetch("/accounts", {
      method: "POST",
      body: formBody({
        type: "express",
        country: input.country ?? "US",
        email: input.email ?? undefined,
        "capabilities[card_payments][requested]": "true",
        "capabilities[transfers][requested]": "true",
        "metadata[organization_id]": input.organizationId,
        "metadata[mpa_purpose]": input.purpose,
        "metadata[owner_user_id]": input.ownerUserId ?? undefined
      })
    });
    if (!res.ok) throw new Error(`Stripe createExpressAccount failed: ${await res.text()}`);
    const json = (await res.json()) as { id: string };
    return { externalAccountId: json.id, purpose: input.purpose };
  },

  async createAccountLink(input: CreateAccountLinkInput): Promise<AccountLinkRef> {
    if (isSandboxMode() && !secretKey()) {
      const sep = input.returnUrl.includes("?") ? "&" : "?";
      return {
        url: `${input.returnUrl}${sep}connect=sandbox&account=${encodeURIComponent(input.externalAccountId)}`,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString()
      };
    }

    const res = await stripeFetch("/account_links", {
      method: "POST",
      body: formBody({
        account: input.externalAccountId,
        refresh_url: input.refreshUrl,
        return_url: input.returnUrl,
        type: input.linkType ?? "account_onboarding"
      })
    });
    if (!res.ok) throw new Error(`Stripe createAccountLink failed: ${await res.text()}`);
    const json = (await res.json()) as { url: string; expires_at?: number };
    return {
      url: json.url,
      expiresAt: json.expires_at ? new Date(json.expires_at * 1000).toISOString() : null
    };
  },

  async getAccount(externalAccountId: string): Promise<ConnectAccountSnapshot> {
    if (isSandboxMode() && !secretKey()) {
      return mapStripeAccount(
        {
          id: externalAccountId,
          details_submitted: true,
          charges_enabled: externalAccountId.includes("org_settlement"),
          payouts_enabled: !externalAccountId.includes("org_settlement"),
          requirements: { currently_due: [], past_due: [] },
          metadata: {
            mpa_purpose: externalAccountId.includes("org_settlement") ? "org_settlement" : "owner"
          }
        },
        externalAccountId.includes("org_settlement") ? "org_settlement" : "owner"
      );
    }

    const res = await stripeFetch(`/accounts/${encodeURIComponent(externalAccountId)}`, {
      method: "GET"
    });
    if (!res.ok) throw new Error(`Stripe getAccount failed: ${await res.text()}`);
    const json = (await res.json()) as Record<string, unknown>;
    return mapStripeAccount(json);
  },

  async parseAccountWebhook(
    payload: unknown,
    headers: Record<string, string>
  ): Promise<NormalizedConnectAccountEvent[]> {
    const rawBody = headers["x-mpa-raw-body"] ?? "";
    if (!verifyConnectSignature(headers, rawBody)) {
      throw new Error("Invalid Connect webhook signature");
    }

    const body = (payload ?? {}) as Record<string, unknown>;
    const typeRaw = String(body["type"] ?? "");
    const externalEventId = typeof body["id"] === "string" ? body["id"] : `stripe-connect-${Date.now()}`;
    const data = (body["data"] ?? {}) as Record<string, unknown>;
    const object = (data["object"] ?? {}) as Record<string, unknown>;
    const externalAccountId = typeof object["id"] === "string" ? object["id"] : null;
    const occurredAt =
      typeof body["created"] === "number"
        ? new Date(body["created"] * 1000).toISOString()
        : new Date().toISOString();

    // Account webhook path ignores money events — use parseTransferWebhook for transfer.*.
    if (
      typeRaw.startsWith("transfer.") ||
      typeRaw.startsWith("payout.") ||
      typeRaw.startsWith("charge.") ||
      typeRaw.startsWith("payment_intent.") ||
      typeRaw.startsWith("invoice.")
    ) {
      return [
        {
          externalEventId,
          type: "ignored",
          externalAccountId: typeRaw.startsWith("transfer.") ? null : externalAccountId,
          occurredAt,
          ignored: true,
          message: `Use parseTransferWebhook for money event: ${typeRaw}`
        }
      ];
    }

    if (typeRaw === "account.application.deauthorized") {
      return [
        {
          externalEventId,
          type: "account_deauthorized",
          externalAccountId,
          occurredAt
        }
      ];
    }

    if (typeRaw === "account.updated" || typeRaw === "account.application.authorized") {
      return [
        {
          externalEventId,
          type: typeRaw === "account.updated" ? "account_updated" : "account_application_authorized",
          externalAccountId,
          occurredAt
        }
      ];
    }

    return [
      {
        externalEventId,
        type: "ignored",
        externalAccountId,
        occurredAt,
        ignored: true,
        message: `Ignored Connect event: ${typeRaw}`
      }
    ];
  },

  async createTransfer(input: CreateConnectTransferInput): Promise<ConnectTransferRef> {
    if (input.amountCents <= 0) throw new Error("Transfer amount must be positive");
    if (!input.sourceSettlementAccountId.startsWith("acct_")) {
      throw new Error("createTransfer requires settlement acct_… source");
    }
    if (!input.destinationOwnerAccountId.startsWith("acct_")) {
      throw new Error("createTransfer requires owner acct_… destination");
    }

    if (isSandboxMode() && !secretKey()) {
      return {
        externalTransferId: `tr_sandbox_${input.idempotencyKey.replace(/[^a-zA-Z0-9]/g, "").slice(0, 40)}`,
        amountCents: input.amountCents,
        currency: input.currency,
        destinationAccountId: input.destinationOwnerAccountId,
        status: "paid"
      };
    }

    const res = await stripeFetch("/transfers", {
      method: "POST",
      headers: {
        "Stripe-Account": input.sourceSettlementAccountId,
        "Idempotency-Key": input.idempotencyKey
      },
      body: formBody({
        amount: String(input.amountCents),
        currency: input.currency,
        destination: input.destinationOwnerAccountId,
        "metadata[organization_id]": input.metadata.organizationId,
        "metadata[payout_run_id]": input.metadata.payoutRunId,
        "metadata[transfer_intent_id]": input.metadata.transferIntentId,
        "metadata[attempt_number]": String(input.metadata.attemptNumber)
      })
    });
    if (!res.ok) throw new Error(`Stripe createTransfer failed: ${await res.text()}`);
    const json = (await res.json()) as {
      id: string;
      amount?: number;
      currency?: string;
      destination?: string;
      reversed?: boolean;
    };
    return {
      externalTransferId: json.id,
      amountCents: typeof json.amount === "number" ? json.amount : input.amountCents,
      currency: json.currency ?? input.currency,
      destinationAccountId: json.destination ?? input.destinationOwnerAccountId,
      status: json.reversed ? "reversed" : "paid"
    };
  },

  async getTransfer(
    externalTransferId: string,
    sourceSettlementAccountId: string
  ): Promise<ConnectTransferRef> {
    if (isSandboxMode() && !secretKey()) {
      return {
        externalTransferId,
        amountCents: 0,
        currency: "usd",
        destinationAccountId: "acct_sandbox_owner",
        status: "paid"
      };
    }

    const res = await stripeFetch(`/transfers/${encodeURIComponent(externalTransferId)}`, {
      method: "GET",
      headers: { "Stripe-Account": sourceSettlementAccountId }
    });
    if (!res.ok) throw new Error(`Stripe getTransfer failed: ${await res.text()}`);
    const json = (await res.json()) as {
      id: string;
      amount?: number;
      currency?: string;
      destination?: string;
      reversed?: boolean;
    };
    return {
      externalTransferId: json.id,
      amountCents: typeof json.amount === "number" ? json.amount : 0,
      currency: json.currency ?? "usd",
      destinationAccountId: typeof json.destination === "string" ? json.destination : "",
      status: json.reversed ? "reversed" : "paid"
    };
  },

  async getBalance(sourceSettlementAccountId: string): Promise<ConnectBalanceSnapshot> {
    if (!sourceSettlementAccountId.startsWith("acct_") && !sourceSettlementAccountId.startsWith("noop_")) {
      throw new Error("getBalance requires Connect account id");
    }
    if (isSandboxMode() && !secretKey()) {
      return { availableCents: 10_000_000, pendingCents: 0, currency: "usd" };
    }

    const res = await fetch(`${baseUrl()}/balance`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${secretKey()}`,
        "Stripe-Account": sourceSettlementAccountId
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
    return {
      availableCents: sumUsd(json.available),
      pendingCents: sumUsd(json.pending),
      currency: "usd"
    };
  },

  async parseTransferWebhook(
    payload: unknown,
    headers: Record<string, string>
  ): Promise<NormalizedConnectTransferEvent[]> {
    const rawBody = headers["x-mpa-raw-body"] ?? "";
    if (!verifyConnectSignature(headers, rawBody)) {
      throw new Error("Invalid Connect webhook signature");
    }

    const body = (payload ?? {}) as Record<string, unknown>;
    const typeRaw = String(body["type"] ?? "");
    const externalEventId = typeof body["id"] === "string" ? body["id"] : `stripe-xfer-${Date.now()}`;
    const data = (body["data"] ?? {}) as Record<string, unknown>;
    const object = (data["object"] ?? {}) as Record<string, unknown>;
    const occurredAt =
      typeof body["created"] === "number"
        ? new Date(body["created"] * 1000).toISOString()
        : new Date().toISOString();

    if (!typeRaw.startsWith("transfer.")) {
      return [
        {
          externalEventId,
          type: "ignored",
          externalTransferId: null,
          sourceAccountId: null,
          destinationAccountId: null,
          amountCents: null,
          currency: null,
          status: null,
          occurredAt,
          ignored: true,
          message: `Not a transfer event: ${typeRaw}`
        }
      ];
    }

    let type: NormalizedConnectTransferEvent["type"] = "transfer_updated";
    if (typeRaw === "transfer.created") type = "transfer_created";
    if (typeRaw === "transfer.reversed") type = "transfer_reversed";
    if (typeRaw.includes("failed")) type = "transfer_failed";

    const meta = (object["metadata"] ?? {}) as Record<string, unknown>;
    return [
      {
        externalEventId,
        type,
        externalTransferId: typeof object["id"] === "string" ? object["id"] : null,
        sourceAccountId: typeof body["account"] === "string" ? body["account"] : null,
        destinationAccountId:
          typeof object["destination"] === "string" ? object["destination"] : null,
        amountCents: typeof object["amount"] === "number" ? object["amount"] : null,
        currency: typeof object["currency"] === "string" ? object["currency"] : "usd",
        status:
          object["reversed"] === true
            ? "reversed"
            : type === "transfer_failed"
              ? "failed"
              : "paid",
        occurredAt,
        metadata: meta
      }
    ];
  }
};
