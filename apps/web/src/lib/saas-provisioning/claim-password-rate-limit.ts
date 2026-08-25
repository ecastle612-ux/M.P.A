/**
 * Abuse protection for public claim-password.
 * Delegates to the shared durable limiter (Postgres + memory fallback).
 */

import {
  clearDurableRateLimitForTests,
  consumeRateLimit
} from "../security/durable-rate-limit";

export function clearClaimPasswordRateLimitForTests(): void {
  clearDurableRateLimitForTests("AUTH:claim-password:");
}

/** Returns true when the key is allowed; false when rate-limited. */
export async function consumeClaimPasswordRateLimit(key: string): Promise<boolean> {
  return consumeRateLimit({ class: "AUTH", key: `claim-password:${key}` });
}
