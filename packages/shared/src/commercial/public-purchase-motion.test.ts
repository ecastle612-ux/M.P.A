import { describe, expect, it } from "vitest";
import { FO_READY } from "./commerce-flags";
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
  });

  it("routes Facility Operations to Request Early Access while FO_READY is false", () => {
    expect(FO_READY).toBe(false);
    const motion = publicPurchaseMotionForSku("mpa_facility_operations");
    expect(motion.kind).toBe("early_access");
    expect(motion.ctaLabel).toBe("Request Early Access");
    expect(motion.availabilityLabel.toLowerCase()).toMatch(/not online|gated/);
    expect(motion.explanation.toLowerCase()).toContain("not available");
  });

  it("routes Complete Platform to Request Consultation while FO_READY is false", () => {
    const motion = publicPurchaseMotionForSku("mpa_complete_platform");
    expect(motion.kind).toBe("consultation");
    expect(motion.ctaLabel).toBe("Request Consultation");
    expect(motion.availabilityLabel.toLowerCase()).toMatch(/not online|gated/);
    expect(motion.explanation.toLowerCase()).toContain("not available");
  });
});

describe("display Price env keys", () => {
  it("maps FO/Complete display Prices without expanding Checkout allowlist", () => {
    expect(saasPriceEnvKeyForOfferId("mpa_facility_operations__professional__monthly")).toBeNull();
    expect(saasDisplayPriceEnvKeyForOfferId("mpa_facility_operations__professional__monthly")).toBe(
      "STRIPE_PRICE_FO_PROFESSIONAL_MONTHLY"
    );
    expect(saasDisplayPriceEnvKeyForOfferId("mpa_complete_platform__professional__annual")).toBe(
      "STRIPE_PRICE_COMPLETE_PROFESSIONAL_ANNUAL"
    );
    expect(saasDisplayPriceEnvKeyForOfferId("mpa_property_manager__professional__monthly")).toBe(
      "STRIPE_PRICE_PM_PROFESSIONAL_MONTHLY"
    );
  });
});
