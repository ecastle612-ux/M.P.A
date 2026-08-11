import { describe, expect, it } from "vitest";
import {
  MAX_DECLARED_MANAGED_UNITS,
  assertQuoteMatchesRecompute,
  buildCommercialQuote,
  confirmPlanCapacityLines,
  createAcquisitionSnapshot,
  findForbiddenClientQuoteFields,
  isCommercialQuoteExpired,
  recommendModuleForNeed,
  regenerateCommercialQuote,
  validateAcquisitionAnswers
} from "./acquisition-quote";
import { FO_READY } from "./commerce-flags";

const BOUNDARY = [1, 500, 501, 1000, 1001, 1500, 1501] as const;

function answers(overrides: Partial<Parameters<typeof buildCommercialQuote>[0]["answers"]> = {}) {
  return {
    managedUnits: 500,
    operationalNeed: "property_resident_leasing" as const,
    billingInterval: "monthly" as const,
    notes: null,
    unitRangeId: null,
    selectedModule: null,
    ...overrides
  };
}

describe("acquisition questionnaire validation", () => {
  it("accepts positive integer units and required fields", () => {
    const result = validateAcquisitionAnswers({
      managedUnits: 501,
      operationalNeed: "property_resident_leasing",
      billingInterval: "annual",
      notes: "  hello  "
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.answers.managedUnits).toBe(501);
      expect(result.answers.notes).toBe("hello");
    }
  });

  it("rejects invalid unit values", () => {
    expect(validateAcquisitionAnswers({
      managedUnits: 0,
      operationalNeed: "both",
      billingInterval: "monthly"
    }).ok).toBe(false);
    expect(validateAcquisitionAnswers({
      managedUnits: -3,
      operationalNeed: "both",
      billingInterval: "monthly"
    }).ok).toBe(false);
    expect(validateAcquisitionAnswers({
      managedUnits: 12.5,
      operationalNeed: "both",
      billingInterval: "monthly"
    }).ok).toBe(false);
    expect(validateAcquisitionAnswers({
      managedUnits: "abc",
      operationalNeed: "both",
      billingInterval: "monthly"
    }).ok).toBe(false);
    expect(validateAcquisitionAnswers({
      managedUnits: MAX_DECLARED_MANAGED_UNITS + 1,
      operationalNeed: "both",
      billingInterval: "monthly"
    }).ok).toBe(false);
  });
});

describe("module recommendation", () => {
  it("maps needs to modules and keeps FO/Complete gated", () => {
    expect(FO_READY).toBe(false);
    expect(recommendModuleForNeed("property_resident_leasing").recommendedModule).toBe(
      "mpa_property_manager"
    );
    const fo = recommendModuleForNeed("facility_maintenance");
    expect(fo.recommendedModule).toBe("mpa_facility_operations");
    expect(fo.gated).toBe(true);
    expect(fo.selfServeAvailable).toBe(false);
    const complete = recommendModuleForNeed("both");
    expect(complete.recommendedModule).toBe("mpa_complete_platform");
    expect(complete.gated).toBe(true);
  });
});

describe("server commercial quote", () => {
  it("prices PM monthly at boundaries", () => {
    const expectedMonthly: Record<number, number> = {
      1: 59,
      500: 59,
      501: 98,
      1000: 98,
      1001: 137,
      1500: 137,
      1501: 176
    };
    for (const units of BOUNDARY) {
      const quote = buildCommercialQuote({ answers: answers({ managedUnits: units }) });
      expect(quote.monthly_amount).toBe(expectedMonthly[units]);
      expect(quote.annual_amount).toBe(expectedMonthly[units]! * 12);
      expect(quote.stripe_objects_created).toBe(false);
    }
  });

  it("prices PM annual as monthly × 12", () => {
    const quote = buildCommercialQuote({
      answers: answers({ managedUnits: 501, billingInterval: "annual" })
    });
    expect(quote.billing_interval).toBe("annual");
    expect(quote.selected_amount).toBe(1176);
    expect(quote.annual_amount).toBe(quote.monthly_amount * 12);
  });

  it("calculates Complete pricing without activating self-serve", () => {
    const quote = buildCommercialQuote({
      answers: answers({
        managedUnits: 501,
        operationalNeed: "both",
        selectedModule: "mpa_complete_platform"
      })
    });
    expect(quote.module).toBe("mpa_complete_platform");
    expect(quote.monthly_amount).toBe(148);
    expect(quote.annual_amount).toBe(1776);
    expect(quote.recommendation.gated).toBe(true);
  });

  it("keeps FO flat and gated", () => {
    const quote = buildCommercialQuote({
      answers: answers({
        managedUnits: 1000,
        operationalNeed: "facility_maintenance",
        selectedModule: "mpa_facility_operations",
        billingInterval: "annual"
      })
    });
    expect(quote.monthly_amount).toBe(59);
    expect(quote.annual_amount).toBe(590);
    expect(quote.additional_blocks).toBe(0);
    expect(quote.trial_eligible).toBe(false);
    expect(quote.recommendation.gated).toBe(true);
  });

  it("sets trial eligibility only for <=500 units on unit-volume modules", () => {
    const eligible = buildCommercialQuote({ answers: answers({ managedUnits: 500 }) });
    expect(eligible.trial_eligible).toBe(true);
    expect(eligible.trial_days).toBe(30);
    const ineligible = buildCommercialQuote({ answers: answers({ managedUnits: 501 }) });
    expect(ineligible.trial_eligible).toBe(false);
    expect(ineligible.trial_days).toBe(0);
  });

  it("reproduces quote fields server-side", () => {
    const quote = buildCommercialQuote({ answers: answers({ managedUnits: 1001 }) });
    expect(assertQuoteMatchesRecompute(quote)).toBe(true);
  });

  it("expires and regenerates a fresh quote", () => {
    const quote = buildCommercialQuote({
      answers: answers({ managedUnits: 500 }),
      now: new Date("2026-01-01T00:00:00.000Z")
    });
    expect(isCommercialQuoteExpired(quote, new Date("2026-01-02T00:00:00.000Z"))).toBe(true);
    const next = regenerateCommercialQuote({
      answers: answers({ managedUnits: 500 }),
      previousQuoteId: quote.quote_id,
      now: new Date("2026-01-03T00:00:00.000Z")
    });
    expect(next.quote_id).not.toBe(quote.quote_id);
    expect(next.monthly_amount).toBe(59);
  });

  it("rejects client price / Stripe / trial tampering fields", () => {
    expect(
      findForbiddenClientQuoteFields({
        managedUnits: 100,
        stripePriceId: "price_hack",
        monthly_amount: 1,
        trial_eligible: true
      })
    ).toEqual(expect.arrayContaining(["stripePriceId", "monthly_amount", "trial_eligible"]));
  });

  it("builds Confirm Plan capacity lines for 500 and 501", () => {
    const base = confirmPlanCapacityLines(
      buildCommercialQuote({ answers: answers({ managedUnits: 500 }) })
    );
    expect(base.additionalCapacity).toBe("None");
    expect(base.trialLabel).toBe("30 days free");
    expect(base.additionalUnitCapacityNotice).toBeNull();

    const over = confirmPlanCapacityLines(
      buildCommercialQuote({ answers: answers({ managedUnits: 501 }) })
    );
    expect(over.additionalCapacity).toBe("1 × 500-unit block");
    expect(over.trialLabel).toBe("Not eligible");
    expect(over.additionalUnitCapacityNotice).toBe("Your plan includes additional unit capacity.");
  });

  it("creates an acquisition snapshot for audit", () => {
    const quote = buildCommercialQuote({ answers: answers({ managedUnits: 250 }) });
    const snap = createAcquisitionSnapshot(quote);
    expect(snap.declared_units).toBe(250);
    expect(snap.recommended_module).toBe("mpa_property_manager");
    expect(snap.quote.quote_id).toBe(quote.quote_id);
  });
});
