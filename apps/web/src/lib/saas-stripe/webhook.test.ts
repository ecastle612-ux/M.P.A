import { describe, expect, it } from "vitest";
import { createHmac } from "node:crypto";
import {
  getSaasPurchaseBySessionId,
  rememberSaasPurchase,
  saasStoreTouchesFinOps
} from "./purchase-store";
import { handleSaasStripeEvent } from "./webhook";

function signedHeader(payload: string, secret: string): string {
  const timestamp = Math.floor(Date.now() / 1000);
  const signed = createHmac("sha256", secret).update(`${timestamp}.${payload}`).digest("hex");
  return `t=${timestamp},v1=${signed}`;
}

describe("COM-002 Slice C SaaS webhook handling", () => {
  it("never touches FIN-OPS tables", () => {
    expect(saasStoreTouchesFinOps()).toBe(false);
  });

  it("marks checkout completed without provisioning", async () => {
    const sessionId = `cs_test_${Date.now()}`;
    rememberSaasPurchase({
      id: "p1",
      stripeCheckoutSessionId: sessionId,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      catalogOfferId: "mpa_property_manager__professional__monthly",
      productSku: "mpa_property_manager",
      planTier: "professional",
      billingCycle: "monthly",
      status: "checkout_created",
      customerEmail: "buyer@example.com",
      idempotencyKey: null,
      demoSessionId: null,
      metadata: {
        mpa_money_domain: "saas_billing",
        mpa_product_sku: "mpa_property_manager",
        mpa_plan_tier: "professional",
        mpa_billing_cycle: "monthly",
        mpa_catalog_offer_id: "mpa_property_manager__professional__monthly",
        mpa_seat_limit: "5",
        mpa_property_limit: "25"
      },
      provisioned: false,
      organizationId: null,
      userId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    const event = {
      id: `evt_${Date.now()}`,
      type: "checkout.session.completed",
      data: {
        object: {
          id: sessionId,
          object: "checkout.session",
          customer: "cus_test",
          subscription: "sub_test",
          customer_email: "buyer@example.com",
          metadata: {
            mpa_money_domain: "saas_billing",
            mpa_catalog_offer_id: "mpa_property_manager__professional__monthly",
            mpa_product_sku: "mpa_property_manager",
            mpa_plan_tier: "professional",
            mpa_billing_cycle: "monthly"
          }
        }
      }
    };

    const result = await handleSaasStripeEvent(event as never);
    expect(result.ok).toBe(true);
    const purchase = getSaasPurchaseBySessionId(sessionId);
    expect(purchase?.status).toBe("checkout_completed");
    expect(purchase?.provisioned).toBe(false);
    expect(purchase?.organizationId).toBeNull();
    expect(purchase?.userId).toBeNull();

    const dup = await handleSaasStripeEvent(event as never);
    expect(dup.ok).toBe(true);
    if (dup.ok) {
      expect(dup.duplicate).toBe(true);
    }
  });

  it("builds a stripe-compatible signature header shape", () => {
    const payload = "{\"id\":\"evt_x\"}";
    const header = signedHeader(payload, "whsec_test");
    expect(header.startsWith("t=")).toBe(true);
    expect(header.includes(",v1=")).toBe(true);
  });
});
