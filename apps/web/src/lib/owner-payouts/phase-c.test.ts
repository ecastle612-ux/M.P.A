import { describe, expect, it } from "vitest";
import {
  allocatePropertyCents,
  assertProfilePercentsValid,
  roundHalfEvenToCents
} from "./allocation-math";
import { isFin003TransfersEnabled } from "../integrations/connect";
import { noopConnectProvider } from "../integrations/connect/noop-provider";

describe("allocation math (R13)", () => {
  it("rounds half-to-even", () => {
    expect(roundHalfEvenToCents(1.5)).toBe(2);
    expect(roundHalfEvenToCents(2.5)).toBe(2);
    expect(roundHalfEvenToCents(3.5)).toBe(4);
  });

  it("allocates cents that sum to property distributable", () => {
    const result = allocatePropertyCents({
      propertyDistributableCents: 100,
      shares: [
        { ownerUserId: "a", percent: 33.3333 },
        { ownerUserId: "b", percent: 33.3333 },
        { ownerUserId: "c", percent: 33.3334 }
      ]
    });
    const sum = result.reduce((s, r) => s + r.amountCents, 0);
    expect(sum).toBe(100);
    expect(result.every((r) => r.amountCents >= 0)).toBe(true);
  });

  it("rejects non-100 profiles", () => {
    expect(() => assertProfilePercentsValid([50, 40])).toThrow(/100/);
  });
});

describe("FIN003_TRANSFERS_ENABLED", () => {
  it("defaults off (fail closed)", () => {
    const previous = process.env["FIN003_TRANSFERS_ENABLED"];
    delete process.env["FIN003_TRANSFERS_ENABLED"];
    expect(isFin003TransfersEnabled()).toBe(false);
    process.env["FIN003_TRANSFERS_ENABLED"] = "true";
    expect(isFin003TransfersEnabled()).toBe(true);
    if (previous === undefined) delete process.env["FIN003_TRANSFERS_ENABLED"];
    else process.env["FIN003_TRANSFERS_ENABLED"] = previous;
  });
});

describe("ConnectProvider Phase C transfers (noop)", () => {
  it("creates idempotent sandbox transfer", async () => {
    const a = await noopConnectProvider.createTransfer({
      sourceSettlementAccountId: "noop_acct_org_settlement_eligible",
      destinationOwnerAccountId: "noop_acct_owner_eligible",
      amountCents: 2500,
      currency: "usd",
      idempotencyKey: "fin003-intent-a1",
      metadata: {
        organizationId: "org",
        payoutRunId: "run",
        transferIntentId: "intent",
        attemptNumber: 1
      }
    });
    const b = await noopConnectProvider.createTransfer({
      sourceSettlementAccountId: "noop_acct_org_settlement_eligible",
      destinationOwnerAccountId: "noop_acct_owner_eligible",
      amountCents: 2500,
      currency: "usd",
      idempotencyKey: "fin003-intent-a1",
      metadata: {
        organizationId: "org",
        payoutRunId: "run",
        transferIntentId: "intent",
        attemptNumber: 1
      }
    });
    expect(a.externalTransferId).toBe(b.externalTransferId);
    expect(a.amountCents).toBe(2500);
  });

  it("returns available balance for preflight", async () => {
    const bal = await noopConnectProvider.getBalance("noop_acct_org_settlement_eligible");
    expect(bal.availableCents).toBeGreaterThan(0);
    const low = await noopConnectProvider.getBalance("noop_acct_org_settlement_lowbal");
    expect(low.availableCents).toBe(100);
  });

  it("parses transfer webhooks without treating transfer id as account id", async () => {
    const events = await noopConnectProvider.parseTransferWebhook(
      {
        id: "evt_tr_1",
        type: "transfer.created",
        data: {
          object: {
            id: "tr_123",
            amount: 500,
            currency: "usd",
            destination: "acct_owner",
            metadata: { transfer_intent_id: "intent-1" }
          }
        }
      },
      {}
    );
    expect(events[0]?.type).toBe("transfer_created");
    expect(events[0]?.externalTransferId).toBe("tr_123");
    expect(events[0]?.metadata?.["transfer_intent_id"]).toBe("intent-1");
  });
});
