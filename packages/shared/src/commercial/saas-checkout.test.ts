import { describe, expect, it } from "vitest";
import { COM_002_FLAGS } from "./commerce-flags";
import {
  SAAS_MONEY_DOMAIN,
  buildSaasCheckoutMetadata,
  isSaasCheckoutMetadata,
  validateSaasCheckoutRequest
} from "./saas-checkout";

describe("COM-002 Slice C SaaS checkout validation", () => {
  it("enables Slice C with FO and Complete self-serve", () => {
    expect(COM_002_FLAGS.sliceC_stripeCheckout).toBe(true);
    expect(COM_002_FLAGS.foReady).toBe(true);
    expect(COM_002_FLAGS.completeReady).toBe(true);
    expect(COM_002_FLAGS.sliceD_automaticProvisioning).toBe(true);
  });

  it("allows PM professional when price is configured", () => {
    const result = validateSaasCheckoutRequest(
      {
        productSku: "mpa_property_manager",
        planTier: "professional",
        billingCycle: "monthly"
      },
      () => "price_test_pm_pro_monthly"
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.offer.stripePriceId).toBe("price_test_pm_pro_monthly");
    }
  });

  it("rejects PM business as a customer plan", () => {
    const result = validateSaasCheckoutRequest(
      {
        productSku: "mpa_property_manager",
        planTier: "business",
        billingCycle: "annual"
      },
      () => "price_should_not_matter"
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("invalid_plan");
    }
  });

  it("rejects FO/Complete on legacy offer Checkout (unit-volume quote path is authoritative)", () => {
    const fo = validateSaasCheckoutRequest(
      {
        productSku: "mpa_facility_operations",
        planTier: "professional",
        billingCycle: "monthly"
      },
      () => "price_should_not_matter"
    );
    expect(fo.ok).toBe(false);
    if (!fo.ok) {
      // Legacy path remains PM-only; FO Checkout uses quote-authoritative unit-volume sessions.
      expect(fo.reason).toBe("enterprise_required");
      expect(fo.route).toBe("enterprise");
    }
  });

  it("rejects unconfigured prices", () => {
    const result = validateSaasCheckoutRequest(
      {
        productSku: "mpa_property_manager",
        planTier: "professional",
        billingCycle: "annual"
      },
      () => null
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("price_unconfigured");
    }
  });

  it("does not write seat/property limit metadata", () => {
    const result = validateSaasCheckoutRequest(
      {
        productSku: "mpa_property_manager",
        planTier: "professional",
        billingCycle: "monthly"
      },
      () => "price_x"
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const meta = buildSaasCheckoutMetadata({ offer: result.offer });
    expect(meta.mpa_seat_limit).toBeUndefined();
    expect(meta.mpa_property_limit).toBeUndefined();
  });

  it("tags metadata with saas_billing money domain", () => {
    const result = validateSaasCheckoutRequest(
      {
        productSku: "mpa_property_manager",
        planTier: "professional",
        billingCycle: "annual"
      },
      () => "price_x"
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const meta = buildSaasCheckoutMetadata({ offer: result.offer, demoSessionId: "demo_1" });
    expect(meta.mpa_money_domain).toBe(SAAS_MONEY_DOMAIN);
    expect(isSaasCheckoutMetadata(meta)).toBe(true);
    expect(meta.mpa_demo_session_id).toBe("demo_1");
  });
});
