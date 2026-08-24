/**
 * Shared durable rate limiter for multi-instance / serverless Production.
 *
 * Layers (do not implement the same limiter three times):
 * - Vercel edge WAF: login/forgot/reset/public QR/admin observation (Owner-applied)
 * - Supabase Auth: leaked-password + min length + Auth throttling (Owner dashboard)
 * - This module: application-server buckets in Postgres (service role only)
 *
 * Never attach this limiter to provider webhooks or PM cron.
 */

export type RateLimitClass = "AUTH" | "PUBLIC" | "APPLICATION" | "ADMIN";

export const RATE_LIMIT_WINDOWS = {
  AUTH: { limit: 8, windowMs: 15 * 60 * 1000 },
  PUBLIC: { limit: 12, windowMs: 15 * 60 * 1000 },
  APPLICATION: { limit: 30, windowMs: 15 * 60 * 1000 },
  ADMIN: { limit: 60, windowMs: 15 * 60 * 1000 }
} as const;

export const WEBHOOK_RATE_LIMIT_EXEMPT_PATHS = [
  "/api/commerce/webhooks/stripe",
  "/api/finance/webhooks/stripe",
  "/api/leasing/webhooks/signwell"
] as const;

type Bucket = { count: number; windowStartedAt: number };

const globalStore = globalThis as typeof globalThis & {
  __mpaDurableRateLimit?: Map<string, Bucket>;
};

function memoryBuckets(): Map<string, Bucket> {
  if (!globalStore.__mpaDurableRateLimit) {
    globalStore.__mpaDurableRateLimit = new Map();
  }
  return globalStore.__mpaDurableRateLimit;
}

function consumeMemory(bucketKey: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const map = memoryBuckets();
  const existing = map.get(bucketKey);
  if (!existing || now - existing.windowStartedAt > windowMs) {
    map.set(bucketKey, { count: 1, windowStartedAt: now });
    return true;
  }
  if (existing.count >= limit) {
    return false;
  }
  existing.count += 1;
  return true;
}

export function clearDurableRateLimitForTests(keyPrefix?: string): void {
  if (!keyPrefix) {
    globalStore.__mpaDurableRateLimit = new Map();
    return;
  }
  const map = memoryBuckets();
  for (const key of map.keys()) {
    if (key.startsWith(keyPrefix)) {
      map.delete(key);
    }
  }
}

export function requestActorKey(request: Request, suffix = ""): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = forwarded || request.headers.get("x-real-ip") || "unknown";
  return suffix ? `${ip}:${suffix}` : ip;
}

export function isWebhookRateLimitExemptPath(pathname: string): boolean {
  return (WEBHOOK_RATE_LIMIT_EXEMPT_PATHS as readonly string[]).includes(pathname);
}

async function consumeDurable(
  bucketKey: string,
  limit: number,
  windowMs: number
): Promise<boolean | null> {
  if (process.env["VITEST"]) {
    return null;
  }
  try {
    const { serverEnv } = await import("../env/server-env");
    if (!serverEnv.SUPABASE_SERVICE_ROLE_KEY) {
      return null;
    }
    const { createServiceRoleClient } = await import("../supabase/service-role");
    const admin = createServiceRoleClient();
    const { data, error } = await admin.rpc("consume_platform_rate_limit", {
      p_bucket_key: bucketKey,
      p_limit: limit,
      p_window_ms: windowMs
    });
    if (error) {
      return null;
    }
    return data === true;
  } catch {
    return null;
  }
}

/** Returns true when the key is allowed; false when rate-limited. */
export async function consumeRateLimit(input: {
  class: RateLimitClass;
  key: string;
}): Promise<boolean> {
  const normalized = input.key.trim().toLowerCase();
  if (!normalized) return false;
  const { limit, windowMs } = RATE_LIMIT_WINDOWS[input.class];
  const bucketKey = `${input.class}:${normalized}`;
  const durable = await consumeDurable(bucketKey, limit, windowMs);
  if (durable !== null) {
    return durable;
  }
  return consumeMemory(bucketKey, limit, windowMs);
}
