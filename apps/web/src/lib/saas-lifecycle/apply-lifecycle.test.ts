import { beforeEach, describe, expect, it } from "vitest";
import { customerLifecyclePhase, hasLifecycleModuleAccess } from "@mpa/shared";
import { rememberSaasPurchase } from "../saas-stripe/purchase-store";
import {
  applyInvoicePaid,
  applyInvoicePaymentFailed,
  applySubscriptionCreatedOrUpdated,
  cancelAtPeriodEnd,
  changePlanTier,
  enforceGraceExpirations,
  reactivateSubscription,
  seedLifecycleFromPurchase
} from "./apply-lifecycle";
import { clearLifecycleStoreForTests, getLifecycleByStripeSubscriptionId } from "./lifecycle-store";

function seedPurchase(sessionId: string, subId: string, orgId = "org_life_1") {
  const now = new Date().toISOString();
  rememberSaasPurchase({
    id: crypto.randomUUID(),
    stripeCheckoutSessionId: sessionId,
    stripeCustomerId: "cus_life",
    stripeSubscriptionId: subId,
    catalogOfferId: "mpa_property_manager__professional__monthly",
    productSku: "mpa_property_manager",
    planTier: "professional",
    billingCycle: "monthly",
    status: "checkout_completed",
    customerEmail: "owner@example.com",
    idempotencyKey: null,
    demoSessionId: null,
    metadata: {},
    provisioned: true,
    organizationId: orgId,
    userId: "user_1",
    createdAt: now,
    updatedAt: now
  });
}

describe("COM-002 Slice E lifecycle apply", () => {
  beforeEach(() => {
    clearLifecycleStoreForTests();
  });

  it("seeds active subscription and handles renewal success", async () => {
    seedPurchase("cs_life_1", "sub_life_1");
    const seeded = seedLifecycleFromPurchase("cs_life_1");
    expect(seeded?.status).toBe("active");
    const paid = await applyInvoicePaid({
      stripeSubscriptionId: "sub_life_1",
      stripeCustomerId: "cus_life",
      amountCents: 9900,
      eventId: "evt_paid_1"
    });
    expect(paid?.status).toBe("active");
    expect(paid?.emailsSent.some((e) => e.startsWith("renewal:"))).toBe(true);
    expect(paid?.paymentHistory.some((p) => p.kind === "paid")).toBe(true);
  });

  it("enters grace on payment failure and expires after 7 days", async () => {
    seedPurchase("cs_life_2", "sub_life_2");
    seedLifecycleFromPurchase("cs_life_2");
    const failed = await applyInvoicePaymentFailed({
      stripeSubscriptionId: "sub_life_2",
      stripeCustomerId: "cus_life",
      eventId: "evt_fail_1"
    });
    expect(failed?.status).toBe("past_due");
    expect(customerLifecyclePhase(failed!)).toBe("grace");
    expect(hasLifecycleModuleAccess(failed!)).toBe(true);
    expect(failed?.emailsSent.some((e) => e.includes("dunning:0"))).toBe(true);

    const row = getLifecycleByStripeSubscriptionId("sub_life_2")!;
    row.graceStartedAt = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString();
    const expiredCount = await enforceGraceExpirations();
    expect(expiredCount).toBe(1);
    const expired = getLifecycleByStripeSubscriptionId("sub_life_2");
    expect(expired?.status).toBe("expired");
    expect(hasLifecycleModuleAccess(expired!)).toBe(false);
  });

  it("recovers from past_due on invoice.paid (restored)", async () => {
    seedPurchase("cs_life_3", "sub_life_3");
    seedLifecycleFromPurchase("cs_life_3");
    await applyInvoicePaymentFailed({
      stripeSubscriptionId: "sub_life_3",
      stripeCustomerId: "cus_life",
      eventId: "evt_fail_2"
    });
    const restored = await applyInvoicePaid({
      stripeSubscriptionId: "sub_life_3",
      stripeCustomerId: "cus_life",
      eventId: "evt_paid_2"
    });
    expect(restored?.status).toBe("active");
    expect(restored?.graceStartedAt).toBeNull();
    expect(restored?.emailsSent.some((e) => e.startsWith("restored:"))).toBe(true);
  });

  it("supports cancel at period end and reactivate", async () => {
    seedPurchase("cs_life_4", "sub_life_4", "org_cancel");
    seedLifecycleFromPurchase("cs_life_4");
    const canceled = await cancelAtPeriodEnd({ organizationId: "org_cancel" });
    expect(canceled?.cancelAtPeriodEnd).toBe(true);
    const reactivated = await reactivateSubscription({ organizationId: "org_cancel" });
    expect(reactivated?.status).toBe("active");
    expect(reactivated?.cancelAtPeriodEnd).toBe(false);
  });

  it("upgrades immediately and schedules downgrade", async () => {
    seedPurchase("cs_life_5", "sub_life_5", "org_plan");
    seedLifecycleFromPurchase("cs_life_5");
    const up = await changePlanTier({ organizationId: "org_plan", planTier: "business" });
    expect(up.ok).toBe(true);
    if (up.ok) {
      expect(up.sub.planTier).toBe("business");
      expect(up.sub.seatLimit).toBeNull();
      expect(up.sub.propertyLimit).toBeNull();
    }
    const down = await changePlanTier({ organizationId: "org_plan", planTier: "professional" });
    expect(down.ok).toBe(true);
    if (down.ok) {
      expect(down.sub.pendingPlanTier).toBe("professional");
      expect(down.sub.planTier).toBe("business");
    }
  });

  it("syncs subscription updated without duplicating on replay semantics", async () => {
    const first = await applySubscriptionCreatedOrUpdated({
      stripeSubscriptionId: "sub_sync_1",
      stripeCustomerId: "cus_sync",
      stripeStatus: "active",
      cancelAtPeriodEnd: false,
      currentPeriodEnd: new Date(Date.now() + 86400000).toISOString(),
      planTier: "professional",
      billingCycle: "monthly",
      eventId: "evt_sync_1",
      eventType: "customer.subscription.created"
    });
    const second = await applySubscriptionCreatedOrUpdated({
      stripeSubscriptionId: "sub_sync_1",
      stripeCustomerId: "cus_sync",
      stripeStatus: "active",
      cancelAtPeriodEnd: false,
      currentPeriodEnd: first!.currentPeriodEnd,
      planTier: "professional",
      billingCycle: "monthly",
      eventId: "evt_sync_2",
      eventType: "customer.subscription.updated"
    });
    expect(second?.id).toBe(first?.id);
    expect(second?.status).toBe("active");
  });
});
