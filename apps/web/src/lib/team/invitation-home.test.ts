import { describe, expect, it } from "vitest";
import { resolvePostAuthHome } from "@mpa/shared";

describe("PLAT-006 invitation and magic-link home matrix", () => {
  const setupComplete = true;

  it("routes invited staff by SKU, not role-only PM homes", () => {
    expect(
      resolvePostAuthHome({
        roles: ["organization_admin"],
        productSku: "mpa_property_manager",
        setupComplete
      })
    ).toBe("/pm/mission-control");
    expect(
      resolvePostAuthHome({
        roles: ["property_manager"],
        productSku: "mpa_facility_operations",
        setupComplete
      })
    ).toBe("/facility/mission-control");
    expect(
      resolvePostAuthHome({
        roles: ["organization_admin"],
        productSku: "mpa_complete_platform",
        setupComplete
      })
    ).toBe("/launcher");
  });

  it("routes technicians by product and tenants to the resident portal", () => {
    expect(
      resolvePostAuthHome({
        roles: ["maintenance_technician"],
        productSku: "mpa_facility_operations",
        setupComplete
      })
    ).toBe("/facility/mission-control");
    expect(
      resolvePostAuthHome({
        roles: ["maintenance_technician"],
        productSku: "mpa_complete_platform",
        setupComplete
      })
    ).toBe("/pm/maintenance");
    expect(
      resolvePostAuthHome({
        roles: ["tenant"],
        productSku: "mpa_property_manager",
        setupComplete: false
      })
    ).toBe("/portal/tenant");
  });
});
