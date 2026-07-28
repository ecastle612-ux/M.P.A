import { describe, expect, it } from "vitest";
import {
  assignedSurfaceHome,
  canAccessOperationsPath,
  canAccessOperationsShell,
  flattenMembershipRoles,
  hasOperationsShellRole,
  isOperationsShellPath
} from "./ops-shell-access";

describe("ops-shell-access (AUTH-001 Slice D)", () => {
  it("allows Slice D Ops membership roles into Ops shell", () => {
    expect(hasOperationsShellRole(["organization_admin"])).toBe(true);
    expect(hasOperationsShellRole(["property_manager"])).toBe(true);
    expect(hasOperationsShellRole(["leasing_agent"])).toBe(true);
    expect(hasOperationsShellRole(["facility_technician"])).toBe(true);
    expect(hasOperationsShellRole(["tenant"])).toBe(false);
    expect(hasOperationsShellRole(["vendor"])).toBe(false);
    expect(hasOperationsShellRole(["property_owner"])).toBe(false);
    expect(canAccessOperationsShell(["tenant"], false)).toBe(false);
    expect(canAccessOperationsShell(["organization_admin"], false)).toBe(true);
    expect(canAccessOperationsShell([], true)).toBe(true);
  });

  it("maps assigned homes per AUTH-001 priority", () => {
    expect(
      assignedSurfaceHome(["organization_admin"], false, { organizationType: "property_manager" })
    ).toBe("/dashboard");
    expect(
      assignedSurfaceHome(["organization_admin"], false, { organizationType: "property_owner" })
    ).toBe("/portal/owner");
    expect(assignedSurfaceHome(["property_manager"], false)).toBe("/dashboard");
    expect(assignedSurfaceHome(["leasing_agent"], false)).toBe("/leases");
    expect(assignedSurfaceHome(["facility_technician"], false)).toBe("/maintenance");
    expect(assignedSurfaceHome(["property_owner"], false)).toBe("/portal/owner");
    expect(assignedSurfaceHome(["tenant"], false)).toBe("/portal/tenant");
    expect(assignedSurfaceHome(["vendor"], false)).toBe("/vendor-access");
    expect(assignedSurfaceHome([], true)).toBe("/master-admin");
    expect(assignedSurfaceHome([], false)).toBe("/unauthorized");
  });

  it("path-scopes leasing and technician inside Ops", () => {
    expect(canAccessOperationsPath("/leases", ["leasing_agent"], false)).toBe(true);
    expect(canAccessOperationsPath("/financials", ["leasing_agent"], false)).toBe(false);
    expect(canAccessOperationsPath("/maintenance", ["facility_technician"], false)).toBe(true);
    expect(canAccessOperationsPath("/leases", ["facility_technician"], false)).toBe(false);
    expect(canAccessOperationsPath("/financials", ["organization_admin"], false)).toBe(true);
    expect(canAccessOperationsPath("/financials", ["property_manager"], false)).toBe(true);
  });

  it("classifies Ops paths and excludes portal / master-admin", () => {
    expect(isOperationsShellPath("/properties")).toBe(true);
    expect(isOperationsShellPath("/setup")).toBe(true);
    expect(isOperationsShellPath("/profile")).toBe(true);
    expect(isOperationsShellPath("/portal/tenant")).toBe(false);
    expect(isOperationsShellPath("/vendor-access")).toBe(false);
    expect(isOperationsShellPath("/master-admin")).toBe(false);
  });

  it("flattens membership role rows", () => {
    expect(
      flattenMembershipRoles([{ roles: ["tenant"] }, { roles: ["vendor", "tenant"] }, null])
    ).toEqual(["tenant", "vendor"]);
  });
});
