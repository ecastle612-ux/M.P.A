import { describe, expect, it } from "vitest";
import { flattenShellNavigationItems, getShellNavigationGroups } from "./navigation-config";

describe("NAV-001 / ARCH-001 navigation consolidation", () => {
  it("hides Portals and Surface Switcher for Master Admin ops shell", () => {
    const groups = getShellNavigationGroups(["master_admin", "property:read", "dashboard:read"]);
    const hrefs = groups.flatMap((group) => group.items.map((item) => item.href));
    expect(hrefs).not.toContain("/portal");
    expect(hrefs).not.toContain("/master-admin/dashboards");
    expect(hrefs).toContain("/master-admin");
  });

  it("keeps Portals for non–Master Admin ops shell", () => {
    const hrefs = flattenShellNavigationItems(["property:read", "dashboard:read"]).map(
      (item) => item.href
    );
    expect(hrefs).toContain("/portal");
  });

  it("Master Admin–only shell has no Portal Testing or Surface Switcher", () => {
    const hrefs = flattenShellNavigationItems(["master_admin"], {
      masterAdminOnlyShell: true
    }).map((item) => item.href);
    expect(hrefs).not.toContain("/portal");
    expect(hrefs).not.toContain("/master-admin/dashboards");
    expect(hrefs).toContain("/master-admin");
  });

  it("Master Admin–only My Work labels match destinations (no STD-001 metaphor collision)", () => {
    const myWork =
      getShellNavigationGroups(["master_admin"], { masterAdminOnlyShell: true }).find(
        (group) => group.title === "My Work"
      )?.items ?? [];
    const labels = myWork.map((item) => item.label);
    expect(labels).toEqual(["Impersonation", "Recovery", "Commercial"]);
    expect(labels).not.toContain("Waiting on Me");
  });
});
