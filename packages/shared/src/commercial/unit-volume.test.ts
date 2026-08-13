import { describe, expect, it } from "vitest";
import {
  ADDITIONAL_UNIT_BLOCK_ANNUAL_USD,
  ADDITIONAL_UNIT_BLOCK_MONTHLY_USD,
  ANNUAL_PREPAID_MULTIPLIER,
  ANNUAL_SAVINGS_PERCENT,
  COMPLETE_BASE_ANNUAL_CENTS,
  COMPLETE_BASE_ANNUAL_USD,
  COMPLETE_BASE_MONTHLY_USD,
  FO_ANNUAL_CENTS,
  FO_ANNUAL_USD,
  FO_MONTHLY_USD,
  PM_BASE_ANNUAL_CENTS,
  PM_BASE_ANNUAL_USD,
  PM_BASE_MONTHLY_USD,
  UNIT_BLOCK_SIZE,
  UNIT_VOLUME_TRIAL_DAYS,
  additionalUnitBlocks,
  annualSavingsVsMonthlyUsd,
  annualUnitVolumePriceUsd,
  isUnitVolumeTrialEligible,
  monthlyUnitVolumePriceUsd,
  quoteUnitVolume,
  quoteUnitVolumeForSku
} from "./unit-volume";

const BOUNDARY_UNITS = [0, 1, 499, 500, 501, 999, 1000, 1001, 1499, 1500, 1501] as const;

describe("unit-volume domain", () => {
  it("uses approved constants", () => {
    expect(UNIT_BLOCK_SIZE).toBe(500);
    expect(PM_BASE_MONTHLY_USD).toBe(59);
    expect(COMPLETE_BASE_MONTHLY_USD).toBe(109);
    expect(ADDITIONAL_UNIT_BLOCK_MONTHLY_USD).toBe(39);
    expect(ADDITIONAL_UNIT_BLOCK_ANNUAL_USD).toBe(468);
    expect(UNIT_VOLUME_TRIAL_DAYS).toBe(30);
    expect(FO_MONTHLY_USD).toBe(59);
    expect(ANNUAL_PREPAID_MULTIPLIER).toBe(0.8);
    expect(ANNUAL_SAVINGS_PERCENT).toBe(20);
    expect(PM_BASE_ANNUAL_CENTS).toBe(56640);
    expect(FO_ANNUAL_CENTS).toBe(56640);
    expect(COMPLETE_BASE_ANNUAL_CENTS).toBe(104640);
    expect(PM_BASE_ANNUAL_USD).toBe(566.4);
    expect(FO_ANNUAL_USD).toBe(566.4);
    expect(COMPLETE_BASE_ANNUAL_USD).toBe(1046.4);
    expect(PM_BASE_ANNUAL_CENTS).toBe(
      Math.round(PM_BASE_MONTHLY_USD * 12 * ANNUAL_PREPAID_MULTIPLIER * 100)
    );
    expect(COMPLETE_BASE_ANNUAL_CENTS).toBe(
      Math.round(COMPLETE_BASE_MONTHLY_USD * 12 * ANNUAL_PREPAID_MULTIPLIER * 100)
    );
  });

  it("computes additional blocks at boundaries", () => {
    expect(additionalUnitBlocks(0)).toBe(0);
    expect(additionalUnitBlocks(1)).toBe(0);
    expect(additionalUnitBlocks(499)).toBe(0);
    expect(additionalUnitBlocks(500)).toBe(0);
    expect(additionalUnitBlocks(501)).toBe(1);
    expect(additionalUnitBlocks(999)).toBe(1);
    expect(additionalUnitBlocks(1000)).toBe(1);
    expect(additionalUnitBlocks(1001)).toBe(2);
    expect(additionalUnitBlocks(1499)).toBe(2);
    expect(additionalUnitBlocks(1500)).toBe(2);
    expect(additionalUnitBlocks(1501)).toBe(3);
  });

  it("prices Property Manager monthly and annual with 20% prepaid savings", () => {
    expect(monthlyUnitVolumePriceUsd({ module: "mpa_property_manager", managedUnits: 500 })).toBe(
      59
    );
    expect(annualUnitVolumePriceUsd({ module: "mpa_property_manager", managedUnits: 500 })).toBe(
      566.4
    );
    expect(
      annualSavingsVsMonthlyUsd(
        monthlyUnitVolumePriceUsd({ module: "mpa_property_manager", managedUnits: 500 }),
        annualUnitVolumePriceUsd({ module: "mpa_property_manager", managedUnits: 500 })
      )
    ).toBe(141.6);
    expect(monthlyUnitVolumePriceUsd({ module: "mpa_property_manager", managedUnits: 501 })).toBe(
      98
    );
    expect(annualUnitVolumePriceUsd({ module: "mpa_property_manager", managedUnits: 501 })).toBe(
      1034.4
    );
    expect(monthlyUnitVolumePriceUsd({ module: "mpa_property_manager", managedUnits: 1000 })).toBe(
      98
    );
    expect(monthlyUnitVolumePriceUsd({ module: "mpa_property_manager", managedUnits: 1001 })).toBe(
      137
    );
    expect(monthlyUnitVolumePriceUsd({ module: "mpa_property_manager", managedUnits: 1500 })).toBe(
      137
    );
    expect(monthlyUnitVolumePriceUsd({ module: "mpa_property_manager", managedUnits: 1501 })).toBe(
      176
    );
  });

  it("prices Facility Operations monthly like PM with 20% annual base", () => {
    expect(monthlyUnitVolumePriceUsd({ module: "mpa_facility_operations", managedUnits: 500 })).toBe(
      59
    );
    expect(monthlyUnitVolumePriceUsd({ module: "mpa_facility_operations", managedUnits: 501 })).toBe(
      98
    );
    expect(monthlyUnitVolumePriceUsd({ module: "mpa_facility_operations", managedUnits: 1000 })).toBe(
      98
    );
    expect(monthlyUnitVolumePriceUsd({ module: "mpa_facility_operations", managedUnits: 1001 })).toBe(
      137
    );

    expect(annualUnitVolumePriceUsd({ module: "mpa_facility_operations", managedUnits: 500 })).toBe(
      566.4
    );
    expect(
      annualSavingsVsMonthlyUsd(
        monthlyUnitVolumePriceUsd({ module: "mpa_facility_operations", managedUnits: 500 }),
        annualUnitVolumePriceUsd({ module: "mpa_facility_operations", managedUnits: 500 })
      )
    ).toBe(141.6);
    expect(annualUnitVolumePriceUsd({ module: "mpa_facility_operations", managedUnits: 501 })).toBe(
      1034.4
    );
    expect(annualUnitVolumePriceUsd({ module: "mpa_facility_operations", managedUnits: 1000 })).toBe(
      1034.4
    );
    expect(annualUnitVolumePriceUsd({ module: "mpa_facility_operations", managedUnits: 1001 })).toBe(
      1502.4
    );
  });

  it("prices Complete Platform monthly and annual with 20% prepaid savings", () => {
    expect(monthlyUnitVolumePriceUsd({ module: "mpa_complete_platform", managedUnits: 500 })).toBe(
      109
    );
    expect(annualUnitVolumePriceUsd({ module: "mpa_complete_platform", managedUnits: 500 })).toBe(
      1046.4
    );
    expect(
      annualSavingsVsMonthlyUsd(
        monthlyUnitVolumePriceUsd({ module: "mpa_complete_platform", managedUnits: 500 }),
        annualUnitVolumePriceUsd({ module: "mpa_complete_platform", managedUnits: 500 })
      )
    ).toBe(261.6);
    expect(monthlyUnitVolumePriceUsd({ module: "mpa_complete_platform", managedUnits: 501 })).toBe(
      148
    );
    expect(monthlyUnitVolumePriceUsd({ module: "mpa_complete_platform", managedUnits: 1000 })).toBe(
      148
    );
    expect(monthlyUnitVolumePriceUsd({ module: "mpa_complete_platform", managedUnits: 1001 })).toBe(
      187
    );
  });

  it("sets annual = discounted base + undiscounted block annual", () => {
    for (const units of BOUNDARY_UNITS) {
      for (const module of [
        "mpa_property_manager",
        "mpa_facility_operations",
        "mpa_complete_platform"
      ] as const) {
        const monthly = monthlyUnitVolumePriceUsd({ module, managedUnits: units });
        const annual = annualUnitVolumePriceUsd({ module, managedUnits: units });
        const blocks = additionalUnitBlocks(units);
        const expectedBase =
          module === "mpa_complete_platform" ? COMPLETE_BASE_ANNUAL_USD : PM_BASE_ANNUAL_USD;
        expect(annual).toBe(expectedBase + ADDITIONAL_UNIT_BLOCK_ANNUAL_USD * blocks);
        expect(annual).not.toBe(monthly * 12);
        if (blocks === 0 && units > 0) {
          expect(annual).toBe(monthly * 12 * ANNUAL_PREPAID_MULTIPLIER);
        }
      }
    }
  });

  it("marks trial eligibility at <=500 only", () => {
    expect(isUnitVolumeTrialEligible(0)).toBe(true);
    expect(isUnitVolumeTrialEligible(1)).toBe(true);
    expect(isUnitVolumeTrialEligible(500)).toBe(true);
    expect(isUnitVolumeTrialEligible(501)).toBe(false);
    expect(isUnitVolumeTrialEligible(1501)).toBe(false);
  });

  it("returns a full server-authoritative quote for FO", () => {
    const quote = quoteUnitVolume({ module: "mpa_facility_operations", managedUnits: 501 });
    expect(quote).toEqual({
      managedUnits: 501,
      includedUnits: 500,
      additionalBlocks: 1,
      authorizedUnitCapacity: 1000,
      monthlyPriceUsd: 98,
      annualPriceUsd: 1034.4,
      trialEligible: false,
      trialDays: 30,
      module: "mpa_facility_operations",
      baseMonthlyUsd: 59,
      baseAnnualUsd: 566.4,
      additionalBlockMonthlyUsd: 39
    });
  });

  it("floors fractional / clamps invalid managed unit inputs", () => {
    expect(additionalUnitBlocks(500.9)).toBe(0);
    expect(additionalUnitBlocks(-10)).toBe(0);
    expect(quoteUnitVolume({ module: "mpa_property_manager", managedUnits: Number.NaN }).managedUnits).toBe(
      0
    );
  });

  it("includes FO in unit-volume quote helper", () => {
    const quote = quoteUnitVolumeForSku({
      productSku: "mpa_facility_operations",
      managedUnits: 100
    });
    expect(quote).not.toBeNull();
    expect(quote?.module).toBe("mpa_facility_operations");
    expect(quote?.monthlyPriceUsd).toBe(59);
    expect(quote?.annualPriceUsd).toBe(566.4);
    expect(quote?.trialEligible).toBe(true);
  });
});
