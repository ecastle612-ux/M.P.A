/**
 * FIN-003 Phase C hardening — pure money-safety helpers (M1–M3).
 * No I/O. Unit-tested in phase-c-hardening.test.ts.
 */

/** Run statuses that always block a new claim for the same property/period. */
export const RUN_STATUSES_BLOCKING_CLAIM = [
  "queued",
  "running",
  "succeeded",
  "partial"
] as const;

/**
 * Intent statuses that count as money already moved or ambiguous (must not re-allocate).
 * M1: needs_reconcile and executing are treated as transferred until proven otherwise.
 */
export const INTENT_STATUSES_COUNT_AS_TRANSFERRED = [
  "paid",
  "in_transit",
  "executing",
  "needs_reconcile"
] as const;

export type AttemptStatus = "created" | "succeeded" | "failed" | "unknown";

export function runStatusBlocksNewClaim(status: string): boolean {
  return (RUN_STATUSES_BLOCKING_CLAIM as readonly string[]).includes(status);
}

export function intentStatusCountsAsTransferred(status: string): boolean {
  return (INTENT_STATUSES_COUNT_AS_TRANSFERRED as readonly string[]).includes(status);
}

/** Failed runs may supersede only when no money/ambiguous intents remain. */
export function failedRunMaySupersede(input: {
  runStatus: string;
  intents: Array<{ status: string; external_transfer_id?: string | null }>;
}): boolean {
  if (input.runStatus !== "failed" && input.runStatus !== "canceled") return false;
  return !input.intents.some(
    (i) => intentStatusCountsAsTransferred(i.status) || Boolean(i.external_transfer_id)
  );
}

export function claimBlockedByIntent(intent: {
  status: string;
  external_transfer_id?: string | null;
}): boolean {
  if (intentStatusCountsAsTransferred(intent.status)) return true;
  if (intent.external_transfer_id) return true;
  return false;
}

/**
 * R6: new attempt only when prior attempt is definite failure and no transfer id.
 * Unknown / succeeded / created (in-flight) block new attempts.
 */
export function canOpenNewAttempt(input: {
  intentStatus: string;
  externalTransferId: string | null | undefined;
  lastAttemptStatus: AttemptStatus | null;
}): boolean {
  if (input.externalTransferId) return false;
  if (input.intentStatus === "paid" || input.intentStatus === "in_transit") return false;
  if (input.intentStatus === "needs_reconcile" || input.intentStatus === "executing") {
    return false; // must reconcile first
  }
  if (input.lastAttemptStatus === "unknown" || input.lastAttemptStatus === "succeeded") {
    return false;
  }
  if (input.lastAttemptStatus === "created") return false;
  return (
    input.intentStatus === "eligible" ||
    input.intentStatus === "failed" ||
    input.intentStatus === "pending"
  );
}

export type ReconcileOutcome =
  | { action: "mark_paid"; externalTransferId: string }
  | { action: "mark_failed"; reason: string }
  | { action: "clear_for_retry"; reason: string }
  | { action: "still_unknown"; reason: string };

/**
 * Map getTransfer / idempotent-replay result into local state (M3).
 */
export function interpretReconcileTransfer(input: {
  transfer: { externalTransferId: string; status: string } | null;
  retrieveError?: string | null;
}): ReconcileOutcome {
  if (input.retrieveError) {
    const msg = input.retrieveError.toLowerCase();
    if (msg.includes("no such") || msg.includes("not found") || msg.includes("resource_missing")) {
      return { action: "clear_for_retry", reason: input.retrieveError };
    }
    return { action: "still_unknown", reason: input.retrieveError };
  }
  if (!input.transfer) {
    return { action: "clear_for_retry", reason: "No transfer found at provider" };
  }
  const status = input.transfer.status.toLowerCase();
  if (status === "failed" || status === "canceled" || status === "cancelled") {
    return {
      action: "mark_failed",
      reason: `Provider transfer status ${input.transfer.status}`
    };
  }
  if (status === "reversed") {
    return { action: "mark_failed", reason: "Provider transfer reversed" };
  }
  // paid, pending, in_transit, or unknown-success-shaped → treat as money moved
  return {
    action: "mark_paid",
    externalTransferId: input.transfer.externalTransferId
  };
}

/** M2: intent must not exceed freshly recomputed distributable. */
export function intentAllowedByDistributable(input: {
  intentAmountCents: number;
  distributableCents: number;
  incomplete: boolean;
}): { ok: true } | { ok: false; reason: string } {
  if (input.incomplete) {
    return { ok: false, reason: "Distributable facts incomplete at execute" };
  }
  if (input.intentAmountCents > input.distributableCents) {
    return {
      ok: false,
      reason: `Intent ${input.intentAmountCents} exceeds distributable ${input.distributableCents}`
    };
  }
  if (input.intentAmountCents <= 0) {
    return { ok: false, reason: "Intent amount must be positive" };
  }
  return { ok: true };
}

/** Idle statuses that may acquire a fresh execute lease (R-C1). */
export function isExecutableRunStatus(status: string): boolean {
  return status === "queued" || status === "partial" || status === "failed";
}

/**
 * @deprecated Prefer decideExecuteLeaseAction — live `running` leases must deny.
 * Kept for tests: running alone is not claimable without expiry (R-C1).
 */
export function mayClaimRunForExecute(currentStatus: string): boolean {
  return isExecutableRunStatus(currentStatus);
}
