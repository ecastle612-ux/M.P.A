import { describe, expect, it } from "vitest";
import { calculateUnitVolumeDisplay, PUBLIC_PRICING_MODEL_COPY } from "./pricing-display";

describe("unit-volume pricing display (Slice 5)", () => {
  it("calculates PM examples 500/501/1000/1001", () => {
    const at500 = calculateUnitVolumeDisplay({
      managedUnits: 500,
      billingInterval: "monthly"
    });
    expect(at500.monthlyPriceUsd).toBe(59);
    expect(at500.annualPriceUsd).toBe(708);
    expect(at500.trialEligible).toBe(true);
    expect(at500.trialHeadline).toBe("30 days free");
    expect(at500.trialDetails.join(" ")).toMatch(/Valid payment card required/i);

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

  it("documents public model copy without legacy tiers", () => {
    expect(PUBLIC_PRICING_MODEL_COPY.pmBaseMonthly).toBe(59);
    expect(PUBLIC_PRICING_MODEL_COPY.additionalBlockMonthly).toBe(39);
    expect(PUBLIC_PRICING_MODEL_COPY.pmHeadline).not.toMatch(/99|249|Professional|Business/);
  });
});
