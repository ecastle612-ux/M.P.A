import { describe, expect, it } from "vitest";
import { LAUNCH_INVITE_ROLES, toRoleLabel } from "../types/roles";
import {
  defaultLaunchInviteRoleForSku,
  launchInviteRolesForSku,
  toInviteRoleDescription,
  toInviteRoleLabel
} from "./invite-presentation";

describe("SKU-aware invite presentation (Wave D)", () => {
  it("defaults FO invites to maintenance_technician without changing role keys", () => {
    expect(defaultLaunchInviteRoleForSku("mpa_facility_operations")).toBe(
      "maintenance_technician"
    );
    expect(defaultLaunchInviteRoleForSku("mpa_property_manager")).toBe("property_manager");
    expect(defaultLaunchInviteRoleForSku("mpa_complete_platform")).toBe("property_manager");
    expect(defaultLaunchInviteRoleForSku(null)).toBe("property_manager");
  });

  it("prioritizes FO technician, facility manager, and vendor while keeping all launch roles", () => {
    const foRoles = launchInviteRolesForSku("mpa_facility_operations");
    expect(foRoles.slice(0, 3)).toEqual([
      "maintenance_technician",
      "property_manager",
      "vendor"
    ]);
    for (const role of LAUNCH_INVITE_ROLES) {
      expect(foRoles).toContain(role);
    }
    expect(launchInviteRolesForSku("mpa_property_manager")).toEqual([...LAUNCH_INVITE_ROLES]);
  });

  it("uses Facility Technician / Facility Manager labels for FO only", () => {
    expect(toInviteRoleLabel("maintenance_technician", "mpa_facility_operations")).toBe(
      "Facility Technician"
    );
    expect(toInviteRoleLabel("property_manager", "mpa_facility_operations")).toBe(
      "Facility Manager"
    );
    expect(toInviteRoleLabel("maintenance_technician", "mpa_property_manager")).toBe(
      toRoleLabel("maintenance_technician")
    );
    expect(toInviteRoleLabel("property_manager", "mpa_property_manager")).toBe("Property Manager");
  });

  it("keeps FO invite descriptions presentation-only", () => {
    expect(
      toInviteRoleDescription("maintenance_technician", "mpa_facility_operations")
    ).toMatch(/facility work/i);
    expect(toInviteRoleDescription("property_manager", "mpa_facility_operations")).toMatch(
      /facility operations/i
    );
    expect(toInviteRoleDescription("vendor", "mpa_facility_operations")).toMatch(/External/i);
  });
});
