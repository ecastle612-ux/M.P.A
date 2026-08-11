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
import { clearLifecycleStoreForTests, getLifecycleByStripeSubscriptionId, saveLifecycleSubscription } from "./lifecycle-store";

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
    const seeded = await seedLifecycleFromPurchase("cs_life_1");
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
    await seedLifecycleFromPurchase("cs_life_2");
    const failed = await applyInvoicePaymentFailed({
      stripeSubscriptionId: "sub_life_2",
      stripeCustomerId: "cus_life",
      eventId: "evt_fail_1"
    });
    expect(failed?.status).toBe("past_due");
    expect(customerLifecyclePhase(failed!)).toBe("grace");
    expect(hasLifecycleModuleAccess(failed!)).toBe(true);
    expect(failed?.emailsSent.some((e) => e.includes("dunning:0"))).toBe(true);

    const row = (await getLifecycleByStripeSubscriptionId("sub_life_2"))!;
    row.graceStartedAt = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString();
    await saveLifecycleSubscription(row);
    const expiredCount = await enforceGraceExpirations();
    expect(expiredCount).toBe(1);
    const expired = await getLifecycleByStripeSubscriptionId("sub_life_2");
    expect(expired?.status).toBe("expired");
    expect(hasLifecycleModuleAccess(expired!)).toBe(false);
  });

  it("recovers from past_due on invoice.paid (restored)", async () => {
    seedPurchase("cs_life_3", "sub_life_3");
    await seedLifecycleFromPurchase("cs_life_3");
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

  it("supports cancel at period end and reactivate without refunds", async () => {
    seedPurchase("cs_life_4", "sub_life_4", "org_cancel");
    await seedLifecycleFromPurchase("cs_life_4");
    const periodEnd = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
    await applySubscriptionCreatedOrUpdated({
      stripeSubscriptionId: "sub_life_4",
      stripeCustomerId: "cus_life",
      stripeStatus: "active",
      cancelAtPeriodEnd: false,
      currentPeriodEnd: periodEnd,
      planTier: "professional",
      billingCycle: "monthly",
      eventId: "evt_period_4",
      eventType: "customer.subscription.updated"
    });
    const canceled = await cancelAtPeriodEnd({ organizationId: "org_cancel" });
    expect(canceled?.cancelAtPeriodEnd).toBe(true);
    expect(canceled?.status).toBe("active");
    expect(hasLifecycleModuleAccess(canceled!)).toBe(true);
    expect(customerLifecyclePhase(canceled!)).toBe("cancellation_scheduled");
    expect(canceled?.paymentHistory.some((p) => p.kind === "refunded")).toBe(false);

    // Idempotent second cancel — no duplicate cancel_scheduled email key noise / status flip
    const canceledAgain = await cancelAtPeriodEnd({ organizationId: "org_cancel" });
    expect(canceledAgain?.cancelAtPeriodEnd).toBe(true);
    expect(canceledAgain?.status).toBe("active");
    const cancelAudits =
      canceledAgain?.audit.filter((a) => a.reason === "cancel_at_period_end_requested") ?? [];
    expect(cancelAudits).toHaveLength(1);

    const reactivated = await reactivateSubscription({ organizationId: "org_cancel" });
    expect(reactivated?.status).toBe("active");
    expect(reactivated?.cancelAtPeriodEnd).toBe(false);
    expect(hasLifecycleModuleAccess(reactivated!)).toBe(true);
    expect(customerLifecyclePhase(reactivated!)).not.toBe("cancellation_scheduled");
  });

  it("keeps annual access through paid-through after cancellation schedule", async () => {
    seedPurchase("cs_life_annual", "sub_life_annual", "org_annual");
    await seedLifecycleFromPurchase("cs_life_annual");
    const annualEnd = new Date(Date.now() + 200 * 24 * 60 * 60 * 1000).toISOString();
    const synced = await applySubscriptionCreatedOrUpdated({
      stripeSubscriptionId: "sub_life_annual",
      stripeCustomerId: "cus_life",
      stripeStatus: "active",
      cancelAtPeriodEnd: false,
      currentPeriodEnd: annualEnd,
      planTier: "professional",
      billingCycle: "annual",
      eventId: "evt_annual_1",
      eventType: "customer.subscription.updated"
    });
    expect(synced?.billingCycle).toBe("annual");
    const canceled = await cancelAtPeriodEnd({ organizationId: "org_annual" });
    expect(canceled?.cancelAtPeriodEnd).toBe(true);
    expect(canceled?.currentPeriodEnd).toBe(annualEnd);
    expect(hasLifecycleModuleAccess(canceled!)).toBe(true);
  });

  it("ends access when Stripe marks subscription canceled at period end", async () => {
    seedPurchase("cs_life_end", "sub_life_end", "org_end");
    await seedLifecycleFromPurchase("cs_life_end");
    await cancelAtPeriodEnd({ organizationId: "org_end" });
    const ended = await applySubscriptionCreatedOrUpdated({
      stripeSubscriptionId: "sub_life_end",
      stripeCustomerId: "cus_life",
      stripeStatus: "canceled",
      cancelAtPeriodEnd: false,
      currentPeriodEnd: new Date(Date.now() - 1000).toISOString(),
      planTier: "professional",
      billingCycle: "monthly",
      eventId: "evt_end_1",
      eventType: "customer.subscription.deleted"
    });
    expect(ended?.status).toBe("canceled");
    expect(hasLifecycleModuleAccess(ended!)).toBe(false);
    expect(customerLifecyclePhase(ended!)).toBe("canceled");
  });

  it("does not silently reactivate an already-ended subscription", async () => {
    seedPurchase("cs_life_dead", "sub_life_dead", "org_dead");
    await seedLifecycleFromPurchase("cs_life_dead");
    await applySubscriptionCreatedOrUpdated({
      stripeSubscriptionId: "sub_life_dead",
      stripeCustomerId: "cus_life",
      stripeStatus: "canceled",
      cancelAtPeriodEnd: false,
      currentPeriodEnd: new Date(Date.now() - 1000).toISOString(),
      planTier: "professional",
      billingCycle: "monthly",
      eventId: "evt_dead_1",
      eventType: "customer.subscription.deleted"
    });
    const result = await reactivateSubscription({ organizationId: "org_dead" });
    expect(result).toBeNull();
  });

  it("supports cancel during trial without flipping to canceled status", async () => {
    seedPurchase("cs_life_trial", "sub_life_trial", "org_trial");
    await seedLifecycleFromPurchase("cs_life_trial");
    const trialEnd = new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString();
    await applySubscriptionCreatedOrUpdated({
      stripeSubscriptionId: "sub_life_trial",
      stripeCustomerId: "cus_life",
      stripeStatus: "trialing",
      cancelAtPeriodEnd: false,
      currentPeriodEnd: trialEnd,
      planTier: "professional",
      billingCycle: "monthly",
      eventId: "evt_trial_1",
      eventType: "customer.subscription.updated"
    });
    const canceled = await cancelAtPeriodEnd({ organizationId: "org_trial" });
    expect(canceled?.status).toBe("trialing");
    expect(canceled?.cancelAtPeriodEnd).toBe(true);
    expect(hasLifecycleModuleAccess(canceled!)).toBe(true);
    expect(canceled?.paymentHistory.some((p) => p.kind === "refunded")).toBe(false);
  });

  it("rejects Business and legacy Professional plan-price swaps", async () => {
    seedPurchase("cs_life_5", "sub_life_5", "org_plan");
    await seedLifecycleFromPurchase("cs_life_5");
    const business = await changePlanTier({ organizationId: "org_plan", planTier: "business" });
    expect(business.ok).toBe(false);
    if (!business.ok) {
      expect(business.error).toBe("unsupported_plan");
    }
    const professional = await changePlanTier({
      organizationId: "org_plan",
      planTier: "professional"
    });
    expect(professional.ok).toBe(false);
    if (!professional.ok) {
      expect(professional.error).toBe("unsupported_plan_change");
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
