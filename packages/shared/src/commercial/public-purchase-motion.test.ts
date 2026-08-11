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
  });

  it("routes Facility Operations to self-serve when FO_READY", () => {
    expect(FO_READY).toBe(true);
    const motion = publicPurchaseMotionForSku("mpa_facility_operations");
    expect(motion.kind).toBe("self_serve");
    expect(motion.ctaLabel).toMatch(/Facility Operations/i);
    expect(motion.availabilityLabel).toBe("Available");
    expect(motion.explanation.toLowerCase()).not.toContain("not available");
    expect(motion.explanation.toLowerCase()).not.toMatch(/coming soon|early access|gated|enterprise only/);
  });

  it("routes Complete Platform to Request Consultation while COMPLETE_READY is false", () => {
    expect(COMPLETE_READY).toBe(false);
    const motion = publicPurchaseMotionForSku("mpa_complete_platform");
    expect(motion.kind).toBe("consultation");
    expect(motion.ctaLabel).toBe("Request Consultation");
    expect(motion.availabilityLabel.toLowerCase()).toMatch(/not online|gated/);
    expect(motion.explanation.toLowerCase()).toContain("not available");
  });
});

describe("display Price env keys", () => {
  it("maps FO/Complete display Prices; legacy Checkout allowlist stays PM-only", () => {
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
