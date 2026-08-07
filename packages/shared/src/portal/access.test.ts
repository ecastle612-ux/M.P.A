import { describe, expect, it } from "vitest";
import {
  isPortalAccessRole,
  membershipHasPortalRole,
  mergeRolesWithPortalRole
} from "./access";

describe("portal access helpers", () => {
  it("recognizes portal roles", () => {
    expect(isPortalAccessRole("tenant")).toBe(true);
    expect(isPortalAccessRole("vendor")).toBe(true);
    expect(isPortalAccessRole("property_manager")).toBe(false);
  });

  it("merges portal role without duplicates", () => {
    expect(mergeRolesWithPortalRole(["property_manager"], "tenant")).toEqual([
      "property_manager",
      "tenant"
    ]);
    expect(mergeRolesWithPortalRole(["tenant"], "tenant")).toEqual(["tenant"]);
  });

  it("detects portal role on membership", () => {
    expect(membershipHasPortalRole(["tenant", "vendor"], "tenant")).toBe(true);
    expect(membershipHasPortalRole(["property_owner"], "vendor")).toBe(false);
  });
});
