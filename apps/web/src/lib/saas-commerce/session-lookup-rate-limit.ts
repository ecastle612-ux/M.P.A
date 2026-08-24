/**
 * STAB-009 — abuse protection for public commerce session lookups.
 * Delegates to the shared durable limiter (Postgres + memory fallback).
 */

import {
  clearDurableRateLimitForTests,
  consumeRateLimit,
  requestActorKey
} from "../security/durable-rate-limit";

export function clearCommerceSessionLookupRateLimitForTests(): void {
  clearDurableRateLimitForTests("APPLICATION:commerce-session:");
}

/** Returns true when allowed; false when rate-limited. */
export async function consumeCommerceSessionLookupRateLimit(key: string): Promise<boolean> {
  return consumeRateLimit({ class: "APPLICATION", key: `commerce-session:${key}` });
}

export function clientLookupKey(request: Request, sessionId: string): string {
  return requestActorKey(request, sessionId);
}
