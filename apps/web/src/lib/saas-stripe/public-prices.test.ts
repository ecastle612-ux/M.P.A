import { describe, expect, it } from "vitest";
import {
  cadenceLabelForInterval,
  formatStripeUnitAmount,
  priceForSkuCycle,
  type PublicCatalogPriceCatalog
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

  it("reads per-SKU cycle prices from the catalog", () => {
    const catalog: PublicCatalogPriceCatalog = {
      status: "partial",
      warning: null,
      bySku: {
        mpa_facility_operations: {
          monthly: {
            offerId: "mpa_facility_operations__professional__monthly",
            productSku: "mpa_facility_operations",
            billingCycle: "monthly",
            currency: "usd",
            unitAmount: 14900,
            interval: "month",
            formatted: "$149",
            cadenceLabel: "Billed monthly · renews automatically"
          }
        }
      },
      byCycle: {},
      prices: []
    };
    expect(priceForSkuCycle(catalog, "mpa_facility_operations", "monthly")?.formatted).toBe("$149");
    expect(priceForSkuCycle(catalog, "mpa_property_manager", "monthly")).toBeUndefined();
  });
});
