import { describe, expect, it } from "vitest";
import {
  entitlementsForSku,
  hasEntitlement,
  modulesForSku,
  navigationGroupsForSku,
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

  it("shows both product groups for Complete Platform", () => {
    const groups = navigationGroupsForSku("mpa_complete_platform");
    expect(groups.some((group) => group.id === "property_manager")).toBe(true);
    expect(groups.some((group) => group.id === "facility_operations")).toBe(true);
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
});

describe("module ownership boundaries", () => {
  it("does not include Facility assets under Property Manager modules", () => {
    const modules = modulesForSku("mpa_property_manager");
    expect(modules.some((module) => module.id === "assets")).toBe(false);
    expect(modules.some((module) => module.id === "maintenance")).toBe(true);
  });

  it("keeps Financial Operations as planned (not implemented)", () => {
    const modules = modulesForSku("mpa_property_manager");
    const financial = modules.find((module) => module.id === "financial_operations");
    expect(financial?.readiness).toBe("planned");
  });
});

describe("master admin catalog", () => {
  it("exposes all three products and operational areas", () => {
    const titles = MASTER_ADMIN_NAV.map((group) => group.title);
    expect(titles).toContain("Commercial Products");
    expect(titles).toContain("Commercial");
    expect(titles).toContain("Platform Administration");
    expect(titles).toContain("Testing");
    expect(titles).toContain("Operational Workspaces");

    const productLabels = MASTER_ADMIN_NAV.find((group) => group.id === "products")?.items.map((item) => item.label) ?? [];
    expect(productLabels).toEqual(["Property Manager", "Facility Operations", "Complete Platform"]);
  });

  it("does not hide planned capabilities from Master Admin", () => {
    const workspaces = MASTER_ADMIN_NAV.find((group) => group.id === "workspaces")?.items ?? [];
    expect(workspaces.some((item) => item.label.includes("Financial Operations") && item.status === "planned")).toBe(
      true
    );
    expect(workspaces.some((item) => item.label.includes("Assets") && item.status === "planned")).toBe(true);
    expect(workspaces.some((item) => item.label.includes("Capital Projects"))).toBe(true);
  });
});
