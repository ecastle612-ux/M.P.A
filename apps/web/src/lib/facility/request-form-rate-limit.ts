const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 12;

type Bucket = { count: number; windowStartedAt: number };

const globalStore = globalThis as typeof globalThis & {
  __mpaFacilityRequestRateLimit?: Map<string, Bucket>;
};

function buckets(): Map<string, Bucket> {
  if (!globalStore.__mpaFacilityRequestRateLimit) {
    globalStore.__mpaFacilityRequestRateLimit = new Map();
  }
  return globalStore.__mpaFacilityRequestRateLimit;
}

export function clearFacilityRequestRateLimitForTests(): void {
  globalStore.__mpaFacilityRequestRateLimit = new Map();
}

/** Returns true when allowed; false when rate-limited. */
export function consumeFacilityRequestRateLimit(key: string): boolean {
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
