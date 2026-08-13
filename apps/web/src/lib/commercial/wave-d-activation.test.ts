import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  defaultLaunchInviteRoleForSku,
  postPurchaseDestinationLabel,
  resolveProductWorkspaceHome,
  USER_ROLES
} from "@mpa/shared";

const webRoot = join(process.cwd(), "src");

function read(rel: string): string {
  return readFileSync(join(webRoot, rel), "utf8");
}

describe("Wave D customer activation polish (web wiring)", () => {
  it("uses FO invite defaults and SKU-aware team breadcrumbs", () => {
    expect(defaultLaunchInviteRoleForSku("mpa_facility_operations")).toBe(
      "maintenance_technician"
    );
    expect(defaultLaunchInviteRoleForSku("mpa_property_manager")).toBe("property_manager");
    expect(read("components/team/team-invite-panel.tsx")).toMatch(/defaultLaunchInviteRoleForSku/);
    expect(read("components/team/team-invite-panel.tsx")).toMatch(/toInviteRoleLabel/);
    expect(read("app/(app)/settings/team/page.tsx")).toMatch(/productWorkspaceNavLabel/);
    expect(read("app/(app)/settings/team/page.tsx")).not.toMatch(
      /href: "\/pm\/mission-control", label: "Mission Control"/
    );
  });

  it("uses SKU-aware claim and continue destinations", () => {
    expect(read("components/shell/login-form.tsx")).toMatch(/postPurchaseNextStepCopy/);
    expect(read("components/marketing/commerce-continue-page.tsx")).toMatch(
      /postPurchaseReadyCopy/
    );
    expect(read("components/marketing/checkout-success-page.tsx")).toMatch(
      /postPurchaseDestinationLabel/
    );
    expect(postPurchaseDestinationLabel("mpa_complete_platform")).toBe(
      "Complete Platform Launcher"
    );
  });

  it("does not change SKU routing", () => {
    expect(resolveProductWorkspaceHome("mpa_property_manager")).toBe("/pm/mission-control");
    expect(resolveProductWorkspaceHome("mpa_facility_operations")).toBe(
      "/facility/mission-control"
    );
    expect(resolveProductWorkspaceHome("mpa_complete_platform")).toBe("/launcher");
  });

  it("keeps RBAC role keys unchanged", () => {
    expect(USER_ROLES).toEqual([
      "organization_admin",
      "property_manager",
      "leasing_agent",
      "maintenance_technician",
      "property_owner",
      "tenant",
      "vendor"
    ]);
  });

  it("aligns FO demo honesty strings", () => {
    const surfaces = read("components/demo/demo-surfaces.tsx");
    expect(surfaces).toMatch(/Inventory work tracking/);
    expect(surfaces).toMatch(/Preventive work tracking/);
    expect(surfaces).toMatch(/Inspection workflows/);
    expect(surfaces).not.toMatch(/Stock positions/);
    expect(surfaces).not.toMatch(/Scheduled PM tasks/);
    expect(surfaces).not.toMatch(/Inspection schedule/);
  });

  it("wires PM unit Day-1 guidance", () => {
    expect(read("components/property/properties-directory.tsx")).toMatch(
      /pm-units-day1-guidance/
    );
    expect(read("components/property/property-command-center.tsx")).toMatch(
      /property-units-guidance/
    );
    expect(read("components/commercial/workspace-launcher.tsx")).toMatch(
      /Operational capabilities/
    );
  });
});
