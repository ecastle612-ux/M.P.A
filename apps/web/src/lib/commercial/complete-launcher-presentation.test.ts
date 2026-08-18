import { describe, expect, it } from "vitest";
import {
  entitlementsForSku,
  hasEntitlement,
  navigationGroupsForSku,
  resolveProductWorkspaceHome,
  workspaceLauncherItemsForSku
} from "@mpa/shared";
import {
  buildCompleteLauncherViewModel,
  foBriefFromMissionControlApi,
  pmBriefFromMissionControlApi,
  priorityBadgeVariant,
  workspaceSectionLabel
} from "./complete-launcher-presentation";

describe("Complete launcher presentation (PPS1-006)", () => {
  it("maps Complete home to /launcher and preserves PM/FO deep-links", () => {
    expect(resolveProductWorkspaceHome("mpa_complete_platform")).toBe("/launcher");
    const view = buildCompleteLauncherViewModel({
      sku: "mpa_complete_platform",
      pmBody: {
        propertyCount: 1,
        nextAction: {
          title: "Review leases",
          detail: "One lease needs attention",
          href: "/pm/leasing"
        }
      },
      foBody: {
        snapshot: {
          todayOpen: 2,
          emergency: 0,
          open: 2,
          overdue: 0,
          waitingOnTechnician: 0,
          waitingOnVendor: 0
        }
      },
      pmError: null,
      foError: null
    });

    expect(view.handoffs.map((item) => item.href)).toEqual([
      "/pm/mission-control",
      "/facility/mission-control"
    ]);
    expect(view.handoffs.map((item) => item.title).join(" ")).not.toMatch(/PM Module|FO Module/i);
    expect(view.facilityPriorities[0]?.href).toMatch(/^\/facility\//);
  });

  it("renders empty-state guidance to first property when portfolio is empty", () => {
    const view = buildCompleteLauncherViewModel({
      sku: "mpa_complete_platform",
      pmBody: { propertyCount: 0 },
      foBody: {
        snapshot: {
          todayOpen: 0,
          emergency: 0,
          open: 0,
          overdue: 0,
          waitingOnTechnician: 0,
          waitingOnVendor: 0
        }
      },
      pmError: null,
      foError: null
    });

    expect(view.emptyGuidance?.href).toBe("/pm/properties?new=1");
    expect(view.emptyGuidance?.title).toMatch(/first property/i);
    expect(view.priorities[0]?.href).toBe("/pm/properties?new=1");
  });

  it("ignores incomplete API payloads instead of inventing metrics", () => {
    expect(pmBriefFromMissionControlApi({})).toBeNull();
    expect(foBriefFromMissionControlApi({})).toBeNull();
    const view = buildCompleteLauncherViewModel({
      sku: "mpa_complete_platform",
      pmBody: null,
      foBody: null,
      pmError: "pm failed",
      foError: null
    });
    expect(view.priorities).toHaveLength(0);
    expect(view.loadErrors).toContain("pm failed");
  });

  it("keeps Complete navigation entitled and Property/Facility labeled", () => {
    const groups = navigationGroupsForSku("mpa_complete_platform", ["organization_admin"]);
    expect(groups.find((group) => group.id === "home")?.title).toBe("Complete Platform");
    expect(groups.find((group) => group.id === "property_manager")?.title).toBe(
      "Property Operations"
    );
    expect(groups.find((group) => group.id === "facility_operations")?.title).toBe(
      "Facility Operations"
    );

    const entitlements = entitlementsForSku("mpa_complete_platform");
    expect(hasEntitlement(entitlements, "platform.launcher")).toBe(true);
    expect(hasEntitlement(entitlements, "pm.mission_control")).toBe(true);
    expect(hasEntitlement(entitlements, "facility.mission_control")).toBe(true);

    const launcher = workspaceLauncherItemsForSku("mpa_complete_platform");
    expect(launcher.find((item) => item.id === "pm_mc")?.title).toBe("Property Operations");
    expect(launcher.find((item) => item.id === "fac_mc")?.title).toBe("Facility Operations");
  });

  it("hides Facility handoff and empty-guidance CTA for Complete PM-only scope", () => {
    const view = buildCompleteLauncherViewModel({
      sku: "mpa_complete_platform",
      storedScope: "property_operations",
      roles: ["property_manager"],
      pmBody: { propertyCount: 1 },
      foBody: {
        snapshot: {
          todayOpen: 2,
          emergency: 1,
          open: 2,
          overdue: 0,
          waitingOnTechnician: 0,
          waitingOnVendor: 0
        }
      },
      pmError: null,
      foError: "Forbidden"
    });

    expect(view.handoffs.map((item) => item.id)).toEqual(["property_operations"]);
    expect(view.handoffs.some((item) => item.href.startsWith("/facility/"))).toBe(false);
    expect(view.facilityPriorities).toHaveLength(0);
    expect(view.loadErrors).toHaveLength(0);
    expect(view.emptyGuidance?.href ?? "").not.toMatch(/^\/facility\//);
  });

  it("hides Property handoff and first-property CTA for Complete FO-only scope", () => {
    const view = buildCompleteLauncherViewModel({
      sku: "mpa_complete_platform",
      storedScope: "facility_operations",
      roles: ["property_manager"],
      pmBody: { propertyCount: 0 },
      foBody: {
        snapshot: {
          todayOpen: 0,
          emergency: 0,
          open: 0,
          overdue: 0,
          waitingOnTechnician: 0,
          waitingOnVendor: 0
        }
      },
      pmError: "Forbidden",
      foError: null
    });

    expect(view.handoffs.map((item) => item.id)).toEqual(["facility_operations"]);
    expect(view.handoffs.some((item) => item.href.startsWith("/pm/"))).toBe(false);
    expect(view.propertyPriorities).toHaveLength(0);
    expect(view.loadErrors).toHaveLength(0);
    expect(view.emptyGuidance?.href).toBe("/facility/mission-control");
    expect(view.emptyGuidance?.detail ?? "").not.toMatch(/either workspace/i);
  });

  it("maps priority tone and workspace section labels", () => {
    expect(priorityBadgeVariant("critical")).toBe("danger");
    expect(priorityBadgeVariant("watch")).toBe("warning");
    expect(workspaceSectionLabel("property_operations")).toBe("Property Operations");
    expect(workspaceSectionLabel("facility_operations")).toBe("Facility Operations");
  });
});
