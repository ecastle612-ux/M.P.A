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
    expect(requiredEntitlementForApiPath("/api/finance/online-payments")).toBe("pm.financial_operations");
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
    expect(requiredEntitlementForApiPath("/api/pm/tenants")).toBe("pm.residents");
    expect(requiredEntitlementForApiPath("/api/pm/tenants/occupancies/x/move-out")).toBe("pm.residents");
    expect(requiredEntitlementForApiPath("/api/pm/leasing")).toBe("pm.leasing");
    expect(requiredEntitlementForApiPath("/api/facility/preventive-maintenance/generate")).toBeNull();
    expect(requiredEntitlementForApiPath("/api/facility/operations")).toBe("facility.operations");
    expect(requiredEntitlementForApiPath("/api/facility/reports")).toBe("facility.operations");
    expect(requiredEntitlementForApiPath("/api/facility/assets")).toBe("facility.assets");
    expect(requiredEntitlementForApiPath("/api/facility/assets/asset-1/qr")).toBe("facility.assets");
    expect(requiredEntitlementForApiPath("/api/facility/inventory")).toBe("facility.inventory");
    expect(requiredEntitlementForApiPath("/api/facility/reports/assets")).toBe("facility.operations");
    expect(requiredEntitlementForApiPath("/api/facility/reports/inventory")).toBe(
      "facility.operations"
    );
    expect(requiredEntitlementForApiPath("/api/shared/reports")).toBe("platform.reports");
    expect(requiredEntitlementForApiPath("/api/shared/documents")).toBe("platform.documents");
    expect(requiredEntitlementForApiPath("/api/shared/tables")).toBe("platform.documents");
    expect(requiredEntitlementForPath("/shared/tables")).toBe("platform.documents");
    expect(requiredEntitlementForApiPath("/api/shared/communications")).toBe("platform.communications");
    expect(requiredEntitlementForApiPath("/api/shared/communications/conversations")).toBe("tenant_comms_staff");
    expect(requiredEntitlementForApiPath("/api/shared/search")).toBe("platform.search");
    expect(requiredEntitlementForApiPath("/api/shared/search/resolve")).toBe("platform.search");
    expect(
      evaluateApiPathEntitlement({ pathname: "/api/shared/search", sku: "mpa_facility_operations" }).allowed
    ).toBe(true);
    expect(
      evaluateApiPathEntitlement({
        pathname: "/api/shared/search",
        sku: "mpa_complete_platform",
        roles: ["property_manager"],
        storedScope: "facility_operations"
      }).allowed
    ).toBe(true);
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
      evaluateApiPathEntitlement({ pathname: "/api/pm/tenants", sku: "mpa_facility_operations" }).allowed
    ).toBe(false);
    expect(
      evaluateApiPathEntitlement({ pathname: "/api/facility/operations", sku: "mpa_facility_operations" }).allowed
    ).toBe(true);
    expect(
      evaluateApiPathEntitlement({ pathname: "/api/facility/assets", sku: "mpa_facility_operations" }).allowed
    ).toBe(true);
    expect(
      evaluateApiPathEntitlement({ pathname: "/api/facility/inventory", sku: "mpa_facility_operations" }).allowed
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
      evaluateApiPathEntitlement({ pathname: "/api/pm/tenants", sku: "mpa_property_manager" }).allowed
    ).toBe(true);
    expect(
      evaluateApiPathEntitlement({ pathname: "/api/facility/operations", sku: "mpa_property_manager" }).allowed
    ).toBe(false);
    expect(
      evaluateApiPathEntitlement({ pathname: "/api/facility/assets", sku: "mpa_property_manager" }).allowed
    ).toBe(false);
    expect(
      evaluateApiPathEntitlement({ pathname: "/api/facility/inventory", sku: "mpa_property_manager" }).allowed
    ).toBe(false);
  });

  it("Complete + facility_operations still denies Property Mission Control URL", () => {
    expect(
      evaluatePathEntitlement({
        pathname: "/pm/mission-control",
        sku: "mpa_complete_platform",
        roles: ["property_manager"],
        storedScope: "facility_operations"
      }).allowed
    ).toBe(false);
    expect(
      evaluatePathEntitlement({
        pathname: "/facility/mission-control",
        sku: "mpa_complete_platform",
        roles: ["property_manager"],
        storedScope: "facility_operations"
      }).allowed
    ).toBe(true);
  });

  it("Complete + property_operations still denies Facility Mission Control URL", () => {
    expect(
      evaluatePathEntitlement({
        pathname: "/facility/mission-control",
        sku: "mpa_complete_platform",
        roles: ["property_manager"],
        storedScope: "property_operations"
      }).allowed
    ).toBe(false);
    expect(
      evaluatePathEntitlement({
        pathname: "/pm/mission-control",
        sku: "mpa_complete_platform",
        roles: ["property_manager"],
        storedScope: "property_operations"
      }).allowed
    ).toBe(true);
  });

  it("Complete + facility_operations denies PM finance and property APIs", () => {
    expect(
      evaluateApiPathEntitlement({
        pathname: "/api/finance/snapshot",
        sku: "mpa_complete_platform",
        roles: ["property_manager"],
        storedScope: "facility_operations"
      }).allowed
    ).toBe(false);
    expect(
      evaluatePathEntitlement({
        pathname: "/pm/financial-operations",
        sku: "mpa_complete_platform",
        roles: ["property_manager"],
        storedScope: "facility_operations"
      }).allowed
    ).toBe(false);
    expect(
      evaluateApiPathEntitlement({
        pathname: "/api/facility/assets",
        sku: "mpa_complete_platform",
        roles: ["property_manager"],
        storedScope: "facility_operations"
      }).allowed
    ).toBe(true);
  });

  it("Complete + property_operations denies Facility APIs and keeps finance", () => {
    expect(
      evaluateApiPathEntitlement({
        pathname: "/api/finance/snapshot",
        sku: "mpa_complete_platform",
        storedScope: "property_operations"
      }).allowed
    ).toBe(true);
    expect(
      evaluateApiPathEntitlement({
        pathname: "/api/facility/assets",
        sku: "mpa_complete_platform",
        storedScope: "property_operations"
      }).allowed
    ).toBe(false);
  });

  it("PM SKU + stored both still cannot open Facility", () => {
    expect(
      evaluatePathEntitlement({
        pathname: "/facility/mission-control",
        sku: "mpa_property_manager",
        storedScope: "both"
      }).allowed
    ).toBe(false);
  });

  it("FO SKU + stored both still cannot open PM finance", () => {
    expect(
      evaluatePathEntitlement({
        pathname: "/pm/financial-operations",
        sku: "mpa_facility_operations",
        storedScope: "both"
      }).allowed
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
