import { describe, expect, it, beforeEach } from "vitest";
import {
  RATE_LIMIT_WINDOWS,
  WEBHOOK_RATE_LIMIT_EXEMPT_PATHS,
  clearDurableRateLimitForTests,
  consumeRateLimit,
  isWebhookRateLimitExemptPath,
  requestActorKey
} from "./durable-rate-limit";

describe("SEC-001 durable rate limit", () => {
  beforeEach(() => {
    clearDurableRateLimitForTests();
  });

  it("rate-limits AUTH after the shared threshold", async () => {
    let allowed = 0;
    let blocked = 0;
    for (let i = 0; i < RATE_LIMIT_WINDOWS.AUTH.limit + 3; i += 1) {
      if (await consumeRateLimit({ class: "AUTH", key: "claim-password:203.0.113.10:a" })) {
        allowed += 1;
      } else {
        blocked += 1;
      }
    }
    expect(allowed).toBe(RATE_LIMIT_WINDOWS.AUTH.limit);
    expect(blocked).toBe(3);
  });

  it("keeps PUBLIC, APPLICATION, and ADMIN classes independent", async () => {
    expect(await consumeRateLimit({ class: "PUBLIC", key: "same-ip" })).toBe(true);
    expect(await consumeRateLimit({ class: "APPLICATION", key: "same-ip" })).toBe(true);
    expect(await consumeRateLimit({ class: "ADMIN", key: "same-ip" })).toBe(true);
  });

  it("never lists provider webhooks as limited paths", () => {
    expect(WEBHOOK_RATE_LIMIT_EXEMPT_PATHS).toEqual([
      "/api/commerce/webhooks/stripe",
      "/api/finance/webhooks/stripe",
      "/api/leasing/webhooks/signwell"
    ]);
    expect(isWebhookRateLimitExemptPath("/api/commerce/webhooks/stripe")).toBe(true);
    expect(isWebhookRateLimitExemptPath("/api/admin/search")).toBe(false);
  });

  it("builds a stable actor key from forwarded IP", () => {
    const request = new Request("http://localhost/api/x", {
      headers: { "x-forwarded-for": "198.51.100.20, 10.0.0.1" }
    });
    expect(requestActorKey(request, "session")).toBe("198.51.100.20:session");
  });
});
