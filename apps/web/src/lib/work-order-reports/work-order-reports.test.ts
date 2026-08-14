import { describe, expect, it } from "vitest";
import { evaluatePathEntitlement } from "@mpa/shared";
import { parseWorkOrderReportFilters } from "./parse-filters";

describe("FAC-002 route entitlements", () => {
  it("allows FO reports for facility and complete SKUs only", () => {
    expect(
      evaluatePathEntitlement({ pathname: "/facility/reports", sku: "mpa_facility_operations" }).allowed
    ).toBe(true);
    expect(
      evaluatePathEntitlement({ pathname: "/facility/reports", sku: "mpa_complete_platform" }).allowed
    ).toBe(true);
    expect(
      evaluatePathEntitlement({ pathname: "/facility/reports", sku: "mpa_property_manager" }).allowed
    ).toBe(false);
  });

  it("allows PM work-order reports for PM and complete SKUs only", () => {
    expect(
      evaluatePathEntitlement({
        pathname: "/pm/reports/work-orders",
        sku: "mpa_property_manager"
      }).allowed
    ).toBe(true);
    expect(
      evaluatePathEntitlement({
        pathname: "/pm/reports/work-orders",
        sku: "mpa_complete_platform"
      }).allowed
    ).toBe(true);
    expect(
      evaluatePathEntitlement({
        pathname: "/pm/reports/work-orders",
        sku: "mpa_facility_operations"
      }).allowed
    ).toBe(false);
  });

  it("keeps tenant portals off FAC-002 paths", () => {
    expect(
      evaluatePathEntitlement({ pathname: "/portal/tenant", sku: "mpa_complete_platform" }).allowed
    ).toBe(true);
    // Tenant portal itself is allowed by path map (null entitlement), but FAC-002
    // APIs require org staff membership + maintenance capability (tested at API gate).
    expect(
      evaluatePathEntitlement({ pathname: "/facility/reports", sku: null }).allowed
    ).toBe(false);
  });
});

describe("FAC-002 filter parsing", () => {
  it("defaults to last-30-day created mode", () => {
    const filters = parseWorkOrderReportFilters(new URLSearchParams());
    expect(filters.dateMode).toBe("created");
    expect(filters.dateFrom).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(filters.dateTo).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("parses multi filters from query string", () => {
    const filters = parseWorkOrderReportFilters(
      new URLSearchParams(
        "dateFrom=2026-08-01&dateTo=2026-08-14&dateMode=completed&status=closed&priority=high&category=hvac&vendorId=11111111-1111-4111-8111-111111111111&userId=22222222-2222-4222-8222-222222222222&location=Roof&propertyId=33333333-3333-4333-8333-333333333333"
      )
    );
    expect(filters.dateMode).toBe("completed");
    expect(filters.statuses).toEqual(["closed"]);
    expect(filters.priorities).toEqual(["high"]);
    expect(filters.categories).toEqual(["hvac"]);
    expect(filters.location).toBe("Roof");
    expect(filters.vendorIds).toHaveLength(1);
    expect(filters.userIds).toHaveLength(1);
    expect(filters.propertyIds).toHaveLength(1);
  });
});
