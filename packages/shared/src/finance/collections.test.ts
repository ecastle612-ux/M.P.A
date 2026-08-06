import { describe, expect, it } from "vitest";
import {
  agingBucketForDaysPastDue,
  computeLateFeeAmount,
  daysBetween,
  delinquencyStatusForDays,
  isPastGrace
} from "./collections";
import { FINANCE_FEATURE_FLAGS, FINANCIAL_DOMAIN_REGISTRATION, FIN_OPS_SLICES } from "./index";

describe("FIN-OPS-001 S2 collections helpers", () => {
  it("computes aging buckets and delinquency status", () => {
    expect(daysBetween("2026-08-01", "2026-08-10")).toBe(9);
    expect(agingBucketForDaysPastDue(0)).toBe("current");
    expect(agingBucketForDaysPastDue(12)).toBe("1_30");
    expect(agingBucketForDaysPastDue(45)).toBe("31_60");
    expect(agingBucketForDaysPastDue(120)).toBe("90_plus");
    expect(delinquencyStatusForDays(3, 5)).toBe("watch");
    expect(delinquencyStatusForDays(8, 5)).toBe("past_due");
    expect(delinquencyStatusForDays(30, 5)).toBe("in_collections");
    expect(isPastGrace("2026-08-01", "2026-08-10", 5)).toBe(true);
  });

  it("computes flat and percent late fees with max cap", () => {
    expect(computeLateFeeAmount({ chargeAmount: 1000, feeType: "flat", feeAmount: 50, feePercent: 0 })).toBe(50);
    expect(
      computeLateFeeAmount({
        chargeAmount: 1000,
        feeType: "percent",
        feeAmount: 0,
        feePercent: 5,
        maxFeeAmount: 40
      })
    ).toBe(40);
  });

  it("enables S2 flags and marks S2 complete", () => {
    expect(FINANCE_FEATURE_FLAGS["finance.late_fees"]).toBe(true);
    expect(FINANCE_FEATURE_FLAGS["finance.vendor_invoices"]).toBe(true);
    expect(FINANCE_FEATURE_FLAGS["finance.vendor_payments"]).toBe(true);
    expect(FINANCE_FEATURE_FLAGS["finance.erp_accounting"]).toBe(false);
    expect(FINANCIAL_DOMAIN_REGISTRATION.currentSlice).toBe("S2");
    expect(FIN_OPS_SLICES.find((slice) => slice.id === "S2")?.status).toBe("complete");
  });
});
