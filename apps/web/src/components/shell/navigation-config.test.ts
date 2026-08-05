import { describe, expect, it } from "vitest";
import {
  MASTER_ADMIN_ONLY_NAVIGATION_GROUPS,
  MOBILE_NAV_SECTION_ORDER,
  MOBILE_QUICK_CREATE_ACTIONS,
  SHELL_NAVIGATION_GROUPS,
  UNIVERSAL_SIDEBAR_GROUP_ORDER,
  getShellNavigationGroups,
  shellHomeHref
} from "./navigation-config";

describe("navigation-config (UX-016 Slice C)", () => {
  it("follows universal sidebar group order for ops shell", () => {
    expect(SHELL_NAVIGATION_GROUPS.map((group) => group.title)).toEqual([
      ...UNIVERSAL_SIDEBAR_GROUP_ORDER
    ]);
  });

  it("keeps Dashboard first and My Work second", () => {
    expect(SHELL_NAVIGATION_GROUPS[0]?.title).toBe("Dashboard");
    expect(SHELL_NAVIGATION_GROUPS[0]?.items[0]?.href).toBe("/dashboard");
    expect(SHELL_NAVIGATION_GROUPS[1]?.title).toBe("My Work");
    const myWorkLabels = SHELL_NAVIGATION_GROUPS[1]?.items.map((item) => item.label) ?? [];
    expect(myWorkLabels).toEqual(
      expect.arrayContaining([
        "Assigned Today",
        "Waiting on Me",
        "High Priority",
        "Scheduled Today",
        "Completed Today"
      ])
    );
  });

  it("does not invent routes outside existing app surfaces", () => {
    const hrefs = SHELL_NAVIGATION_GROUPS.flatMap((group) => group.items.map((item) => item.href));
    for (const href of hrefs) {
      expect(href.startsWith("/")).toBe(true);
      expect(href.includes("://")).toBe(false);
    }
  });

  it("maps mobile drawer sections to workspace groups", () => {
    expect(MOBILE_NAV_SECTION_ORDER.map((section) => section.title)).toEqual([
      "My Work",
      "Operations",
      "Financial",
      "Documents",
      "Communication",
      "Analytics",
      "Administration",
      "Operations Center"
    ]);
  });

  it("exposes Quick Create actions for common tasks", () => {
    const labels = MOBILE_QUICK_CREATE_ACTIONS.map((action) => action.label);
    expect(labels).toEqual(
      expect.arrayContaining(["Work Order", "Lease", "Resident", "Document", "Invite User", "Property"])
    );
  });

  it("keeps Master Admin–only shell HQ-focused", () => {
    expect(MASTER_ADMIN_ONLY_NAVIGATION_GROUPS[0]?.title).toBe("Dashboard");
    expect(shellHomeHref(["master_admin"], { masterAdminOnlyShell: true })).toBe("/master-admin");
    const groups = getShellNavigationGroups(["master_admin"], { masterAdminOnlyShell: true });
    expect(groups.some((group) => group.items.some((item) => item.href === "/properties"))).toBe(
      false
    );
  });
});
