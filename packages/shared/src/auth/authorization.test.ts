import { describe, expect, it } from "vitest";
import {
  canAccessRole,
  extractRolesFromMetadata,
  resolveActiveRole,
  type AuthorizationContext
} from "./authorization";

describe("authorization helpers", () => {
  it("extracts valid roles from metadata", () => {
    const roles = extractRolesFromMetadata({ roles: ["property_manager", "tenant"] });
    expect(roles).toEqual(["property_manager", "tenant"]);
  });

  it("ignores invalid metadata safely", () => {
    expect(extractRolesFromMetadata(null)).toEqual([]);
    expect(extractRolesFromMetadata({ roles: ["invalid-role"] })).toEqual([]);
  });

  it("resolves preferred role when available", () => {
    const active = resolveActiveRole(["property_manager", "vendor"], "vendor");
    expect(active).toBe("vendor");
  });

  it("falls back to first role when preferred is invalid", () => {
    const active = resolveActiveRole(["property_manager", "vendor"], "tenant");
    expect(active).toBe("property_manager");
  });

  it("checks role access against one or more required roles", () => {
    const context: AuthorizationContext = {
      userId: "user-1",
      roles: ["property_manager", "vendor"],
      activeRole: "property_manager"
    };
    expect(canAccessRole(context, "vendor")).toBe(true);
    expect(canAccessRole(context, "tenant")).toBe(false);
    expect(canAccessRole(context, ["tenant", "vendor"])).toBe(true);
  });
});
