import { describe, expect, it } from "vitest";
import {
  isContextualNavActive,
  resolveContextualNavigation
} from "./contextual-navigation";

describe("contextual-navigation (UX-016 Slice C)", () => {
  it("builds property-focused navigation from property pathname", () => {
    const context = resolveContextualNavigation("/properties/oak-1");
    expect(context?.kind).toBe("property");
    expect(context?.items.map((item) => item.label)).toEqual([
      "Overview",
      "Residents",
      "Maintenance",
      "Leases",
      "Documents",
      "Financial",
      "Activity",
      "Settings"
    ]);
    expect(context?.items.find((item) => item.label === "Residents")?.href).toContain(
      "propertyId=oak-1"
    );
  });

  it("builds vendor-focused navigation from vendor pathname", () => {
    const context = resolveContextualNavigation("/vendors/vendor-9/edit");
    expect(context?.kind).toBe("vendor");
    expect(context?.items.map((item) => item.label)).toEqual([
      "Jobs",
      "Invoices",
      "Messages",
      "Documents",
      "Performance"
    ]);
  });

  it("ignores create routes and unrelated paths", () => {
    expect(resolveContextualNavigation("/properties/new")).toBeNull();
    expect(resolveContextualNavigation("/vendors/new")).toBeNull();
    expect(resolveContextualNavigation("/dashboard")).toBeNull();
  });

  it("marks exact contextual overview active", () => {
    const context = resolveContextualNavigation("/properties/p1");
    const overview = context?.items.find((item) => item.label === "Overview");
    expect(overview).toBeTruthy();
    expect(isContextualNavActive("/properties/p1", "", overview!)).toBe(true);
    expect(isContextualNavActive("/properties/p1/units", "", overview!)).toBe(false);
  });
});
