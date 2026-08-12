import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { LifecycleSubscription } from "@mpa/shared";

const stripeUpdate = vi.fn();

vi.mock("../saas-stripe/client", () => ({
  getSaasStripeClient: () => ({
    subscriptions: {
      update: stripeUpdate
    }
  })
}));

import {
  cancelAtPeriodEnd,
  reactivateSubscription,
  StripeLifecycleSyncError
} from "./apply-lifecycle";
import {
  clearLifecycleStoreForTests,
  getLifecycleByOrganizationId,
  saveLifecycleSubscription
} from "./lifecycle-store";

function seed(partial: Partial<LifecycleSubscription> = {}): Promise<LifecycleSubscription> {
  const now = new Date().toISOString();
  return saveLifecycleSubscription({
    id: "life_stripe_sync",
    organizationId: "org_stripe_sync",
    stripeSubscriptionId: "sub_stripe_sync",
    stripeCustomerId: "cus_stripe_sync",
    productSku: "mpa_property_manager",
    planTier: "professional",
    billingCycle: "monthly",
    status: "active",
    cancelAtPeriodEnd: false,
    currentPeriodEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    graceStartedAt: null,
    seatLimit: null,
    propertyLimit: null,
    stripeBaseItemId: null,
    stripeAdditionalCapacityItemId: null,
    managedUnitCount: 100,
    authorizedAdditionalBlocks: 0,
    authorizedUnitCapacity: 500,
    declaredUnitCount: 100,
    pendingAdditionalBlocks: null,
    pendingAuthorizedUnitCapacity: null,
    lastCapacityAuthorizedAt: null,
    quoteId: null,
    trialEndsAt: null,
    pendingPlanTier: null,
    lastInvoiceStatus: null,
    scaRequired: false,
    emailsSent: [],
    audit: [],
    paymentHistory: [],
    createdAt: now,
    updatedAt: now,
    ...partial
  });
}

describe("Stripe cancel/reactivate sync failures", () => {
  const previousVitest = process.env["VITEST"];

  beforeEach(() => {
    clearLifecycleStoreForTests();
    stripeUpdate.mockReset();
    // Exercise real Stripe sync path (skipped when VITEST is set).
    delete process.env["VITEST"];
  });

  afterEach(() => {
    if (previousVitest === undefined) {
      delete process.env["VITEST"];
    } else {
      process.env["VITEST"] = previousVitest;
    }
  });

  it("does not persist cancellation when Stripe update fails", async () => {
    await seed();
    stripeUpdate.mockRejectedValueOnce(new Error("stripe unavailable"));

    await expect(cancelAtPeriodEnd({ organizationId: "org_stripe_sync" })).rejects.toBeInstanceOf(
      StripeLifecycleSyncError
    );

    const loaded = await getLifecycleByOrganizationId("org_stripe_sync");
    expect(loaded?.cancelAtPeriodEnd).toBe(false);
    expect(stripeUpdate).toHaveBeenCalledWith("sub_stripe_sync", { cancel_at_period_end: true });
  });

  it("persists cancellation only after Stripe cancel_at_period_end succeeds", async () => {
    await seed();
    stripeUpdate.mockResolvedValueOnce({ id: "sub_stripe_sync", cancel_at_period_end: true });

    const canceled = await cancelAtPeriodEnd({ organizationId: "org_stripe_sync" });
    expect(canceled?.cancelAtPeriodEnd).toBe(true);
    expect(stripeUpdate).toHaveBeenCalledWith("sub_stripe_sync", { cancel_at_period_end: true });
  });

  it("does not persist reactivation when Stripe undo fails", async () => {
    await seed({ cancelAtPeriodEnd: true });
    stripeUpdate.mockRejectedValueOnce(new Error("stripe unavailable"));

    await expect(
      reactivateSubscription({ organizationId: "org_stripe_sync" })
    ).rejects.toBeInstanceOf(StripeLifecycleSyncError);

    const loaded = await getLifecycleByOrganizationId("org_stripe_sync");
    expect(loaded?.cancelAtPeriodEnd).toBe(true);
    expect(stripeUpdate).toHaveBeenCalledWith("sub_stripe_sync", { cancel_at_period_end: false });
  });

  it("never calls immediate subscriptions.cancel or refunds", async () => {
    await seed();
    stripeUpdate.mockResolvedValueOnce({ id: "sub_stripe_sync" });
    await cancelAtPeriodEnd({ organizationId: "org_stripe_sync" });
    expect(stripeUpdate.mock.calls[0]?.[1]).toEqual({ cancel_at_period_end: true });
    expect(JSON.stringify(stripeUpdate.mock.calls)).not.toMatch(/refund|proration/i);
  });
});
