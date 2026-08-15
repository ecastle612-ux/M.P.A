import { describe, expect, it } from "vitest";
import { entitlementsForSku } from "../commercial/entitlements";
import {
  entitlementsForMember,
  memberAllowsWorkSurface,
  resolveMemberOperatingScope,
  storedScopeForNewMembership,
  validateInviteOperatingScope,
  wouldLeaveCompleteWithoutBothAdmin
} from "./operating-scope";

describe("member operating scope", () => {
  it("keeps PM SKU on Property even when stored scope is Facility or Both", () => {
    for (const storedScope of ["facility_operations", "both", "property_operations"] as const) {
      const entitlements = entitlementsForMember({
        sku: "mpa_property_manager",
        roles: ["property_manager"],
        storedScope
      });
      expect(entitlements).toEqual(entitlementsForSku("mpa_property_manager"));
      expect(entitlements).toContain("pm.financial_operations");
      expect(entitlements).not.toContain("facility.operations");
      expect(
        memberAllowsWorkSurface({
          sku: "mpa_property_manager",
          storedScope,
          surface: "facility"
        })
      ).toBe(false);
    }
  });

  it("keeps FO SKU on Facility even when stored scope is Property or Both", () => {
    for (const storedScope of ["property_operations", "both", "facility_operations"] as const) {
      const entitlements = entitlementsForMember({
        sku: "mpa_facility_operations",
        roles: ["property_manager"],
        storedScope
      });
      expect(entitlements).toEqual(entitlementsForSku("mpa_facility_operations"));
      expect(entitlements).toContain("facility.operations");
      expect(entitlements).not.toContain("pm.financial_operations");
      expect(
        memberAllowsWorkSurface({
          sku: "mpa_facility_operations",
          storedScope,
          surface: "residential"
        })
      ).toBe(false);
    }
  });

  it("Complete + both (or unassigned staff) keeps the current union including finance", () => {
    const both = entitlementsForMember({
      sku: "mpa_complete_platform",
      roles: ["property_manager"],
      storedScope: "both"
    });
    const unassigned = entitlementsForMember({
      sku: "mpa_complete_platform",
      roles: ["property_manager"],
      storedScope: null
    });
    expect(both).toEqual(entitlementsForSku("mpa_complete_platform"));
    expect(unassigned).toEqual(both);
    expect(both).toContain("pm.financial_operations");
    expect(both).toContain("facility.assets");
    expect(both).toContain("platform.documents");
  });

  it("Complete + property_operations drops Facility and keeps PM finance", () => {
    const entitlements = entitlementsForMember({
      sku: "mpa_complete_platform",
      roles: ["property_manager"],
      storedScope: "property_operations"
    });
    expect(entitlements).toContain("pm.financial_operations");
    expect(entitlements).toContain("pm.residents");
    expect(entitlements).toContain("platform.documents");
    expect(entitlements).not.toContain("facility.operations");
    expect(entitlements).not.toContain("facility.assets");
    expect(
      memberAllowsWorkSurface({
        sku: "mpa_complete_platform",
        storedScope: "property_operations",
        surface: "facility"
      })
    ).toBe(false);
  });

  it("Complete + facility_operations drops PM finance and tenant-desk entitlements", () => {
    const entitlements = entitlementsForMember({
      sku: "mpa_complete_platform",
      roles: ["property_manager"],
      storedScope: "facility_operations"
    });
    expect(entitlements).toContain("facility.operations");
    expect(entitlements).toContain("facility.assets");
    expect(entitlements).toContain("platform.documents");
    expect(entitlements).not.toContain("pm.financial_operations");
    expect(entitlements).not.toContain("pm.portal_tenant");
    expect(entitlements).not.toContain("pm.residents");
    expect(
      memberAllowsWorkSurface({
        sku: "mpa_complete_platform",
        storedScope: "facility_operations",
        surface: "residential"
      })
    ).toBe(false);
  });

  it("requires an explicit Complete invite scope and rejects leasing + Facility", () => {
    expect(
      validateInviteOperatingScope({
        sku: "mpa_complete_platform",
        roles: ["property_manager"],
        storedScope: null
      }).ok
    ).toBe(false);
    expect(
      validateInviteOperatingScope({
        sku: "mpa_complete_platform",
        roles: ["leasing_agent"],
        storedScope: "facility_operations"
      }).ok
    ).toBe(false);
    expect(
      validateInviteOperatingScope({
        sku: "mpa_complete_platform",
        roles: ["property_manager"],
        storedScope: "facility_operations"
      })
    ).toEqual({ ok: true, scope: "facility_operations" });
  });

  it("blocks removing the last Complete BOTH admin", () => {
    expect(
      wouldLeaveCompleteWithoutBothAdmin({
        sku: "mpa_complete_platform",
        admins: [{ id: "a1", roles: ["organization_admin"], storedScope: "both" }],
        targetMembershipId: "a1",
        nextScope: "facility_operations"
      })
    ).toBe(true);
    expect(
      wouldLeaveCompleteWithoutBothAdmin({
        sku: "mpa_complete_platform",
        admins: [
          { id: "a1", roles: ["organization_admin"], storedScope: "both" },
          { id: "a2", roles: ["organization_admin"], storedScope: "both" }
        ],
        targetMembershipId: "a1",
        nextScope: "facility_operations"
      })
    ).toBe(false);
  });

  it("stores SKU-implied scope for new founding memberships", () => {
    expect(storedScopeForNewMembership("mpa_property_manager")).toBe("property_operations");
    expect(storedScopeForNewMembership("mpa_facility_operations")).toBe("facility_operations");
    expect(storedScopeForNewMembership("mpa_complete_platform")).toBe("both");
  });

  it("treats unassigned Complete admin as both", () => {
    expect(
      resolveMemberOperatingScope({
        sku: "mpa_complete_platform",
        roles: ["organization_admin"],
        storedScope: null
      })
    ).toBe("both");
  });
});
