import { beforeEach, describe, expect, it } from "vitest";
import type { LifecycleSubscription } from "@mpa/shared";
import {
  applyInvoicePaid,
  applyInvoicePaymentFailed,
  cancelAtPeriodEnd,
  reactivateSubscription
} from "./apply-lifecycle";
import {
  clearLifecycleStoreForTests,
  createSharedDurableBackendForTests,
  getLifecycleByOrganizationId,
  getLifecycleByStripeSubscriptionId,
  saveLifecycleSubscription,
  setLifecycleDurableBackendForTests,
  simulateColdStartForTests
} from "./lifecycle-store";
import { authorizeAdditionalUnitCapacity } from "./unit-capacity-service";

function baseSub(partial: Partial<LifecycleSubscription> = {}): LifecycleSubscription {
  const now = new Date().toISOString();
  return {
    id: "life_durability",
    organizationId: "org_durable_a",
    stripeSubscriptionId: "sub_durable_a",
    stripeCustomerId: "cus_durable_a",
    productSku: "mpa_property_manager",
    planTier: "professional",
    billingCycle: "monthly",
    status: "active",
    cancelAtPeriodEnd: false,
    currentPeriodEnd: now,
    graceStartedAt: null,
    seatLimit: null,
    propertyLimit: null,
    stripeBaseItemId: "si_base",
    stripeAdditionalCapacityItemId: null,
    managedUnitCount: 500,
    authorizedAdditionalBlocks: 0,
    authorizedUnitCapacity: 500,
    declaredUnitCount: 500,
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
  };
}

describe("STAB-005 lifecycle durability", () => {
  beforeEach(() => {
    clearLifecycleStoreForTests();
    process.env["VITEST"] = "true";
    process.env["MPA_LIFECYCLE_FORCE_MEMORY"] = "1";
  });

  it("fresh instance reads existing subscription from durable store", async () => {
    await saveLifecycleSubscription(baseSub());
    simulateColdStartForTests();
    const loaded = await getLifecycleByOrganizationId("org_durable_a");
    expect(loaded).not.toBeNull();
    expect(loaded?.stripeSubscriptionId).toBe("sub_durable_a");
    expect(loaded?.status).toBe("active");
  });

  it("empty in-memory cache does not produce false not-found", async () => {
    await saveLifecycleSubscription(baseSub({ status: "trialing" }));
    simulateColdStartForTests();
    const byOrg = await getLifecycleByOrganizationId("org_durable_a");
    const byStripe = await getLifecycleByStripeSubscriptionId("sub_durable_a");
    expect(byOrg?.status).toBe("trialing");
    expect(byStripe?.status).toBe("trialing");
  });

  it("database state survives simulated instance replacement", async () => {
    const sharedDb = createSharedDurableBackendForTests();
    setLifecycleDurableBackendForTests(sharedDb);
    await saveLifecycleSubscription(baseSub({ managedUnitCount: 750 }));

    // Instance B: new empty process cache, same durable backend.
    simulateColdStartForTests();
    setLifecycleDurableBackendForTests(sharedDb);
    const fromB = await getLifecycleByOrganizationId("org_durable_a");
    expect(fromB?.managedUnitCount).toBe(750);
  });

  it("write on Instance A is visible to Instance B after update", async () => {
    const sharedDb = createSharedDurableBackendForTests();
    setLifecycleDurableBackendForTests(sharedDb);
    await saveLifecycleSubscription(baseSub());

    // Instance A updates cancel flag.
    await cancelAtPeriodEnd({ organizationId: "org_durable_a", source: "customer" });

    // Instance B cold start.
    simulateColdStartForTests();
    setLifecycleDurableBackendForTests(sharedDb);
    const fromB = await getLifecycleByOrganizationId("org_durable_a");
    expect(fromB?.cancelAtPeriodEnd).toBe(true);

    // Instance A reactivates.
    await reactivateSubscription({ organizationId: "org_durable_a" });

    simulateColdStartForTests();
    setLifecycleDurableBackendForTests(sharedDb);
    const fromBAgain = await getLifecycleByOrganizationId("org_durable_a");
    expect(fromBAgain?.cancelAtPeriodEnd).toBe(false);
    expect(fromBAgain?.status).toBe("active");
  });

  it("cancellation persists across cold starts", async () => {
    await saveLifecycleSubscription(baseSub());
    await cancelAtPeriodEnd({ organizationId: "org_durable_a" });
    simulateColdStartForTests();
    const loaded = await getLifecycleByOrganizationId("org_durable_a");
    expect(loaded?.cancelAtPeriodEnd).toBe(true);
  });

  it("reactivation persists across cold starts", async () => {
    await saveLifecycleSubscription(baseSub({ cancelAtPeriodEnd: true }));
    await reactivateSubscription({ organizationId: "org_durable_a" });
    simulateColdStartForTests();
    const loaded = await getLifecycleByOrganizationId("org_durable_a");
    expect(loaded?.cancelAtPeriodEnd).toBe(false);
    expect(loaded?.status).toBe("active");
  });

  it("capacity authorization persists across instances", async () => {
    const sharedDb = createSharedDurableBackendForTests();
    setLifecycleDurableBackendForTests(sharedDb);
    await saveLifecycleSubscription(
      baseSub({
        managedUnitCount: 1001,
        authorizedAdditionalBlocks: 0,
        authorizedUnitCapacity: 500
      })
    );

    const result = await authorizeAdditionalUnitCapacity({
      organizationId: "org_durable_a",
      intentId: null,
      clientBody: {}
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.sub.authorizedAdditionalBlocks).toBe(2);
    expect(result.sub.authorizedUnitCapacity).toBe(1500);

    simulateColdStartForTests();
    setLifecycleDurableBackendForTests(sharedDb);
    const fromB = await getLifecycleByOrganizationId("org_durable_a");
    expect(fromB?.authorizedAdditionalBlocks).toBe(2);
    expect(fromB?.authorizedUnitCapacity).toBe(1500);
    expect(fromB?.pendingAdditionalBlocks).toBe(2);
  });

  it("webhook lifecycle state persists across cold starts", async () => {
    await saveLifecycleSubscription(baseSub({ organizationId: "org_wh", stripeSubscriptionId: "sub_wh" }));
    await applyInvoicePaymentFailed({
      stripeSubscriptionId: "sub_wh",
      stripeCustomerId: "cus_durable_a",
      eventId: "evt_fail_dur"
    });
    simulateColdStartForTests();
    const failed = await getLifecycleByStripeSubscriptionId("sub_wh");
    expect(failed?.status).toBe("past_due");

    await applyInvoicePaid({
      stripeSubscriptionId: "sub_wh",
      stripeCustomerId: "cus_durable_a",
      eventId: "evt_paid_dur"
    });
    simulateColdStartForTests();
    const paid = await getLifecycleByStripeSubscriptionId("sub_wh");
    expect(paid?.status).toBe("active");
    expect(paid?.graceStartedAt).toBeNull();
  });

  it("rejects cross-organization lifecycle access", async () => {
    await saveLifecycleSubscription(baseSub({ organizationId: "org_a", stripeSubscriptionId: "sub_a" }));
    await saveLifecycleSubscription(
      baseSub({
        id: "life_b",
        organizationId: "org_b",
        stripeSubscriptionId: "sub_b"
      })
    );
    const forA = await getLifecycleByOrganizationId("org_a");
    expect(forA?.organizationId).toBe("org_a");
    expect(forA?.stripeSubscriptionId).toBe("sub_a");

    // Cross-org cancel must not mutate org_b when targeting org_a after cold start.
    simulateColdStartForTests();
    const canceled = await cancelAtPeriodEnd({ organizationId: "org_a" });
    expect(canceled?.organizationId).toBe("org_a");
    simulateColdStartForTests();
    const orgB = await getLifecycleByOrganizationId("org_b");
    expect(orgB?.cancelAtPeriodEnd).toBe(false);
  });

  it("501 units require one additional capacity block; 1001 require two", async () => {
    await saveLifecycleSubscription(
      baseSub({
        managedUnitCount: 501,
        authorizedAdditionalBlocks: 0,
        authorizedUnitCapacity: 500
      })
    );
    const one = await authorizeAdditionalUnitCapacity({
      organizationId: "org_durable_a",
      clientBody: {}
    });
    expect(one.ok).toBe(true);
    if (one.ok) {
      expect(one.sub.authorizedAdditionalBlocks).toBe(1);
      expect(one.sub.authorizedUnitCapacity).toBe(1000);
    }

    simulateColdStartForTests();
    await saveLifecycleSubscription(
      baseSub({
        managedUnitCount: 1001,
        authorizedAdditionalBlocks: 0,
        authorizedUnitCapacity: 500,
        updatedAt: new Date().toISOString()
      })
    );
    const two = await authorizeAdditionalUnitCapacity({
      organizationId: "org_durable_a",
      clientBody: {}
    });
    expect(two.ok).toBe(true);
    if (two.ok) {
      expect(two.sub.authorizedAdditionalBlocks).toBe(2);
      expect(two.sub.authorizedUnitCapacity).toBe(1500);
    }
  });
});
