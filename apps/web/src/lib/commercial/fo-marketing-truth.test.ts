import { describe, expect, it } from "vitest";
import {
  PUBLIC_PRICING_MODEL_COPY,
  SKU_SUMMARIES,
  marketingModulesForSku,
  modulesForSku,
  navigationGroupsForSku,
  skuComparisonRows
} from "@mpa/shared";
import { MARKETING_MODULE_COPY } from "../../components/marketing/marketing-module-copy";

const OVERCLAIM_PATTERNS = [
  /parts catalog/i,
  /warehouse management/i,
  /preventive schedules/i,
  /qr scanner/i,
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
    expect(description).not.toMatch(/rent collection|autopay|\bach\b/i);
    expect(PUBLIC_PRICING_MODEL_COPY.foIncludes).not.toMatch(/rent collection|AutoPay|\bACH\b/i);
  });

  it("markets FO category modules as work queues, not subsystems", () => {
    const foModules = marketingModulesForSku("mpa_facility_operations");
    const managerModules = modulesForSku("mpa_facility_operations", { roles: ["organization_admin"] });
    const byId = new Map(managerModules.map((entry) => [entry.id, entry]));

    expect(byId.get("assets")?.label).toBe("Assets");
    expect(byId.get("inventory")?.label).toBe("Inventory");
    expect(byId.get("parts")?.label).toBe("Parts Work");
    expect(byId.get("preventive_maintenance")?.label).toBe("Preventive Maintenance");
    expect(byId.get("inspections")?.label).toBe("Inspection Work");
    expect(byId.get("safety")?.label).toBe("Safety Work");
    expect(byId.get("compliance")?.label).toBe("Compliance Work");
    expect(byId.get("building_systems")?.label).toBe("Building Systems Work");

    for (const entry of [...foModules, ...managerModules]) {
      for (const pattern of OVERCLAIM_PATTERNS) {
        expect(`${entry.label} ${entry.description ?? ""}`).not.toMatch(pattern);
      }
    }
  });

  it("keeps nav labels aligned with marketed FO work-queue naming", () => {
    const foNav = navigationGroupsForSku("mpa_facility_operations", ["organization_admin"])
      .flatMap((group) => group.items)
      .map((item) => item.label);
    expect(foNav).toContain("Assets");
    expect(foNav).toContain("Inventory");
    expect(foNav).toContain("Parts Work");
    expect(foNav).toContain("Preventive Maintenance");
    expect(foNav).not.toContain("Buildings & Sites");
    expect(foNav).not.toContain("Inventory Work");
    expect(foNav).not.toContain("Parts");
    expect(foNav).not.toContain("Preventive Work");
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
      expect(copy.toLowerCase()).toMatch(/work|building|site|queue|registry|stock|ledger/);
      for (const pattern of OVERCLAIM_PATTERNS) {
        expect(copy).not.toMatch(pattern);
      }
    }
  });

  it("keeps comparison rows free of Capital Projects and CMMS overclaims", () => {
    const rows = skuComparisonRows().filter((row) => row.fo);
    expect(rows.some((row) => row.id === "capital_projects")).toBe(false);
    expect(rows.some((row) => row.label === "Parts Work")).toBe(true);
    expect(rows.some((row) => row.label === "Inventory")).toBe(true);
    expect(rows.some((row) => row.label === "Assets")).toBe(true);
  });
});
