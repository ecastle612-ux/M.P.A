import { describe, expect, it } from "vitest";
import { resolveContextualNavigation } from "./contextual-navigation";

describe("CORE-004 Phase 1 property workspace nav", () => {
  it("exposes operational workspace destinations without parallel IA", () => {
    const nav = resolveContextualNavigation("/properties/abc-123");
    expect(nav?.kind).toBe("property");
    const labels = nav?.items.map((item) => item.label) ?? [];
    expect(labels).toEqual([
      "Overview",
      "Residents",
      "Leasing",
      "Maintenance",
      "Vendors",
      "Financial",
      "Documents",
      "Communications",
      "Inspections",
      "Activity",
      "Settings"
    ]);
    expect(nav?.items.find((item) => item.label === "Settings")?.href).toBe(
      "/properties/abc-123/edit"
    );
  });
});
