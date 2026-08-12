import { describe, expect, it } from "vitest";
import {
  CANCEL_CONFIRMATION_POINTS,
  calculateUnitVolumeDisplay,
  cancelScheduledAccessCopy,
  formatPaidThroughDate,
  PUBLIC_PRICING_MODEL_COPY
} from "./pricing-display";

describe("unit-volume pricing display (Slice 5)", () => {
  it("calculates PM examples 500/501/1000/1001", () => {
    const at500 = calculateUnitVolumeDisplay({
      managedUnits: 500,
      billingInterval: "monthly"
    });
    expect(at500.monthlyPriceUsd).toBe(59);
    expect(at500.annualPriceUsd).toBe(708);
    expect(at500.trialEligible).toBe(true);
    expect(at500.trialHeadline).toBe("30 DAYS FREE");
    expect(at500.trialDetails.join(" ")).toMatch(/Payment card required/i);
    expect(at500.trialDetails.join(" ")).toMatch(/unless you cancel/i);

    const at501 = calculateUnitVolumeDisplay({
      managedUnits: 501,
      billingInterval: "monthly"
    });
    expect(at501.monthlyPriceUsd).toBe(98);
    expect(at501.annualPriceUsd).toBe(1176);
    expect(at501.trialEligible).toBe(false);
    expect(at501.trialHeadline).toBeNull();
    expect(at501.capacityHeadline).toMatch(/Additional Unit Capacity/i);

    expect(
      calculateUnitVolumeDisplay({ managedUnits: 1000, billingInterval: "monthly" }).monthlyPriceUsd
    ).toBe(98);
    expect(
      calculateUnitVolumeDisplay({ managedUnits: 1001, billingInterval: "monthly" }).monthlyPriceUsd
    ).toBe(137);
    expect(
      calculateUnitVolumeDisplay({ managedUnits: 1001, billingInterval: "annual" }).selectedAmount
    ).toBe(1644);
  });

  it("calculates FO examples with approved annual base Price", () => {
    const at500 = calculateUnitVolumeDisplay({
      module: "mpa_facility_operations",
      managedUnits: 500,
      billingInterval: "monthly"
    });
    expect(at500.monthlyPriceUsd).toBe(59);
    expect(at500.annualPriceUsd).toBe(590);
    expect(at500.trialEligible).toBe(true);

    const at501 = calculateUnitVolumeDisplay({
      module: "mpa_facility_operations",
      managedUnits: 501,
      billingInterval: "annual"
    });
    expect(at501.monthlyPriceUsd).toBe(98);
    expect(at501.annualPriceUsd).toBe(1058);
    expect(at501.selectedAmount).toBe(1058);
    expect(at501.trialEligible).toBe(false);

    expect(
      calculateUnitVolumeDisplay({
        module: "mpa_facility_operations",
        managedUnits: 1001,
        billingInterval: "annual"
      }).selectedAmount
    ).toBe(1526);
  });

  it("calculates Complete examples 500/501/1000/1001 monthly and annual", () => {
    const at500 = calculateUnitVolumeDisplay({
      module: "mpa_complete_platform",
      managedUnits: 500,
      billingInterval: "monthly"
    });
    expect(at500.monthlyPriceUsd).toBe(109);
    expect(at500.annualPriceUsd).toBe(1308);
    expect(at500.trialEligible).toBe(true);

    expect(
      calculateUnitVolumeDisplay({
        module: "mpa_complete_platform",
        managedUnits: 501,
        billingInterval: "monthly"
      }).monthlyPriceUsd
    ).toBe(148);
    expect(
      calculateUnitVolumeDisplay({
        module: "mpa_complete_platform",
        managedUnits: 1000,
        billingInterval: "annual"
      }).selectedAmount
    ).toBe(1776);
    expect(
      calculateUnitVolumeDisplay({
        module: "mpa_complete_platform",
        managedUnits: 1001,
        billingInterval: "annual"
      }).selectedAmount
    ).toBe(2244);
  });

  it("documents public model copy without legacy tiers", () => {
    expect(PUBLIC_PRICING_MODEL_COPY.pmBaseMonthly).toBe(59);
    expect(PUBLIC_PRICING_MODEL_COPY.completeBaseMonthly).toBe(109);
    expect(PUBLIC_PRICING_MODEL_COPY.completeHeadlineAnnual).toBe("$1,308/year");
    expect(PUBLIC_PRICING_MODEL_COPY.pmHeadlineAnnual).toBe("$708/year");
    expect(PUBLIC_PRICING_MODEL_COPY.foMonthly).toBe(59);
    expect(PUBLIC_PRICING_MODEL_COPY.foAnnual).toBe(590);
    expect(PUBLIC_PRICING_MODEL_COPY.additionalBlockMonthly).toBe(39);
    expect(PUBLIC_PRICING_MODEL_COPY.pmHeadline).not.toMatch(/99|249|Professional|Business/);
    expect(PUBLIC_PRICING_MODEL_COPY.unitDefinition).toMatch(/1 managed unit/i);
    expect(PUBLIC_PRICING_MODEL_COPY.capacityChange).toMatch(/customer approval/i);
    expect(PUBLIC_PRICING_MODEL_COPY.enterpriseNotProduct).toMatch(/not a separate product/i);
    expect(PUBLIC_PRICING_MODEL_COPY.additionalCapacityAnnualLine).toMatch(/468/);
    expect(PUBLIC_PRICING_MODEL_COPY.cancellationSummary).toMatch(/Cancel anytime/i);
    expect(PUBLIC_PRICING_MODEL_COPY.cancellationSummary).toMatch(/No refunds/i);
    expect(PUBLIC_PRICING_MODEL_COPY.cancellationSummary).toMatch(/paid billing period/i);
  });

  it("formats cancel-scheduled paid-through copy from authoritative period end", () => {
    const iso = "2026-09-15T12:00:00.000Z";
    expect(formatPaidThroughDate(iso)).toMatch(/2026/);
    expect(cancelScheduledAccessCopy(iso)).toMatch(/remains active through/i);
    expect(cancelScheduledAccessCopy(iso)).toMatch(/won't be charged/i);
    expect(cancelScheduledAccessCopy(null)).toMatch(/paid billing period/i);
    expect(CANCEL_CONFIRMATION_POINTS).toHaveLength(3);
    expect(CANCEL_CONFIRMATION_POINTS.join(" ")).toMatch(/No refunds/i);
    expect(CANCEL_CONFIRMATION_POINTS.join(" ")).toMatch(/period end|paid billing period/i);
  });
});
