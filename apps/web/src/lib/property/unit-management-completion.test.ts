import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { ownerDay1ChecklistForSku } from "@mpa/shared";

const webRoot = join(process.cwd(), "src");

function read(rel: string): string {
  return readFileSync(join(webRoot, rel), "utf8");
}

describe("PM unit management completion wiring", () => {
  it("exposes unit create/update/archive API routes with existing permissions", () => {
    const createRoute = read("app/api/pm/properties/[propertyId]/units/route.ts");
    const unitRoute = read("app/api/pm/properties/[propertyId]/units/[unitId]/route.ts");
    expect(createRoute).toMatch(/createPropertyUnit/);
    expect(createRoute).toMatch(/assertWithinUnitCapacityOrGate/);
    expect(createRoute).toMatch(/additionalUnits:\s*1/);
    expect(createRoute).toMatch(/requirePropertyPermission\("pm\.properties:write"\)/);
    expect(createRoute).toMatch(/requirePropertyPermission\("pm\.properties:read"\)/);
    expect(unitRoute).toMatch(/archivePropertyUnit/);
    expect(unitRoute).toMatch(/updatePropertyUnit/);
    expect(unitRoute).toMatch(/requirePropertyPermission\("pm\.properties:write"\)/);
    expect(unitRoute).toMatch(/archived:\s*true/);
    expect(unitRoute).not.toMatch(/\.from\("property_units"\)\.delete/i);
  });

  it("enforces capacity on the server create path (client cannot bypass)", () => {
    const createRoute = read("app/api/pm/properties/[propertyId]/units/route.ts");
    const capacityIdx = createRoute.indexOf("assertWithinUnitCapacityOrGate");
    const createCallIdx = createRoute.indexOf("await createPropertyUnit(");
    expect(capacityIdx).toBeGreaterThan(-1);
    expect(createCallIdx).toBeGreaterThan(capacityIdx);
    expect(createRoute).toMatch(/if\s*\(\s*!capacity\.ok\s*\)/);
    expect(createRoute).toMatch(/status: capacity\.status/);
  });

  it("wires Property Command Center units panel and impact copy", () => {
    const panel = read("components/property/property-units-panel.tsx");
    expect(read("components/property/property-command-center.tsx")).toMatch(/PropertyUnitsPanel/);
    expect(panel).toMatch(/add-unit-submit/);
    expect(panel).toMatch(/Archive/);
    expect(panel).toMatch(/Residents and leases attach to units/i);
    expect(panel).toMatch(/maintenance can reference a unit/i);
    expect(panel).toMatch(/plan capacity/i);
    expect(panel).not.toMatch(/status:\s*["']occupied["']/);
  });

  it("updates Day-1 guidance for manage units", () => {
    const item = ownerDay1ChecklistForSku("mpa_property_manager").items.find(
      (row) => row.id === "pm_units"
    );
    expect(item?.label).toBe("Manage units");
    expect(item?.detail).toMatch(/add, edit, or archive/i);
  });

  it("does not introduce schema migrations for unit management", () => {
    expect(read("lib/property/unit-catalog.ts")).toMatch(/status: "offline"/);
    expect(read("lib/property/unit-catalog.ts")).toMatch(/property_units/);
    expect(read("lib/property/unit-catalog.ts")).not.toMatch(/alter table|create table/i);
  });
});
