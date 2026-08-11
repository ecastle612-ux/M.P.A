import { describe, expect, it } from "vitest";
import { COM_002_FLAGS } from "./commerce-flags";
import {
  PAST_DUE_GRACE_DAYS,
  customerLifecyclePhase,
  customerStatusCopy,
  dunningEmailKindForDay,
  graceEndsAt,
  hasLifecycleModuleAccess,
  limitsForPlanTier,
  mapStripeSubscriptionStatus,
  transitionLifecycle,
  type LifecycleSubscription
} from "./subscription-lifecycle";

function sub(partial: Partial<LifecycleSubscription> = {}): LifecycleSubscription {
  const now = new Date().toISOString();
  return {
    id: "sub_row_1",
    organizationId: "org_1",
    stripeSubscriptionId: "sub_stripe_1",
    stripeCustomerId: "cus_1",
    productSku: "mpa_property_manager",
    planTier: "professional",
    billingCycle: "monthly",
    status: "active",
    cancelAtPeriodEnd: false,
    currentPeriodEnd: null,
    graceStartedAt: null,
    seatLimit: null,
    propertyLimit: null,
    pendingPlanTier: null,
    lastInvoiceStatus: null,
    scaRequired: false,
    emailsSent: [],
    audit: [],
    paymentHistory: [],
    createdAt: now,
    updatedAt: now,
    ...partial
  };
}

describe("COM-002 Slice E subscription lifecycle", () => {
  it("enables Slice E while portal/FO stay off", () => {
    expect(COM_002_FLAGS.sliceE_subscriptionLifecycle).toBe(true);
    expect(COM_002_FLAGS.sliceF_customerPortal).toBe(false);
    expect(COM_002_FLAGS.foReady).toBe(false);
    expect(PAST_DUE_GRACE_DAYS).toBe(7);
  });

  it("maps Stripe statuses and returns null commercial seat/property limits", () => {
    expect(mapStripeSubscriptionStatus("active")).toBe("active");
    expect(mapStripeSubscriptionStatus("past_due")).toBe("past_due");
    expect(mapStripeSubscriptionStatus("unpaid")).toBe("unpaid");
    expect(limitsForPlanTier("professional")).toEqual({ seatLimit: null, propertyLimit: null });
    expect(limitsForPlanTier("business")).toEqual({ seatLimit: null, propertyLimit: null });
  });

  it("keeps module access during grace and revokes after", () => {
    const started = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
    const grace = sub({ status: "past_due", graceStartedAt: started });
    expect(hasLifecycleModuleAccess(grace)).toBe(true);
    expect(customerLifecyclePhase(grace)).toBe("grace");

    const expiredGrace = sub({
      status: "past_due",
      graceStartedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString()
    });
    expect(hasLifecycleModuleAccess(expiredGrace)).toBe(false);
    expect(customerLifecyclePhase(expiredGrace)).toBe("past_due");
    expect(Date.parse(graceEndsAt(started))).toBeGreaterThan(Date.parse(started));
  });

  it("fail-closes unpaid, incomplete, dispute_hold, canceled", () => {
    for (const status of ["unpaid", "incomplete", "dispute_hold", "canceled", "expired"] as const) {
      expect(hasLifecycleModuleAccess(sub({ status }))).toBe(false);
    }
    expect(hasLifecycleModuleAccess(sub({ status: "active" }))).toBe(true);
  });

  it("records audit transitions and customer copy without Stripe jargon", () => {
    const next = transitionLifecycle(sub(), "past_due", "invoice_payment_failed", "webhook", "evt_1");
    expect(next.audit).toHaveLength(1);
    expect(next.status).toBe("past_due");
    const copy = customerStatusCopy("grace");
    expect(copy.title.toLowerCase()).not.toContain("stripe");
    expect(copy.requiredAction).toBeTruthy();
  });

  it("maps dunning email cadence days", () => {
    expect(dunningEmailKindForDay(0)).toBe("payment_failed");
    expect(dunningEmailKindForDay(3)).toBe("grace_warning");
    expect(dunningEmailKindForDay(6)).toBe("grace_warning");
    expect(dunningEmailKindForDay(7)).toBe("subscription_canceled");
  });
});
