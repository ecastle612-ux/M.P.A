export type RateLimitOptions = {
  limit: number;
  windowMs: number;
};

export type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  retryAfterSeconds: number;
};

type Bucket = {
  count: number;
  resetAt: number;
};

/**
 * Process-local fixed-window store. NOTE: this is per-instance only. A shared/distributed
 * limiter store (e.g. Postgres/Upstash) is a documented follow-up in ADR-015 §4.2.
 */
const buckets = new Map<string, Bucket>();
const MAX_TRACKED_KEYS = 10_000;

function prune(now: number): void {
  if (buckets.size < MAX_TRACKED_KEYS) return;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

/**
 * Fixed-window rate limit check. Fail-open: on any internal error the request is allowed
 * so that the limiter can never take down a route.
 */
export function rateLimit(key: string, options: RateLimitOptions): RateLimitResult {
  try {
    const now = Date.now();
    prune(now);

    const existing = buckets.get(key);
    if (!existing || existing.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + options.windowMs });
      return {
        allowed: true,
        limit: options.limit,
        remaining: Math.max(0, options.limit - 1),
        retryAfterSeconds: Math.ceil(options.windowMs / 1000)
      };
    }

    existing.count += 1;
    const remaining = Math.max(0, options.limit - existing.count);
    const retryAfterSeconds = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
    return {
      allowed: existing.count <= options.limit,
      limit: options.limit,
      remaining,
      retryAfterSeconds
    };
  } catch {
    return {
      allowed: true,
      limit: options.limit,
      remaining: options.limit,
      retryAfterSeconds: 0
    };
  }
}
