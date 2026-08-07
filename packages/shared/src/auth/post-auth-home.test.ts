import { describe, expect, it } from "vitest";
import { resolvePostAuthHome } from "./post-auth-home";

describe("resolvePostAuthHome", () => {
  it("routes staff by role, not SKU", () => {
    expect(
      resolvePostAuthHome({
        roles: ["leasing_agent"],
        productSku: "mpa_property_manager",
        setupComplete: true
      })
    ).toBe("/pm/leasing");

    expect(
      resolvePostAuthHome({
        roles: ["maintenance_technician"],
        productSku: "mpa_property_manager",
        setupComplete: true
      })
    ).toBe("/pm/maintenance");

    expect(
      resolvePostAuthHome({
        roles: ["property_manager"],
        productSku: "mpa_property_manager",
        setupComplete: true
      })
    ).toBe("/pm/mission-control");

    expect(
      resolvePostAuthHome({
        roles: ["organization_admin"],
        productSku: "mpa_property_manager",
        setupComplete: true
      })
    ).toBe("/pm/mission-control");
  });

  it("routes portal roles to their portals even before setup flags matter", () => {
    expect(
      resolvePostAuthHome({
        roles: ["tenant"],
        productSku: "mpa_property_manager",
        setupComplete: false
      })
    ).toBe("/portal/tenant");

    expect(
      resolvePostAuthHome({
        roles: ["vendor"],
        productSku: "mpa_property_manager",
        setupComplete: true
      })
    ).toBe("/portal/vendor");

    expect(
      resolvePostAuthHome({
        roles: ["property_owner"],
        productSku: "mpa_property_manager",
        setupComplete: true
      })
    ).toBe("/portal/owner");
  });

  it("sends platform operators without memberships to Master Admin", () => {
    expect(
      resolvePostAuthHome({
        roles: [],
        productSku: null,
        setupComplete: false,
        isPlatformOperator: true
      })
    ).toBe("/admin");
  });

  it("does not invent Organization Admin when roles are empty", () => {
    expect(
      resolvePostAuthHome({
        roles: [],
        productSku: "mpa_property_manager",
        setupComplete: true,
        isPlatformOperator: false
      })
    ).toBe("/unauthorized?reason=role");
  });

  it("prefers primary role when multiple roles exist", () => {
    expect(
      resolvePostAuthHome({
        roles: ["tenant", "property_manager"],
        productSku: "mpa_property_manager",
        setupComplete: true
      })
    ).toBe("/pm/mission-control");
  });
});
