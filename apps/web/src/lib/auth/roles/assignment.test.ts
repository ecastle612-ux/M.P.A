import { describe, expect, it } from "vitest";
import { assertRoleAssignmentAllowed } from "./assignment";
import { sliceDCertificationSummary } from "./certification";

describe("AUTH-001 Slice D role assignment", () => {
  it("allows Org Admin to assign leasing_agent", () => {
    expect(() =>
      assertRoleAssignmentAllowed({
        actorUserId: "admin",
        targetUserId: "agent",
        actorRoles: ["organization_admin"],
        actorIsOwner: true,
        actorIsMasterAdmin: false,
        nextRoles: ["leasing_agent"]
      })
    ).not.toThrow();
  });

  it("blocks self-elevate to organization_admin", () => {
    expect(() =>
      assertRoleAssignmentAllowed({
        actorUserId: "staff",
        targetUserId: "staff",
        actorRoles: ["property_manager"],
        actorIsOwner: false,
        actorIsMasterAdmin: false,
        nextRoles: ["organization_admin"]
      })
    ).toThrow(/self-elevate/i);
  });

  it("blocks property_manager from granting organization_admin", () => {
    expect(() =>
      assertRoleAssignmentAllowed({
        actorUserId: "pm",
        targetUserId: "other",
        actorRoles: ["property_manager"],
        actorIsOwner: false,
        actorIsMasterAdmin: false,
        nextRoles: ["organization_admin"]
      })
    ).toThrow(/Only Organization Administrators/i);
  });

  it("certification support checks pass", () => {
    const summary = sliceDCertificationSummary();
    expect(summary.failed).toEqual([]);
    expect(summary.passed).toBe(summary.total);
  });
});
