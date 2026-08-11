/**
 * In-memory abuse protection for public claim-password.
 * Follows the capacity-intent-store pattern (process-local Map).
 */

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 8;

type Bucket = { count: number; windowStartedAt: number };

const globalStore = globalThis as typeof globalThis & {
  __mpaClaimPasswordRateLimit?: Map<string, Bucket>;
};

function buckets(): Map<string, Bucket> {
  if (!globalStore.__mpaClaimPasswordRateLimit) {
    globalStore.__mpaClaimPasswordRateLimit = new Map();
  }
  return globalStore.__mpaClaimPasswordRateLimit;
}

export function clearClaimPasswordRateLimitForTests(): void {
  globalStore.__mpaClaimPasswordRateLimit = new Map();
}

/** Returns true when the key is allowed; false when rate-limited. */
export function consumeClaimPasswordRateLimit(key: string): boolean {
  const normalized = key.trim().toLowerCase();
  if (!normalized) return false;
  const now = Date.now();
  const map = buckets();
  const existing = map.get(normalized);
  if (!existing || now - existing.windowStartedAt > WINDOW_MS) {
    map.set(normalized, { count: 1, windowStartedAt: now });
    return true;
  }
  if (existing.count >= MAX_ATTEMPTS) {
    return false;
  }
  existing.count += 1;
  return true;
}
