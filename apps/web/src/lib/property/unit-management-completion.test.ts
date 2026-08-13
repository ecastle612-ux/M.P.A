import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { ownerDay1ChecklistForSku } from "@mpa/shared";

const webRoot = join(process.cwd(), "src");

function read(rel: string): string {
  return readFileSync(join(webRoot, rel), "utf8");
}

describe("PM unit management completion wiring", () => {
  it("exposes unit create/update/archive API routes", () => {
    expect(read("app/api/pm/properties/[propertyId]/units/route.ts")).toMatch(/createPropertyUnit/);
    expect(read("app/api/pm/properties/[propertyId]/units/[unitId]/route.ts")).toMatch(
      /archivePropertyUnit/
    );
    expect(read("app/api/pm/properties/[propertyId]/units/[unitId]/route.ts")).toMatch(
      /requirePropertyPermission\("pm\.properties:write"\)/
    );
  });

  it("wires Property Command Center units panel", () => {
    expect(read("components/property/property-command-center.tsx")).toMatch(/PropertyUnitsPanel/);
    expect(read("components/property/property-units-panel.tsx")).toMatch(/add-unit-submit/);
    expect(read("components/property/property-units-panel.tsx")).toMatch(/Archive/);
  });

  it("updates Day-1 guidance for manage units", () => {
    const item = ownerDay1ChecklistForSku("mpa_property_manager").items.find(
      (row) => row.id === "pm_units"
    );
    expect(item?.label).toBe("Manage units");
    expect(item?.detail).toMatch(/add, edit, or archive/i);
  });
});
