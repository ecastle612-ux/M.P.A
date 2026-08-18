import { describe, expect, it } from "vitest";
import { MASTER_ADMIN_NAV } from "./master-admin";
import { navigationGroupsForSku, type NavGroup } from "./modules";
import {
  completeSurfaceOptions,
  isNavItemActive,
  isTechnicianOnlyStaff,
  navCandidatesFromGroups,
  navIconForHref,
  presentMasterAdminNav,
  presentNavigationGroups,
  sidebarClickCountToHref,
  surfaceLabelForPath
} from "./nav-presentation";

const FO_EFF_ITEMS: NavGroup = {
  id: "facility_operations",
  title: "Facility Operations",
  product: "facility_operations",
  items: [
    { href: "/facility/mission-control", label: "Mission Control", readiness: "aligned", entitlement: "facility.mission_control" },
    { href: "/facility/my-work", label: "My Work", readiness: "aligned", entitlement: "facility.operations" },
    { href: "/facility/operations", label: "Operations", readiness: "aligned", entitlement: "facility.operations" },
    { href: "/facility/settings/work-templates", label: "Work Templates", readiness: "aligned", entitlement: "facility.operations" },
    { href: "/facility/settings/request-forms", label: "Request Forms", readiness: "aligned", entitlement: "facility.operations" }
  ]
};

function hrefsOf(groups: ReturnType<typeof presentNavigationGroups>): string[] {
  return navCandidatesFromGroups(groups);
}

describe("nav presentation — grouping and icons", () => {
  it("groups Property Manager destinations without changing entitled hrefs", () => {
    const source = navigationGroupsForSku("mpa_property_manager", ["property_manager"]);
    const presented = presentNavigationGroups(source, { roles: ["property_manager"] });
    const sourceHrefs = navCandidatesFromGroups(source).sort();
    expect(hrefsOf(presented).sort()).toEqual(sourceHrefs);

    const sectionTitles = presented.flatMap((group) => group.sections.map((section) => section.title));
    expect(sectionTitles).toContain("Overview");
    expect(sectionTitles).toContain("Portfolio");
    expect(sectionTitles).toContain("Finance");
    expect(sectionTitles).toContain("Partners");
    expect(sectionTitles).toContain("Manage");

    const finance = presented.flatMap((group) => group.sections).find((section) => section.id === "finance");
    expect(finance?.items.map((item) => item.href)).toEqual(["/pm/financial-operations"]);
    expect(navIconForHref("/pm/properties")).toBe("properties");
    expect(navIconForHref("/pm/financial-operations")).toBe("financialOperations");
  });

  it("groups Facility destinations and maps FO-eff settings routes", () => {
    const source = navigationGroupsForSku("mpa_facility_operations", ["organization_admin"]);
    const presented = presentNavigationGroups(source, { roles: ["organization_admin"] });
    expect(hrefsOf(presented).sort()).toEqual(navCandidatesFromGroups(source).sort());
    expect(hrefsOf(presented)).toContain("/facility/operations");
    expect(hrefsOf(presented)).not.toContain("/pm/properties");

    const presentedEff = presentNavigationGroups([FO_EFF_ITEMS], { roles: ["organization_admin"] });
    const work = presentedEff[0]?.sections.find((section) => section.id === "work");
    const facilities = presentedEff[0]?.sections.find((section) => section.id === "facilities");
    expect(work?.items.map((item) => item.label)).toEqual(["My Work", "Operations"]);
    expect(facilities?.items.map((item) => item.label)).toEqual(["Work Templates", "Request Forms"]);
    expect(navIconForHref("/facility/my-work")).toBe("myWork");
    expect(navIconForHref("/facility/settings/request-forms")).toBe("requestForms");
    expect(navIconForHref("/facility/settings/work-templates")).toBe("workTemplates");
    expect(navIconForHref("/facility/settings/assignment-rules")).toBe("settings");
  });

  it("keeps technician sidebar dramatically simpler than manager sidebar", () => {
    const source = navigationGroupsForSku("mpa_facility_operations", ["maintenance_technician"]);
    const presented = presentNavigationGroups(source, { roles: ["maintenance_technician"] });
    const hrefs = hrefsOf(presented);
    expect(isTechnicianOnlyStaff(["maintenance_technician"])).toBe(true);
    expect(hrefs).toContain("/facility/operations");
    expect(hrefs).not.toContain("/facility/preventive-maintenance");
    expect(hrefs).not.toContain("/facility/settings/assignment-rules");
    expect(hrefs).not.toContain("/facility/inspections");
    expect(hrefs).not.toContain("/facility/reports");
    expect(hrefs).not.toContain("/facility/vendors");
    expect(hrefs).not.toContain("/settings/team");

    const withMyWork = presentNavigationGroups([FO_EFF_ITEMS], { roles: ["maintenance_technician"] });
    expect(hrefsOf(withMyWork)).toEqual(["/facility/my-work", "/facility/operations"]);
  });

  it("does not simplify a manager who also holds technician", () => {
    expect(isTechnicianOnlyStaff(["organization_admin", "maintenance_technician"])).toBe(false);
    const source = navigationGroupsForSku("mpa_facility_operations", [
      "organization_admin",
      "maintenance_technician"
    ]);
    const presented = presentNavigationGroups(source, {
      roles: ["organization_admin", "maintenance_technician"]
    });
    expect(hrefsOf(presented)).toContain("/facility/vendors");
  });
});

describe("nav presentation — Complete surfaces and docs/202 scope", () => {
  it("exposes both surfaces for unscope Complete and hides the other when scoped", () => {
    const both = navigationGroupsForSku("mpa_complete_platform", ["organization_admin"]);
    expect(completeSurfaceOptions(both).map((option) => option.id)).toEqual(["property", "facility"]);

    const pmOnly = navigationGroupsForSku(
      "mpa_complete_platform",
      ["property_manager"],
      "property_operations"
    );
    expect(completeSurfaceOptions(pmOnly).map((option) => option.id)).toEqual(["property"]);
    expect(navCandidatesFromGroups(pmOnly).some((href) => href.startsWith("/facility/"))).toBe(false);

    const foOnly = navigationGroupsForSku(
      "mpa_complete_platform",
      ["property_manager"],
      "facility_operations"
    );
    expect(completeSurfaceOptions(foOnly).map((option) => option.id)).toEqual(["facility"]);
    expect(navCandidatesFromGroups(foOnly).some((href) => href.startsWith("/pm/"))).toBe(false);
  });

  it("labels the current surface without exposing organization ids", () => {
    const both = completeSurfaceOptions(
      navigationGroupsForSku("mpa_complete_platform", ["organization_admin"])
    );
    expect(surfaceLabelForPath("/pm/properties", "Complete Platform", both)).toBe("Property Operations");
    expect(surfaceLabelForPath("/facility/operations", "Complete Platform", both)).toBe(
      "Facility Operations"
    );
    expect(surfaceLabelForPath("/pm/properties", "Complete Platform", both)).not.toMatch(
      /[0-9a-f-]{36}/i
    );
  });
});

describe("nav presentation — active state", () => {
  it("activates nested PM finance, FO my-work, and FO settings parents", () => {
    const candidates = [
      "/pm/financial-operations",
      "/facility/my-work",
      "/facility/settings/request-forms",
      "/facility/settings/work-templates",
      "/facility/operations",
      "/admin",
      "/admin/support"
    ];
    expect(isNavItemActive("/pm/financial-operations/online-payments", "/pm/financial-operations", candidates)).toBe(
      true
    );
    expect(isNavItemActive("/facility/my-work/assigned/wo-1", "/facility/my-work", candidates)).toBe(true);
    expect(
      isNavItemActive("/facility/settings/request-forms/form-1", "/facility/settings/request-forms", candidates)
    ).toBe(true);
    expect(
      isNavItemActive("/facility/settings/request-forms/form-1", "/facility/settings/work-templates", candidates)
    ).toBe(false);
    expect(isNavItemActive("/admin/support", "/admin", candidates)).toBe(false);
    expect(isNavItemActive("/admin", "/admin", candidates)).toBe(true);
    expect(isNavItemActive("/admin/support", "/admin/support", candidates)).toBe(true);
  });
});

describe("nav presentation — click counts", () => {
  it("keeps common manager and technician destinations at one click", () => {
    const pm = navigationGroupsForSku("mpa_property_manager", ["property_manager"]);
    expect(sidebarClickCountToHref({ href: "/pm/properties", groups: pm, roles: ["property_manager"] })).toEqual({
      clicks: 1,
      available: true,
      via: "sidebar"
    });
    expect(
      sidebarClickCountToHref({ href: "/pm/financial-operations", groups: pm, roles: ["property_manager"] })
    ).toEqual({ clicks: 1, available: true, via: "sidebar" });

    const fo = navigationGroupsForSku("mpa_facility_operations", ["organization_admin"]);
    expect(sidebarClickCountToHref({ href: "/facility/operations", groups: fo })).toMatchObject({
      clicks: 1,
      available: true
    });

    const complete = navigationGroupsForSku("mpa_complete_platform", ["organization_admin"]);
    expect(
      sidebarClickCountToHref({
        href: "/facility/mission-control",
        groups: complete,
        fromPathname: "/pm/mission-control"
      })
    ).toMatchObject({ clicks: 1, available: true });

    const tech = presentNavigationGroups([FO_EFF_ITEMS], { roles: ["maintenance_technician"] });
    expect(hrefsOf(tech)[0]).toBe("/facility/my-work");
    expect(
      sidebarClickCountToHref({
        href: "/facility/my-work",
        groups: [FO_EFF_ITEMS],
        roles: ["maintenance_technician"]
      })
    ).toMatchObject({ clicks: 1, available: true });

    expect(
      sidebarClickCountToHref({
        href: "/facility/settings/request-forms",
        groups: [FO_EFF_ITEMS],
        roles: ["organization_admin"]
      })
    ).toMatchObject({ clicks: 1, available: true });
    expect(
      sidebarClickCountToHref({
        href: "/facility/settings/work-templates",
        groups: [FO_EFF_ITEMS],
        roles: ["organization_admin"]
      })
    ).toMatchObject({ clicks: 1, available: true });
  });

  it("does not invent PM destinations for Facility-only SKU", () => {
    const fo = navigationGroupsForSku("mpa_facility_operations");
    expect(sidebarClickCountToHref({ href: "/pm/financial-operations", groups: fo }).available).toBe(false);
  });
});

describe("nav presentation — Master Admin", () => {
  it("presents operator destinations only", () => {
    const presented = presentMasterAdminNav(MASTER_ADMIN_NAV, "/admin/commercial/billing");
    const hrefs = hrefsOf(presented);
    expect(hrefs.every((href) => href.startsWith("/admin"))).toBe(true);
    expect(hrefs).not.toContain("/pm/mission-control");
    expect(hrefs).toContain("/admin/commercial/complimentary-access");
    expect(isNavItemActive("/admin/commercial/billing", "/admin/commercial/billing", hrefs)).toBe(true);
  });
});
