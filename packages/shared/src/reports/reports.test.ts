import { describe, expect, it } from "vitest";
import {
  assembleReportingSnapshot,
  buildReportingInsights,
  resolveExecutivePersona,
  type RawReportingFacts
} from "./index";

const emptyFacts: RawReportingFacts = {
  properties: [],
  units: [],
  leases: [],
  residents: [],
  workOrders: [],
  documents: [],
  finance: null,
  subscription: null,
  vendors: []
};

describe("reporting insights", () => {
  it("does not invent occupancy when finance is missing", () => {
    const insights = buildReportingInsights(emptyFacts);
    expect(insights.every((i) => i.id !== "occupancy")).toBe(true);
  });

  it("surfaces lease expirations from real end dates", () => {
    const now = new Date("2026-08-09T12:00:00Z");
    const insights = buildReportingInsights(
      {
        ...emptyFacts,
        leases: [
          {
            id: "1",
            status: "active",
            endDate: "2026-08-20",
            startDate: "2025-08-20",
            residentName: "Maya Chen",
            propertyName: "Oak"
          }
        ]
      },
      now
    );
    expect(insights.some((i) => i.id === "leases-expiring")).toBe(true);
    expect(insights.find((i) => i.id === "leases-expiring")?.headline).toContain("1 lease");
  });

  it("maps organization_admin to organization_owner persona", () => {
    expect(
      resolveExecutivePersona({
        roles: ["organization_admin"],
        hasFacilityEntitlement: false
      })
    ).toBe("organization_owner");
  });

  it("assembles persona-filtered snapshot", () => {
    const snap = assembleReportingSnapshot({
      organizationId: "org",
      organizationName: "Demo Org",
      persona: "property_manager",
      facts: {
        ...emptyFacts,
        workOrders: [
          {
            id: "wo1",
            title: "HVAC emergency",
            status: "submitted",
            priority: "emergency"
          }
        ],
        finance: {
          expectedRentThisMonth: 10000,
          rentCollectedThisMonth: 8000,
          outstandingRent: 2000,
          outstandingBalance: 2000,
          delinquencyCount: 2,
          totalDelinquency: 1500,
          vendorPayablesOpen: 500,
          vendorPaidThisMonth: 300,
          netOperationalCash: 7700,
          occupancyRate: 92,
          unitsTotal: 10,
          unitsOccupied: 9
        }
      }
    });
    expect(snap.attentionQuestion).toContain("pay attention");
    expect(snap.insights.some((i) => i.id === "wo-emergency")).toBe(true);
    expect(snap.areas.some((a) => a.area === "commercial")).toBe(false);
    expect(snap.areas.some((a) => a.area === "maintenance")).toBe(true);
  });

  it("does not expand selectedArea beyond the authorized allowlist", () => {
    const areas = assembleReportingSnapshot({
      organizationId: "org",
      organizationName: "Demo",
      persona: "facility_manager",
      allowedAreas: ["facility_operations", "maintenance", "documents"],
      facts: {
        ...emptyFacts,
        finance: {
          expectedRentThisMonth: 1,
          rentCollectedThisMonth: 1,
          outstandingRent: 1,
          outstandingBalance: 1,
          delinquencyCount: 1,
          totalDelinquency: 1,
          vendorPayablesOpen: 1,
          vendorPaidThisMonth: 1,
          netOperationalCash: 1,
          occupancyRate: 90,
          unitsTotal: 10,
          unitsOccupied: 9
        }
      }
    });
    expect(areas.areas.some((a) => a.area === "financial_performance")).toBe(false);
    expect(areas.areas.some((a) => a.area === "resident_experience")).toBe(false);
    expect(areas.areas.some((a) => a.area === "facility_operations")).toBe(true);
  });
});
