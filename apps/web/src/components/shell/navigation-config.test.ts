import { describe, expect, it } from "vitest";
import {
  SHELL_NAVIGATION_GROUPS,
  buildPropertyContextNav,
  getShellNavigationGroups,
  isNavHrefActive,
  parsePropertyIdFromPathname,
  parsePropertyIdFromSearch,
  resolveActivePropertyId,
  workflowGroupTitles
} from "./navigation-config";

describe("UX-016 Slice C workflow navigation", () => {
  it("orders sidebar groups as a workflow hierarchy", () => {
    expect(workflowGroupTitles()).toEqual([
      "Dashboard",
      "My Work",
      "Operations",
      "Financial",
      "Documents",
      "Communication",
      "Analytics",
      "Administration",
      "Master Admin"
    ]);
  });

  it("keeps Dashboard first with a single home destination", () => {
    const dashboard = SHELL_NAVIGATION_GROUPS[0];
    expect(dashboard?.title).toBe("Dashboard");
    expect(dashboard?.items.map((item) => item.href)).toEqual(["/dashboard"]);
  });

  it("does not duplicate primary destinations across workflow groups", () => {
    const hrefs = SHELL_NAVIGATION_GROUPS.flatMap((group) => group.items.map((item) => item.href));
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });

  it("parses property ids from pathname and search", () => {
    expect(parsePropertyIdFromPathname("/properties/prop_123")).toBe("prop_123");
    expect(parsePropertyIdFromPathname("/properties/prop_123/edit")).toBe("prop_123");
    expect(parsePropertyIdFromPathname("/properties/new")).toBeNull();
    expect(parsePropertyIdFromPathname("/tenants")).toBeNull();
    expect(parsePropertyIdFromSearch("?propertyId=prop_9&q=x")).toBe("prop_9");
    expect(resolveActivePropertyId("/tenants", "propertyId=prop_9")).toBe("prop_9");
    expect(resolveActivePropertyId("/properties/prop_9", "")).toBe("prop_9");
  });

  it("builds property-scoped workflow destinations without inventing routes", () => {
    const items = buildPropertyContextNav("oak-1");
    expect(items.map((item) => item.label)).toEqual([
      "Overview",
      "Residents",
      "Maintenance",
      "Documents",
      "Accounting",
      "Inspections",
      "Activity",
      "Settings"
    ]);
    expect(items[0]?.href).toBe("/properties/oak-1");
    expect(items.find((item) => item.label === "Residents")?.href).toBe("/tenants?propertyId=oak-1");
    expect(items.find((item) => item.label === "Maintenance")?.href).toBe("/maintenance?propertyId=oak-1");
  });

  it("matches query-scoped hrefs for property context active state", () => {
    expect(isNavHrefActive("/tenants", "propertyId=oak-1", "/tenants?propertyId=oak-1")).toBe(true);
    expect(isNavHrefActive("/tenants", "propertyId=other", "/tenants?propertyId=oak-1")).toBe(false);
    expect(isNavHrefActive("/properties/oak-1", "", "/properties/oak-1", true)).toBe(true);
    expect(isNavHrefActive("/properties/oak-1/edit", "", "/properties/oak-1", true)).toBe(false);
  });

  it("hides module-gated items when entitled modules are provided", () => {
    const groups = getShellNavigationGroups(["dashboard:read", "property:read"], {
      entitledModules: ["property_operations"]
    });
    const hrefs = groups.flatMap((group) => group.items.map((item) => item.href));
    expect(hrefs).toContain("/properties");
    expect(hrefs).toContain("/tenants");
    expect(hrefs).not.toContain("/maintenance");
    expect(hrefs).not.toContain("/financials");
  });
});
