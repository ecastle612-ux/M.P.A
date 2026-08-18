import { describe, expect, it } from "vitest";
import {
  buildCompleteLauncherPriorities,
  buildCompleteWorkspaceHandoffs,
  completeLauncherEmptyGuidance,
  completeWorkspaceLabels,
  missionControlNavLabelForSku,
  navigationGroupTitleForSku
} from "./complete-launcher";
import { navigationGroupsForSku } from "./modules";
import { resolveProductWorkspaceHome } from "../auth/post-auth-home";

describe("Complete Platform launcher (PPS1-006)", () => {
  it("routes Complete home to launcher via shared resolver", () => {
    expect(resolveProductWorkspaceHome("mpa_complete_platform")).toBe("/launcher");
  });

  it("uses Property/Facility Operations labels for Complete navigation", () => {
    expect(navigationGroupTitleForSku("property_manager", "mpa_complete_platform")).toBe(
      "Property Operations"
    );
    expect(navigationGroupTitleForSku("property_manager", "mpa_property_manager")).toBe(
      "Property Manager"
    );
    expect(missionControlNavLabelForSku("property", "mpa_complete_platform")).toBe(
      "Mission Control"
    );
    expect(missionControlNavLabelForSku("facility", "mpa_complete_platform")).toBe(
      "Mission Control"
    );
    expect(missionControlNavLabelForSku("property", "mpa_property_manager")).toBe(
      "Mission Control"
    );
    expect(missionControlNavLabelForSku("facility", "mpa_facility_operations")).toBe(
      "Mission Control"
    );
    expect(navigationGroupTitleForSku("home", "mpa_complete_platform")).toBe("Complete Platform");
    expect(navigationGroupTitleForSku("shared", "mpa_complete_platform")).toBe(
      "Shared across capabilities"
    );
  });

  it("builds workspace handoffs to PM and FO Mission Controls", () => {
    const handoffs = buildCompleteWorkspaceHandoffs("mpa_complete_platform");
    expect(handoffs).toHaveLength(2);
    expect(handoffs[0]?.href).toBe("/pm/mission-control");
    expect(handoffs[1]?.href).toBe("/facility/mission-control");
    expect(handoffs[0]?.title).toBe("Property Operations");
    expect(handoffs[1]?.title).toBe("Facility Operations");
    expect(handoffs.map((item) => item.title).join(" ")).not.toMatch(/PM Module|FO Module/i);
  });

  it("keeps both Complete handoffs for org-admin / both-surface members", () => {
    const handoffs = buildCompleteWorkspaceHandoffs("mpa_complete_platform", {
      roles: ["organization_admin"],
      storedScope: "both"
    });
    expect(handoffs.map((item) => item.id)).toEqual(["property_operations", "facility_operations"]);
  });

  it("hides Facility handoff for Complete PM-only scoped members", () => {
    const handoffs = buildCompleteWorkspaceHandoffs("mpa_complete_platform", {
      roles: ["property_manager"],
      storedScope: "property_operations"
    });
    expect(handoffs.map((item) => item.id)).toEqual(["property_operations"]);
    expect(handoffs.some((item) => item.href === "/facility/mission-control")).toBe(false);
  });

  it("hides Property handoff for Complete FO-only scoped members", () => {
    const handoffs = buildCompleteWorkspaceHandoffs("mpa_complete_platform", {
      roles: ["property_manager"],
      storedScope: "facility_operations"
    });
    expect(handoffs.map((item) => item.id)).toEqual(["facility_operations"]);
    expect(handoffs.some((item) => item.href === "/pm/mission-control")).toBe(false);
  });

  it("does not invent a Facility handoff on a Property Manager SKU", () => {
    expect(buildCompleteWorkspaceHandoffs("mpa_property_manager").map((item) => item.id)).toEqual([
      "property_operations"
    ]);
  });

  it("agrees with sidebar surfaces for Complete scoped members", () => {
    const roles = ["property_manager"] as const;
    for (const storedScope of ["property_operations", "facility_operations", "both"] as const) {
      const handoffs = buildCompleteWorkspaceHandoffs("mpa_complete_platform", {
        roles,
        storedScope
      });
      const groups = navigationGroupsForSku("mpa_complete_platform", roles, storedScope);
      expect(handoffs.some((item) => item.id === "property_operations")).toBe(
        groups.some((group) => group.id === "property_manager")
      );
      expect(handoffs.some((item) => item.id === "facility_operations")).toBe(
        groups.some((group) => group.id === "facility_operations")
      );
    }
  });

  it("does not invent a Property handoff on a Facility Operations SKU", () => {
    expect(buildCompleteWorkspaceHandoffs("mpa_facility_operations").map((item) => item.id)).toEqual([
      "facility_operations"
    ]);
  });

  it("surfaces authoritative PM + FO priorities without fabricating counts", () => {
    const priorities = buildCompleteLauncherPriorities({
      pm: {
        propertyCount: 2,
        dailyOperations: {
          briefing: {
            immediateCount: 1,
            waitingOnMeCount: 2,
            waitingOnOthersCount: 0,
            firstTask: "Approve an application"
          },
          openMaintenance: [
            { id: "wo1", title: "No heat", priority: "emergency", href: "/pm/maintenance" }
          ]
        }
      },
      fo: {
        todayOpen: 1,
        emergency: 2,
        open: 4,
        overdue: 1,
        waitingOnTechnician: 1,
        waitingOnVendor: 1
      }
    });

    expect(priorities.some((item) => item.id === "pm_immediate")).toBe(true);
    expect(priorities.some((item) => item.id === "fo_emergency")).toBe(true);
    expect(priorities.find((item) => item.id === "fo_emergency")?.label).toMatch(/^2 /);
    expect(priorities.find((item) => item.id === "fo_waiting")?.detail).toMatch(/1 technician/);
  });

  it("empty state points to first property when portfolio is empty", () => {
    const empty = completeLauncherEmptyGuidance({ propertyCount: 0, foOpen: 0 });
    expect(empty?.href).toBe(completeWorkspaceLabels().addPropertyHref);
    expect(empty?.title).toMatch(/first property/i);

    const priorities = buildCompleteLauncherPriorities({
      pm: { propertyCount: 0 },
      fo: {
        todayOpen: 0,
        emergency: 0,
        open: 0,
        overdue: 0,
        waitingOnTechnician: 0,
        waitingOnVendor: 0
      }
    });
    expect(priorities[0]?.href).toBe("/pm/properties?new=1");
  });

  it("does not invent FO priorities when FO brief is null", () => {
    const priorities = buildCompleteLauncherPriorities({
      pm: { propertyCount: 1, nextAction: { title: "Review leases", detail: "x", href: "/pm/leasing" } },
      fo: null
    });
    expect(priorities.every((item) => item.workspace === "property_operations")).toBe(true);
  });
});
