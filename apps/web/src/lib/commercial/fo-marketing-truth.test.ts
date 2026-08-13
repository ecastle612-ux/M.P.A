import { describe, expect, it } from "vitest";
import {
  SKU_SUMMARIES,
  marketingModulesForSku,
  navigationGroupsForSku,
  skuComparisonRows
} from "@mpa/shared";
import { MARKETING_MODULE_COPY } from "../../components/marketing/marketing-module-copy";

const OVERCLAIM_PATTERNS = [
  /parts catalog/i,
  /storeroom/i,
  /preventive schedules/i,
  /asset registry/i,
  /safety incidents and protocols/i,
  /compliance programs/i,
  /inspection programs/i
];

describe("FO advertising depth truth", () => {
  it("describes FO as work-order operations, not a full CMMS suite", () => {
    const description = SKU_SUMMARIES.mpa_facility_operations.description.toLowerCase();
    expect(description).toContain("work order");
    expect(description).toMatch(/mission control|operational visibility|assignments/);
    for (const pattern of OVERCLAIM_PATTERNS) {
      expect(description).not.toMatch(pattern);
    }
    expect(description).not.toContain("inventory, preventive maintenance, safety, compliance");
  });

  it("markets FO category modules as work queues, not subsystems", () => {
    const foModules = marketingModulesForSku("mpa_facility_operations");
    const byId = new Map(foModules.map((entry) => [entry.id, entry]));

    expect(byId.get("assets")?.label).toBe("Buildings & Sites");
    expect(byId.get("inventory")?.label).toBe("Inventory Work");
    expect(byId.get("parts")?.label).toBe("Parts Work");
    expect(byId.get("preventive_maintenance")?.label).toBe("Preventive Work");
    expect(byId.get("inspections")?.label).toBe("Inspection Work");
    expect(byId.get("safety")?.label).toBe("Safety Work");
    expect(byId.get("compliance")?.label).toBe("Compliance Work");
    expect(byId.get("building_systems")?.label).toBe("Building Systems Work");

    for (const entry of foModules) {
      for (const pattern of OVERCLAIM_PATTERNS) {
        expect(`${entry.label} ${entry.description ?? ""}`).not.toMatch(pattern);
      }
    }
  });

  it("keeps nav labels aligned with marketed FO work-queue naming", () => {
    const foNav = navigationGroupsForSku("mpa_facility_operations")
      .flatMap((group) => group.items)
      .map((item) => item.label);
    expect(foNav).toContain("Buildings & Sites");
    expect(foNav).toContain("Inventory Work");
    expect(foNav).toContain("Parts Work");
    expect(foNav).toContain("Preventive Work");
    expect(foNav).not.toContain("Inventory");
    expect(foNav).not.toContain("Parts");
    expect(foNav).not.toContain("Preventive Maintenance");
  });

  it("uses honest FO marketing blurbs when module copy is shown", () => {
    for (const id of [
      "inventory",
      "parts",
      "preventive_maintenance",
      "inspections",
      "safety",
      "compliance",
      "building_systems",
      "assets"
    ]) {
      const copy = MARKETING_MODULE_COPY[id] ?? "";
      expect(copy.length).toBeGreaterThan(0);
      expect(copy.toLowerCase()).toMatch(/work|building|site|queue/);
      for (const pattern of OVERCLAIM_PATTERNS) {
        expect(copy).not.toMatch(pattern);
      }
    }
  });

  it("keeps comparison rows free of Capital Projects and CMMS overclaims", () => {
    const rows = skuComparisonRows().filter((row) => row.fo);
    expect(rows.some((row) => row.id === "capital_projects")).toBe(false);
    expect(rows.some((row) => row.label === "Parts Work")).toBe(true);
    expect(rows.some((row) => row.label === "Inventory")).toBe(false);
  });
});
