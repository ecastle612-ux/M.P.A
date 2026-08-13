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
import { COMPLETE_READY, FO_READY } from "./commerce-flags";

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
  it("maps needs to modules — PM, FO, and Complete are self-serve", () => {
    expect(FO_READY).toBe(true);
    expect(COMPLETE_READY).toBe(true);
    expect(recommendModuleForNeed("property_resident_leasing").recommendedModule).toBe(
      "mpa_property_manager"
    );
    const fo = recommendModuleForNeed("facility_maintenance");
    expect(fo.recommendedModule).toBe("mpa_facility_operations");
    expect(fo.gated).toBe(false);
    expect(fo.selfServeAvailable).toBe(true);
    expect(fo.nextAction).toBe("confirm_plan_self_serve");
    const complete = recommendModuleForNeed("both");
    expect(complete.recommendedModule).toBe("mpa_complete_platform");
    expect(complete.gated).toBe(false);
    expect(complete.selfServeAvailable).toBe(true);
    expect(complete.nextAction).toBe("confirm_plan_self_serve");
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
      expect(quote.annual_amount).not.toBe(expectedMonthly[units]! * 12);
      expect(quote.stripe_objects_created).toBe(false);
    }
  });

  it("prices PM annual with 20% prepaid discount", () => {
    const quote = buildCommercialQuote({
      answers: answers({ managedUnits: 501, billingInterval: "annual" })
    });
    expect(quote.billing_interval).toBe("annual");
    expect(quote.selected_amount).toBe(1034.4);
    expect(quote.annual_amount).toBe(566.4 + 468);
    expect(quote.annual_amount).not.toBe(quote.monthly_amount * 12);
  });

  it("prices Complete on unit-volume with self-serve available", () => {
    const cases: Array<{ units: number; monthly: number; annual: number; trial: boolean }> = [
      { units: 500, monthly: 109, annual: 1046.4, trial: true },
      { units: 501, monthly: 148, annual: 1514.4, trial: false },
      { units: 1000, monthly: 148, annual: 1514.4, trial: false },
      { units: 1001, monthly: 187, annual: 1982.4, trial: false }
    ];
    for (const row of cases) {
      const monthly = buildCommercialQuote({
        answers: answers({
          managedUnits: row.units,
          operationalNeed: "both",
          selectedModule: "mpa_complete_platform",
          billingInterval: "monthly"
        })
      });
      expect(monthly.module).toBe("mpa_complete_platform");
      expect(monthly.monthly_amount).toBe(row.monthly);
      expect(monthly.annual_amount).toBe(row.annual);
      expect(monthly.trial_eligible).toBe(row.trial);
      expect(monthly.trial_days).toBe(row.trial ? 30 : 0);
      expect(monthly.recommendation.gated).toBe(false);
      expect(monthly.recommendation.selfServeAvailable).toBe(true);

      const annual = buildCommercialQuote({
        answers: answers({
          managedUnits: row.units,
          operationalNeed: "both",
          selectedModule: "mpa_complete_platform",
          billingInterval: "annual"
        })
      });
      expect(annual.selected_amount).toBe(row.annual);
      expect(annual.annual_amount).not.toBe(annual.monthly_amount * 12);
    }
  });

  it("prices FO on unit-volume with trial and capacity", () => {
    const at500 = buildCommercialQuote({
      answers: answers({
        managedUnits: 500,
        operationalNeed: "facility_maintenance",
        selectedModule: "mpa_facility_operations",
        billingInterval: "monthly"
      })
    });
    expect(at500.monthly_amount).toBe(59);
    expect(at500.annual_amount).toBe(566.4);
    expect(at500.additional_blocks).toBe(0);
    expect(at500.included_units).toBe(500);
    expect(at500.trial_eligible).toBe(true);
    expect(at500.trial_days).toBe(30);
    expect(at500.recommendation.gated).toBe(false);
    expect(at500.recommendation.selfServeAvailable).toBe(true);

    const at501 = buildCommercialQuote({
      answers: answers({
        managedUnits: 501,
        operationalNeed: "facility_maintenance",
        selectedModule: "mpa_facility_operations",
        billingInterval: "annual"
      })
    });
    expect(at501.monthly_amount).toBe(98);
    expect(at501.annual_amount).toBe(1034.4);
    expect(at501.selected_amount).toBe(1034.4);
    expect(at501.additional_blocks).toBe(1);
    expect(at501.trial_eligible).toBe(false);
    expect(at501.trial_days).toBe(0);

    const at1000 = buildCommercialQuote({
      answers: answers({
        managedUnits: 1000,
        operationalNeed: "facility_maintenance",
        selectedModule: "mpa_facility_operations"
      })
    });
    expect(at1000.monthly_amount).toBe(98);
    expect(at1000.additional_blocks).toBe(1);

    const at1001 = buildCommercialQuote({
      answers: answers({
        managedUnits: 1001,
        operationalNeed: "facility_maintenance",
        selectedModule: "mpa_facility_operations",
        billingInterval: "annual"
      })
    });
    expect(at1001.monthly_amount).toBe(137);
    expect(at1001.annual_amount).toBe(1502.4);
    expect(at1001.additional_blocks).toBe(2);
    expect(at1001.trial_eligible).toBe(false);
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
    const fo = buildCommercialQuote({
      answers: answers({
        managedUnits: 1001,
        operationalNeed: "facility_maintenance",
        selectedModule: "mpa_facility_operations"
      })
    });
    expect(assertQuoteMatchesRecompute(fo)).toBe(true);
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

  it("builds Confirm Plan capacity lines for FO 500 and 501", () => {
    const base = confirmPlanCapacityLines(
      buildCommercialQuote({
        answers: answers({
          managedUnits: 500,
          operationalNeed: "facility_maintenance",
          selectedModule: "mpa_facility_operations"
        })
      })
    );
    expect(base.additionalCapacity).toBe("None");
    expect(base.trialLabel).toBe("30-Day Free Trial");
    expect(base.additionalUnitCapacityNotice).toBeNull();

    const over = confirmPlanCapacityLines(
      buildCommercialQuote({
        answers: answers({
          managedUnits: 501,
          operationalNeed: "facility_maintenance",
          selectedModule: "mpa_facility_operations"
        })
      })
    );
    expect(over.additionalCapacity).toBe("1 × 500-unit block");
    expect(over.trialLabel).toBe("No free trial");
    expect(over.additionalUnitCapacityNotice).toMatch(/Additional Unit Capacity/i);
    expect(over.additionalUnitCapacityNotice).toMatch(/\$98\/month/);
  });

  it("creates an acquisition snapshot for audit", () => {
    const quote = buildCommercialQuote({ answers: answers({ managedUnits: 250 }) });
    const snap = createAcquisitionSnapshot(quote);
    expect(snap.declared_units).toBe(250);
    expect(snap.recommended_module).toBe("mpa_property_manager");
    expect(snap.quote.quote_id).toBe(quote.quote_id);
  });
});
