import { describe, expect, it } from "vitest";
import { FO_READY } from "./commerce-flags";
import { entitlementsForSku } from "./entitlements";
import { PROPERTY_LIMITS, SEAT_LIMITS } from "./plans";
import { publicPurchaseMotionForSku } from "./public-purchase-motion";
import {
  AUTHORIZED_TARGET_UNIT_AMOUNTS_CENTS,
  PRICING_MIGRATION_ROWS,
  publicListPriceMayShowTarget,
  targetUnitAmountCentsForOffer
} from "./pricing-migration";
import { validateSaasCheckoutRequest } from "./saas-checkout";

describe("pricing migration preparation", () => {
  it("encodes Owner-authorized public targets ($40 reduction destinations)", () => {
    expect(AUTHORIZED_TARGET_UNIT_AMOUNTS_CENTS.mpa_property_manager__professional__monthly).toBe(
      5900
    );
    expect(AUTHORIZED_TARGET_UNIT_AMOUNTS_CENTS.mpa_property_manager__professional__annual).toBe(
      59000
    );
    expect(
      AUTHORIZED_TARGET_UNIT_AMOUNTS_CENTS.mpa_facility_operations__professional__monthly
    ).toBe(5900);
    expect(
      AUTHORIZED_TARGET_UNIT_AMOUNTS_CENTS.mpa_facility_operations__professional__annual
    ).toBe(59000);
    expect(
      AUTHORIZED_TARGET_UNIT_AMOUNTS_CENTS.mpa_complete_platform__professional__monthly
    ).toBe(10900);
    expect(AUTHORIZED_TARGET_UNIT_AMOUNTS_CENTS.mpa_complete_platform__professional__annual).toBe(
      109000
    );
  });

  it("records verified PM Business current amounts and $40 targets", () => {
    expect(targetUnitAmountCentsForOffer("mpa_property_manager__business__monthly")).toBe(20900);
    expect(targetUnitAmountCentsForOffer("mpa_property_manager__business__annual")).toBe(245000);
    const monthly = PRICING_MIGRATION_ROWS.find(
      (r) => r.offerKey === "mpa_property_manager__business__monthly"
    );
    const annual = PRICING_MIGRATION_ROWS.find(
      (r) => r.offerKey === "mpa_property_manager__business__annual"
    );
    expect(monthly?.currentUnitAmountCents).toBe(24900);
    expect(annual?.currentUnitAmountCents).toBe(249000);
    expect(monthly?.existingStripePriceId).toMatch(/^price_/);
    expect(annual?.existingStripePriceId).toMatch(/^price_/);
  });

  it("records created NEW Stripe Price IDs pending Vercel env cutover", () => {
    for (const row of PRICING_MIGRATION_ROWS) {
      expect(row.newStripePriceId).toMatch(/^price_/);
      expect(row.newStripePriceStatus).toBe("CREATED_PENDING_VERCEL_ENV");
      expect(row.existingStripePriceId).toMatch(/^price_/);
      expect(row.newStripePriceId).not.toBe(row.existingStripePriceId);
    }
  });

  it("does not invent placeholder Price IDs outside Stripe price_ prefix", () => {
    for (const row of PRICING_MIGRATION_ROWS) {
      expect(row.newStripePriceId?.startsWith("price_")).toBe(true);
      expect(row.newStripePriceId).not.toContain("PENDING");
      expect(row.newStripePriceId).not.toContain("TODO");
    }
  });

  it("keeps FO/Complete unavailable for self-serve while FO_READY is false", () => {
    expect(FO_READY).toBe(false);
    expect(publicPurchaseMotionForSku("mpa_facility_operations").kind).toBe("early_access");
    expect(publicPurchaseMotionForSku("mpa_complete_platform").kind).toBe("consultation");
    expect(
      publicPurchaseMotionForSku("mpa_facility_operations").availabilityLabel.toLowerCase()
    ).toContain("not online");
    expect(
      publicPurchaseMotionForSku("mpa_complete_platform").availabilityLabel.toLowerCase()
    ).toContain("not online");

    for (const sku of ["mpa_facility_operations", "mpa_complete_platform"] as const) {
      const result = validateSaasCheckoutRequest(
        { productSku: sku, planTier: "professional", billingCycle: "monthly" },
        () => "price_should_not_matter"
      );
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.reason).toBe("enterprise_required");
      }
    }
  });

  it("does not allow target list display until checkout Price ID matches new Price", () => {
    expect(
      publicListPriceMayShowTarget({
        offerKey: "mpa_property_manager__professional__monthly",
        configuredCheckoutPriceId: "price_old",
        newStripePriceId: null
      })
    ).toBe(false);
    expect(
      publicListPriceMayShowTarget({
        offerKey: "mpa_property_manager__professional__monthly",
        configuredCheckoutPriceId: "price_new_pending",
        newStripePriceId: "price_new_pending"
      })
    ).toBe(true);
  });

  it("does not couple price targets to entitlements or seat/property limits", () => {
    const before = entitlementsForSku("mpa_property_manager");
    expect(before.length).toBeGreaterThan(0);
    expect(SEAT_LIMITS.professional).toBe(5);
    expect(PROPERTY_LIMITS.professional).toBe(25);
    expect(SEAT_LIMITS.business).toBe(25);
    expect(PROPERTY_LIMITS.business).toBe(150);
    // Targets exist independently — mutating display amounts must not alter these.
    expect(targetUnitAmountCentsForOffer("mpa_property_manager__professional__monthly")).toBe(5900);
    expect(entitlementsForSku("mpa_property_manager")).toEqual(before);
  });
});
