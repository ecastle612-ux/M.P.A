import { describe, expect, it } from "vitest";
import {
  buildCommercialQuote,
  validateAcquisitionAnswers
} from "./acquisition-quote";
import {
  SUPERSEDED_CHECKOUT_STRIPE_PRICE_IDS,
  findSupersededCheckoutStripePriceId,
  isSupersededCheckoutStripePriceId
} from "./superseded-stripe-prices";
import {
  UNIT_VOLUME_PRICE_ENV_KEYS,
  buildUnitVolumeCheckoutPlan,
  resolveCheckoutLineItems
} from "./unit-volume-stripe";

function quoteFor(
  module: "mpa_property_manager" | "mpa_facility_operations" | "mpa_complete_platform",
  units = 100
) {
  const need =
    module === "mpa_facility_operations"
      ? "facility_maintenance"
      : module === "mpa_complete_platform"
        ? "both"
        : "property_resident_leasing";
  const validated = validateAcquisitionAnswers({
    managedUnits: units,
    operationalNeed: need,
    billingInterval: "monthly",
    selectedModule: module
  });
  if (!validated.ok) throw new Error(validated.reason);
  return buildCommercialQuote({ answers: validated.answers });
}

describe("superseded Stripe checkout Prices", () => {
  it("identifies the legacy $99 Professional Price", () => {
    expect(SUPERSEDED_CHECKOUT_STRIPE_PRICE_IDS).toContain("price_1Tw3Cb8jGrZYUXDtQwHvaXFW");
    expect(isSupersededCheckoutStripePriceId("price_1Tw3Cb8jGrZYUXDtQwHvaXFW")).toBe(true);
    expect(isSupersededCheckoutStripePriceId("price_pm_base_ok")).toBe(false);
    expect(findSupersededCheckoutStripePriceId(["price_ok", "price_1Tw3Cb8jGrZYUXDtQwHvaXFW"])).toBe(
      "price_1Tw3Cb8jGrZYUXDtQwHvaXFW"
    );
  });

  it("blocks superseded Prices in unit-volume line-item resolution", () => {
    const plan = buildUnitVolumeCheckoutPlan(quoteFor("mpa_property_manager"))!;
    const blocked = resolveCheckoutLineItems(plan, (key) =>
      key === UNIT_VOLUME_PRICE_ENV_KEYS.PM_BASE_MONTHLY
        ? "price_1Tw3Cb8jGrZYUXDtQwHvaXFW"
        : `price_${key}`
    );
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) {
      expect(blocked.reason).toBe("superseded_price_blocked");
    }
  });

  it("allows current authoritative PM / FO / Complete Prices", () => {
    const cases: Array<{
      module: "mpa_property_manager" | "mpa_facility_operations" | "mpa_complete_platform";
      baseKey: string;
      price: string;
    }> = [
      {
        module: "mpa_property_manager",
        baseKey: UNIT_VOLUME_PRICE_ENV_KEYS.PM_BASE_MONTHLY,
        price: "price_pm_base_59"
      },
      {
        module: "mpa_facility_operations",
        baseKey: UNIT_VOLUME_PRICE_ENV_KEYS.FO_BASE_MONTHLY,
        price: "price_fo_59"
      },
      {
        module: "mpa_complete_platform",
        baseKey: UNIT_VOLUME_PRICE_ENV_KEYS.COMPLETE_BASE_MONTHLY,
        price: "price_complete_109"
      }
    ];

    for (const row of cases) {
      const plan = buildUnitVolumeCheckoutPlan(quoteFor(row.module))!;
      const resolved = resolveCheckoutLineItems(plan, (key) =>
        key === row.baseKey ? row.price : key.includes("UNIT_BLOCK") ? "price_block" : null
      );
      expect(resolved.ok).toBe(true);
      if (resolved.ok) {
        expect(resolved.items[0]?.price).toBe(row.price);
        expect(isSupersededCheckoutStripePriceId(resolved.items[0]?.price)).toBe(false);
      }
    }
  });
});
