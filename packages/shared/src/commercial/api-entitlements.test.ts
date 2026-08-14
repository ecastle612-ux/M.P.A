import { describe, expect, it } from "vitest";
import {
  evaluateApiPathEntitlement,
  evaluatePathEntitlement,
  orgAllowsWorkSurface,
  requiredEntitlementForApiPath,
  requiredEntitlementForPath
} from "./index";

describe("PLAT-002 API entitlement catalog", () => {
  it("does not change page entitlement mapping for /api/", () => {
    expect(requiredEntitlementForPath("/api/finance/snapshot")).toBeNull();
    expect(evaluatePathEntitlement({ pathname: "/pm/financial-operations", sku: "mpa_property_manager" }).allowed).toBe(
      true
    );
  });

  it("maps finance staff APIs and excludes webhooks, resident, checkout", () => {
    expect(requiredEntitlementForApiPath("/api/finance/snapshot")).toBe("pm.financial_operations");
    expect(requiredEntitlementForApiPath("/api/finance/webhooks/stripe")).toBeNull();
    expect(requiredEntitlementForApiPath("/api/finance/resident/billing")).toBeNull();
    expect(requiredEntitlementForApiPath("/api/finance/checkout")).toBeNull();
  });

  it("maps property, maintenance, facility, and shared prefixes", () => {
    expect(requiredEntitlementForApiPath("/api/pm/properties")).toBe("pm.properties");
    expect(requiredEntitlementForApiPath("/api/pm/mission-control")).toBe("pm.properties");
    expect(requiredEntitlementForApiPath("/api/pm/maintenance")).toBe("pm.maintenance");
    expect(requiredEntitlementForApiPath("/api/pm/maintenance/vendors")).toBe("pm.vendors");
    expect(requiredEntitlementForApiPath("/api/pm/reports/work-orders")).toBe("pm.maintenance");
    expect(requiredEntitlementForApiPath("/api/pm/residents")).toBe("pm.residents");
    expect(requiredEntitlementForApiPath("/api/pm/leasing")).toBe("pm.leasing");
    expect(requiredEntitlementForApiPath("/api/facility/operations")).toBe("facility.operations");
    expect(requiredEntitlementForApiPath("/api/facility/reports")).toBe("facility.operations");
    expect(requiredEntitlementForApiPath("/api/shared/reports")).toBe("platform.reports");
    expect(requiredEntitlementForApiPath("/api/shared/communications")).toBe("platform.communications");
    expect(requiredEntitlementForApiPath("/api/shared/communications/conversations")).toBe("tenant_comms_staff");
    expect(requiredEntitlementForApiPath("/api/portal/tenant/conversations")).toBeNull();
    expect(requiredEntitlementForApiPath("/api/commerce/checkout")).toBeNull();
  });

  it("denies FO SKU on finance and property APIs (C1/C2/C3)", () => {
    expect(
      evaluateApiPathEntitlement({ pathname: "/api/finance/snapshot", sku: "mpa_facility_operations" }).allowed
    ).toBe(false);
    expect(
      evaluateApiPathEntitlement({ pathname: "/api/pm/properties", sku: "mpa_facility_operations" }).allowed
    ).toBe(false);
    expect(
      evaluateApiPathEntitlement({ pathname: "/api/facility/operations", sku: "mpa_facility_operations" }).allowed
    ).toBe(true);
    expect(
      evaluateApiPathEntitlement({ pathname: "/api/pm/maintenance", sku: "mpa_facility_operations" }).allowed
    ).toBe(false);
  });

  it("allows PM SKU on finance/property and denies facility APIs", () => {
    expect(
      evaluateApiPathEntitlement({ pathname: "/api/finance/snapshot", sku: "mpa_property_manager" }).allowed
    ).toBe(true);
    expect(
      evaluateApiPathEntitlement({ pathname: "/api/pm/properties", sku: "mpa_property_manager" }).allowed
    ).toBe(true);
    expect(
      evaluateApiPathEntitlement({ pathname: "/api/facility/operations", sku: "mpa_property_manager" }).allowed
    ).toBe(false);
  });

  it("Complete is the union", () => {
    expect(
      evaluateApiPathEntitlement({ pathname: "/api/finance/snapshot", sku: "mpa_complete_platform" }).allowed
    ).toBe(true);
    expect(
      evaluateApiPathEntitlement({ pathname: "/api/facility/operations", sku: "mpa_complete_platform" }).allowed
    ).toBe(true);
    expect(
      evaluateApiPathEntitlement({
        pathname: "/api/shared/communications/conversations",
        sku: "mpa_complete_platform"
      }).allowed
    ).toBe(true);
  });

  it("denies FO staff conversation APIs and allows PM", () => {
    expect(
      evaluateApiPathEntitlement({
        pathname: "/api/shared/communications/conversations",
        sku: "mpa_facility_operations"
      }).allowed
    ).toBe(false);
    expect(
      evaluateApiPathEntitlement({
        pathname: "/api/shared/communications/conversations",
        sku: "mpa_property_manager"
      }).allowed
    ).toBe(true);
  });

  it("returns 403-shaped deny for unknown /api/pm/*", () => {
    const decision = evaluateApiPathEntitlement({
      pathname: "/api/pm/unknown-module",
      sku: "mpa_property_manager"
    });
    expect(decision.allowed).toBe(false);
  });
});

describe("PLAT-002 work surface SKU map", () => {
  it("Property Manager is residential only", () => {
    expect(orgAllowsWorkSurface("mpa_property_manager", "residential")).toBe(true);
    expect(orgAllowsWorkSurface("mpa_property_manager", "facility")).toBe(false);
  });

  it("Facility Operations is facility only", () => {
    expect(orgAllowsWorkSurface("mpa_facility_operations", "facility")).toBe(true);
    expect(orgAllowsWorkSurface("mpa_facility_operations", "residential")).toBe(false);
  });

  it("Complete is the approved union", () => {
    expect(orgAllowsWorkSurface("mpa_complete_platform", "residential")).toBe(true);
    expect(orgAllowsWorkSurface("mpa_complete_platform", "facility")).toBe(true);
  });

  it("canceled / missing SKU allows neither surface", () => {
    expect(orgAllowsWorkSurface(null, "residential")).toBe(false);
    expect(orgAllowsWorkSurface(null, "facility")).toBe(false);
  });
});
