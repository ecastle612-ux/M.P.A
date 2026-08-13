import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  ORGANIZATION_ADMIN_CLARITY,
  ownerDay1ChecklistForSku,
  resolveProductWorkspaceHome,
  toRoleDescription,
  toRoleLabel,
  USER_ROLES
} from "@mpa/shared";

const webRoot = join(process.cwd(), "src");

function read(rel: string): string {
  return readFileSync(join(webRoot, rel), "utf8");
}

describe("Owner Day-1 activation polish (web wiring)", () => {
  it("shows PM Day-1 checklist on Mission Control first-run", () => {
    const page = read("components/commercial/mission-control-page.tsx");
    expect(page).toMatch(/OwnerDay1ChecklistCard/);
    expect(page).toMatch(/ownerDay1ChecklistForSku\("mpa_property_manager"\)/);
    expect(page).toMatch(/showOwnerClarity/);
    expect(ownerDay1ChecklistForSku("mpa_property_manager").items[0]?.id).toBe("pm_property");
  });

  it("shows FO Day-1 checklist on Facility Mission Control first-run", () => {
    const page = read("components/facility/facility-mission-control-page.tsx");
    expect(page).toMatch(/OwnerDay1ChecklistCard/);
    expect(page).toMatch(/mpa_facility_operations/);
    expect(page).toMatch(/Organization Admin/);
    expect(ownerDay1ChecklistForSku("mpa_facility_operations").items[0]?.href).toBe(
      "/facility/assets"
    );
  });

  it("shows Complete Day-1 checklist on Workspace Launcher with one-organization balance", () => {
    const launcher = read("components/commercial/workspace-launcher.tsx");
    expect(launcher).toMatch(/OwnerDay1ChecklistCard/);
    expect(launcher).toMatch(/ownerDay1ChecklistForSku\("mpa_complete_platform"\)/);
    expect(launcher).toMatch(/one commercial product/);
    const checklist = ownerDay1ChecklistForSku("mpa_complete_platform");
    expect(checklist.intro).toMatch(/one organization/i);
    expect(checklist.items.some((item) => item.href === "/pm/mission-control")).toBe(true);
    expect(checklist.items.some((item) => item.href === "/facility/mission-control")).toBe(true);
  });

  it("keeps SKU workspace routing unchanged", () => {
    expect(resolveProductWorkspaceHome("mpa_property_manager")).toBe("/pm/mission-control");
    expect(resolveProductWorkspaceHome("mpa_facility_operations")).toBe(
      "/facility/mission-control"
    );
    expect(resolveProductWorkspaceHome("mpa_complete_platform")).toBe("/launcher");
  });

  it("adds Organization Admin clarity on Guided Setup and claim without changing auth APIs", () => {
    const setup = read("components/commercial/guided-setup-page.tsx");
    expect(setup).toMatch(/ORGANIZATION_ADMIN_CLARITY/);
    expect(setup).toMatch(/guided-setup-owner-clarity/);
    expect(ORGANIZATION_ADMIN_CLARITY.headline).toBe("You are the Organization Admin");

    const login = read("components/shell/login-form.tsx");
    expect(login).toMatch(/claim-owner-clarity/);
    expect(login).toMatch(/Organization Admin/);
    expect(login).toMatch(/\/api\/commerce\/provision\/claim/);
    expect(login).toMatch(/claim-password/);
  });

  it("shows invite role descriptions without changing role labels or inventing roles", () => {
    const invite = read("components/team/team-invite-panel.tsx");
    expect(invite).toMatch(/toRoleDescription/);
    expect(invite).toMatch(/invite-role-description/);
    expect(toRoleLabel("organization_admin")).toBe("Organization Admin");
    expect(toRoleDescription("organization_admin")).toMatch(/Full organization management/i);
    expect(toRoleDescription("property_manager")).toMatch(/property operations/i);
    expect(toRoleDescription("maintenance_technician")).toMatch(/facility|maintenance/i);
    expect(toRoleDescription("vendor")).toMatch(/External service provider/i);
    expect(toRoleDescription("tenant")).toMatch(/Resident portal/i);
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

  it("wires critical empty-state copy for residents, maintenance, FO, and finance", () => {
    expect(read("components/resident/residents-directory.tsx")).toMatch(/ownerEmptyStateCopy\("residents"\)/);
    expect(read("components/maintenance/maintenance-command-center.tsx")).toMatch(
      /ownerEmptyStateCopy\("maintenance"\)/
    );
    expect(read("components/facility/facility-operations-workspace.tsx")).toMatch(
      /ownerEmptyStateCopy\("fo_operations"\)/
    );
    expect(read("components/facility/facility-assets-workspace.tsx")).toMatch(
      /ownerEmptyStateCopy\("fo_assets"\)/
    );
    expect(read("components/finance/finance-desk.tsx")).toMatch(/ownerEmptyStateCopy\("finance"\)/);
  });
});
