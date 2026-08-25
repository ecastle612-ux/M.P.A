import { describe, expect, it } from "vitest";
import { entitlementsForMember } from "../auth/operating-scope";
import { MASTER_ADMIN_NAV } from "../commercial/master-admin";
import { navigationGroupsForSku } from "../commercial/modules";
import { presentMasterAdminNav, presentNavigationGroups } from "../commercial/nav-presentation";
import { entitlementsForSku, hasEntitlement } from "../commercial/entitlements";
import { requiredEntitlementForApiPath, requiredEntitlementForPath } from "../commercial/route-entitlements";
import { authorizedQuickCreateActions } from "../simplicity/quick-create";
import { authorizedSearchDomains } from "../simplicity/search";
import { memberCanAdministerAssignmentRules } from "./assignment-routing";

function actor(input: {
  sku: "mpa_property_manager" | "mpa_facility_operations" | "mpa_complete_platform";
  roles: string[];
  storedScope?: "property_operations" | "facility_operations" | "both" | null;
}) {
  return {
    sku: input.sku,
    roles: input.roles,
    storedScope: input.storedScope ?? null,
    entitlements: entitlementsForMember({
      sku: input.sku,
      roles: input.roles,
      storedScope: input.storedScope ?? null
    }),
    userId: "user-1"
  };
}

describe("FO-EFF Slice 6 — entitlement, nav, search, Quick Create", () => {
  it("grants facility.routing to FO managers and denies technicians", () => {
    expect(hasEntitlement(entitlementsForSku("mpa_facility_operations"), "facility.routing")).toBe(true);
    expect(hasEntitlement(entitlementsForSku("mpa_property_manager"), "facility.routing")).toBe(false);
    expect(memberCanAdministerAssignmentRules(["property_manager"])).toBe(true);
    expect(memberCanAdministerAssignmentRules(["maintenance_technician"])).toBe(false);
    expect(
      entitlementsForMember({ sku: "mpa_facility_operations", roles: ["property_manager"] })
    ).toContain("facility.routing");
    expect(
      entitlementsForMember({ sku: "mpa_facility_operations", roles: ["maintenance_technician"] })
    ).not.toContain("facility.routing");
  });

  it("Complete SKU is not authorization — FO scope allowed, PM-only denied", () => {
    expect(
      entitlementsForMember({
        sku: "mpa_complete_platform",
        roles: ["property_manager"],
        storedScope: "facility_operations"
      })
    ).toContain("facility.routing");
    expect(
      entitlementsForMember({
        sku: "mpa_complete_platform",
        roles: ["property_manager"],
        storedScope: "property_operations"
      })
    ).not.toContain("facility.routing");
    expect(
      entitlementsForMember({
        sku: "mpa_complete_platform",
        roles: ["property_manager"],
        storedScope: "both"
      })
    ).toContain("facility.routing");
  });

  it("maps Assignment Rules pages and APIs to facility.routing", () => {
    expect(requiredEntitlementForPath("/facility/settings/assignment-rules")).toBe("facility.routing");
    expect(requiredEntitlementForApiPath("/api/facility/assignment-rules")).toBe("facility.routing");
    expect(requiredEntitlementForApiPath("/api/facility/assignment-rules/preview")).toBe("facility.routing");
    expect(requiredEntitlementForApiPath("/api/facility/assignment-rules/rerun")).toBe("facility.routing");
  });

  it("places Assignment Rules in Facilities/Manage, not the technician rail", () => {
    const fo = presentNavigationGroups(navigationGroupsForSku("mpa_facility_operations", ["organization_admin"]), {
      roles: ["organization_admin"]
    });
    const facilities = fo.flatMap((group) => group.sections).find((section) => section.id === "facilities");
    expect(facilities?.items.some((item) => item.href === "/facility/settings/assignment-rules")).toBe(true);

    const tech = presentNavigationGroups(
      navigationGroupsForSku("mpa_facility_operations", ["maintenance_technician"]),
      { roles: ["maintenance_technician"] }
    );
    expect(
      tech
        .flatMap((group) => group.sections.flatMap((section) => section.items))
        .some((item) => item.href === "/facility/settings/assignment-rules")
    ).toBe(false);

    const pmOnly = presentNavigationGroups(
      navigationGroupsForSku("mpa_complete_platform", ["organization_admin"], "property_operations"),
      { roles: ["organization_admin"] }
    );
    expect(
      pmOnly
        .flatMap((group) => group.sections.flatMap((section) => section.items))
        .some((item) => item.href === "/facility/settings/assignment-rules")
    ).toBe(false);

    const admin = presentMasterAdminNav(MASTER_ADMIN_NAV, "/admin");
    expect(
      admin
        .flatMap((group) => group.sections.flatMap((section) => section.items))
        .some((item) => item.href === "/facility/settings/assignment-rules")
    ).toBe(false);
  });

  it("does not add Assignment Rules to Search or Quick Create", () => {
    const manager = actor({ sku: "mpa_facility_operations", roles: ["property_manager"] });
    expect(authorizedSearchDomains(manager)).not.toContain("assignment_rule");
    expect(authorizedQuickCreateActions(manager).map((row) => row.id)).not.toContain("fo_assignment_rule");
    expect(authorizedQuickCreateActions(manager).map((row) => row.href)).not.toContain(
      "/facility/settings/assignment-rules?new=1"
    );
  });
});
