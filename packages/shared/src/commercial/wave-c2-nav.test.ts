import { describe, expect, it } from "vitest";
import { missionControlNavLabelForSku } from "./complete-launcher";
import { searchCatalogForSku } from "./route-entitlements";

describe("Wave C2 navigation terminology (PPS1-027)", () => {
  it("uses Mission Control under product groups for all SKUs", () => {
    expect(missionControlNavLabelForSku("property", "mpa_property_manager")).toBe("Mission Control");
    expect(missionControlNavLabelForSku("facility", "mpa_facility_operations")).toBe(
      "Mission Control"
    );
    expect(missionControlNavLabelForSku("property", "mpa_complete_platform")).toBe("Mission Control");
  });

  it("drops FO · prefixes and slice markers from financial catalog labels", () => {
    const results = searchCatalogForSku("mpa_property_manager", "charges");
    const labels = results.map((item) => item.label).join(" | ");
    expect(labels).toMatch(/Charges & ledger/);
    expect(labels).not.toMatch(/FO ·/);
    expect(labels).not.toMatch(/S1\+/);

    const mission = searchCatalogForSku("mpa_property_manager", "mission");
    expect(mission.some((item) => item.label === "Mission Control")).toBe(true);
    expect(mission.every((item) => !item.label.includes("PM Mission"))).toBe(true);
  });
});
