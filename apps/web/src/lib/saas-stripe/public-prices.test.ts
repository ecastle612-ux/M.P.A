import { describe, expect, it } from "vitest";
import {
  cadenceLabelForInterval,
  formatStripeUnitAmount
} from "./public-prices";

describe("public Stripe price formatting", () => {
  it("formats whole-dollar amounts without cents noise", () => {
    expect(formatStripeUnitAmount(9900, "usd")).toBe("$99");
    expect(formatStripeUnitAmount(9900, "USD")).toBe("$99");
  });

  it("formats fractional amounts with cents", () => {
    expect(formatStripeUnitAmount(9999, "usd")).toBe("$99.99");
  });

  it("labels renewal cadence from interval", () => {
    expect(cadenceLabelForInterval("month", "monthly")).toContain("monthly");
    expect(cadenceLabelForInterval("year", "annual")).toContain("annually");
  });
});
