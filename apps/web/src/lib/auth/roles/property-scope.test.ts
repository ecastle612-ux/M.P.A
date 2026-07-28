import { describe, expect, it } from "vitest";
import { requirePropertyIdsForScopedRoles, roleRequiresPropertyScope } from "./property-scope";

describe("property scope helpers", () => {
  it("detects property-scoped roles", () => {
    expect(roleRequiresPropertyScope(["facility_technician"])).toBe(true);
    expect(roleRequiresPropertyScope(["leasing_agent"])).toBe(true);
    expect(roleRequiresPropertyScope(["property_manager"])).toBe(false);
    expect(roleRequiresPropertyScope(["organization_admin", "facility_technician"])).toBe(true);
  });

  it("requires property ids for scoped roles", () => {
    expect(() =>
      requirePropertyIdsForScopedRoles({
        roles: ["facility_technician"],
        propertyIds: []
      })
    ).toThrow(/at least one property/i);

    expect(
      requirePropertyIdsForScopedRoles({
        roles: ["facility_technician"],
        propertyIds: ["prop-1", "prop-1", "prop-2"]
      })
    ).toEqual(["prop-1", "prop-2"]);
  });

  it("returns empty property ids for non-scoped roles", () => {
    expect(
      requirePropertyIdsForScopedRoles({
        roles: ["property_manager"],
        propertyIds: undefined
      })
    ).toEqual([]);
  });
});
