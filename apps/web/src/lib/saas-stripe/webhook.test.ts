import { beforeEach, describe, expect, it } from "vitest";
import { createHmac } from "node:crypto";
import {
  getSaasPurchaseBySessionId,
  rememberSaasPurchase,
  saasStoreTouchesFinOps
} from "./purchase-store";
import { handleSaasStripeEvent } from "./webhook";
import { getProvisioningJob } from "../saas-provisioning/jobs-store";
import {
  clearLifecycleStoreForTests,
  getLifecycleByStripeSubscriptionId
} from "../saas-lifecycle/lifecycle-store";

const globalStore = globalThis as typeof globalThis & {
  __mpaProvisioningJobs?: Map<string, unknown>;
  __mpaSaasCustomers?: Map<string, unknown>;
};

function signedHeader(payload: string, secret: string): string {
  const timestamp = Math.floor(Date.now() / 1000);
  const signed = createHmac("sha256", secret).update(`${timestamp}.${payload}`).digest("hex");
  return `t=${timestamp},v1=${signed}`;
}

describe("COM-002 SaaS webhook handling (Slice C + D + E)", () => {
  beforeEach(() => {
    globalStore.__mpaProvisioningJobs = new Map();
    globalStore.__mpaSaasCustomers = new Map();
    clearLifecycleStoreForTests();
  });

  it("never touches FIN-OPS tables", () => {
    expect(saasStoreTouchesFinOps()).toBe(false);
  });

  it("marks checkout completed, starts provisioning, and seeds lifecycle", async () => {
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
        mpa_catalog_offer_id: "mpa_property_manager__professional__monthly"
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
    const job = getProvisioningJob(sessionId);
    expect(job?.checkpoint).toBe("owner_pending");
    expect(getLifecycleByStripeSubscriptionId("sub_test")?.status).toBe("active");

    const dup = await handleSaasStripeEvent(event as never);
    expect(dup.ok).toBe(true);
    if (dup.ok) {
      expect(dup.duplicate).toBe(true);
    }
  });

  it("handles invoice.payment_failed and invoice.paid lifecycle events idempotently", async () => {
    const failEvent = {
      id: "evt_fail_unique_1",
      type: "invoice.payment_failed",
      data: {
        object: {
          id: "in_1",
          object: "invoice",
          subscription: "sub_wh_1",
          customer: "cus_wh_1",
          amount_due: 9900
        }
      }
    };
    const fail = await handleSaasStripeEvent(failEvent as never);
    expect(fail.ok).toBe(true);
    expect(getLifecycleByStripeSubscriptionId("sub_wh_1")?.status).toBe("past_due");

    const failDup = await handleSaasStripeEvent(failEvent as never);
    expect(failDup.ok).toBe(true);
    if (failDup.ok) expect(failDup.duplicate).toBe(true);

    const paidEvent = {
      id: "evt_paid_unique_1",
      type: "invoice.paid",
      data: {
        object: {
          id: "in_2",
          object: "invoice",
          subscription: "sub_wh_1",
          customer: "cus_wh_1",
          amount_paid: 9900
        }
      }
    };
    const paid = await handleSaasStripeEvent(paidEvent as never);
    expect(paid.ok).toBe(true);
    expect(getLifecycleByStripeSubscriptionId("sub_wh_1")?.status).toBe("active");
  });

  it("builds a stripe-compatible signature header shape", () => {
    const payload = "{\"id\":\"evt_x\"}";
    const header = signedHeader(payload, "whsec_test");
    expect(header.startsWith("t=")).toBe(true);
    expect(header.includes(",v1=")).toBe(true);
  });
});
