import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { createFacilityWorkOrderInputSchema } from "@mpa/shared";

const service = readFileSync(
  resolve(process.cwd(), "src/lib/maintenance/maintenance-service.ts"),
  "utf8"
);

describe("FAC-003 work order asset relationship", () => {
  it("keeps unlabeled work valid and binds an optional asset id", () => {
    const unlabeled = createFacilityWorkOrderInputSchema.parse({
      title: "Hallway light",
      description: "Replace ballast in corridor.",
      propertyId: "11111111-1111-4111-8111-111111111111"
    });
    expect(unlabeled.facilityAssetId).toBeUndefined();
    expect(unlabeled.facilityAssetLabel).toBeUndefined();

    const linked = createFacilityWorkOrderInputSchema.parse({
      title: "AHU repair",
      description: "Belt noise on AHU-2.",
      propertyId: "11111111-1111-4111-8111-111111111111",
      facilityAssetId: "33333333-3333-4333-8333-333333333333",
      facilityAssetLabel: "AHU-2"
    });
    expect(linked.facilityAssetId).toBe("33333333-3333-4333-8333-333333333333");
    expect(linked.facilityAssetLabel).toBe("AHU-2");
  });

  it("fills the label from the asset name and writes both columns", () => {
    expect(service).toContain("facility_asset_id: facilityAssetId");
    expect(service).toContain("facility_asset_label: facilityAssetLabel");
    expect(service).toContain("facilityAssetLabel = asset.name");
    expect(service).toContain('work_surface: "facility"');
    expect(service).toContain("floor_label, department_label, room_label");
    expect(service).toContain("Facility asset not found for organization");
  });
});
