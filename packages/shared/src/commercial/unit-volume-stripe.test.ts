import { describe, expect, it } from "vitest";
import {
  buildCommercialQuote,
  validateAcquisitionAnswers
} from "./acquisition-quote";
import {
  COMMERCIAL_MODEL_VERSION,
  UNIT_VOLUME_PRICE_ENV_KEYS,
  buildCheckoutLineItemPlan,
  buildUnitVolumeCheckoutPlan,
  planNextPeriodCapacityUpdate,
  resolveCheckoutLineItems,
  validateQuoteForCheckout
} from "./unit-volume-stripe";

function quoteFor(units: number, cycle: "monthly" | "annual" = "monthly") {
  const validated = validateAcquisitionAnswers({
    managedUnits: units,
    operationalNeed: "property_resident_leasing",
    billingInterval: cycle
  });
  if (!validated.ok) throw new Error(validated.reason);
  return buildCommercialQuote({ answers: validated.answers });
}

describe("unit-volume Stripe checkout architecture", () => {
  it("documents Price env keys without hard-coded Price IDs", () => {
    expect(UNIT_VOLUME_PRICE_ENV_KEYS.PM_BASE_MONTHLY).toBe("STRIPE_PRICE_PM_BASE_MONTHLY");
    expect(UNIT_VOLUME_PRICE_ENV_KEYS.FO_BASE_MONTHLY).toBe("STRIPE_PRICE_FO_PROFESSIONAL_MONTHLY");
    expect(UNIT_VOLUME_PRICE_ENV_KEYS.FO_BASE_ANNUAL).toBe("STRIPE_PRICE_FO_PROFESSIONAL_ANNUAL");
    expect(UNIT_VOLUME_PRICE_ENV_KEYS.UNIT_BLOCK_ANNUAL).toBe("STRIPE_PRICE_UNIT_BLOCK_ANNUAL");
    expect(UNIT_VOLUME_PRICE_ENV_KEYS.COMPLETE_BASE_MONTHLY).toBe(
      "STRIPE_PRICE_COMPLETE_BASE_MONTHLY"
    );
  });

  it("omits Additional Unit Capacity item at 500 units", () => {
    const plan = buildCheckoutLineItemPlan({
      module: "mpa_property_manager",
      billingInterval: "monthly",
      additionalBlocks: 0
    });
    expect(plan).toEqual([
      {
        role: "base",
        priceEnvKey: "STRIPE_PRICE_PM_BASE_MONTHLY",
        quantity: 1
      }
    ]);
  });

  it("uses quantity 1 Additional Unit Capacity at 501 and 1000", () => {
    for (const units of [501, 1000]) {
      const quote = quoteFor(units);
      const plan = buildUnitVolumeCheckoutPlan(quote)!;
      expect(plan.additionalBlocks).toBe(1);
      expect(plan.lineItems).toHaveLength(2);
      expect(plan.lineItems[1]).toEqual({
        role: "additional_unit_capacity",
        priceEnvKey: "STRIPE_PRICE_UNIT_BLOCK_MONTHLY",
        quantity: 1
      });
    }
  });

  it("uses quantity 2 Additional Unit Capacity at 1001", () => {
    const quote = quoteFor(1001);
    const plan = buildUnitVolumeCheckoutPlan(quote)!;
    expect(plan.additionalBlocks).toBe(2);
    expect(plan.lineItems[1]?.quantity).toBe(2);
  });

  it("configures 30-day trial only when units <= 500 and requires payment method", () => {
    const eligible = buildUnitVolumeCheckoutPlan(quoteFor(500))!;
    expect(eligible.trialEligible).toBe(true);
    expect(eligible.trialPeriodDays).toBe(30);
    expect(eligible.paymentMethodCollection).toBe("always");

    const ineligible = buildUnitVolumeCheckoutPlan(quoteFor(501))!;
    expect(ineligible.trialEligible).toBe(false);
    expect(ineligible.trialPeriodDays).toBeNull();
  });

  it("builds PM monthly and annual line plans", () => {
    const monthly = buildUnitVolumeCheckoutPlan(quoteFor(500, "monthly"))!;
    expect(monthly.lineItems[0]?.priceEnvKey).toBe("STRIPE_PRICE_PM_BASE_MONTHLY");
    const annual = buildUnitVolumeCheckoutPlan(quoteFor(500, "annual"))!;
    expect(annual.lineItems[0]?.priceEnvKey).toBe("STRIPE_PRICE_PM_BASE_ANNUAL");
  });

  it("builds FO Checkout plan with shared unit-block Prices and self-serve allowed", () => {
    const validated = validateAcquisitionAnswers({
      managedUnits: 501,
      operationalNeed: "facility_maintenance",
      billingInterval: "monthly",
      selectedModule: "mpa_facility_operations"
    });
    if (!validated.ok) throw new Error(validated.reason);
    const quote = buildCommercialQuote({ answers: validated.answers });
    const plan = buildUnitVolumeCheckoutPlan(quote)!;
    expect(plan.module).toBe("mpa_facility_operations");
    expect(plan.selfServeAllowed).toBe(true);
    expect(plan.trialEligible).toBe(false);
    expect(plan.trialPeriodDays).toBeNull();
    expect(plan.paymentMethodCollection).toBe("always");
    expect(plan.lineItems).toEqual([
      {
        role: "base",
        priceEnvKey: "STRIPE_PRICE_FO_PROFESSIONAL_MONTHLY",
        quantity: 1
      },
      {
        role: "additional_unit_capacity",
        priceEnvKey: "STRIPE_PRICE_UNIT_BLOCK_MONTHLY",
        quantity: 1
      }
    ]);

    const annual = validateAcquisitionAnswers({
      managedUnits: 500,
      operationalNeed: "facility_maintenance",
      billingInterval: "annual",
      selectedModule: "mpa_facility_operations"
    });
    if (!annual.ok) throw new Error(annual.reason);
    const annualPlan = buildUnitVolumeCheckoutPlan(
      buildCommercialQuote({ answers: annual.answers })
    )!;
    expect(annualPlan.trialEligible).toBe(true);
    expect(annualPlan.trialPeriodDays).toBe(30);
    expect(annualPlan.lineItems[0]?.priceEnvKey).toBe("STRIPE_PRICE_FO_PROFESSIONAL_ANNUAL");
    expect(annualPlan.lineItems).toHaveLength(1);
  });

  it("builds Complete monthly architecture while remaining gated", () => {
    const validated = validateAcquisitionAnswers({
      managedUnits: 501,
      operationalNeed: "both",
      billingInterval: "monthly",
      selectedModule: "mpa_complete_platform"
    });
    if (!validated.ok) throw new Error(validated.reason);
    const quote = buildCommercialQuote({ answers: validated.answers });
    const plan = buildUnitVolumeCheckoutPlan(quote)!;
    expect(plan.module).toBe("mpa_complete_platform");
    expect(plan.lineItems[0]?.priceEnvKey).toBe("STRIPE_PRICE_COMPLETE_BASE_MONTHLY");
    expect(plan.lineItems[1]?.quantity).toBe(1);
    expect(plan.selfServeAllowed).toBe(false);
  });

  it("allows FO quote Checkout validation and rejects Complete as gated", () => {
    const foValidated = validateAcquisitionAnswers({
      managedUnits: 1001,
      operationalNeed: "facility_maintenance",
      billingInterval: "annual",
      selectedModule: "mpa_facility_operations"
    });
    if (!foValidated.ok) throw new Error(foValidated.reason);
    const foQuote = buildCommercialQuote({ answers: foValidated.answers });
    const foOk = validateQuoteForCheckout({
      quote: foQuote,
      resolvePriceId: (key) =>
        key.includes("FO_PROFESSIONAL") || key.includes("UNIT_BLOCK") ? `price_${key}` : null
    });
    expect(foOk.ok).toBe(true);
    if (foOk.ok) {
      expect(foOk.plan.lineItems[1]?.quantity).toBe(2);
      expect(foOk.plan.trialPeriodDays).toBeNull();
    }

    const completeValidated = validateAcquisitionAnswers({
      managedUnits: 500,
      operationalNeed: "both",
      billingInterval: "monthly",
      selectedModule: "mpa_complete_platform"
    });
    if (!completeValidated.ok) throw new Error(completeValidated.reason);
    const completeQuote = buildCommercialQuote({ answers: completeValidated.answers });
    const gated = validateQuoteForCheckout({ quote: completeQuote });
    expect(gated.ok).toBe(false);
    if (!gated.ok) {
      expect(gated.reason).toBe("module_gated");
    }
  });

  it("writes reconciliation metadata without sensitive payload", () => {
    const plan = buildUnitVolumeCheckoutPlan(quoteFor(501))!;
    expect(plan.metadata.mpa_commercial_model_version).toBe(COMMERCIAL_MODEL_VERSION);
    expect(plan.metadata.mpa_managed_units).toBe("501");
    expect(plan.metadata.mpa_additional_blocks).toBe("1");
    expect(plan.metadata.mpa_quote_id).toBeTruthy();
    expect(JSON.stringify(plan.metadata)).not.toMatch(/password|ssn|card/i);
  });

  it("resolves Stripe line items from env Price map", () => {
    const plan = buildUnitVolumeCheckoutPlan(quoteFor(1001))!;
    const prices: Record<string, string> = {
      STRIPE_PRICE_PM_BASE_MONTHLY: "price_pm_base_m",
      STRIPE_PRICE_UNIT_BLOCK_MONTHLY: "price_block_m"
    };
    const resolved = resolveCheckoutLineItems(plan, (key) => prices[key] ?? null);
    expect(resolved.ok).toBe(true);
    if (resolved.ok) {
      expect(resolved.items).toEqual([
        { price: "price_pm_base_m", quantity: 1, role: "base" },
        { price: "price_block_m", quantity: 2, role: "additional_unit_capacity" }
      ]);
    }
  });

  it("validates quotes and rejects tampering / expiry / mismatches", () => {
    const quote = quoteFor(500);
    const ok = validateQuoteForCheckout({
      quote,
      resolvePriceId: (key) =>
        key.includes("PM_BASE") || key.includes("UNIT_BLOCK") ? `price_${key}` : null
    });
    expect(ok.ok).toBe(true);

    expect(
      validateQuoteForCheckout({
        quote,
        clientBody: { stripePriceId: "price_hack" }
      }).ok
    ).toBe(false);

    expect(
      validateQuoteForCheckout({
        quote,
        clientBody: { monthly_amount: 1 }
      }).ok
    ).toBe(false);

    expect(
      validateQuoteForCheckout({
        quote,
        clientBody: { trial_eligible: true, trial_period_days: 99 }
      }).ok
    ).toBe(false);

    expect(
      validateQuoteForCheckout({
        quote,
        expectedModule: "mpa_complete_platform"
      }).ok
    ).toBe(false);

    expect(
      validateQuoteForCheckout({
        quote,
        expectedManagedUnits: 999
      }).ok
    ).toBe(false);

    expect(
      validateQuoteForCheckout({
        quote: { ...quote, expires_at: new Date(Date.now() - 1000).toISOString() }
      }).ok
    ).toBe(false);

    expect(
      validateQuoteForCheckout({
        quote: { ...quote, trial_eligible: false }
      }).ok
    ).toBe(false);
  });

  it("prepares next-period capacity update plan for Slice 4", () => {
    const plan = planNextPeriodCapacityUpdate({
      stripeSubscriptionId: "sub_x",
      additionalCapacityItemId: "si_block",
      currentAdditionalBlocks: 1,
      nextManagedUnits: 1001
    });
    expect(plan.nextAdditionalBlocks).toBe(2);
    expect(plan.prorationBehavior).toBe("none");
    expect(plan.applyAt).toBe("next_billing_period");
    expect(plan.omitItemWhenZero).toBe(true);
  });
});
