import { describe, expect, it } from "vitest";
import { entitlementsForMember, hasEntitlement } from "@mpa/shared";
import {
  facilityMissionControlErrorMessage,
  facilityMissionControlGlanceMetrics,
  facilityMissionControlLoadView,
  facilityMissionControlQuickActions
} from "./mission-control-presentation";

function canAccessFor(
  sku: "mpa_complete_platform" | "mpa_facility_operations" | "mpa_property_manager",
  storedScope?: "property_operations" | "facility_operations" | "both"
) {
  const entitlements = entitlementsForMember({
    sku,
    roles: ["property_manager"],
    storedScope
  });
  return (entitlement: string) => hasEntitlement(entitlements, entitlement);
}

describe("facilityMissionControlLoadView (PPS1-003)", () => {
  it("shows loading skeletons only while loading", () => {
    expect(
      facilityMissionControlLoadView({ loading: true, error: null, hasSnapshot: false })
    ).toBe("loading");
    expect(
      facilityMissionControlLoadView({ loading: true, error: "x", hasSnapshot: false })
    ).toBe("loading");
  });

  it("shows error without skeleton when load failed", () => {
    expect(
      facilityMissionControlLoadView({ loading: false, error: "failed", hasSnapshot: false })
    ).toBe("error");
    expect(
      facilityMissionControlLoadView({ loading: false, error: "failed", hasSnapshot: true })
    ).toBe("error");
  });

  it("shows ready dashboard after successful load", () => {
    expect(
      facilityMissionControlLoadView({ loading: false, error: null, hasSnapshot: true })
    ).toBe("ready");
  });
});

describe("facilityMissionControlGlanceMetrics (PPS1-003)", () => {
  it("maps distinct snapshot fields to distinct cards — no duplicated values under different labels", () => {
    const metrics = facilityMissionControlGlanceMetrics({
      todayOpen: 1,
      emergency: 2,
      open: 5,
      overdue: 1,
      waitingOnTechnician: 3,
      waitingOnVendor: 4,
      completedRecently: 7
    });

    const byId = Object.fromEntries(metrics.map((metric) => [metric.id, metric]));
    expect(byId["waiting_technician"]?.value).toBe(3);
    expect(byId["waiting_vendor"]?.value).toBe(4);
    expect(byId["waiting_technician"]?.label).not.toBe(byId["waiting_vendor"]?.label);

    const waitingLabels = metrics.filter((metric) =>
      /waiting|assigned/i.test(metric.label)
    );
    const values = waitingLabels.map((metric) => metric.value);
    expect(new Set(values).size).toBe(values.length);
  });
});

describe("facilityMissionControlQuickActions (docs/201 P1-01)", () => {
  it("shows Property Operations for Complete both-surface members", () => {
    const actions = facilityMissionControlQuickActions({
      productSku: "mpa_complete_platform",
      canAccess: canAccessFor("mpa_complete_platform", "both")
    });
    expect(actions.some((action) => action.href === "/pm/mission-control")).toBe(true);
    expect(actions.some((action) => action.href === "/pm/maintenance")).toBe(true);
  });

  it("hides Property handoffs for Complete FO-only scoped members", () => {
    const actions = facilityMissionControlQuickActions({
      productSku: "mpa_complete_platform",
      canAccess: canAccessFor("mpa_complete_platform", "facility_operations")
    });
    expect(actions.some((action) => action.href.startsWith("/pm/"))).toBe(false);
    expect(actions.some((action) => action.label === "Property Operations")).toBe(false);
  });

  it("does not invent a Property handoff on a Facility Operations SKU", () => {
    const actions = facilityMissionControlQuickActions({
      productSku: "mpa_facility_operations",
      canAccess: canAccessFor("mpa_facility_operations")
    });
    expect(actions.some((action) => action.href.startsWith("/pm/"))).toBe(false);
  });
});

describe("facilityMissionControlErrorMessage", () => {
  it("does not expose implementation details", () => {
    expect(facilityMissionControlErrorMessage(new Error("relation does not exist"))).not.toMatch(
      /relation|sql|postgres/i
    );
    expect(facilityMissionControlErrorMessage(new Error("Failed to load"))).toMatch(
      /try again/i
    );
  });
});
