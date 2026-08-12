import { describe, expect, it } from "vitest";
import { resolveCheckoutCancelRecovery } from "./checkout-cancel-recovery";

describe("resolveCheckoutCancelRecovery", () => {
  it("preserves PM unit-volume quote on retry", () => {
    const recovery = resolveCheckoutCancelRecovery({
      quote: {
        quoteId: "cq_pm",
        productSku: "mpa_property_manager",
        billingCycle: "monthly",
        snapshotId: "snap_pm",
        managedUnits: 500,
        expired: false
      }
    });
    expect(recovery.mode).toBe("quote");
    expect(recovery.productSku).toBe("mpa_property_manager");
    expect(recovery.retryHref).toBe(
      "/checkout?intent=mpa_property_manager&cycle=monthly&quote=cq_pm&snapshot=snap_pm"
    );
    expect(recovery.pricingHref).toBe("/pricing?intent=mpa_property_manager");
  });

  it("preserves FO unit-volume quote and never falls back to PM pricing", () => {
    const recovery = resolveCheckoutCancelRecovery({
      quote: {
        quoteId: "cq_fo",
        productSku: "mpa_facility_operations",
        billingCycle: "annual",
        snapshotId: "snap_fo",
        managedUnits: 1001,
        expired: false
      }
    });
    expect(recovery.mode).toBe("quote");
    expect(recovery.productSku).toBe("mpa_facility_operations");
    expect(recovery.retryHref).toContain("intent=mpa_facility_operations");
    expect(recovery.retryHref).toContain("quote=cq_fo");
    expect(recovery.retryHref).toContain("cycle=annual");
    expect(recovery.pricingHref).toBe("/pricing?intent=mpa_facility_operations");
    expect(recovery.retryHref).not.toContain("mpa_property_manager");
    expect(recovery.pricingHref).not.toContain("mpa_property_manager");
  });

  it("preserves Complete unit-volume quote on cancel recovery", () => {
    const recovery = resolveCheckoutCancelRecovery({
      quote: {
        quoteId: "cq_complete",
        productSku: "mpa_complete_platform",
        billingCycle: "monthly",
        snapshotId: "snap_c",
        managedUnits: 750,
        expired: false
      }
    });
    expect(recovery.mode).toBe("quote");
    expect(recovery.retryHref).toBe(
      "/checkout?intent=mpa_complete_platform&cycle=monthly&quote=cq_complete&snapshot=snap_c"
    );
    expect(recovery.pricingHref).toBe("/pricing?intent=mpa_complete_platform");
  });

  it("sends expired quotes back to Get Started with the same SKU and units", () => {
    const recovery = resolveCheckoutCancelRecovery({
      quote: {
        quoteId: "cq_old",
        productSku: "mpa_facility_operations",
        billingCycle: "monthly",
        managedUnits: 501,
        expired: true
      }
    });
    expect(recovery.mode).toBe("quote_expired");
    expect(recovery.retryHref).toBe(
      "/get-started?intent=mpa_facility_operations&cycle=monthly&units=501"
    );
    expect(recovery.pricingHref).toBe("/pricing?intent=mpa_facility_operations");
  });

  it("recovers legacy offer checkout without forcing PM for FO offers", () => {
    const recovery = resolveCheckoutCancelRecovery({
      offerId: "mpa_facility_operations__professional__monthly"
    });
    expect(recovery.mode).toBe("offer");
    expect(recovery.productSku).toBe("mpa_facility_operations");
    expect(recovery.retryHref).toContain("intent=mpa_facility_operations");
    expect(recovery.pricingHref).toBe("/pricing?intent=mpa_facility_operations");
  });

  it("uses honest generic recovery when quote and offer are missing", () => {
    const recovery = resolveCheckoutCancelRecovery({});
    expect(recovery.mode).toBe("fallback");
    expect(recovery.productSku).toBeNull();
    expect(recovery.retryHref).toBe("/get-started");
    expect(recovery.pricingHref).toBe("/pricing");
  });

  it("uses honest generic recovery for unknown offer ids", () => {
    const recovery = resolveCheckoutCancelRecovery({ offerId: "not_a_real_offer" });
    expect(recovery.mode).toBe("fallback");
    expect(recovery.retryHref).toBe("/get-started");
    expect(recovery.pricingHref).toBe("/pricing");
  });

  it("prefers quote context over offer when both are present", () => {
    const recovery = resolveCheckoutCancelRecovery({
      quote: {
        quoteId: "cq_win",
        productSku: "mpa_complete_platform",
        billingCycle: "monthly",
        expired: false
      },
      offerId: "mpa_property_manager__professional__monthly"
    });
    expect(recovery.mode).toBe("quote");
    expect(recovery.productSku).toBe("mpa_complete_platform");
    expect(recovery.retryHref).toContain("quote=cq_win");
  });
});
