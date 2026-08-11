/**
 * STAB-009 — abuse protection for public commerce session lookups.
 * Process-local Map (same pattern as claim-password rate limit).
 */

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 30;

type Bucket = { count: number; windowStartedAt: number };

const globalStore = globalThis as typeof globalThis & {
  __mpaCommerceSessionLookupRateLimit?: Map<string, Bucket>;
};

function buckets(): Map<string, Bucket> {
  if (!globalStore.__mpaCommerceSessionLookupRateLimit) {
    globalStore.__mpaCommerceSessionLookupRateLimit = new Map();
  }
  return globalStore.__mpaCommerceSessionLookupRateLimit;
}

export function clearCommerceSessionLookupRateLimitForTests(): void {
  globalStore.__mpaCommerceSessionLookupRateLimit = new Map();
}

/** Returns true when allowed; false when rate-limited. */
export function consumeCommerceSessionLookupRateLimit(key: string): boolean {
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

export function clientLookupKey(request: Request, sessionId: string): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = forwarded || request.headers.get("x-real-ip") || "unknown";
  return `${ip}:${sessionId}`;
}
