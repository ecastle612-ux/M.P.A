import { describe, expect, it } from "vitest";
import { COMPLETE_READY, FO_READY } from "./commerce-flags";
import { publicPurchaseMotionForSku } from "./public-purchase-motion";
import {
  saasDisplayPriceEnvKeyForOfferId,
  saasPriceEnvKeyForOfferId
} from "./saas-checkout";

describe("public purchase motion (Option B)", () => {
  it("keeps Property Manager as self-serve checkout", () => {
    const motion = publicPurchaseMotionForSku("mpa_property_manager");
    expect(motion.kind).toBe("self_serve");
    expect(motion.ctaLabel).toMatch(/Property Manager/i);
    expect(motion.explanation).toMatch(/Save 20% with annual billing/);
    expect(motion.explanation).toMatch(/\$566\.40\/year/);
  });

  it("routes Facility Operations to self-serve when FO_READY", () => {
    expect(FO_READY).toBe(true);
    const motion = publicPurchaseMotionForSku("mpa_facility_operations");
    expect(motion.kind).toBe("self_serve");
    expect(motion.ctaLabel).toMatch(/Facility Operations/i);
    expect(motion.availabilityLabel).toBe("Available");
    expect(motion.explanation).toMatch(/Save 20% with annual billing/);
    expect(motion.explanation).toMatch(/\$59\/month or \$566\.40\/year/);
  });

  it("routes Complete Platform to self-serve when COMPLETE_READY", () => {
    expect(COMPLETE_READY).toBe(true);
    const motion = publicPurchaseMotionForSku("mpa_complete_platform");
    expect(motion.kind).toBe("self_serve");
    expect(motion.ctaLabel).toMatch(/Complete Platform/i);
    expect(motion.availabilityLabel).toBe("Available");
    expect(motion.explanation).toMatch(/Save 20% with annual billing/);
    expect(motion.explanation).toMatch(/\$1,046\.40\/year/);
  });
});

describe("display Price env keys", () => {
  it("maps public catalog display Prices to authoritative unit-volume registry", () => {
    expect(saasPriceEnvKeyForOfferId("mpa_facility_operations__professional__monthly")).toBeNull();
    expect(saasDisplayPriceEnvKeyForOfferId("mpa_facility_operations__professional__monthly")).toBe(
      "STRIPE_PRICE_FO_PROFESSIONAL_MONTHLY"
    );
    expect(saasDisplayPriceEnvKeyForOfferId("mpa_complete_platform__professional__annual")).toBe(
      "STRIPE_PRICE_COMPLETE_BASE_ANNUAL"
    );
    expect(saasDisplayPriceEnvKeyForOfferId("mpa_property_manager__professional__monthly")).toBe(
      "STRIPE_PRICE_PM_BASE_MONTHLY"
    );
    expect(saasDisplayPriceEnvKeyForOfferId("mpa_property_manager__professional__annual")).toBe(
      "STRIPE_PRICE_PM_BASE_ANNUAL"
    );
    expect(saasDisplayPriceEnvKeyForOfferId("mpa_complete_platform__professional__monthly")).toBe(
      "STRIPE_PRICE_COMPLETE_BASE_MONTHLY"
    );
  });
});
