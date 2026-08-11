import { describe, expect, it } from "vitest";
import {
  ADDITIONAL_UNIT_BLOCK_MONTHLY_USD,
  COMPLETE_BASE_MONTHLY_USD,
  FO_ANNUAL_USD,
  FO_MONTHLY_USD,
  PM_BASE_MONTHLY_USD,
  UNIT_BLOCK_SIZE,
  UNIT_VOLUME_TRIAL_DAYS,
  additionalUnitBlocks,
  annualUnitVolumePriceUsd,
  isUnitVolumeTrialEligible,
  monthlyUnitVolumePriceUsd,
  quoteUnitVolume,
  quoteUnitVolumeForSku
} from "./unit-volume";

const BOUNDARY_UNITS = [0, 1, 499, 500, 501, 999, 1000, 1001, 1499, 1500, 1501] as const;

describe("unit-volume domain (Slice 1)", () => {
  it("uses approved constants", () => {
    expect(UNIT_BLOCK_SIZE).toBe(500);
    expect(PM_BASE_MONTHLY_USD).toBe(59);
    expect(COMPLETE_BASE_MONTHLY_USD).toBe(109);
    expect(ADDITIONAL_UNIT_BLOCK_MONTHLY_USD).toBe(39);
    expect(UNIT_VOLUME_TRIAL_DAYS).toBe(30);
    expect(FO_MONTHLY_USD).toBe(59);
    expect(FO_ANNUAL_USD).toBe(590);
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

  it("prices Property Manager at boundaries", () => {
    expect(monthlyUnitVolumePriceUsd({ module: "mpa_property_manager", managedUnits: 500 })).toBe(
      59
    );
    expect(monthlyUnitVolumePriceUsd({ module: "mpa_property_manager", managedUnits: 501 })).toBe(
      98
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

  it("prices Complete Platform at boundaries", () => {
    expect(monthlyUnitVolumePriceUsd({ module: "mpa_complete_platform", managedUnits: 500 })).toBe(
      109
    );
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

  it("sets annual = monthly × 12 with no discount for all boundary units", () => {
    for (const units of BOUNDARY_UNITS) {
      for (const module of ["mpa_property_manager", "mpa_complete_platform"] as const) {
        const monthly = monthlyUnitVolumePriceUsd({ module, managedUnits: units });
        const annual = annualUnitVolumePriceUsd({ module, managedUnits: units });
        expect(annual).toBe(monthly * 12);
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

  it("returns a full server-authoritative quote", () => {
    const quote = quoteUnitVolume({ module: "mpa_property_manager", managedUnits: 501 });
    expect(quote).toEqual({
      managedUnits: 501,
      includedUnits: 500,
      additionalBlocks: 1,
      authorizedUnitCapacity: 1000,
      monthlyPriceUsd: 98,
      annualPriceUsd: 1176,
      trialEligible: false,
      trialDays: 30,
      module: "mpa_property_manager",
      baseMonthlyUsd: 59,
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

  it("rejects FO from unit-volume quote helper", () => {
    expect(
      quoteUnitVolumeForSku({ productSku: "mpa_facility_operations", managedUnits: 100 })
    ).toBeNull();
  });
});
