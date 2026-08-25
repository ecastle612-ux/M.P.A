import { describe, expect, it, vi } from "vitest";
import { verifyFinanceStripeWebhook } from "./verify-finance-stripe-webhook";

const platformEvent = { id: "evt_platform", type: "payment_intent.succeeded" };
const connectEvent = { id: "evt_connect", type: "payment_intent.succeeded" };

describe("verifyFinanceStripeWebhook", () => {
  it("accepts a platform-signed event with STRIPE_WEBHOOK_SECRET", () => {
    const constructEvent = vi.fn(( _body, _sig, secret: string) => {
      if (secret === "whsec_platform") return platformEvent;
      throw new Error("No signatures found matching the expected signature for payload");
    });

    const result = verifyFinanceStripeWebhook({
      constructEvent: constructEvent as never,
      body: '{"id":"evt_platform"}',
      signature: "t=1,v1=platform",
      platformSecret: "whsec_platform",
      connectSecret: "whsec_connect"
    });

    expect(result).toEqual({ ok: true, event: platformEvent, verifiedWith: "platform" });
    expect(constructEvent).toHaveBeenCalledTimes(1);
    expect(constructEvent).toHaveBeenCalledWith('{"id":"evt_platform"}', "t=1,v1=platform", "whsec_platform");
  });

  it("accepts a Connect-signed event only after constructEvent succeeds with STRIPE_CONNECT_WEBHOOK_SECRET", () => {
    const constructEvent = vi.fn(( _body, _sig, secret: string) => {
      if (secret === "whsec_connect") return connectEvent;
      throw new Error("No signatures found matching the expected signature for payload");
    });

    const result = verifyFinanceStripeWebhook({
      constructEvent: constructEvent as never,
      body: '{"id":"evt_connect"}',
      signature: "t=1,v1=connect",
      platformSecret: "whsec_platform",
      connectSecret: "whsec_connect"
    });

    expect(result).toEqual({ ok: true, event: connectEvent, verifiedWith: "connect" });
    expect(constructEvent).toHaveBeenCalledTimes(2);
    expect(constructEvent).toHaveBeenNthCalledWith(1, '{"id":"evt_connect"}', "t=1,v1=connect", "whsec_platform");
    expect(constructEvent).toHaveBeenNthCalledWith(2, '{"id":"evt_connect"}', "t=1,v1=connect", "whsec_connect");
  });

  it("rejects when both configured secrets fail constructEvent", () => {
    const constructEvent = vi.fn(() => {
      throw new Error("No signatures found matching the expected signature for payload");
    });

    const result = verifyFinanceStripeWebhook({
      constructEvent,
      body: "{}",
      signature: "t=1,v1=forged",
      platformSecret: "whsec_platform",
      connectSecret: "whsec_connect"
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(400);
      expect(result.error).toMatch(/signature/i);
    }
    expect(constructEvent).toHaveBeenCalledTimes(2);
  });

  it("does not accept a Connect-signed event when the Connect secret is missing", () => {
    const constructEvent = vi.fn(() => {
      throw new Error("No signatures found matching the expected signature for payload");
    });

    const result = verifyFinanceStripeWebhook({
      constructEvent,
      body: "{}",
      signature: "t=1,v1=connect",
      platformSecret: "whsec_platform"
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(400);
    }
    expect(constructEvent).toHaveBeenCalledTimes(1);
  });

  it("does not use a SaaS secret and refuses when platform secret is missing", () => {
    const constructEvent = vi.fn();
    const result = verifyFinanceStripeWebhook({
      constructEvent,
      body: "{}",
      signature: "t=1,v1=saas",
      platformSecret: null,
      connectSecret: "whsec_connect"
    });
    expect(result).toEqual({ ok: false, status: 503, error: "Stripe webhook not configured" });
    expect(constructEvent).not.toHaveBeenCalled();
  });

  it("refuses a missing signature without calling constructEvent", () => {
    const constructEvent = vi.fn();
    const result = verifyFinanceStripeWebhook({
      constructEvent,
      body: "{}",
      signature: null,
      platformSecret: "whsec_platform",
      connectSecret: "whsec_connect"
    });
    expect(result).toEqual({ ok: false, status: 400, error: "Missing signature" });
    expect(constructEvent).not.toHaveBeenCalled();
  });
});
