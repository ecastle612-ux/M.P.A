import { describe, expect, it } from "vitest";
import {
  LAUNCH_INVITE_ROLES,
  defaultHomeForRole,
  isLaunchInviteRole,
  primaryRole,
  toRoleDescription,
  toRoleLabel
} from "./roles";

describe("LAUNCH-001 J2 roles", () => {
  it("exposes six launch invite roles", () => {
    expect(LAUNCH_INVITE_ROLES).toHaveLength(6);
    expect(isLaunchInviteRole("leasing_agent")).toBe(true);
    expect(isLaunchInviteRole("tenant")).toBe(false);
  });

  it("labels and homes match launch personas", () => {
    expect(toRoleLabel("organization_admin")).toBe("Organization Admin");
    expect(toRoleDescription("organization_admin")).toMatch(/Full organization management/i);
    expect(toRoleDescription("property_manager")).toMatch(/Manages property operations/i);
    expect(toRoleDescription("maintenance_technician")).toMatch(/Executes facility/i);
    expect(toRoleDescription("vendor")).toMatch(/External service provider/i);
    expect(toRoleDescription("tenant")).toMatch(/Resident portal access/i);
    expect(toRoleLabel("maintenance_technician")).toBe("Maintenance Technician");
    expect(defaultHomeForRole("property_manager")).toBe("/pm/mission-control");
    expect(defaultHomeForRole("leasing_agent")).toBe("/pm/leasing");
    expect(defaultHomeForRole("maintenance_technician")).toBe("/facility/my-work");
    expect(defaultHomeForRole("property_owner")).toBe("/portal/owner");
    expect(defaultHomeForRole("vendor")).toBe("/portal/vendor");
  });

  it("picks primary role by priority", () => {
    expect(primaryRole(["vendor", "organization_admin"])).toBe("organization_admin");
  });
});
