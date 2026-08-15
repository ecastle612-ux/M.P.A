import { describe, expect, it } from "vitest";
import { entitlementsForSku } from "../commercial/entitlements";
import { resolveAuthorizedReportShape } from "./authorization";

const ADMIN_FINANCE_CAPS = [
  "pm.finance:read",
  "pm.finance:reports.read",
  "platform.reports:read"
];
const LEASING_CAPS = ["pm.finance:read", "platform.reports:read"];
const TECH_CAPS = ["platform.reports:read"];

function shape(input: {
  roles: readonly string[];
  sku: "mpa_property_manager" | "mpa_facility_operations" | "mpa_complete_platform" | null;
  capabilities?: readonly string[];
  personaOverride?: string | null;
  areaOverride?: string | null;
}) {
  return resolveAuthorizedReportShape({
    roles: input.roles,
    sku: input.sku,
    entitlements: input.sku ? entitlementsForSku(input.sku) : [],
    capabilities: input.capabilities ?? ADMIN_FINANCE_CAPS,
    personaOverride: input.personaOverride ?? null,
    areaOverride: input.areaOverride ?? null
  });
}

describe("PLAT-006 shared report SKU × persona authorization", () => {
  it("PM admin gets organization_owner PM areas and finance, never FO product areas", () => {
    const result = shape({ roles: ["organization_admin"], sku: "mpa_property_manager" });
    expect(result.allowed).toBe(true);
    expect(result.persona).toBe("organization_owner");
    expect(result.areas).toContain("property_operations");
    expect(result.areas).toContain("resident_experience");
    expect(result.areas).toContain("financial_performance");
    expect(result.areas).not.toContain("facility_operations");
    expect(result.areas).not.toContain("assets");
    expect(result.areas).not.toContain("compliance");
    expect(result.loadFinance).toBe(true);
    expect(result.loadResidentFacts).toBe(true);
    expect(result.workSurface).toBe("residential");
  });

  it("PM property_manager gets PM set with finance and cannot escalate to owner or FO", () => {
    const result = shape({
      roles: ["property_manager"],
      sku: "mpa_property_manager",
      personaOverride: "organization_owner"
    });
    expect(result.persona).toBe("property_manager");
    expect(result.allowedPersonas).toEqual(["property_manager"]);
    expect(result.areas).toContain("financial_performance");
    expect(result.areas).not.toContain("facility_operations");
    expect(result.areas).not.toContain("commercial");
  });

  it("PM leasing_agent has PM set without command-center finance", () => {
    const result = shape({
      roles: ["leasing_agent"],
      sku: "mpa_property_manager",
      capabilities: LEASING_CAPS
    });
    expect(result.allowed).toBe(true);
    expect(result.persona).toBe("property_manager");
    expect(result.loadFinance).toBe(false);
    expect(result.areas).not.toContain("financial_performance");
    expect(result.areas).toContain("property_operations");
  });

  it("PM technician is denied staff shared reports", () => {
    const result = shape({
      roles: ["maintenance_technician"],
      sku: "mpa_property_manager",
      capabilities: TECH_CAPS,
      personaOverride: "organization_owner"
    });
    expect(result.allowed).toBe(false);
    expect(result.denyReason).toBe("technician_denied");
    expect(result.loadFinance).toBe(false);
  });

  it("FO admin is facility_manager only — organization_owner override cannot expand", () => {
    const result = shape({
      roles: ["organization_admin"],
      sku: "mpa_facility_operations",
      personaOverride: "organization_owner"
    });
    expect(result.allowed).toBe(true);
    expect(result.persona).toBe("facility_manager");
    expect(result.allowedPersonas).toEqual(["facility_manager"]);
    expect(result.areas).toEqual([
      "facility_operations",
      "maintenance",
      "assets",
      "compliance",
      "vendors",
      "documents"
    ]);
    expect(result.areas).not.toContain("resident_experience");
    expect(result.areas).not.toContain("property_operations");
    expect(result.areas).not.toContain("financial_performance");
    expect(result.loadFinance).toBe(false);
    expect(result.loadPropertyFacts).toBe(false);
    expect(result.loadResidentFacts).toBe(false);
    expect(result.workSurface).toBe("facility");
  });

  it("FO staff cannot fetch finance or residents via malicious persona/area", () => {
    const result = shape({
      roles: ["property_manager"],
      sku: "mpa_facility_operations",
      personaOverride: "property_manager",
      areaOverride: "financial_performance"
    });
    expect(result.persona).toBe("facility_manager");
    expect(result.areas).not.toContain("financial_performance");
    expect(result.loadFinance).toBe(false);
  });

  it("Complete admin default is the approved PM ∪ FO union", () => {
    const result = shape({ roles: ["organization_admin"], sku: "mpa_complete_platform" });
    expect(result.persona).toBe("organization_owner");
    expect(result.areas).toContain("property_operations");
    expect(result.areas).toContain("resident_experience");
    expect(result.areas).toContain("financial_performance");
    expect(result.areas).toContain("facility_operations");
    expect(result.areas).toContain("assets");
    expect(result.workSurface).toBe("union");
    expect(result.loadFinance).toBe(true);
  });

  it("Complete admin ?persona=facility_manager narrows and drops finance/residents", () => {
    const result = shape({
      roles: ["organization_admin"],
      sku: "mpa_complete_platform",
      personaOverride: "facility_manager"
    });
    expect(result.persona).toBe("facility_manager");
    expect(result.areas).toContain("facility_operations");
    expect(result.areas).not.toContain("resident_experience");
    expect(result.areas).not.toContain("property_operations");
    expect(result.areas).not.toContain("financial_performance");
    expect(result.loadFinance).toBe(false);
    expect(result.workSurface).toBe("facility");
  });

  it("Complete technician is FO-shaped and cannot escalate to owner", () => {
    const result = shape({
      roles: ["maintenance_technician"],
      sku: "mpa_complete_platform",
      capabilities: TECH_CAPS,
      personaOverride: "organization_owner"
    });
    expect(result.allowed).toBe(true);
    expect(result.persona).toBe("facility_manager");
    expect(result.loadFinance).toBe(false);
    expect(result.areas).not.toContain("resident_experience");
  });

  it("portal roles are denied even with finance capabilities and owner persona", () => {
    for (const role of ["tenant", "vendor", "property_owner"] as const) {
      const result = shape({
        roles: [role],
        sku: "mpa_property_manager",
        personaOverride: "organization_owner"
      });
      expect(result.allowed).toBe(false);
      expect(result.denyReason).toBe("portal_role");
    }
  });

  it("invalid and unknown persona strings never expand authority", () => {
    const result = shape({
      roles: ["leasing_agent"],
      sku: "mpa_property_manager",
      capabilities: LEASING_CAPS,
      personaOverride: "platform_operator'; drop table reports;--"
    });
    expect(result.persona).toBe("property_manager");
    expect(result.allowedPersonas).toEqual(["property_manager"]);
    expect(result.loadFinance).toBe(false);
  });

  it("area override cannot add an unauthorized FO area on PM", () => {
    const result = shape({
      roles: ["organization_admin"],
      sku: "mpa_property_manager",
      areaOverride: "facility_operations"
    });
    expect(result.areas).not.toContain("facility_operations");
    expect(result.areas).toContain("property_operations");
  });

  it("organization_admin on FO does not inherit PM owner shapes", () => {
    const result = shape({
      roles: ["organization_admin"],
      sku: "mpa_facility_operations"
    });
    expect(result.persona).not.toBe("organization_owner");
    expect(result.loadPropertyFacts).toBe(false);
    expect(result.loadResidentFacts).toBe(false);
  });
});
