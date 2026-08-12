import { describe, expect, it } from "vitest";
import {
  defaultHomeForSku,
  resolvePostAuthHome,
  resolveProductWorkspaceHome
} from "@mpa/shared";

/**
 * PPS1-001 / PPS1-012 — Guided Setup finish + Billing home must share
 * the same authoritative product workspace home as post-auth manager routing.
 */
describe("product workspace home (Guided Setup + Billing)", () => {
  it("PM setup/billing home → PM Mission Control", () => {
    expect(resolveProductWorkspaceHome("mpa_property_manager")).toBe("/pm/mission-control");
    expect(defaultHomeForSku("mpa_property_manager")).toBe("/pm/mission-control");
    expect(
      resolvePostAuthHome({
        roles: ["organization_admin"],
        productSku: "mpa_property_manager",
        setupComplete: true
      })
    ).toBe("/pm/mission-control");
  });

  it("FO setup/billing home → Facility Mission Control", () => {
    expect(resolveProductWorkspaceHome("mpa_facility_operations")).toBe(
      "/facility/mission-control"
    );
    expect(defaultHomeForSku("mpa_facility_operations")).toBe("/facility/mission-control");
    expect(
      resolvePostAuthHome({
        roles: ["organization_admin"],
        productSku: "mpa_facility_operations",
        setupComplete: true
      })
    ).toBe("/facility/mission-control");
  });

  it("Complete setup/billing home → Workspace Launcher", () => {
    expect(resolveProductWorkspaceHome("mpa_complete_platform")).toBe("/launcher");
    expect(defaultHomeForSku("mpa_complete_platform")).toBe("/launcher");
    expect(
      resolvePostAuthHome({
        roles: ["organization_admin"],
        productSku: "mpa_complete_platform",
        setupComplete: true
      })
    ).toBe("/launcher");
  });
});
