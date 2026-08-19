import { describe, expect, it } from "vitest";
import {
  defaultHomeForSku,
  guidedSetupNextActionCopy,
  productDisplayLabel,
  productWorkspaceHomeLabel,
  resolveLoginNextPath,
  resolvePostAuthHome,
  resolveProductWorkspaceHome
} from "./post-auth-home";

describe("resolveProductWorkspaceHome", () => {
  it("routes PM / FO / Complete to authoritative product homes", () => {
    expect(resolveProductWorkspaceHome("mpa_property_manager")).toBe("/pm/mission-control");
    expect(resolveProductWorkspaceHome("mpa_facility_operations")).toBe(
      "/facility/mission-control"
    );
    expect(resolveProductWorkspaceHome("mpa_complete_platform")).toBe("/launcher");
  });

  it("aliases defaultHomeForSku with setup fallback when SKU is null", () => {
    expect(defaultHomeForSku(null)).toBe("/setup");
    expect(defaultHomeForSku("mpa_facility_operations")).toBe("/facility/mission-control");
  });

  it("exposes product-aware labels for Guided Setup and Billing", () => {
    expect(productWorkspaceHomeLabel("mpa_property_manager")).toBe(
      "Property Manager Mission Control"
    );
    expect(productWorkspaceHomeLabel("mpa_facility_operations")).toBe(
      "Facility Operations Mission Control"
    );
    expect(productWorkspaceHomeLabel("mpa_complete_platform")).toBe("Complete Platform Launcher");
    expect(productDisplayLabel("mpa_complete_platform")).toBe("Complete Platform");
    expect(guidedSetupNextActionCopy("mpa_facility_operations")).toMatch(/building/i);
    expect(guidedSetupNextActionCopy("mpa_property_manager")).toMatch(/property/i);
    expect(guidedSetupNextActionCopy("mpa_complete_platform")).toMatch(
      /Complete Platform Launcher/i
    );
  });
});

describe("resolvePostAuthHome", () => {
  it("routes staff by role for specialized PM roles", () => {
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
  });

  it("routes PM manager/admin home via product workspace resolver", () => {
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

  it("routes FO manager/admin to Facility Mission Control", () => {
    expect(
      resolvePostAuthHome({
        roles: ["organization_admin"],
        productSku: "mpa_facility_operations",
        setupComplete: true
      })
    ).toBe("/facility/mission-control");

    expect(
      resolvePostAuthHome({
        roles: ["property_manager"],
        productSku: "mpa_facility_operations",
        setupComplete: true
      })
    ).toBe("/facility/mission-control");
  });

  it("routes Complete manager/admin to Workspace Launcher", () => {
    expect(
      resolvePostAuthHome({
        roles: ["organization_admin"],
        productSku: "mpa_complete_platform",
        setupComplete: true
      })
    ).toBe("/launcher");

    expect(
      resolvePostAuthHome({
        roles: ["property_manager"],
        productSku: "mpa_complete_platform",
        setupComplete: true
      })
    ).toBe("/launcher");
  });

  it("remaps FO-only specialized staff away from PM module homes", () => {
    expect(
      resolvePostAuthHome({
        roles: ["leasing_agent"],
        productSku: "mpa_facility_operations",
        setupComplete: true
      })
    ).toBe("/facility/mission-control");
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

  it("routes FO technician to My Work and Complete FO-scoped technician to My Work", () => {
    expect(
      resolvePostAuthHome({
        roles: ["maintenance_technician"],
        productSku: "mpa_facility_operations",
        setupComplete: true
      })
    ).toBe("/facility/my-work");

    expect(
      resolvePostAuthHome({
        roles: ["maintenance_technician"],
        productSku: "mpa_complete_platform",
        setupComplete: true
      })
    ).toBe("/facility/my-work");
  });

  it("routes Complete staff by member operating scope", () => {
    expect(
      resolvePostAuthHome({
        roles: ["property_manager"],
        productSku: "mpa_complete_platform",
        setupComplete: true,
        storedScope: "property_operations"
      })
    ).toBe("/pm/mission-control");
    expect(
      resolvePostAuthHome({
        roles: ["property_manager"],
        productSku: "mpa_complete_platform",
        setupComplete: true,
        storedScope: "facility_operations"
      })
    ).toBe("/facility/mission-control");
    expect(
      resolvePostAuthHome({
        roles: ["maintenance_technician"],
        productSku: "mpa_complete_platform",
        setupComplete: true,
        storedScope: "property_operations"
      })
    ).toBe("/pm/maintenance");
    expect(
      resolvePostAuthHome({
        roles: ["maintenance_technician"],
        productSku: "mpa_complete_platform",
        setupComplete: true,
        storedScope: "facility_operations"
      })
    ).toBe("/facility/my-work");
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

describe("resolveLoginNextPath", () => {
  it("keeps portal, setup, invitation, and commerce next paths", () => {
    expect(resolveLoginNextPath("/portal/tenant")).toBe("/portal/tenant");
    expect(resolveLoginNextPath("/setup")).toBe("/setup");
    expect(resolveLoginNextPath("/accept-invitation/token-1")).toBe("/accept-invitation/token-1");
    expect(resolveLoginNextPath("/commerce/continue?session_id=1")).toBe(
      "/commerce/continue?session_id=1"
    );
  });

  it("defers stale staff workspace homes through /dashboard", () => {
    expect(resolveLoginNextPath("/pm/mission-control")).toBe("/dashboard");
    expect(resolveLoginNextPath("/facility/mission-control")).toBe("/dashboard");
    expect(resolveLoginNextPath("/launcher")).toBe("/dashboard");
    expect(resolveLoginNextPath("/dashboard")).toBe("/dashboard");
    expect(resolveLoginNextPath("//evil.example")).toBe("/dashboard");
    expect(resolveLoginNextPath(null)).toBe("/dashboard");
  });
});
