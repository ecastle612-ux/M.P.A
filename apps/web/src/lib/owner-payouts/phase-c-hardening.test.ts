/**
 * FIN-003 Phase C hardening — M1–M6 orchestration & safety tests.
 */
import { describe, expect, it } from "vitest";
import type {
  ConnectProvider,
  ConnectTransferRef,
  CreateConnectTransferInput
} from "../integrations/connect/contracts";
import { noopConnectProvider } from "../integrations/connect/noop-provider";
import {
  runTransferIntentCycle,
  type CycleAttempt,
  type CycleIntent,
  type CyclePersistence
} from "./transfer-intent-cycle";
import {
  canOpenNewAttempt,
  claimBlockedByIntent,
  failedRunMaySupersede,
  intentAllowedByDistributable,
  intentStatusCountsAsTransferred,
  interpretReconcileTransfer,
  mayClaimRunForExecute,
  runStatusBlocksNewClaim
} from "./transfer-safety";

function baseIntent(overrides: Partial<CycleIntent> = {}): CycleIntent {
  return {
    id: "intent-1",
    status: "eligible",
    amount_cents: 1000,
    currency: "usd",
    source_settlement_account_id: "acct_settlement",
    destination_owner_account_id: "acct_owner",
    external_transfer_id: null,
    owner_user_id: "owner-1",
    property_id: "prop-1",
    period_start: "2026-07-01T00:00:00.000Z",
    period_end: "2026-08-01T00:00:00.000Z",
    ...overrides
  };
}

function memoryPersist(state: {
  intent: CycleIntent;
  attempts: CycleAttempt[];
}): CyclePersistence {
  return {
    async markIntentPaid(externalTransferId) {
      state.intent.status = "paid";
      state.intent.external_transfer_id = externalTransferId;
    },
    async markIntentFailed(reason) {
      state.intent.status = "failed";
      void reason;
    },
    async markIntentNeedsReconcile(reason) {
      state.intent.status = "needs_reconcile";
      void reason;
    },
    async markIntentEligibleForRetry(reason) {
      state.intent.status = "eligible";
      state.intent.external_transfer_id = null;
      void reason;
    },
    async markIntentSkipped(reason) {
      state.intent.status = "skipped";
      void reason;
    },
    async markIntentExecuting() {
      state.intent.status = "executing";
    },
    async insertAttempt({ attemptNumber, idempotencyKey }) {
      const row: CycleAttempt = {
        id: `att-${attemptNumber}`,
        attempt_number: attemptNumber,
        idempotency_key: idempotencyKey,
        status: "created",
        external_transfer_id: null
      };
      state.attempts.push(row);
      return { id: row.id };
    },
    async updateAttempt(attemptId, patch) {
      const row = state.attempts.find((a) => a.id === attemptId);
      if (!row) return;
      row.status = patch.status;
      if (patch.external_transfer_id !== undefined) {
        row.external_transfer_id = patch.external_transfer_id;
      }
    }
  };
}

function makeProvider(opts: {
  timeoutOnKeys?: Set<string>;
  transfers?: Map<string, ConnectTransferRef>;
  createCalls?: string[];
}): ConnectProvider {
  const transfers = opts.transfers ?? new Map<string, ConnectTransferRef>();
  const timeoutOnKeys = opts.timeoutOnKeys ?? new Set<string>();
  const timedOutOnce = new Set<string>();
  const createCalls = opts.createCalls ?? [];

  return {
    ...noopConnectProvider,
    async createTransfer(input: CreateConnectTransferInput): Promise<ConnectTransferRef> {
      createCalls.push(input.idempotencyKey);
      if (timeoutOnKeys.has(input.idempotencyKey) && !timedOutOnce.has(input.idempotencyKey)) {
        timedOutOnce.add(input.idempotencyKey);
        // Simulate Stripe accepting then client timeout: store transfer, throw
        const stored: ConnectTransferRef = {
          externalTransferId: `tr_${input.idempotencyKey}`,
          amountCents: input.amountCents,
          currency: input.currency,
          destinationAccountId: input.destinationOwnerAccountId,
          status: "paid"
        };
        transfers.set(input.idempotencyKey, stored);
        transfers.set(stored.externalTransferId, stored);
        throw new Error("network timeout");
      }
      const existing = transfers.get(input.idempotencyKey);
      if (existing) return existing;
      const created: ConnectTransferRef = {
        externalTransferId: `tr_${input.idempotencyKey}`,
        amountCents: input.amountCents,
        currency: input.currency,
        destinationAccountId: input.destinationOwnerAccountId,
        status: "paid"
      };
      transfers.set(input.idempotencyKey, created);
      transfers.set(created.externalTransferId, created);
      return created;
    },
    async getTransfer(externalTransferId: string): Promise<ConnectTransferRef> {
      const hit = transfers.get(externalTransferId);
      if (!hit) throw new Error("No such transfer: resource_missing");
      return hit;
    }
  };
}

describe("M1 — double-pay / claim safety", () => {
  it("counts needs_reconcile as transferred", () => {
    expect(intentStatusCountsAsTransferred("needs_reconcile")).toBe(true);
    expect(claimBlockedByIntent({ status: "needs_reconcile" })).toBe(true);
    expect(claimBlockedByIntent({ status: "failed", external_transfer_id: "tr_x" })).toBe(true);
    expect(claimBlockedByIntent({ status: "failed" })).toBe(false);
  });

  it("blocks failed supersede when ambiguous intents remain", () => {
    expect(
      failedRunMaySupersede({
        runStatus: "failed",
        intents: [{ status: "needs_reconcile" }]
      })
    ).toBe(false);
    expect(
      failedRunMaySupersede({
        runStatus: "failed",
        intents: [{ status: "failed" }]
      })
    ).toBe(true);
  });

  it("blocks new claim for partial/running/succeeded", () => {
    expect(runStatusBlocksNewClaim("partial")).toBe(true);
    expect(runStatusBlocksNewClaim("failed")).toBe(false);
  });

  it("timeout → needs_reconcile → period cannot be re-allocated (intent gate)", async () => {
    const createCalls: string[] = [];
    const provider = makeProvider({
      timeoutOnKeys: new Set(["fin003-intent-1-a1"]),
      createCalls
    });
    const state = { intent: baseIntent(), attempts: [] as CycleAttempt[] };
    const first = await runTransferIntentCycle({
      intent: state.intent,
      lastAttempt: null,
      provider,
      organizationId: "org",
      payoutRunId: "run",
      loadDistributable: async () => ({ distributableCents: 1000, incomplete: false }),
      persist: memoryPersist(state)
    });
    expect(first.outcome).toBe("needs_reconcile");
    expect(state.intent.status).toBe("needs_reconcile");
    expect(claimBlockedByIntent(state.intent)).toBe(true);

    // A naive second create while still needs_reconcile must reconcile, not open a2
    const second = await runTransferIntentCycle({
      intent: { ...state.intent },
      lastAttempt: state.attempts[state.attempts.length - 1] ?? null,
      provider,
      organizationId: "org",
      payoutRunId: "run",
      loadDistributable: async () => ({ distributableCents: 1000, incomplete: false }),
      persist: memoryPersist(state)
    });
    expect(second.outcome).toBe("succeeded");
    if (second.outcome === "succeeded") expect(second.via).toBe("reconcile");
    // Only one logical Stripe create key for a1 (timeout + idempotent replay)
    expect(createCalls.filter((k) => k.endsWith("-a1")).length).toBeGreaterThanOrEqual(1);
    expect(createCalls.some((k) => k.endsWith("-a2"))).toBe(false);
  });
});

describe("M2 — recompute before create", () => {
  it("rejects intent above fresh distributable", () => {
    expect(
      intentAllowedByDistributable({
        intentAmountCents: 500,
        distributableCents: 100,
        incomplete: false
      }).ok
    ).toBe(false);
  });

  it("skips create when distributable shrinks", async () => {
    const provider = makeProvider({});
    const state = { intent: baseIntent({ amount_cents: 1000 }), attempts: [] as CycleAttempt[] };
    const result = await runTransferIntentCycle({
      intent: state.intent,
      lastAttempt: null,
      provider,
      organizationId: "org",
      payoutRunId: "run",
      loadDistributable: async () => ({ distributableCents: 200, incomplete: false }),
      persist: memoryPersist(state)
    });
    expect(result.outcome).toBe("skipped");
    expect(state.intent.status).toBe("skipped");
  });
});

describe("M3 — getTransfer reconciliation", () => {
  it("marks paid when getTransfer finds transfer id", async () => {
    const transfers = new Map<string, ConnectTransferRef>();
    transfers.set("tr_known", {
      externalTransferId: "tr_known",
      amountCents: 1000,
      currency: "usd",
      destinationAccountId: "acct_owner",
      status: "paid"
    });
    const provider = makeProvider({ transfers });
    const state = {
      intent: baseIntent({
        status: "needs_reconcile",
        external_transfer_id: "tr_known"
      }),
      attempts: [
        {
          id: "att-1",
          attempt_number: 1,
          idempotency_key: "fin003-intent-1-a1",
          status: "unknown" as const,
          external_transfer_id: "tr_known"
        }
      ]
    };
    const result = await runTransferIntentCycle({
      intent: state.intent,
      lastAttempt: state.attempts[0]!,
      provider,
      organizationId: "org",
      payoutRunId: "run",
      loadDistributable: async () => ({ distributableCents: 1000, incomplete: false }),
      persist: memoryPersist(state)
    });
    expect(result.outcome).toBe("succeeded");
    if (result.outcome === "succeeded") expect(result.via).toBe("reconcile");
    expect(state.intent.status).toBe("paid");
  });

  it("interpretReconcileTransfer maps missing to clear_for_retry", () => {
    expect(
      interpretReconcileTransfer({
        transfer: null,
        retrieveError: "No such transfer: resource_missing"
      }).action
    ).toBe("clear_for_retry");
  });
});

describe("M6 — duplicate / concurrent / lost acknowledgement / replay", () => {
  it("duplicate execution is idempotent via same idempotency key", async () => {
    const createCalls: string[] = [];
    const provider = makeProvider({ createCalls });
    const state = { intent: baseIntent(), attempts: [] as CycleAttempt[] };
    const persist = memoryPersist(state);
    const a = await runTransferIntentCycle({
      intent: state.intent,
      lastAttempt: null,
      provider,
      organizationId: "org",
      payoutRunId: "run",
      loadDistributable: async () => ({ distributableCents: 1000, incomplete: false }),
      persist
    });
    expect(a.outcome).toBe("succeeded");
    const b = await runTransferIntentCycle({
      intent: { ...state.intent },
      lastAttempt: state.attempts[0]!,
      provider,
      organizationId: "org",
      payoutRunId: "run",
      loadDistributable: async () => ({ distributableCents: 0, incomplete: false }),
      persist: memoryPersist(state)
    });
    expect(b.outcome).toBe("succeeded");
    if (b.outcome === "succeeded") expect(b.via).toBe("existing");
  });

  it("lost acknowledgement recovers via idempotent replay", async () => {
    const createCalls: string[] = [];
    const provider = makeProvider({
      timeoutOnKeys: new Set(["fin003-intent-1-a1"]),
      createCalls
    });
    const state = { intent: baseIntent(), attempts: [] as CycleAttempt[] };
    await runTransferIntentCycle({
      intent: state.intent,
      lastAttempt: null,
      provider,
      organizationId: "org",
      payoutRunId: "run",
      loadDistributable: async () => ({ distributableCents: 1000, incomplete: false }),
      persist: memoryPersist(state)
    });
    expect(state.intent.status).toBe("needs_reconcile");
    // Simulate lost local transfer id (only attempt unknown)
    state.intent.external_transfer_id = null;
    const recovered = await runTransferIntentCycle({
      intent: { ...state.intent },
      lastAttempt: state.attempts[0]!,
      provider,
      organizationId: "org",
      payoutRunId: "run",
      loadDistributable: async () => ({ distributableCents: 1000, incomplete: false }),
      persist: memoryPersist(state)
    });
    expect(recovered.outcome).toBe("succeeded");
    expect(state.intent.external_transfer_id).toMatch(/^tr_/);
  });

  it("concurrent claim helper allows only idle executable statuses (R-C1)", () => {
    expect(mayClaimRunForExecute("queued")).toBe(true);
    expect(mayClaimRunForExecute("running")).toBe(false); // live lease — steal only if expired
    expect(mayClaimRunForExecute("succeeded")).toBe(false);
    expect(mayClaimRunForExecute("draft")).toBe(false);
  });

  it("canOpenNewAttempt blocks unknown and succeeded", () => {
    expect(
      canOpenNewAttempt({
        intentStatus: "eligible",
        externalTransferId: null,
        lastAttemptStatus: "unknown"
      })
    ).toBe(false);
    expect(
      canOpenNewAttempt({
        intentStatus: "failed",
        externalTransferId: null,
        lastAttemptStatus: "failed"
      })
    ).toBe(true);
  });

  it("webhook-shaped reconcile via getTransfer is replay-safe", async () => {
    // Second reconcile after already paid is existing short-circuit
    const transfers = new Map<string, ConnectTransferRef>();
    transfers.set("tr_replay", {
      externalTransferId: "tr_replay",
      amountCents: 1000,
      currency: "usd",
      destinationAccountId: "acct_owner",
      status: "paid"
    });
    const provider = makeProvider({ transfers });
    const state = {
      intent: baseIntent({ status: "paid", external_transfer_id: "tr_replay" }),
      attempts: [] as CycleAttempt[]
    };
    const once = await runTransferIntentCycle({
      intent: state.intent,
      lastAttempt: null,
      provider,
      organizationId: "org",
      payoutRunId: "run",
      loadDistributable: async () => ({ distributableCents: 0, incomplete: false }),
      persist: memoryPersist(state)
    });
    const twice = await runTransferIntentCycle({
      intent: state.intent,
      lastAttempt: null,
      provider,
      organizationId: "org",
      payoutRunId: "run",
      loadDistributable: async () => ({ distributableCents: 0, incomplete: false }),
      persist: memoryPersist(state)
    });
    expect(once.outcome).toBe("succeeded");
    expect(twice.outcome).toBe("succeeded");
    if (twice.outcome === "succeeded") expect(twice.via).toBe("existing");
  });
});
