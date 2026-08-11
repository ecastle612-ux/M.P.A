import { beforeEach, describe, expect, it, vi } from "vitest";
import { COM_002_FLAGS } from "@mpa/shared";
import { clearCommerceSessionLookupRateLimitForTests } from "../../../../../lib/saas-commerce/session-lookup-rate-limit";
import { rememberSaasPurchase } from "../../../../../lib/saas-stripe/purchase-store";

vi.mock("../../../../../lib/saas-stripe/client", () => ({
  getSaasStripeClient: () => null
}));

vi.mock("../../../../../lib/saas-provisioning/run-provisioning", () => ({
  startOrAdvanceProvisioningFromPurchase: async () => null
}));

import { GET as checkoutSessionGet } from "./route";

function seedPurchase(sessionId: string) {
  const now = new Date().toISOString();
  return rememberSaasPurchase({
    id: crypto.randomUUID(),
    stripeCheckoutSessionId: sessionId,
    stripeCustomerId: "cus_secret_xyz",
    stripeSubscriptionId: "sub_secret_xyz",
    catalogOfferId: "mpa_property_manager__professional__monthly",
    productSku: "mpa_property_manager",
    planTier: "professional",
    billingCycle: "monthly",
    status: "checkout_completed",
    customerEmail: "buyer@example.com",
    idempotencyKey: null,
    demoSessionId: null,
    metadata: {},
    provisioned: false,
    organizationId: "org_secret",
    userId: "user_secret",
    createdAt: now,
    updatedAt: now
  });
}

function sensitiveKeysPresent(body: Record<string, unknown>): string[] {
  const banned = [
    "organizationId",
    "userId",
    "customerEmail",
    "ownerEmail",
    "stripeCustomerId",
    "stripeSubscriptionId",
    "sessionId",
    "offerId",
    "planTier",
    "metadata",
    "object"
  ];
  return banned.filter((key) => key in body);
}

describe("STAB-009 checkout session lookup privacy", () => {
  beforeEach(() => {
    clearCommerceSessionLookupRateLimitForTests();
    expect(COM_002_FLAGS.sliceC_stripeCheckout).toBe(true);
  });

  it("rejects missing session id safely", async () => {
    const res = await checkoutSessionGet(
      new Request("http://localhost/api/commerce/checkout/session")
    );
    expect(res.status).toBe(400);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body["error"]).toBe("invalid_request");
    expect(sensitiveKeysPresent(body)).toEqual([]);
  });

  it("returns safe 404 for unknown session", async () => {
    const res = await checkoutSessionGet(
      new Request("http://localhost/api/commerce/checkout/session?session_id=cs_missing")
    );
    expect(res.status).toBe(404);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body["error"]).toBe("not_found");
    expect(JSON.stringify(body)).not.toMatch(/stripe|cus_|org_|stack/i);
  });

  it("returns minimized purchase confirmation without org/user/email", async () => {
    const sessionId = "cs_checkout_min";
    seedPurchase(sessionId);
    const res = await checkoutSessionGet(
      new Request(
        `http://localhost/api/commerce/checkout/session?session_id=${encodeURIComponent(sessionId)}`
      )
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body["status"]).toBe("checkout_completed");
    expect(body["productSku"]).toBe("mpa_property_manager");
    expect(body["billingCycle"]).toBe("monthly");
    expect(body["workspacePreparing"]).toBe(true);
    expect(typeof body["continuePath"]).toBe("string");
    expect(sensitiveKeysPresent(body)).toEqual([]);
    expect(JSON.stringify(body)).not.toContain("buyer@example.com");
    expect(JSON.stringify(body)).not.toContain("org_secret");
    expect(JSON.stringify(body)).not.toContain("user_secret");
    expect(JSON.stringify(body)).not.toContain("cus_secret");
    expect(JSON.stringify(body)).not.toContain("sub_secret");
  });

  it("does not expose raw Stripe objects", async () => {
    const sessionId = "cs_no_stripe_obj";
    seedPurchase(sessionId);
    const res = await checkoutSessionGet(
      new Request(
        `http://localhost/api/commerce/checkout/session?session_id=${encodeURIComponent(sessionId)}`
      )
    );
    const body = (await res.json()) as Record<string, unknown>;
    expect(body["object"]).toBeUndefined();
    expect(body["data"]).toBeUndefined();
    expect(body["customer"]).toBeUndefined();
    expect(body["subscription"]).toBeUndefined();
    expect(body["payment_status"]).toBeUndefined();
  });

  it("rate limits abusive checkout session lookups", async () => {
    const sessionId = "cs_rate_checkout";
    seedPurchase(sessionId);
    let limited = 0;
    for (let i = 0; i < 40; i += 1) {
      const res = await checkoutSessionGet(
        new Request(
          `http://localhost/api/commerce/checkout/session?session_id=${encodeURIComponent(sessionId)}`,
          { headers: { "x-forwarded-for": "203.0.113.99" } }
        )
      );
      if (res.status === 429) limited += 1;
    }
    expect(limited).toBeGreaterThan(0);
  });
});
