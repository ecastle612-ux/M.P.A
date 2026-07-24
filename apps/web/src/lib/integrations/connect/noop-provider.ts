import type {
  AccountLinkRef,
  ConnectAccountRef,
  ConnectBalanceSnapshot,
  ConnectProvider,
  ConnectTransferRef,
  CreateAccountLinkInput,
  CreateConnectAccountInput,
  CreateConnectTransferInput,
  NormalizedConnectAccountEvent,
  NormalizedConnectTransferEvent
} from "./contracts";
import { snapshotFromFlags } from "./eligibility";

/**
 * Local/CI Connect provider — no external network.
 */
export const noopConnectProvider: ConnectProvider = {
  id: "noop",

  async createExpressAccount(input: CreateConnectAccountInput): Promise<ConnectAccountRef> {
    const subject =
      input.purpose === "owner"
        ? (input.ownerUserId ?? "owner").slice(0, 8)
        : input.organizationId.slice(0, 8);
    return {
      externalAccountId: `noop_acct_${input.purpose}_${subject}`,
      purpose: input.purpose
    };
  },

  async createAccountLink(input: CreateAccountLinkInput): Promise<AccountLinkRef> {
    const sep = input.returnUrl.includes("?") ? "&" : "?";
    return {
      url: `${input.returnUrl}${sep}connect=noop&account=${encodeURIComponent(input.externalAccountId)}`,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString()
    };
  },

  async getAccount(externalAccountId: string) {
    const purpose = externalAccountId.includes("org_settlement") ? "org_settlement" : "owner";
    const eligible = externalAccountId.includes("_eligible");
    const restricted = externalAccountId.includes("_restricted");
    return snapshotFromFlags(externalAccountId, {
      purpose,
      detailsSubmitted: eligible || restricted,
      chargesEnabled: eligible && purpose === "org_settlement",
      payoutsEnabled: eligible && purpose === "owner",
      currentlyDue: restricted ? ["individual.verification.document"] : [],
      pastDue: [],
      disabledReason: externalAccountId.includes("_disabled") ? "rejected.other" : null
    });
  },

  async parseAccountWebhook(payload: unknown): Promise<NormalizedConnectAccountEvent[]> {
    const body = (payload ?? {}) as Record<string, unknown>;
    const typeRaw = String(body["type"] ?? "account.updated");
    const data = (body["data"] ?? {}) as Record<string, unknown>;
    const object = (data["object"] ?? body) as Record<string, unknown>;
    const externalAccountId =
      typeof object["id"] === "string"
        ? object["id"]
        : typeof body["externalAccountId"] === "string"
          ? body["externalAccountId"]
          : null;
    const externalEventId =
      typeof body["id"] === "string" ? body["id"] : `noop-connect-${Date.now()}`;

    if (typeRaw.startsWith("transfer.")) {
      return [
        {
          externalEventId,
          type: "ignored",
          externalAccountId: null,
          occurredAt: new Date().toISOString(),
          ignored: true,
          message: "Use parseTransferWebhook for transfer events"
        }
      ];
    }

    if (typeRaw.includes("deauthorize")) {
      return [
        {
          externalEventId,
          type: "account_deauthorized",
          externalAccountId,
          occurredAt: new Date().toISOString()
        }
      ];
    }

    if (!typeRaw.includes("account")) {
      return [
        {
          externalEventId,
          type: "ignored",
          externalAccountId,
          occurredAt: new Date().toISOString(),
          ignored: true,
          message: `Ignored event type: ${typeRaw}`
        }
      ];
    }

    return [
      {
        externalEventId,
        type: "account_updated",
        externalAccountId,
        occurredAt: new Date().toISOString()
      }
    ];
  },

  async createTransfer(input: CreateConnectTransferInput): Promise<ConnectTransferRef> {
    if (input.amountCents <= 0) throw new Error("Transfer amount must be positive");
    if (!input.sourceSettlementAccountId || !input.destinationOwnerAccountId) {
      throw new Error("Source and destination Connect accounts required");
    }
    const id = `tr_noop_${input.idempotencyKey.replace(/[^a-zA-Z0-9]/g, "").slice(0, 24)}`;
    return {
      externalTransferId: id,
      amountCents: input.amountCents,
      currency: input.currency,
      destinationAccountId: input.destinationOwnerAccountId,
      status: "paid"
    };
  },

  async getTransfer(
    externalTransferId: string,
    sourceSettlementAccountId: string
  ): Promise<ConnectTransferRef> {
    void sourceSettlementAccountId;
    return {
      externalTransferId,
      amountCents: 0,
      currency: "usd",
      destinationAccountId: "noop_acct_owner",
      status: externalTransferId.includes("fail") ? "failed" : "paid"
    };
  },

  async getBalance(sourceSettlementAccountId: string): Promise<ConnectBalanceSnapshot> {
    if (!sourceSettlementAccountId) throw new Error("Settlement account required");
    // Deterministic sandbox balance for preflight tests
    const available = sourceSettlementAccountId.includes("_lowbal") ? 100 : 10_000_000;
    return { availableCents: available, pendingCents: 0, currency: "usd" };
  },

  async parseTransferWebhook(
    payload: unknown,
    headers: Record<string, string> = {}
  ): Promise<NormalizedConnectTransferEvent[]> {
    void headers;
    const body = (payload ?? {}) as Record<string, unknown>;
    const typeRaw = String(body["type"] ?? "");
    const data = (body["data"] ?? {}) as Record<string, unknown>;
    const object = (data["object"] ?? {}) as Record<string, unknown>;
    const externalEventId =
      typeof body["id"] === "string" ? body["id"] : `noop-transfer-${Date.now()}`;
    const occurredAt = new Date().toISOString();

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

    const transferId = typeof object["id"] === "string" ? object["id"] : null;
    let type: NormalizedConnectTransferEvent["type"] = "transfer_updated";
    if (typeRaw === "transfer.created") type = "transfer_created";
    if (typeRaw === "transfer.reversed") type = "transfer_reversed";
    if (typeRaw === "transfer.failed" || typeRaw.endsWith(".failed")) type = "transfer_failed";

    return [
      {
        externalEventId,
        type,
        externalTransferId: transferId,
        sourceAccountId:
          typeof object["source_transaction"] === "string"
            ? null
            : typeof body["account"] === "string"
              ? body["account"]
              : null,
        destinationAccountId:
          typeof object["destination"] === "string" ? object["destination"] : null,
        amountCents: typeof object["amount"] === "number" ? object["amount"] : null,
        currency: typeof object["currency"] === "string" ? object["currency"] : "usd",
        status: typeof object["reversed"] === "boolean" && object["reversed"] ? "reversed" : "paid",
        occurredAt,
        metadata: (object["metadata"] as Record<string, unknown>) ?? null
      }
    ];
  }
};
