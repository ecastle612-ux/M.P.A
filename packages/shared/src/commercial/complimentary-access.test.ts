import { describe, expect, it } from "vitest";
import {
  complimentaryClaimLocksSku,
  complimentaryCompleteKeepsBothProducts,
  complimentaryConversionReusesOrganization,
  complimentaryExpiryCopy,
  complimentaryExpiredPageCopy,
  complimentaryGrantIsDue,
  complimentaryGrantNeedsExpiryNotice,
  complimentaryIsolationAllowsPath,
  complimentaryWelcomeCopy,
  evaluateComplimentaryUnitLimit,
  paidSubscriptionTakesPrecedence,
  parseComplimentarySendAccessInput,
  resolveComplimentaryExpiresAt,
  resolveEffectiveComplimentaryAccess,
  TESTER_FEEDBACK_REPLY_TO
} from "./complimentary-access";

describe("docs/185 complimentary access domain", () => {
  it("parses the Owner Send Access payload", () => {
    const parsed = parseComplimentarySendAccessInput({
      email: " Tester@Example.com ",
      grantType: "tester",
      productSku: "mpa_property_manager",
      durationId: "30d",
      limitMode: "product_normal"
    });
    expect(parsed).toMatchObject({
      email: "tester@example.com",
      grantType: "tester",
      productSku: "mpa_property_manager"
    });
  });

  it("allows Gift No Expiration and optional custom limits", () => {
    expect(resolveComplimentaryExpiresAt("none")).toBeNull();
    const custom = parseComplimentarySendAccessInput({
      email: "gift@example.com",
      grantType: "gift",
      productSku: "mpa_complete_platform",
      durationId: "none",
      limitMode: "custom",
      customUnitLimit: 25
    });
    expect(custom).toMatchObject({ limitMode: "custom", customUnitLimit: 25 });
  });

  it("locks claim SKU to the server-owned grant", () => {
    expect(complimentaryClaimLocksSku("mpa_property_manager", "mpa_facility_operations")).toEqual({
      ok: false,
      error: "claim_cannot_change_sku"
    });
    expect(complimentaryClaimLocksSku("mpa_facility_operations", undefined).ok).toBe(true);
  });

  it("keeps PM / FO isolation and Complete ADR-033 union", () => {
    expect(
      complimentaryIsolationAllowsPath({
        sku: "mpa_property_manager",
        pathname: "/facility/mission-control"
      })
    ).toBe(false);
    expect(
      complimentaryIsolationAllowsPath({
        sku: "mpa_facility_operations",
        pathname: "/pm/properties"
      })
    ).toBe(false);
    expect(complimentaryCompleteKeepsBothProducts("mpa_complete_platform")).toBe(true);
  });

  it("gives paid Stripe entitlement precedence over complimentary", () => {
    expect(
      paidSubscriptionTakesPrecedence({
        stripeSubscriptionId: "sub_live",
        paidStatus: "active"
      })
    ).toBe(true);
    const effective = resolveEffectiveComplimentaryAccess({
      grant: {
        status: "active",
        productSku: "mpa_property_manager",
        expiresAt: null,
        convertedAt: null
      },
      stripeSubscriptionId: "sub_live",
      paidStatus: "active",
      paidSku: "mpa_complete_platform"
    });
    expect(effective).toEqual({
      source: "paid",
      sku: "mpa_complete_platform",
      complimentaryActive: false
    });
  });

  it("reuses the complimentary organization on conversion", () => {
    expect(
      complimentaryConversionReusesOrganization({
        grantOrganizationId: "org_existing",
        checkoutWouldCreateNewOrg: false
      })
    ).toBe(true);
  });

  it("expires without deleting data and does not auto-charge", () => {
    expect(
      complimentaryGrantIsDue({
        status: "active",
        expiresAt: new Date(Date.now() - 1000).toISOString()
      })
    ).toBe(true);
    const page = complimentaryExpiredPageCopy();
    expect(page.dataLine).toMatch(/Nothing was deleted/i);
    expect(complimentaryExpiryCopy({
      productSku: "mpa_property_manager",
      expiresAt: "2026-09-01T00:00:00.000Z"
    }).chargeLine).toMatch(/will not be charged automatically/i);
  });

  it("blocks complimentary limit create without deleting existing units", () => {
    const decision = evaluateComplimentaryUnitLimit({
      grant: {
        status: "active",
        limitMode: "custom",
        customUnitLimit: 2,
        convertedAt: null
      },
      actualUnits: 2,
      additionalUnits: 1
    });
    expect(decision.allowed).toBe(false);
    expect(decision.wouldDelete).toBe(false);
  });

  it("does not apply complimentary limits when a paid subscription is present", () => {
    const decision = evaluateComplimentaryUnitLimit({
      grant: {
        status: "active",
        limitMode: "custom",
        customUnitLimit: 1,
        convertedAt: null
      },
      stripeSubscriptionId: "sub_live",
      paidStatus: "active",
      actualUnits: 50,
      additionalUnits: 10
    });
    expect(decision.allowed).toBe(true);
  });

  it("contracts tester welcome and expiry copy", () => {
    const welcome = complimentaryWelcomeCopy({
      grantType: "tester",
      productSku: "mpa_facility_operations",
      expiresAt: "2026-09-01T00:00:00.000Z"
    });
    expect(welcome.ctaLabel).toBe("Set Up Your Account");
    expect(welcome.paymentLine).toMatch(/No payment is required/i);
    expect(welcome.testerFeedback).toMatch(/bugs, errors, confusing behavior, or suggestions/i);
    expect(welcome.testerFeedback).toMatch(/screenshot/i);
    expect(welcome.replyTo).toBe(TESTER_FEEDBACK_REPLY_TO);
    const gift = complimentaryWelcomeCopy({
      grantType: "gift",
      productSku: "mpa_property_manager",
      expiresAt: null
    });
    expect(gift.testerFeedback).toBeNull();
    expect(gift.expirationLine).toMatch(/no expiration/i);
    expect(
      complimentaryGrantNeedsExpiryNotice({
        status: "active",
        expiresAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        expiryNoticeSentAt: null,
        convertedAt: null
      })
    ).toBe(true);
  });
});
