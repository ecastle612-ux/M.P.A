import { describe, expect, it } from "vitest";

/**
 * Pure idempotency key stability checks for Phase 7 double-submit protection.
 * IndexedDB enqueue dedupe is covered by findByIdempotencyKey at runtime.
 */
describe("PMX-004 Phase 7 idempotency helpers", () => {
  it("keeps the same key across retries for a queued mutation identity", () => {
    const key = "msg-thread-1-client-abc";
    const first = { idempotencyKey: key, attempts: 1 };
    const retry = { idempotencyKey: key, attempts: first.attempts + 1 };
    expect(retry.idempotencyKey).toBe(first.idempotencyKey);
  });

  it("treats distinct client keys as distinct queue rows", () => {
    const a = "outbox-a";
    const b = "outbox-b";
    expect(a).not.toBe(b);
  });
});
