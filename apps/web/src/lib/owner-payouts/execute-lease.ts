/**
 * FIN-003 Phase C R-C1 — exclusive execute lease helpers (pure).
 * Single execution authority with expiry-based crash recovery.
 */

/** Default lease TTL — long enough for a typical run; renewed per intent. */
export const EXECUTE_LEASE_TTL_MS = 5 * 60 * 1000;

export type LeaseDecision = "acquire" | "steal" | "deny";

/**
 * Decide whether a worker may take the execute lease for this run snapshot.
 * - acquire: status is idle-executable (queued/partial/failed)
 * - steal: running but lease missing/expired (crash recovery)
 * - deny: another worker holds a live lease
 */
export function decideExecuteLeaseAction(input: {
  status: string;
  leaseExpiresAt: string | null | undefined;
  nowMs: number;
}): LeaseDecision {
  const { status, nowMs } = input;
  if (status === "queued" || status === "partial" || status === "failed") {
    return "acquire";
  }
  if (status === "running") {
    if (isExecuteLeaseExpired(input.leaseExpiresAt, nowMs)) return "steal";
    return "deny";
  }
  return "deny";
}

export function isExecuteLeaseExpired(
  leaseExpiresAt: string | null | undefined,
  nowMs: number
): boolean {
  if (leaseExpiresAt == null || leaseExpiresAt === "") return true;
  const expires = Date.parse(leaseExpiresAt);
  if (!Number.isFinite(expires)) return true;
  return expires <= nowMs;
}

export function computeLeaseExpiryIso(nowMs: number, ttlMs = EXECUTE_LEASE_TTL_MS): string {
  return new Date(nowMs + ttlMs).toISOString();
}

export function newExecuteLeaseToken(): string {
  const rand =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `lease-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `fin003-exec-${rand}`;
}

/**
 * Models Postgres row-lock serialization for concurrent lease claims on one run.
 * First eligible claimer wins; later claimers re-evaluate against the winner's lease.
 */
export function simulateSerializedLeaseClaims(input: {
  initial: { status: string; leaseExpiresAt: string | null };
  claimers: Array<{ nowMs: number }>;
  ttlMs?: number;
}): Array<{ decision: LeaseDecision; won: boolean; token: string | null }> {
  let status = input.initial.status;
  let leaseExpiresAt = input.initial.leaseExpiresAt;
  let token: string | null = null;
  const ttlMs = input.ttlMs ?? EXECUTE_LEASE_TTL_MS;
  const results: Array<{ decision: LeaseDecision; won: boolean; token: string | null }> = [];

  for (const claimer of input.claimers) {
    const decision = decideExecuteLeaseAction({
      status,
      leaseExpiresAt,
      nowMs: claimer.nowMs
    });
    if (decision === "deny") {
      results.push({ decision, won: false, token: null });
      continue;
    }
    // Winner updates row (serialized)
    token = newExecuteLeaseToken();
    status = "running";
    leaseExpiresAt = computeLeaseExpiryIso(claimer.nowMs, ttlMs);
    results.push({ decision, won: true, token });
  }
  return results;
}
