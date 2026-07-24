/**
 * FIN-003 Phase C hardening — single-intent execute/reconcile cycle (M2/M3/M6).
 * Injectable provider + persistence callbacks for orchestration tests.
 */
import type { ConnectProvider, ConnectTransferRef } from "../integrations/connect/contracts";
import {
  canOpenNewAttempt,
  intentAllowedByDistributable,
  interpretReconcileTransfer,
  type AttemptStatus
} from "./transfer-safety";

export type CycleIntent = {
  id: string;
  status: string;
  amount_cents: number;
  currency: string;
  source_settlement_account_id: string;
  destination_owner_account_id: string;
  external_transfer_id: string | null;
  owner_user_id: string;
  property_id: string;
  period_start: string;
  period_end: string;
};

export type CycleAttempt = {
  id: string;
  attempt_number: number;
  idempotency_key: string;
  status: AttemptStatus;
  external_transfer_id: string | null;
};

export type CycleResult =
  | { outcome: "succeeded"; externalTransferId: string; via: "existing" | "reconcile" | "create" }
  | { outcome: "failed"; reason: string }
  | { outcome: "needs_reconcile"; reason: string }
  | { outcome: "skipped"; reason: string };

export type CyclePersistence = {
  markIntentPaid: (externalTransferId: string) => Promise<void>;
  markIntentFailed: (reason: string) => Promise<void>;
  markIntentNeedsReconcile: (reason: string) => Promise<void>;
  markIntentEligibleForRetry: (reason: string) => Promise<void>;
  markIntentSkipped: (reason: string) => Promise<void>;
  markIntentExecuting: () => Promise<void>;
  insertAttempt: (input: {
    attemptNumber: number;
    idempotencyKey: string;
  }) => Promise<{ id: string }>;
  updateAttempt: (
    attemptId: string,
    patch: {
      status: AttemptStatus;
      external_transfer_id?: string | null;
      error_message?: string | null;
    }
  ) => Promise<void>;
};

function isTimeoutLike(message: string): boolean {
  return /timeout|econnreset|network|fetch failed|socket hang up/i.test(message);
}

function needsReconcilePass(
  intent: CycleIntent,
  lastAttempt: CycleAttempt | null
): boolean {
  return (
    intent.status === "needs_reconcile" ||
    intent.status === "executing" ||
    lastAttempt?.status === "unknown" ||
    lastAttempt?.status === "created"
  );
}

type ReconcilePassResult =
  | { kind: "done"; result: CycleResult }
  | { kind: "cleared"; lastAttempt: CycleAttempt | null };

async function reconcileAmbiguous(input: {
  intent: CycleIntent;
  lastAttempt: CycleAttempt | null;
  provider: ConnectProvider;
  persist: CyclePersistence;
  organizationId: string;
  payoutRunId: string;
}): Promise<ReconcilePassResult> {
  const { intent, lastAttempt, provider, persist } = input;
  const transferId =
    intent.external_transfer_id ?? lastAttempt?.external_transfer_id ?? null;

  // Path A: getTransfer when we have an id (M3)
  if (transferId) {
    try {
      const transfer = await provider.getTransfer(
        transferId,
        intent.source_settlement_account_id
      );
      const interpreted = interpretReconcileTransfer({ transfer });
      if (interpreted.action === "mark_paid") {
        if (lastAttempt) {
          await persist.updateAttempt(lastAttempt.id, {
            status: "succeeded",
            external_transfer_id: interpreted.externalTransferId
          });
        }
        await persist.markIntentPaid(interpreted.externalTransferId);
        return {
          kind: "done",
          result: {
            outcome: "succeeded",
            externalTransferId: interpreted.externalTransferId,
            via: "reconcile"
          }
        };
      }
      if (interpreted.action === "mark_failed") {
        if (lastAttempt) {
          await persist.updateAttempt(lastAttempt.id, {
            status: "failed",
            error_message: interpreted.reason
          });
        }
        await persist.markIntentFailed(interpreted.reason);
        return {
          kind: "done",
          result: { outcome: "failed", reason: interpreted.reason }
        };
      }
      if (interpreted.action === "clear_for_retry") {
        let clearedAttempt = lastAttempt;
        if (lastAttempt) {
          await persist.updateAttempt(lastAttempt.id, {
            status: "failed",
            error_message: interpreted.reason
          });
          clearedAttempt = { ...lastAttempt, status: "failed" };
        }
        await persist.markIntentEligibleForRetry(interpreted.reason);
        return { kind: "cleared", lastAttempt: clearedAttempt };
      }
      await persist.markIntentNeedsReconcile(interpreted.reason);
      return {
        kind: "done",
        result: { outcome: "needs_reconcile", reason: interpreted.reason }
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : "getTransfer failed";
      const interpreted = interpretReconcileTransfer({
        transfer: null,
        retrieveError: message
      });
      if (interpreted.action === "clear_for_retry") {
        let clearedAttempt = lastAttempt;
        if (lastAttempt) {
          await persist.updateAttempt(lastAttempt.id, {
            status: "failed",
            error_message: message
          });
          clearedAttempt = { ...lastAttempt, status: "failed" };
        }
        await persist.markIntentEligibleForRetry(message);
        return { kind: "cleared", lastAttempt: clearedAttempt };
      }
      await persist.markIntentNeedsReconcile(message);
      return {
        kind: "done",
        result: { outcome: "needs_reconcile", reason: message }
      };
    }
  }

  // Path B: lost acknowledgement — idempotent replay with same key
  if (lastAttempt && (lastAttempt.status === "unknown" || lastAttempt.status === "created")) {
    try {
      const transfer = await provider.createTransfer({
        sourceSettlementAccountId: intent.source_settlement_account_id,
        destinationOwnerAccountId: intent.destination_owner_account_id,
        amountCents: intent.amount_cents,
        currency: intent.currency,
        idempotencyKey: lastAttempt.idempotency_key,
        metadata: {
          organizationId: input.organizationId,
          payoutRunId: input.payoutRunId,
          transferIntentId: intent.id,
          attemptNumber: lastAttempt.attempt_number
        }
      });
      let confirmed: ConnectTransferRef = transfer;
      try {
        confirmed = await provider.getTransfer(
          transfer.externalTransferId,
          intent.source_settlement_account_id
        );
      } catch {
        confirmed = transfer;
      }
      const interpreted = interpretReconcileTransfer({ transfer: confirmed });
      if (interpreted.action === "mark_paid") {
        await persist.updateAttempt(lastAttempt.id, {
          status: "succeeded",
          external_transfer_id: interpreted.externalTransferId
        });
        await persist.markIntentPaid(interpreted.externalTransferId);
        return {
          kind: "done",
          result: {
            outcome: "succeeded",
            externalTransferId: interpreted.externalTransferId,
            via: "reconcile"
          }
        };
      }
      if (interpreted.action === "mark_failed") {
        await persist.updateAttempt(lastAttempt.id, {
          status: "failed",
          error_message: interpreted.reason
        });
        await persist.markIntentFailed(interpreted.reason);
        return {
          kind: "done",
          result: { outcome: "failed", reason: interpreted.reason }
        };
      }
      await persist.markIntentNeedsReconcile(interpreted.reason);
      return {
        kind: "done",
        result: { outcome: "needs_reconcile", reason: interpreted.reason }
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Idempotent replay failed";
      if (isTimeoutLike(message)) {
        await persist.updateAttempt(lastAttempt.id, {
          status: "unknown",
          error_message: message
        });
        await persist.markIntentNeedsReconcile(message);
        return {
          kind: "done",
          result: { outcome: "needs_reconcile", reason: message }
        };
      }
      await persist.updateAttempt(lastAttempt.id, {
        status: "failed",
        error_message: message
      });
      await persist.markIntentEligibleForRetry(message);
      return {
        kind: "cleared",
        lastAttempt: { ...lastAttempt, status: "failed" }
      };
    }
  }

  await persist.markIntentNeedsReconcile("Ambiguous transfer state without recoverable id");
  return {
    kind: "done",
    result: {
      outcome: "needs_reconcile",
      reason: "Ambiguous transfer state without recoverable id"
    }
  };
}

/**
 * Reconcile-or-execute one transfer intent (hardening core).
 */
export async function runTransferIntentCycle(input: {
  intent: CycleIntent;
  lastAttempt: CycleAttempt | null;
  provider: ConnectProvider;
  organizationId: string;
  payoutRunId: string;
  loadDistributable: () => Promise<{
    distributableCents: number;
    incomplete: boolean;
  }>;
  persist: CyclePersistence;
}): Promise<CycleResult> {
  const { intent, provider, persist } = input;
  let lastAttempt = input.lastAttempt;

  if (
    intent.external_transfer_id &&
    (intent.status === "paid" || intent.status === "in_transit")
  ) {
    return {
      outcome: "succeeded",
      externalTransferId: intent.external_transfer_id,
      via: "existing"
    };
  }

  if (needsReconcilePass(intent, lastAttempt)) {
    const pass = await reconcileAmbiguous({
      intent,
      lastAttempt,
      provider,
      persist,
      organizationId: input.organizationId,
      payoutRunId: input.payoutRunId
    });
    if (pass.kind === "done") return pass.result;
    lastAttempt = pass.lastAttempt;
  } else if (
    !canOpenNewAttempt({
      intentStatus: intent.status,
      externalTransferId: intent.external_transfer_id,
      lastAttemptStatus: lastAttempt?.status ?? null
    })
  ) {
    if (intent.external_transfer_id) {
      return {
        outcome: "succeeded",
        externalTransferId: intent.external_transfer_id,
        via: "existing"
      };
    }
    return {
      outcome: "needs_reconcile",
      reason: "Cannot open new attempt in current state"
    };
  }

  // M2 — recompute distributable immediately before create
  const distributable = await input.loadDistributable();
  const allowed = intentAllowedByDistributable({
    intentAmountCents: intent.amount_cents,
    distributableCents: distributable.distributableCents,
    incomplete: distributable.incomplete
  });
  if (!allowed.ok) {
    await persist.markIntentSkipped(allowed.reason);
    return { outcome: "skipped", reason: allowed.reason };
  }

  const attemptNumber = lastAttempt ? lastAttempt.attempt_number + 1 : 1;
  const idempotencyKey = `fin003-${intent.id}-a${attemptNumber}`;
  const attempt = await persist.insertAttempt({ attemptNumber, idempotencyKey });
  await persist.markIntentExecuting();

  try {
    const transfer = await provider.createTransfer({
      sourceSettlementAccountId: intent.source_settlement_account_id,
      destinationOwnerAccountId: intent.destination_owner_account_id,
      amountCents: intent.amount_cents,
      currency: intent.currency,
      idempotencyKey,
      metadata: {
        organizationId: input.organizationId,
        payoutRunId: input.payoutRunId,
        transferIntentId: intent.id,
        attemptNumber
      }
    });

    let confirmed = transfer;
    try {
      confirmed = await provider.getTransfer(
        transfer.externalTransferId,
        intent.source_settlement_account_id
      );
    } catch {
      confirmed = transfer;
    }

    await persist.updateAttempt(attempt.id, {
      status: "succeeded",
      external_transfer_id: confirmed.externalTransferId
    });
    await persist.markIntentPaid(confirmed.externalTransferId);
    return {
      outcome: "succeeded",
      externalTransferId: confirmed.externalTransferId,
      via: "create"
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Transfer failed";
    if (isTimeoutLike(message)) {
      await persist.updateAttempt(attempt.id, {
        status: "unknown",
        error_message: message
      });
      await persist.markIntentNeedsReconcile(message);
      return { outcome: "needs_reconcile", reason: message };
    }
    await persist.updateAttempt(attempt.id, {
      status: "failed",
      error_message: message
    });
    await persist.markIntentFailed(message);
    return { outcome: "failed", reason: message };
  }
}
