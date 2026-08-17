import { describe, expect, it } from "vitest";
import { residentOnlinePayAvailable } from "./resident-online-pay";

describe("P1-01 resident online pay availability", () => {
  it("is hidden when stripe_payment_execution_enabled is false", () => {
    expect(
      residentOnlinePayAvailable({
        stripePaymentExecutionEnabled: false,
        occupancyAccess: "active"
      })
    ).toBe(false);
  });

  it("cannot be exposed from Stripe key presence alone", () => {
    expect(
      residentOnlinePayAvailable({
        stripePaymentExecutionEnabled: false,
        occupancyAccess: "active"
      })
    ).toBe(false);
  });

  it("requires both the org execution flag and current occupancy", () => {
    expect(
      residentOnlinePayAvailable({
        stripePaymentExecutionEnabled: true,
        occupancyAccess: "active"
      })
    ).toBe(true);
    expect(
      residentOnlinePayAvailable({
        stripePaymentExecutionEnabled: true,
        occupancyAccess: "historical"
      })
    ).toBe(false);
    expect(
      residentOnlinePayAvailable({
        stripePaymentExecutionEnabled: true,
        occupancyAccess: "future"
      })
    ).toBe(false);
  });
});
