import { describe, expect, it } from "vitest";
import {
  calculateCommissionCents,
  commissionStatusForNewEntry,
  exampleFoundingCommission,
  FOUNDING_PARTNER_COMMISSION_PERCENT,
  isReservedPartnerSlug,
  normalizePartnerSlug,
  parsePartnerApplicationInput,
  eligibleRevenueCentsFromInvoice,
  parsePartnerRefParam,
  partnerReferralPath,
  proposePartnerSlug,
  shouldCreateCommission,
  validatePartnerSlug,
  voidOrOffsetStatus
} from "./index";

describe("PARTNER-001 shared contracts", () => {
  it("normalizes slugs and blocks reserved routes", () => {
    expect(normalizePartnerSlug("NorthStar Property Services")).toBe("northstar-property-services");
    expect(isReservedPartnerSlug("request")).toBe(true);
    expect(validatePartnerSlug("admin").ok).toBe(false);
    expect(validatePartnerSlug("northstar-property-services").ok).toBe(true);
    expect(parsePartnerRefParam("NorthStar-Property-Services")).toBe("northstar-property-services");
    expect(partnerReferralPath("northstar-property-services")).toBe(
      "/get-started?ref=northstar-property-services"
    );
    expect(proposePartnerSlug("NorthStar Property Services", new Set(["northstar-property-services"]))).toBe(
      "northstar-property-services-2"
    );
    expect(proposePartnerSlug("Admin", new Set())).toBe("partner-company");
  });

  it("calculates 20% from collected revenue and snapshots the example", () => {
    expect(calculateCommissionCents({ eligibleRevenueCents: 10900, commissionBps: 2000 })).toBe(2180);
    const example = exampleFoundingCommission();
    expect(example.percent).toBe(FOUNDING_PARTNER_COMMISSION_PERCENT);
    expect(example.monthlyCommissionUsd).toBe(21.8);
    expect(example.twelveMonthCommissionUsd).toBe(261.6);
  });

  it("caps qualifying months and excludes complimentary/failed/refunded", () => {
    expect(
      shouldCreateCommission({
        partnerActive: true,
        paymentCollected: true,
        paymentFailed: false,
        refunded: false,
        complimentaryOnly: false,
        existingQualifyingCount: 11
      })
    ).toBe(true);
    expect(
      shouldCreateCommission({
        partnerActive: true,
        paymentCollected: true,
        paymentFailed: false,
        refunded: false,
        complimentaryOnly: false,
        existingQualifyingCount: 12
      })
    ).toBe(false);
    expect(
      shouldCreateCommission({
        partnerActive: true,
        paymentCollected: true,
        paymentFailed: false,
        refunded: false,
        complimentaryOnly: true,
        existingQualifyingCount: 0
      })
    ).toBe(false);
    expect(commissionStatusForNewEntry(true)).toBe("pending");
    expect(voidOrOffsetStatus("paid")).toEqual({ next: "void", offsetRequired: true });
    expect(voidOrOffsetStatus("earned")).toEqual({ next: "void", offsetRequired: false });
    expect(eligibleRevenueCentsFromInvoice({ amountPaidCents: 10900, taxCents: 900 })).toBe(10000);
    expect(eligibleRevenueCentsFromInvoice({ amountPaidCents: 0 })).toBe(0);
  });

  it("validates applications and treats honeypot as spam", () => {
    const valid = parsePartnerApplicationInput({
      companyName: "NorthStar Property Services",
      contactName: "Alex Rivera",
      email: "alex@northstar.example",
      phone: "612-555-0100",
      city: "Minneapolis",
      state: "MN",
      serviceArea: "Twin Cities",
      companyServiceType: "Maintenance company",
      servicesOffered: "Make-ready, HVAC, plumbing",
      interestedPartnerType: "certified_service"
    });
    expect(valid.ok).toBe(true);
    const spam = parsePartnerApplicationInput({
      companyName: "Bot",
      contactName: "Bot",
      email: "bot@example.com",
      phone: "1",
      city: "X",
      state: "MN",
      serviceArea: "X",
      companyServiceType: "X",
      servicesOffered: "X",
      interestedPartnerType: "referral",
      company_fax: "filled"
    });
    expect(spam.ok).toBe(false);
    if (!spam.ok) expect(spam.error).toBe("spam");
  });
});
