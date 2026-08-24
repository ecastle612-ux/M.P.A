import { describe, expect, it } from "vitest";
import {
  calculateCommissionCents,
  commissionStatusForNewEntry,
  exampleFoundingCommission,
  FOUNDING_PARTNER_COMMISSION_PERCENT,
  isReservedPartnerSlug,
  normalizePartnerSlug,
  parsePartnerApplicationInput,
  parsePartnerPublicProfileInput,
  PARTNER_COMMAND_CENTER_NAV,
  parsePartnerServiceRequestInput,
  partnerDisplayStatus,
  partnerPortalIsLive,
  partnerRateDisplay,
  partnerServiceRequestPath,
  partnerPropertyCanonicalUrl,
  partnerPropertyIntakeSourceLabel,
  partnerPropertyServiceRequestPath,
  partnerPropertySlugLooksLikeUuid,
  partnerPropertyTypeFromSku,
  paginatePartnerPropertyPortals,
  parsePartnerPropertyPortalCreateInput,
  validatePartnerPropertySlug,
  eligibleRevenueCentsFromInvoice,
  parsePartnerRefParam,
  partnerReferralPath,
  proposePartnerSlug,
  requestOperationalMetrics,
  shouldCreateCommission,
  summarizeCommissionLedger,
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

  it("gates public portals and parses untrusted service requests", () => {
    expect(partnerServiceRequestPath("northstar-property-services")).toBe(
      "/request/northstar-property-services"
    );
    expect(
      partnerPortalIsLive({
        status: "active",
        partnerType: "certified_service",
        publicPortalEnabled: true,
        organizationId: "org-1",
        publicSlug: "northstar-property-services"
      })
    ).toBe(true);
    expect(
      partnerPortalIsLive({
        status: "active",
        partnerType: "referral",
        publicPortalEnabled: true,
        organizationId: "org-1",
        publicSlug: "referral-only"
      })
    ).toBe(false);
    const parsed = parsePartnerServiceRequestInput({
      requesterName: "Jamie",
      email: "jamie@example.test",
      address: "100 Main",
      category: "plumbing",
      description: "Leak under the sink.",
      urgency: "urgent"
    });
    expect(parsed.ok).toBe(true);
    expect(
      parsePartnerServiceRequestInput({
        requesterName: "Jamie",
        email: "jamie@example.test",
        address: "100 Main",
        category: "plumbing",
        description: "Leak under the sink.",
        organizationId: "x"
      }).ok
    ).toBe(false);
    expect(
      parsePartnerServiceRequestInput({
        requesterName: "Jamie",
        email: "jamie@example.test",
        address: "100 Main",
        category: "plumbing",
        description: "Leak under the sink.",
        propertyId: "11111111-1111-4111-8111-111111111111"
      }).ok
    ).toBe(false);
    expect(
      parsePartnerServiceRequestInput(
        {
          requesterName: "Jamie",
          email: "jamie@example.test",
          category: "plumbing",
          description: "Leak under the sink."
        },
        { requirePropertyAddress: false }
      ).ok
    ).toBe(true);
  });
});

describe("PARTNER-004 property portal contracts", () => {
  it("normalizes partner-scoped property slugs and rejects reserved or UUID values", () => {
    expect(validatePartnerPropertySlug("Maple Apartments").ok).toBe(true);
    if (validatePartnerPropertySlug("Maple Apartments").ok) {
      expect(validatePartnerPropertySlug("Maple Apartments").slug).toBe("maple-apartments");
    }
    expect(validatePartnerPropertySlug("admin").ok).toBe(false);
    expect(validatePartnerPropertySlug("status").ok).toBe(false);
    expect(partnerPropertySlugLooksLikeUuid("11111111-1111-4111-8111-111111111111")).toBe(true);
    expect(validatePartnerPropertySlug("11111111-1111-4111-8111-111111111111").ok).toBe(false);
    expect(partnerPropertyServiceRequestPath("NorthStar Property Services", "Maple Apartments")).toBe(
      "/request/northstar-property-services/maple-apartments"
    );
    expect(partnerPropertyCanonicalUrl("northstar-property-services", "maple-apartments")).toBe(
      "https://www.my-property-assistant.com/request/northstar-property-services/maple-apartments"
    );
    expect(partnerPropertyIntakeSourceLabel("property_portal")).toBe("Property QR / Property Portal");
    expect(partnerPropertyIntakeSourceLabel("generic_portal")).toBe("Partner portal");
    expect(partnerPropertyTypeFromSku("mpa_complete_platform")).toBe("complete");
    expect(partnerPropertyTypeFromSku("mpa_facility_operations")).toBe("facility");
    expect(paginatePartnerPropertyPortals(Array.from({ length: 30 }, (_, index) => index), { page: 2, pageSize: 25 }).items).toHaveLength(5);
    expect(parsePartnerPropertyPortalCreateInput({ organizationId: "org-x", propertyId: "11111111-1111-4111-8111-111111111111" }).ok).toBe(false);
    expect(parsePartnerPropertyPortalCreateInput({ propertyId: "not-a-uuid" }).ok).toBe(false);
    expect(parsePartnerPropertyPortalCreateInput({ propertyId: "11111111-1111-4111-8111-111111111111" }).ok).toBe(true);
  });
});

describe("PARTNER-003 command center contracts", () => {
  it("uses the partner's actual rate and human status labels", () => {
    expect(partnerRateDisplay(2000).label).toBe("Founding Partner Rate: 20%");
    expect(partnerRateDisplay(1500).label).toBe("Partner Rate: 15%");
    expect(partnerRateDisplay(1500).founding).toBe(false);
    expect(
      partnerDisplayStatus({
        status: "suspended",
        partnerType: "certified_service",
        publicPortalEnabled: false,
        organizationId: "org-1",
        publicSlug: "acme"
      }).label
    ).toBe("Suspended");
    expect(
      partnerDisplayStatus({
        status: "active",
        partnerType: "certified_service",
        publicPortalEnabled: false,
        organizationId: "org-1",
        publicSlug: "acme"
      }).label
    ).toBe("Portal Disabled");
  });

  it("summarizes ledger and request metrics from real records", () => {
    const ledger = summarizeCommissionLedger([
      { status: "pending", commissionCents: 100 },
      { status: "earned", commissionCents: 200 },
      { status: "paid", commissionCents: 300 },
      { status: "void", commissionCents: 50 }
    ]);
    expect(ledger.trackedCents).toBe(600);
    expect(ledger.voidCents).toBe(50);
    const metrics = requestOperationalMetrics([
      { status: "submitted", createdAt: "2026-08-02T00:00:00.000Z" },
      { status: "converted", createdAt: "2026-08-03T00:00:00.000Z" },
      { status: "declined", createdAt: "2026-08-04T00:00:00.000Z" }
    ], new Date("2026-08-24T00:00:00.000Z"));
    expect(metrics.newCount).toBe(1);
    expect(metrics.thisMonthCount).toBe(3);
    expect(metrics.conversionRate).toBe(50);
  });

  it("rejects protected profile fields", () => {
    expect(parsePartnerPublicProfileInput({ commissionBps: 2500 }).ok).toBe(false);
    expect(parsePartnerPublicProfileInput({ status: "active" }).ok).toBe(false);
    expect(parsePartnerPublicProfileInput({ partnerType: "strategic" }).ok).toBe(false);
    expect(parsePartnerPublicProfileInput({ organizationId: "org-x" }).ok).toBe(false);
    const allowed = parsePartnerPublicProfileInput({ portalDescription: "Local HVAC" });
    expect(allowed.ok).toBe(true);
    expect(PARTNER_COMMAND_CENTER_NAV.map((item) => item.href)).toContain("/partner/properties");
  });
});
