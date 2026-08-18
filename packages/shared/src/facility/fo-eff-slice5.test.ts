import { describe, expect, it } from "vitest";
import { entitlementsForMember } from "../auth/operating-scope";
import { MASTER_ADMIN_NAV } from "../commercial/master-admin";
import { navigationGroupsForSku } from "../commercial/modules";
import { presentMasterAdminNav, presentNavigationGroups } from "../commercial/nav-presentation";
import { entitlementsForSku, hasEntitlement } from "../commercial/entitlements";
import { requiredEntitlementForApiPath } from "../commercial/route-entitlements";
import { authorizedQuickCreateActions, contextualPreventivePlanHref } from "../simplicity/quick-create";
import { authorizedSearchDomains } from "../simplicity/search";
import { parseRecentItemsJson } from "../simplicity/recent-items";
import { buildFacilityAttentionSections } from "./mission-control-attention";
import { FACILITY_REQUEST_INTAKE_CHANNELS } from "./request-forms";
import {
  memberCanAdministerPreventiveMaintenance,
  staffPmPlanHref,
  workOrderOriginLabel
} from "./preventive-maintenance";

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

describe("FO-EFF Slice 5 — entitlement, nav, search, attention", () => {
  it("reuses facility.preventive for FO managers and denies technicians", () => {
    expect(hasEntitlement(entitlementsForSku("mpa_facility_operations"), "facility.preventive")).toBe(true);
    expect(hasEntitlement(entitlementsForSku("mpa_property_manager"), "facility.preventive")).toBe(false);
    expect(memberCanAdministerPreventiveMaintenance(["property_manager"])).toBe(true);
    expect(memberCanAdministerPreventiveMaintenance(["maintenance_technician"])).toBe(false);
    expect(
      entitlementsForMember({ sku: "mpa_facility_operations", roles: ["property_manager"] })
    ).toContain("facility.preventive");
    expect(
      entitlementsForMember({ sku: "mpa_facility_operations", roles: ["maintenance_technician"] })
    ).not.toContain("facility.preventive");
  });

  it("Complete SKU is not authorization — FO scope allowed, PM-only denied", () => {
    expect(
      entitlementsForMember({
        sku: "mpa_complete_platform",
        roles: ["property_manager"],
        storedScope: "facility_operations"
      })
    ).toContain("facility.preventive");
    expect(
      entitlementsForMember({
        sku: "mpa_complete_platform",
        roles: ["property_manager"],
        storedScope: "property_operations"
      })
    ).not.toContain("facility.preventive");
    expect(
      entitlementsForMember({
        sku: "mpa_complete_platform",
        roles: ["property_manager"],
        storedScope: "both"
      })
    ).toContain("facility.preventive");
  });

  it("maps the PM API to facility.preventive without overloading public intake", () => {
    expect(requiredEntitlementForApiPath("/api/facility/preventive-maintenance")).toBe("facility.preventive");
    expect(requiredEntitlementForApiPath("/api/facility/preventive-maintenance/generate")).toBe(
      "facility.preventive"
    );
    expect(FACILITY_REQUEST_INTAKE_CHANNELS).not.toContain("preventive");
  });

  it("keeps Preventive Maintenance in the Facilities rail and hides it from technicians", () => {
    const fo = presentNavigationGroups(navigationGroupsForSku("mpa_facility_operations", ["organization_admin"]), {
      roles: ["organization_admin"]
    });
    const facilities = fo.flatMap((group) => group.sections).find((section) => section.id === "facilities");
    expect(facilities?.items.some((item) => item.href === "/facility/preventive-maintenance")).toBe(true);

    const tech = presentNavigationGroups(
      navigationGroupsForSku("mpa_facility_operations", ["maintenance_technician"]),
      { roles: ["maintenance_technician"] }
    );
    expect(
      tech
        .flatMap((group) => group.sections.flatMap((section) => section.items))
        .some((item) => item.href === "/facility/preventive-maintenance")
    ).toBe(false);

    const pmOnly = presentNavigationGroups(
      navigationGroupsForSku("mpa_complete_platform", ["organization_admin"], "property_operations"),
      { roles: ["organization_admin"] }
    );
    expect(
      pmOnly
        .flatMap((group) => group.sections.flatMap((section) => section.items))
        .some((item) => item.href === "/facility/preventive-maintenance")
    ).toBe(false);

    const admin = presentMasterAdminNav(MASTER_ADMIN_NAV, "/admin");
    expect(
      admin
        .flatMap((group) => group.sections.flatMap((section) => section.items))
        .some((item) => item.href === "/facility/preventive-maintenance")
    ).toBe(false);
  });

  it("lets managers search and quick-create PM plans; technicians cannot", () => {
    const manager = actor({ sku: "mpa_facility_operations", roles: ["property_manager"] });
    expect(authorizedSearchDomains(manager)).toContain("pm_plan");
    expect(authorizedQuickCreateActions(manager).map((row) => row.id)).toContain("fo_pm_plan");
    expect(staffPmPlanHref("plan-1")).toBe("/facility/preventive-maintenance?planId=plan-1");
    expect(contextualPreventivePlanHref({ facilityAssetId: "asset-1" })).toBe(
      "/facility/preventive-maintenance?new=1&facilityAssetId=asset-1"
    );

    const technician = actor({ sku: "mpa_facility_operations", roles: ["maintenance_technician"] });
    expect(authorizedSearchDomains(technician)).not.toContain("pm_plan");
    expect(authorizedQuickCreateActions(technician)).toEqual([]);
  });

  it("accepts pm_plan Recent refs without treating Recent as authorization", () => {
    expect(parseRecentItemsJson(`[{"type":"pm_plan","id":"p1","viewedAt":"t"}]`)).toEqual([
      { type: "pm_plan", id: "p1", viewedAt: "t" }
    ]);
  });

  it("surfaces generated PM work through existing Mission Control attention, not a second dashboard", () => {
    const now = new Date("2026-08-18T15:00:00.000Z");
    const sections = buildFacilityAttentionSections(
      [
        {
          id: "wo-overdue",
          title: "Quarterly chair inspection",
          status: "submitted",
          priority: "normal",
          assignee_type: "unassigned",
          due_at: "2026-08-17T12:00:00.000Z",
          intake_channel: "internal"
        },
        {
          id: "wo-urgent",
          title: "Roof inspection",
          status: "submitted",
          priority: "high",
          assignee_type: "technician",
          technician_user_id: "tech-1",
          due_at: "2026-08-20T12:00:00.000Z",
          intake_channel: "internal"
        },
        {
          id: "wo-unassigned",
          title: "Drain cleaning",
          status: "submitted",
          priority: "normal",
          assignee_type: "unassigned",
          intake_channel: "internal"
        },
        {
          id: "wo-due-today",
          title: "Fire door inspection",
          status: "assigned",
          priority: "normal",
          assignee_type: "technician",
          technician_user_id: "tech-1",
          due_at: "2026-08-18T18:00:00.000Z",
          intake_channel: "internal"
        }
      ],
      now
    );
    expect(sections.map((section) => section.category)).toEqual([
      "overdue",
      "urgent",
      "unassigned",
      "due_today"
    ]);
    expect(workOrderOriginLabel({ originSource: "preventive", intakeChannel: "internal" })).toBe(
      "Preventive Maintenance"
    );
  });
});
