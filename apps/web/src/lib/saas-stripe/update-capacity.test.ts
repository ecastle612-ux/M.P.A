import { describe, expect, it } from "vitest";
import { applyNextPeriodCapacityStripeUpdate } from "./update-capacity";

describe("next-period capacity Stripe updater", () => {
  it("creates capacity item for 0 → 1 without live Stripe in tests", async () => {
    const result = await applyNextPeriodCapacityStripeUpdate({
      stripeSubscriptionId: "sub_x",
      additionalCapacityItemId: null,
      currentBlocks: 0,
      nextBlocks: 1,
      billingCycle: "monthly"
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.action.kind).toBe("create_item");
    expect(result.action).toMatchObject({ quantity: 1, prorationBehavior: "none" });
    expect(result.skippedLiveCall).toBe(true);
  });

  it("updates quantity for 1 → 2", async () => {
    const result = await applyNextPeriodCapacityStripeUpdate({
      stripeSubscriptionId: "sub_x",
      additionalCapacityItemId: "si_cap",
      currentBlocks: 1,
      nextBlocks: 2,
      billingCycle: "monthly"
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.action).toMatchObject({
      kind: "update_quantity",
      quantity: 2,
      prorationBehavior: "none"
    });
  });

  it("deletes item on decrease to 0 (never qty 0)", async () => {
    const result = await applyNextPeriodCapacityStripeUpdate({
      stripeSubscriptionId: "sub_x",
      additionalCapacityItemId: "si_cap",
      currentBlocks: 1,
      nextBlocks: 0,
      billingCycle: "annual"
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.action.kind).toBe("delete_item");
    expect(result.stripeAdditionalCapacityItemId).toBeNull();
  });
});
