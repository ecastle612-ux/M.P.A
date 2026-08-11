import { describe, expect, it } from "vitest";
import {
  CATALOG_OFFERS,
  isSelfServeCheckoutAllowed,
  prepareOfferEntitlements,
  requiresEnterpriseMotion,
  resolveCatalogOffer,
  validateCommercialSelection
} from "./catalog";
import { COMPLETE_READY, FO_READY } from "./commerce-flags";
import { transitionCommerceFunnel } from "./commerce-state";

describe("COM-002 catalog (unit-capacity model)", () => {
  it("marks PM, FO, and Complete professional as self-serve", () => {
    expect(FO_READY).toBe(true);
    expect(COMPLETE_READY).toBe(true);
    const selfServe = CATALOG_OFFERS.filter(isSelfServeCheckoutAllowed);
    expect(selfServe.length).toBe(6);
    expect(
      selfServe.every(
        (o) =>
          (o.productSku === "mpa_property_manager" ||
            o.productSku === "mpa_facility_operations" ||
            o.productSku === "mpa_complete_platform") &&
          o.planTier === "professional"
      )
    ).toBe(true);
    expect(requiresEnterpriseMotion("mpa_facility_operations")).toBe(false);
    expect(requiresEnterpriseMotion("mpa_complete_platform")).toBe(false);
    expect(requiresEnterpriseMotion("mpa_property_manager")).toBe(false);
  });

  it("resolves PM professional monthly without seat/property commercial limits", () => {
    const offer = resolveCatalogOffer({
      productSku: "mpa_property_manager",
      planTier: "professional",
      billingCycle: "monthly"
    });
    expect(offer).not.toBeNull();
    expect("seatLimit" in (offer ?? {})).toBe(false);
    expect("propertyLimit" in (offer ?? {})).toBe(false);
    expect(isSelfServeCheckoutAllowed(offer!)).toBe(true);
  });

  it("routes FO and Complete to confirm plan; legacy Business PM away from self-serve", () => {
    const fo = validateCommercialSelection({
      productSku: "mpa_facility_operations",
      planTier: "professional",
      billingCycle: "monthly"
    });
    expect(fo.route).toBe("confirm_plan");

    const complete = validateCommercialSelection({
      productSku: "mpa_complete_platform",
      planTier: "professional",
      billingCycle: "annual"
    });
    expect(complete.route).toBe("confirm_plan");

    const pmBusiness = validateCommercialSelection({
      productSku: "mpa_property_manager",
      planTier: "business",
      billingCycle: "annual"
    });
    expect(pmBusiness.route).toBe("enterprise");

    const pm = validateCommercialSelection({
      productSku: "mpa_property_manager",
      planTier: "professional",
      billingCycle: "annual"
    });
    expect(pm.route).toBe("confirm_plan");
  });

  it("never marks enterprise offers self-serve eligible", () => {
    const enterprise = CATALOG_OFFERS.filter((o) => o.planTier === "enterprise");
    expect(enterprise.length).toBe(3);
    expect(enterprise.every((o) => o.selfServeEligible === false)).toBe(true);
  });

  it("prepares entitlement keys without seat/property capacity", () => {
    const offer = resolveCatalogOffer({
      productSku: "mpa_property_manager",
      planTier: "professional",
      billingCycle: "annual"
    });
    expect(offer).not.toBeNull();
    const prep = prepareOfferEntitlements(offer!);
    expect(prep).not.toHaveProperty("seatLimit");
    expect(prep).not.toHaveProperty("propertyLimit");
    expect(prep.entitlementKeys).toContain("pm.mission_control");
    expect(prep.entitlementKeys).not.toContain("facility.capital_projects");
  });
});

describe("commerce funnel state machine", () => {
  it("transitions landing → questionnaire → confirm_plan (Slice 2)", () => {
    expect(transitionCommerceFunnel("landing", "CONTINUE")).toBe("questionnaire");
    expect(transitionCommerceFunnel("questionnaire", "CONTINUE")).toBe("confirm_plan");
    expect(transitionCommerceFunnel("modules", "CONTINUE")).toBe("pricing");
    expect(transitionCommerceFunnel("pricing", "CONTINUE")).toBe("questionnaire");
    expect(transitionCommerceFunnel("confirm_plan", "CONFIRM_PLAN")).toBe("checkout_payment");
    expect(transitionCommerceFunnel("checkout_payment", "CONTINUE")).toBe("account_interim");
    expect(transitionCommerceFunnel("pricing", "REQUEST_ENTERPRISE")).toBe("enterprise_request");
  });
});
