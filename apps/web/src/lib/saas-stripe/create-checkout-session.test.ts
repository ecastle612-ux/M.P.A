import { describe, expect, it } from "vitest";
import {
  buildCommercialQuote,
  buildUnitVolumeCheckoutPlan,
  validateAcquisitionAnswers
} from "@mpa/shared";
import { buildUnitVolumeSessionParamsForTest } from "./create-checkout-session";

function quote(units: number, cycle: "monthly" | "annual" = "monthly") {
  const validated = validateAcquisitionAnswers({
    managedUnits: units,
    operationalNeed: "property_resident_leasing",
    billingInterval: cycle
  });
  if (!validated.ok) throw new Error(validated.reason);
  return buildCommercialQuote({ answers: validated.answers });
}

function foQuote(units: number, cycle: "monthly" | "annual" = "monthly") {
  const validated = validateAcquisitionAnswers({
    managedUnits: units,
    operationalNeed: "facility_maintenance",
    billingInterval: cycle,
    selectedModule: "mpa_facility_operations"
  });
  if (!validated.ok) throw new Error(validated.reason);
  return buildCommercialQuote({ answers: validated.answers });
}

describe("unit-volume Checkout Session param builder", () => {
  const prices = {
    STRIPE_PRICE_PM_BASE_MONTHLY: "price_pm_m",
    STRIPE_PRICE_PM_BASE_ANNUAL: "price_pm_a",
    STRIPE_PRICE_FO_PROFESSIONAL_MONTHLY: "price_fo_m",
    STRIPE_PRICE_FO_PROFESSIONAL_ANNUAL: "price_fo_a",
    STRIPE_PRICE_UNIT_BLOCK_MONTHLY: "price_block_m",
    STRIPE_PRICE_UNIT_BLOCK_ANNUAL: "price_block_a"
  };

  it("builds PM monthly with required payment method and 30-day trial at 500", () => {
    const plan = buildUnitVolumeCheckoutPlan(quote(500, "monthly"))!;
    const params = buildUnitVolumeSessionParamsForTest({ plan, prices });
    expect(params.line_items).toEqual([{ price: "price_pm_m", quantity: 1 }]);
    expect(params.payment_method_collection).toBe("always");
    expect(params.subscription_data.trial_period_days).toBe(30);
    expect(params.metadata["mpa_managed_units"]).toBe("500");
  });

  it("builds PM annual without additional item at 500", () => {
    const plan = buildUnitVolumeCheckoutPlan(quote(500, "annual"))!;
    const params = buildUnitVolumeSessionParamsForTest({ plan, prices });
    expect(params.line_items).toEqual([{ price: "price_pm_a", quantity: 1 }]);
    expect(params.subscription_data.trial_period_days).toBe(30);
  });

  it("adds one capacity item at 501 and none at 500", () => {
    const at500 = buildUnitVolumeSessionParamsForTest({
      plan: buildUnitVolumeCheckoutPlan(quote(500))!,
      prices
    });
    expect(at500.line_items).toHaveLength(1);

    const at501 = buildUnitVolumeSessionParamsForTest({
      plan: buildUnitVolumeCheckoutPlan(quote(501))!,
      prices
    });
    expect(at501.line_items).toEqual([
      { price: "price_pm_m", quantity: 1 },
      { price: "price_block_m", quantity: 1 }
    ]);
    expect(at501.subscription_data.trial_period_days).toBeUndefined();
  });

  it("adds two capacity items at 1001", () => {
    const params = buildUnitVolumeSessionParamsForTest({
      plan: buildUnitVolumeCheckoutPlan(quote(1001))!,
      prices
    });
    expect(params.line_items[1]).toEqual({ price: "price_block_m", quantity: 2 });
  });

  it("builds FO monthly with trial at 500 and capacity at 501/1001", () => {
    const at500 = buildUnitVolumeSessionParamsForTest({
      plan: buildUnitVolumeCheckoutPlan(foQuote(500, "monthly"))!,
      prices
    });
    expect(at500.line_items).toEqual([{ price: "price_fo_m", quantity: 1 }]);
    expect(at500.payment_method_collection).toBe("always");
    expect(at500.subscription_data.trial_period_days).toBe(30);

    const at501 = buildUnitVolumeSessionParamsForTest({
      plan: buildUnitVolumeCheckoutPlan(foQuote(501, "monthly"))!,
      prices
    });
    expect(at501.line_items).toEqual([
      { price: "price_fo_m", quantity: 1 },
      { price: "price_block_m", quantity: 1 }
    ]);
    expect(at501.subscription_data.trial_period_days).toBeUndefined();

    const at1001Annual = buildUnitVolumeSessionParamsForTest({
      plan: buildUnitVolumeCheckoutPlan(foQuote(1001, "annual"))!,
      prices
    });
    expect(at1001Annual.line_items).toEqual([
      { price: "price_fo_a", quantity: 1 },
      { price: "price_block_a", quantity: 2 }
    ]);
    expect(at1001Annual.subscription_data.trial_period_days).toBeUndefined();
  });
});
