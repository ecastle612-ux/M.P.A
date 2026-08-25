import { describe, expect, it } from "vitest";
import {
  PARTNER_OPPORTUNITY_ROUTE_LIMIT,
  PARTNER_OPPORTUNITY_TTL_MS,
  categoriesForOpportunityRouting,
  locationMatchesOpportunity,
  mapWorkOrderCategoryToPartnerCategory,
  partnerEligibleForOpportunityRouting,
  partnerFacingOpportunityPrivacy,
  partnerOffersOpportunityCategory,
  parsePartnerOpportunityCreateInput,
  selectPartnersForRouting,
  summarizePartnerOpportunityMetrics
} from "./opportunities";

describe("PARTNER-006 matching contracts", () => {
  it("keeps a single routing limit and 72-hour TTL", () => {
    expect(PARTNER_OPPORTUNITY_ROUTE_LIMIT).toBe(5);
    expect(PARTNER_OPPORTUNITY_TTL_MS).toBe(72 * 60 * 60 * 1000);
  });

  it("includes Ready Certified and Strategic partners only", () => {
    expect(
      partnerEligibleForOpportunityRouting({
        status: "active",
        partnerType: "certified_service",
        readiness: "ready"
      })
    ).toBe(true);
    expect(
      partnerEligibleForOpportunityRouting({
        status: "active",
        partnerType: "strategic",
        readiness: "ready"
      })
    ).toBe(true);
    expect(
      partnerEligibleForOpportunityRouting({
        status: "active",
        partnerType: "referral",
        readiness: "ready"
      })
    ).toBe(false);
    expect(
      partnerEligibleForOpportunityRouting({
        status: "active",
        partnerType: "certified_service",
        readiness: "not_ready"
      })
    ).toBe(false);
    expect(
      partnerEligibleForOpportunityRouting({
        status: "suspended",
        partnerType: "certified_service",
        readiness: "ready"
      })
    ).toBe(false);
  });

  it("matches plumbing offerings and rejects unrelated categories", () => {
    expect(partnerOffersOpportunityCategory("Plumbing and drain cleaning", "plumbing")).toBe(true);
    expect(partnerOffersOpportunityCategory("Plumbing and drain cleaning", "electrical")).toBe(false);
    expect(categoriesForOpportunityRouting("")).toEqual([]);
    expect(categoriesForOpportunityRouting("We do stuff")).toEqual([]);
    expect(mapWorkOrderCategoryToPartnerCategory("plumbing")).toBe("plumbing");
    expect(mapWorkOrderCategoryToPartnerCategory("general")).toBe("general_maintenance");
    expect(mapWorkOrderCategoryToPartnerCategory("structural")).toBe("handyman");
  });

  it("matches structured city, region, ZIP, and service-area text", () => {
    expect(
      locationMatchesOpportunity(
        { city: "Oakdale", region: "MN", postalCode: "55128" },
        { city: "Oakdale", state: "MN", serviceArea: "Twin Cities" }
      )
    ).toBe(true);
    expect(
      locationMatchesOpportunity(
        { city: "Oakdale", region: "MN", postalCode: "55128" },
        { city: "Duluth", state: "WI", serviceArea: "Northwest Wisconsin" }
      )
    ).toBe(false);
    expect(
      locationMatchesOpportunity(
        { city: "Oakdale", region: "MN", postalCode: "55128" },
        { city: "St Paul", state: "WI", serviceArea: "Oakdale and 55128" }
      )
    ).toBe(true);
    expect(
      locationMatchesOpportunity({ city: null, region: null, postalCode: null }, { city: "Oakdale", state: "MN" })
    ).toBe(false);
  });

  it("does not re-route previously contacted partners and caps the slice", () => {
    const selected = selectPartnersForRouting(
      [
        { id: "b", companyName: "Beta" },
        { id: "a", companyName: "Alpha" },
        { id: "c", companyName: "Charlie" },
        { id: "d", companyName: "Delta" },
        { id: "e", companyName: "Echo" },
        { id: "f", companyName: "Foxtrot" }
      ],
      ["a"],
      PARTNER_OPPORTUNITY_ROUTE_LIMIT
    );
    expect(selected.map((row) => row.id)).toEqual(["b", "c", "d", "e", "f"]);
    expect(selected).toHaveLength(5);
  });

  it("rejects client overrides and hides unit details from partner privacy", () => {
    expect(parsePartnerOpportunityCreateInput({ organizationId: "org-b", propertyId: "p1", category: "plumbing", description: "Leak" }).ok).toBe(false);
    expect(parsePartnerOpportunityCreateInput({ selectedPartnerId: "p", propertyId: "p1", category: "plumbing", description: "Leak" }).ok).toBe(false);
    const parsed = parsePartnerOpportunityCreateInput({
      propertyId: "p1",
      category: "plumbing",
      description: "Kitchen leak",
      urgency: "urgent",
      unitLabel: "4B"
    });
    expect(parsed.ok).toBe(true);
    const privacy = partnerFacingOpportunityPrivacy({
      city: "Oakdale",
      region: "MN",
      propertyType: "residential",
      category: "plumbing",
      urgency: "urgent",
      description: "Kitchen leak",
      preferredTiming: "Tomorrow morning"
    });
    expect(privacy.area).toBe("Oakdale, MN");
    expect(JSON.stringify(privacy)).not.toContain("4B");
    expect(JSON.stringify(privacy)).not.toContain("resident");
  });

  it("summarizes partner opportunity metrics without revenue", () => {
    const metrics = summarizePartnerOpportunityMetrics([
      { response: "interested" },
      { response: "declined" },
      { response: null, selected: true }
    ]);
    expect(metrics.received).toBe(3);
    expect(metrics.interested).toBe(2);
    expect(metrics.declined).toBe(1);
    expect(metrics.selected).toBe(1);
    expect(metrics.responseRate).toBe(66.7);
    expect(JSON.stringify(metrics)).not.toContain("commission");
    expect(JSON.stringify(metrics)).not.toContain("revenue");
  });
});
