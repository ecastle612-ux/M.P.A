import { describe, expect, it } from "vitest";
import {
  entitlementsForSku,
  evaluatePathEntitlement,
  hasEntitlement,
  modulesForSku,
  navigationGroupsForSku,
  searchCatalogForSku,
  upgradeCuesForSku,
  workspaceLauncherItemsForSku,
  MASTER_ADMIN_NAV,
  toSkuLabel
} from "./index";

describe("commercial subscription model", () => {
  it("labels the three commercial SKUs", () => {
    expect(toSkuLabel("mpa_property_manager")).toBe("Property Manager");
    expect(toSkuLabel("mpa_facility_operations")).toBe("Facility Operations");
    expect(toSkuLabel("mpa_complete_platform")).toBe("Complete Platform");
  });

  it("grants PM entitlements without Facility modules", () => {
    const entitlements = entitlementsForSku("mpa_property_manager");
    expect(hasEntitlement(entitlements, "pm.maintenance")).toBe(true);
    expect(hasEntitlement(entitlements, "pm.financial_operations")).toBe(true);
    expect(hasEntitlement(entitlements, "facility.assets")).toBe(false);
    expect(hasEntitlement(entitlements, "platform.billing_self")).toBe(true);
  });

  it("grants Facility entitlements without PM leasing", () => {
    const entitlements = entitlementsForSku("mpa_facility_operations");
    expect(hasEntitlement(entitlements, "facility.mission_control")).toBe(true);
    expect(hasEntitlement(entitlements, "facility.assets")).toBe(true);
    expect(hasEntitlement(entitlements, "pm.leasing")).toBe(false);
    expect(hasEntitlement(entitlements, "facility.capital_projects")).toBe(false);
  });

  it("Complete Platform is the union of both products", () => {
    const entitlements = entitlementsForSku("mpa_complete_platform");
    expect(hasEntitlement(entitlements, "pm.properties")).toBe(true);
    expect(hasEntitlement(entitlements, "facility.operations")).toBe(true);
  });
});

describe("navigation and launcher awareness", () => {
  it("hides Facility nav for Property Manager SKU", () => {
    const groups = navigationGroupsForSku("mpa_property_manager");
    expect(groups.some((group) => group.id === "property_manager")).toBe(true);
    expect(groups.some((group) => group.id === "facility_operations")).toBe(false);
  });

  it("surfaces Reporting beside Documents in Shared Platform nav", () => {
    const groups = navigationGroupsForSku("mpa_property_manager");
    const shared = groups.find((group) => group.id === "shared");
    const hrefs = shared?.items.map((item) => item.href) ?? [];
    expect(hrefs).toContain("/shared/documents");
    expect(hrefs).toContain("/shared/reports");
    expect(hasEntitlement(entitlementsForSku("mpa_property_manager"), "platform.reports")).toBe(true);
  });

  it("surfaces Team beside Organization in Shared Platform nav", () => {
    const groups = navigationGroupsForSku("mpa_property_manager");
    const shared = groups.find((group) => group.id === "shared");
    const hrefs = shared?.items.map((item) => item.href) ?? [];
    expect(hrefs).toContain("/settings/organization");
    expect(hrefs).toContain("/settings/team");
  });

  it("hides staff modules leasing agents cannot execute", () => {
    const groups = navigationGroupsForSku("mpa_property_manager", ["leasing_agent"]);
    const hrefs = groups.flatMap((group) => group.items.map((item) => item.href));
    expect(hrefs).toContain("/pm/leasing");
    expect(hrefs).toContain("/pm/residents");
    expect(hrefs).not.toContain("/pm/financial-operations");
    expect(hrefs).not.toContain("/pm/vendors");
    expect(hrefs).not.toContain("/settings/team");
  });

  it("hides staff modules technicians cannot execute", () => {
    const groups = navigationGroupsForSku("mpa_property_manager", ["maintenance_technician"]);
    const hrefs = groups.flatMap((group) => group.items.map((item) => item.href));
    expect(hrefs).toContain("/pm/maintenance");
    expect(hrefs).not.toContain("/pm/leasing");
    expect(hrefs).not.toContain("/pm/financial-operations");
    expect(hrefs).not.toContain("/settings/team");
  });

  it("shows both product groups for Complete Platform", () => {
    const groups = navigationGroupsForSku("mpa_complete_platform");
    expect(groups.some((group) => group.id === "property_manager")).toBe(true);
    expect(groups.some((group) => group.id === "facility_operations")).toBe(true);
    const fo = groups.find((group) => group.id === "facility_operations");
    expect(fo?.items.map((item) => item.href)).toEqual([
      "/facility/mission-control",
      "/facility/operations",
      "/facility/assets",
      "/facility/preventive-maintenance",
      "/facility/inspections",
      "/facility/safety",
      "/facility/compliance",
      "/facility/inventory",
      "/facility/parts",
      "/facility/building-systems"
    ]);
    expect(fo?.items.every((item) => item.readiness === "aligned")).toBe(true);
  });

  it("marks Facility Operations modules aligned except Capital Projects", () => {
    const foModules = modulesForSku("mpa_facility_operations").filter(
      (module) => module.owner === "facility_operations"
    );
    expect(foModules.every((module) => module.readiness === "aligned")).toBe(true);
    expect(foModules.some((module) => module.id === "capital_projects")).toBe(false);
    expect(foModules.some((module) => module.id === "facility_operations")).toBe(true);
    expect(foModules.find((module) => module.id === "facility_operations")?.plannedLabel).toBeUndefined();
  });

  it("removes Planned labels from Facility Operations search catalog", () => {
    const results = searchCatalogForSku("mpa_facility_operations", "facility");
    expect(results.some((item) => item.href === "/facility/operations")).toBe(true);
    expect(results.every((item) => !item.label.includes("(Planned)"))).toBe(true);
  });

  it("organizes launcher workspaces by commercial product", () => {
    const items = workspaceLauncherItemsForSku("mpa_complete_platform");
    expect(items.some((item) => item.product === "property_manager")).toBe(true);
    expect(items.some((item) => item.product === "facility_operations")).toBe(true);
  });

  it("explains Complete Platform upgrade cues for PM-only", () => {
    const cues = upgradeCuesForSku("mpa_property_manager");
    expect(cues[0]?.requires).toBe("Complete Platform");
  });

  it("does not advertise unavailable modules for Complete Platform", () => {
    expect(upgradeCuesForSku("mpa_complete_platform")).toEqual([]);
  });
});

describe("module ownership boundaries", () => {
  it("does not include Facility assets under Property Manager modules", () => {
    const modules = modulesForSku("mpa_property_manager");
    expect(modules.some((module) => module.id === "assets")).toBe(false);
    expect(modules.some((module) => module.id === "maintenance")).toBe(true);
  });

  it("exposes Financial Operations foundation as aligned for PM/Complete", () => {
    const modules = modulesForSku("mpa_property_manager");
    const financial = modules.find((module) => module.id === "financial_operations");
    expect(financial?.readiness).toBe("aligned");
    expect(modulesForSku("mpa_facility_operations").some((module) => module.id === "financial_operations")).toBe(
      false
    );
  });

  it("includes Financial Operations in the Property Manager launcher", () => {
    const items = workspaceLauncherItemsForSku("mpa_property_manager");
    expect(items.some((item) => item.id === "pm_financial_operations")).toBe(true);
  });
});

describe("route entitlement enforcement", () => {
  it("denies Facility routes for Property Manager SKU", () => {
    const decision = evaluatePathEntitlement({
      pathname: "/facility/assets",
      sku: "mpa_property_manager"
    });
    expect(decision.allowed).toBe(false);
  });

  it("denies Property Manager routes for Facility SKU", () => {
    const decision = evaluatePathEntitlement({
      pathname: "/pm/leasing",
      sku: "mpa_facility_operations"
    });
    expect(decision.allowed).toBe(false);
  });

  it("allows Complete Platform both product homes", () => {
    expect(evaluatePathEntitlement({ pathname: "/pm/mission-control", sku: "mpa_complete_platform" }).allowed).toBe(
      true
    );
    expect(
      evaluatePathEntitlement({ pathname: "/facility/mission-control", sku: "mpa_complete_platform" }).allowed
    ).toBe(true);
  });

  it("keeps search catalog inside entitlements", () => {
    const results = searchCatalogForSku("mpa_property_manager", "facility");
    expect(results.every((item) => !item.href.startsWith("/facility"))).toBe(true);
  });

  it("includes launcher in no-SKU navigation", () => {
    const groups = navigationGroupsForSku(null);
    const home = groups.find((group) => group.id === "home");
    expect(home?.items.some((item) => item.href === "/launcher")).toBe(true);
  });
});

describe("master admin catalog", () => {
  it("exposes Master Admin Overview + Errors with lean Owner Ops groups", () => {
    const titles = MASTER_ADMIN_NAV.map((group) => group.title);
    expect(titles).toEqual(["Master Admin", "Operations", "Customers", "Commercial"]);

    const allHrefs = MASTER_ADMIN_NAV.flatMap((group) => group.items.map((item) => item.href));
    expect(allHrefs).toEqual([
      "/admin",
      "/admin/errors",
      "/admin/support",
      "/admin/system",
      "/admin/platform/organizations",
      "/admin/platform/customers",
      "/admin/platform/operators",
      "/admin/support/view-as",
      "/admin/commercial/billing",
      "/admin/commercial/provisioning",
      "/admin/commercial/lifecycle",
      "/admin/commercial/subscriptions",
      "/admin/commercial/checkout"
    ]);

    const maGroup = MASTER_ADMIN_NAV.find((group) => group.id === "master-admin");
    expect(maGroup?.items.map((item) => item.label)).toEqual(["Overview", "Errors"]);

    // No placeholder / future / theater surfaces in nav.
    expect(allHrefs.some((href) => href.startsWith("/admin/workspaces"))).toBe(false);
    expect(allHrefs).not.toContain("/admin/launch-readiness");
    expect(allHrefs).not.toContain("/admin/testing/demo");
    expect(allHrefs).not.toContain("/admin/testing/product-matrix");
    expect(allHrefs).not.toContain("/admin/commercial/catalog");
    expect(allHrefs).not.toContain("/admin/commercial/entitlements");
    expect(allHrefs).not.toContain("/admin/platform/capability-catalog");
  });

  it("does not expose Capital Projects or planned workspaces in Master Admin navigation", () => {
    const labels = MASTER_ADMIN_NAV.flatMap((group) => group.items.map((item) => item.label));
    expect(labels.some((label) => label.includes("Capital Projects"))).toBe(false);
    expect(labels.some((label) => label.includes("Assets"))).toBe(false);
    expect(labels).toContain("View As");
    expect(labels).toContain("Organizations");
  });

  it("allows FO routes for PM and Complete, denies Facility-only", () => {
    expect(
      evaluatePathEntitlement({ pathname: "/pm/financial-operations", sku: "mpa_property_manager" }).allowed
    ).toBe(true);
    expect(
      evaluatePathEntitlement({ pathname: "/pm/financial-operations", sku: "mpa_complete_platform" }).allowed
    ).toBe(true);
    expect(
      evaluatePathEntitlement({ pathname: "/pm/financial-operations", sku: "mpa_facility_operations" }).allowed
    ).toBe(false);
  });
});
