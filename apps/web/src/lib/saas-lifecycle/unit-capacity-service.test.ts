import { beforeEach, describe, expect, it } from "vitest";
import {
  authorizeAdditionalUnitCapacity,
  reconcileOrganizationUnitCapacity,
  snapshotForSubscription,
  applyPendingCapacityAtPeriodBoundary
} from "./unit-capacity-service";
import {
  clearCapacityIntentStoreForTests,
  createCapacityAuthorizationIntent
} from "./capacity-intent-store";
import {
  clearLifecycleStoreForTests,
  saveLifecycleSubscription
} from "./lifecycle-store";
import type { LifecycleSubscription } from "@mpa/shared";

function sub(partial: Partial<LifecycleSubscription> = {}): LifecycleSubscription {
  const now = new Date().toISOString();
  return {
    id: "sub_row_cap",
    organizationId: "org_cap",
    stripeSubscriptionId: "sub_stripe_cap",
    stripeCustomerId: "cus_cap",
    productSku: "mpa_property_manager",
    planTier: "professional",
    billingCycle: "monthly",
    status: "active",
    cancelAtPeriodEnd: false,
    currentPeriodEnd: new Date(Date.now() + 30 * 86400000).toISOString(),
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
    quoteId: "cq_test",
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

describe("Slice 4 unit capacity service", () => {
  beforeEach(() => {
    clearLifecycleStoreForTests();
    clearCapacityIntentStoreForTests();
  });

  it("authorizes 500 → 501 with next-period Stripe plan and raises operational capacity", async () => {
    saveLifecycleSubscription(sub());
    const intent = createCapacityAuthorizationIntent({
      organizationId: "org_cap",
      projectedUnits: 501,
      additionalUnits: 1,
      source: "test"
    });

    const result = await authorizeAdditionalUnitCapacity({
      organizationId: "org_cap",
      intentId: intent.id,
      idempotencyKey: "idem-501"
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.sub.authorizedUnitCapacity).toBe(1000);
    expect(result.sub.authorizedAdditionalBlocks).toBe(1);
    expect(result.sub.pendingAdditionalBlocks).toBe(1);
    expect(result.snapshot.nextBillingAmountMonthlyUsd).toBe(98);
    expect(result.sub.stripeAdditionalCapacityItemId).toBeTruthy();
    expect(result.sub.audit.some((a) => a.reason.includes("capacity_authorized"))).toBe(true);

    const reused = await authorizeAdditionalUnitCapacity({
      organizationId: "org_cap",
      intentId: intent.id,
      idempotencyKey: "idem-501"
    });
    expect(reused.ok).toBe(true);
    if (reused.ok) expect(reused.reused).toBe(true);
  });

  it("rejects client price / block / Stripe Price injection", async () => {
    saveLifecycleSubscription(sub());
    const result = await authorizeAdditionalUnitCapacity({
      organizationId: "org_cap",
      clientBody: {
        stripePriceId: "price_hack",
        additional_blocks: 99,
        monthly_amount: 1
      }
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBe("client_authoritative_fields_forbidden");
  });

  it("schedules decrease 1001 → 1000 without lowering operational capacity immediately", async () => {
    saveLifecycleSubscription(
      sub({
        managedUnitCount: 1000,
        authorizedAdditionalBlocks: 2,
        authorizedUnitCapacity: 1500,
        stripeAdditionalCapacityItemId: "si_cap_2"
      })
    );

    const { sub: next, snapshot } = await reconcileOrganizationUnitCapacity({
      organizationId: "org_cap",
      source: "test_decrease"
    });
    expect(next?.authorizedUnitCapacity).toBe(1500);
    expect(next?.pendingAdditionalBlocks).toBe(1);
    expect(next?.pendingAuthorizedUnitCapacity).toBe(1000);
    expect(snapshot.capacityStatus).toBe("authorized_pending_period");
    expect(snapshot.nextBillingAmountMonthlyUsd).toBe(59 + 39);

    const applied = await applyPendingCapacityAtPeriodBoundary({
      stripeSubscriptionId: "sub_stripe_cap",
      eventId: "evt_inv_1"
    });
    expect(applied?.authorizedAdditionalBlocks).toBe(1);
    expect(applied?.authorizedUnitCapacity).toBe(1000);
  });

  it("covers block matrix increases 500→501, 1000→1001, 1500→1501", () => {
    expect(
      snapshotForSubscription(
        sub({ authorizedUnitCapacity: 500, authorizedAdditionalBlocks: 0, managedUnitCount: 500 }),
        500,
        1
      )
    ).toMatchObject({
      capacityStatus: "requires_authorization",
      requiredBlocks: 1,
      nextBillingAmountMonthlyUsd: 98
    });

    expect(
      snapshotForSubscription(
        sub({
          authorizedUnitCapacity: 1000,
          authorizedAdditionalBlocks: 1,
          managedUnitCount: 1000
        }),
        1000,
        1
      )
    ).toMatchObject({
      capacityStatus: "requires_authorization",
      requiredBlocks: 2,
      nextBillingAmountMonthlyUsd: 59 + 78
    });

    expect(
      snapshotForSubscription(
        sub({
          authorizedUnitCapacity: 1500,
          authorizedAdditionalBlocks: 2,
          managedUnitCount: 1500
        }),
        1500,
        1
      )
    ).toMatchObject({
      capacityStatus: "requires_authorization",
      requiredBlocks: 3
    });

    // 501 → 1000 stays within one additional block
    expect(
      snapshotForSubscription(
        sub({
          authorizedUnitCapacity: 1000,
          authorizedAdditionalBlocks: 1,
          managedUnitCount: 501
        }),
        501,
        499
      ).capacityStatus
    ).toBe("within_capacity");
  });

  it("trialing past 500 surfaces trial note on snapshot", () => {
    const snap = snapshotForSubscription(
      sub({ status: "trialing", trialEndsAt: new Date(Date.now() + 86400000).toISOString() }),
      500,
      1
    );
    expect(snap.trialActive).toBe(true);
    expect(snap.trialCapacityNote).toMatch(/free-trial/i);
  });
});
