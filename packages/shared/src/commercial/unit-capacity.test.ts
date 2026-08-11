import { describe, expect, it } from "vitest";
import {
  UNIT_VOLUME_PRICE_ENV_KEYS,
  planNextPeriodCapacityUpdate
} from "./unit-volume-stripe";
import {
  buildCapacityGatePresentation,
  evaluateUnitCapacityState,
  findForbiddenClientCapacityFields,
  planStripeCapacityAction,
  wouldExceedAuthorizedCapacity
} from "./unit-capacity";

describe("unit capacity payment gate (Slice 4)", () => {
  it("detects 500 → 501 requires authorization with $98 next price", () => {
    const snapshot = evaluateUnitCapacityState({
      actualUnits: 500,
      projectedAdditionalUnits: 1,
      authorizedUnitCapacity: 500,
      authorizedAdditionalBlocks: 0,
      billingInterval: "monthly"
    });
    expect(snapshot.capacityStatus).toBe("requires_authorization");
    expect(snapshot.requiredBlocks).toBe(1);
    expect(snapshot.requiredCapacity).toBe(1000);
    expect(snapshot.currentBillingAmountMonthlyUsd).toBe(59);
    expect(snapshot.nextBillingAmountMonthlyUsd).toBe(98);

    const gate = buildCapacityGatePresentation(snapshot, 501);
    expect(gate.title).toBe("Additional Unit Capacity Required");
    expect(gate.ctaLabel).toBe("Authorize Additional Capacity");
    expect(gate.currentPriceLabel).toBe("$59/month");
    expect(gate.newPriceLabel).toBe("$98/month");
    expect(gate.additionalCapacityLabel).toBe("+$39/month");
    expect(gate.effectiveLabel).toContain("next billing period");
  });

  it("covers block boundaries 501→1000, 1000→1001, 1500→1501", () => {
    expect(
      evaluateUnitCapacityState({
        actualUnits: 501,
        projectedAdditionalUnits: 499,
        authorizedAdditionalBlocks: 1,
        authorizedUnitCapacity: 1000
      }).capacityStatus
    ).toBe("within_capacity");

    const to1001 = evaluateUnitCapacityState({
      actualUnits: 1000,
      projectedAdditionalUnits: 1,
      authorizedAdditionalBlocks: 1,
      authorizedUnitCapacity: 1000
    });
    expect(to1001.capacityStatus).toBe("requires_authorization");
    expect(to1001.requiredBlocks).toBe(2);
    expect(to1001.nextBillingAmountMonthlyUsd).toBe(59 + 39 * 2);

    const to1501 = evaluateUnitCapacityState({
      actualUnits: 1500,
      projectedAdditionalUnits: 1,
      authorizedAdditionalBlocks: 2,
      authorizedUnitCapacity: 1500
    });
    expect(to1501.requiredBlocks).toBe(3);
  });

  it("marks decrease paths as sync_required without changing authorized capacity", () => {
    for (const [actual, blocks] of [
      [499, 0],
      [500, 1],
      [1000, 2]
    ] as const) {
      const snapshot = evaluateUnitCapacityState({
        actualUnits: actual,
        authorizedAdditionalBlocks: blocks,
        authorizedUnitCapacity: 500 * (1 + blocks)
      });
      if (actual <= 500 * blocks) {
        // 500 with 1 block → actual needs 0 blocks < 1
        expect(["sync_required", "within_capacity"]).toContain(snapshot.capacityStatus);
      }
    }
    const decrease = evaluateUnitCapacityState({
      actualUnits: 500,
      authorizedAdditionalBlocks: 1,
      authorizedUnitCapacity: 1000
    });
    expect(decrease.capacityStatus).toBe("sync_required");
    expect(decrease.authorizedCapacity).toBe(1000);
  });

  it("shows authorized_pending_period when pending blocks differ", () => {
    const snapshot = evaluateUnitCapacityState({
      actualUnits: 501,
      authorizedAdditionalBlocks: 1,
      authorizedUnitCapacity: 1000,
      pendingAdditionalBlocks: 1,
      pendingAuthorizedUnitCapacity: 1000
    });
    // pending equals authorized → within
    expect(snapshot.capacityStatus).toBe("within_capacity");

    const pendingDecrease = evaluateUnitCapacityState({
      actualUnits: 500,
      authorizedAdditionalBlocks: 1,
      authorizedUnitCapacity: 1000,
      pendingAdditionalBlocks: 0,
      pendingAuthorizedUnitCapacity: 500
    });
    expect(pendingDecrease.capacityStatus).toBe("authorized_pending_period");
  });

  it("trial note appears when trialing past 500", () => {
    const snapshot = evaluateUnitCapacityState({
      actualUnits: 500,
      projectedAdditionalUnits: 1,
      authorizedUnitCapacity: 500,
      authorizedAdditionalBlocks: 0,
      trialActive: true
    });
    const gate = buildCapacityGatePresentation(snapshot, 501);
    expect(gate.trialNote).toMatch(/free-trial included capacity/i);
  });

  it("rejects client capacity tamper fields", () => {
    expect(
      findForbiddenClientCapacityFields({
        intentId: "ok",
        stripePriceId: "price_x",
        additional_blocks: 9,
        monthly_amount: 1
      })
    ).toEqual(expect.arrayContaining(["stripePriceId", "additional_blocks", "monthly_amount"]));
  });

  it("plans Stripe next-period actions without qty 0", () => {
    expect(
      planStripeCapacityAction({
        additionalCapacityItemId: null,
        currentBlocks: 0,
        nextBlocks: 1,
        unitBlockPriceEnvKey: UNIT_VOLUME_PRICE_ENV_KEYS.UNIT_BLOCK_MONTHLY
      })
    ).toEqual({
      kind: "create_item",
      priceEnvKey: "STRIPE_PRICE_UNIT_BLOCK_MONTHLY",
      quantity: 1,
      prorationBehavior: "none"
    });

    expect(
      planStripeCapacityAction({
        additionalCapacityItemId: "si_cap",
        currentBlocks: 2,
        nextBlocks: 1,
        unitBlockPriceEnvKey: UNIT_VOLUME_PRICE_ENV_KEYS.UNIT_BLOCK_MONTHLY
      })
    ).toMatchObject({ kind: "update_quantity", quantity: 1, prorationBehavior: "none" });

    expect(
      planStripeCapacityAction({
        additionalCapacityItemId: "si_cap",
        currentBlocks: 1,
        nextBlocks: 0,
        unitBlockPriceEnvKey: UNIT_VOLUME_PRICE_ENV_KEYS.UNIT_BLOCK_MONTHLY
      })
    ).toMatchObject({ kind: "delete_item", prorationBehavior: "none" });
  });

  it("wouldExceedAuthorizedCapacity matches gate", () => {
    expect(
      wouldExceedAuthorizedCapacity({
        actualUnits: 500,
        additionalUnits: 1,
        authorizedCapacity: 500
      })
    ).toBe(true);
    expect(
      wouldExceedAuthorizedCapacity({
        actualUnits: 499,
        additionalUnits: 1,
        authorizedCapacity: 500
      })
    ).toBe(false);
  });

  it("aligns with Slice 3 next-period plan helper", () => {
    const plan = planNextPeriodCapacityUpdate({
      stripeSubscriptionId: "sub_1",
      additionalCapacityItemId: null,
      currentAdditionalBlocks: 0,
      nextManagedUnits: 501
    });
    expect(plan.nextAdditionalBlocks).toBe(1);
    expect(plan.prorationBehavior).toBe("none");
  });
});
