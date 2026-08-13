import { describe, expect, it } from "vitest";
import { resolveProductWorkspaceHome } from "../auth/post-auth-home";
import {
  ORGANIZATION_ADMIN_CLARITY,
  ownerDay1ChecklistForSku,
  ownerEmptyStateCopy
} from "./owner-day1";
import {
  LAUNCH_INVITE_ROLES,
  toRoleDescription,
  toRoleLabel,
  type UserRole
} from "../types/roles";

describe("owner Day-1 activation model", () => {
  it("exposes Organization Admin clarity without resident/vendor identity", () => {
    expect(ORGANIZATION_ADMIN_CLARITY.headline).toBe("You are the Organization Admin");
    expect(ORGANIZATION_ADMIN_CLARITY.manages.length).toBeGreaterThan(0);
    expect(ORGANIZATION_ADMIN_CLARITY.notThese.some((line) => /resident/i.test(line))).toBe(true);
    expect(ORGANIZATION_ADMIN_CLARITY.notThese.some((line) => /vendor/i.test(line))).toBe(true);
  });

  it("builds PM checklist with property-first Day-1 path", () => {
    const checklist = ownerDay1ChecklistForSku("mpa_property_manager");
    expect(checklist.title).toMatch(/Property Manager/i);
    expect(checklist.items.map((item) => item.id)).toEqual([
      "pm_property",
      "pm_units",
      "pm_invite",
      "pm_residents",
      "pm_workflow"
    ]);
    expect(checklist.items[0]?.href).toContain("/pm/properties");
  });

  it("builds FO checklist with building → technician → work order path", () => {
    const checklist = ownerDay1ChecklistForSku("mpa_facility_operations");
    expect(checklist.title).toMatch(/Facility Operations/i);
    expect(checklist.items.map((item) => item.id)).toEqual([
      "fo_building",
      "fo_invite",
      "fo_work_order",
      "fo_assign",
      "fo_complete"
    ]);
    expect(checklist.items[0]?.href).toBe("/facility/assets");
    expect(checklist.items[2]?.href).toBe("/facility/operations");
  });

  it("builds Complete checklist balancing property and facility workspaces", () => {
    const checklist = ownerDay1ChecklistForSku("mpa_complete_platform");
    expect(checklist.intro).toMatch(/one organization/i);
    expect(checklist.items.some((item) => item.href === "/pm/mission-control")).toBe(true);
    expect(checklist.items.some((item) => item.href === "/facility/mission-control")).toBe(true);
    expect(checklist.items.some((item) => item.href.includes("/pm/properties"))).toBe(true);
  });

  it("does not change SKU workspace routing", () => {
    expect(resolveProductWorkspaceHome("mpa_property_manager")).toBe("/pm/mission-control");
    expect(resolveProductWorkspaceHome("mpa_facility_operations")).toBe(
      "/facility/mission-control"
    );
    expect(resolveProductWorkspaceHome("mpa_complete_platform")).toBe("/launcher");
  });

  it("describes invite roles without renaming labels or inventing roles", () => {
    expect(toRoleLabel("organization_admin")).toBe("Organization Admin");
    expect(toRoleDescription("organization_admin")).toMatch(/Full organization management/i);
    expect(toRoleDescription("property_manager")).toMatch(/property operations/i);
    expect(toRoleDescription("maintenance_technician")).toMatch(/facility|maintenance/i);
    expect(toRoleDescription("vendor")).toMatch(/External service provider/i);
    expect(toRoleDescription("tenant")).toMatch(/Resident portal/i);
    for (const role of LAUNCH_INVITE_ROLES) {
      expect(toRoleDescription(role).length).toBeGreaterThan(10);
      expect(toRoleLabel(role as UserRole).length).toBeGreaterThan(0);
    }
  });

  it("provides critical empty-state what/why/next copy", () => {
    expect(ownerEmptyStateCopy("residents").description).toMatch(/leasing/i);
    expect(ownerEmptyStateCopy("maintenance").description).toMatch(/assigned|create/i);
    expect(ownerEmptyStateCopy("fo_operations").description).toMatch(/building|work order/i);
    expect(ownerEmptyStateCopy("finance").description).toMatch(/lease/i);
  });
});
