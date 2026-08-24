import { describe, expect, it } from "vitest";
import {
  facilityAssetMatchesQuery,
  filterFacilityAssets,
  formatFacilityAssetIdentity,
  formatFacilityAssetLocation,
  formatGeneratedAssetCode,
  lockedContextFromFacilityAsset,
  nextGeneratedAssetCode,
  publicAssetQrUrlContainsSecrets,
  publicPortalLockedContext
} from "./asset-registry";

describe("facility asset registry helpers", () => {
  it("assigns human AST codes without exposing UUIDs", () => {
    expect(formatGeneratedAssetCode(14)).toBe("AST-000014");
    expect(nextGeneratedAssetCode(["AHU-2", "AST-000214", "AST-9"])).toBe("AST-000215");
    expect(formatFacilityAssetIdentity("Exam Chair 14", "AST-000214")).toBe("Exam Chair 14 · AST-000214");
  });

  it("formats location at a glance without a new hierarchy", () => {
    expect(
      formatFacilityAssetLocation({
        siteName: "North Clinic",
        floorLabel: "3",
        departmentLabel: "Cardiology",
        roomLabel: "312"
      })
    ).toBe("North Clinic · Floor 3 · Cardiology · Room 312");
  });

  it("searches locally across name, tag, serial, location, and status", () => {
    const assets = [
      {
        name: "Exam Chair 14",
        asset_code: "AST-000214",
        serial_number: null,
        status: "active",
        asset_type: "furniture",
        department_label: "Cardiology",
        property_properties: { name: "North Clinic" }
      },
      {
        name: "Forklift FL-12",
        asset_code: "FL-12",
        serial_number: "WH-FL-12",
        status: "active",
        asset_type: "other",
        department_label: "Warehouse",
        property_properties: { name: "Distribution" }
      }
    ];
    expect(filterFacilityAssets(assets, { query: "ast-000214" }).map((row) => row.name)).toEqual([
      "Exam Chair 14"
    ]);
    expect(facilityAssetMatchesQuery(assets[1]!, "warehouse")).toBe(true);
  });

  it("locks public intake context from the canonical asset row", () => {
    const context = lockedContextFromFacilityAsset({
      id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      name: "Exam Chair 14",
      property_property_id: "11111111-1111-4111-8111-111111111111",
      property_properties: { name: "North Clinic" },
      floor_label: "3",
      department_label: "Cardiology",
      room_label: "312"
    });
    expect(context).toEqual({
      propertyId: "11111111-1111-4111-8111-111111111111",
      propertyLabel: "North Clinic",
      facilityAssetId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      facilityAssetLabel: "Exam Chair 14",
      floorLabel: "3",
      departmentLabel: "Cardiology",
      roomLabel: "312"
    });
    expect(
      publicAssetQrUrlContainsSecrets("https://www.example.com/request/high-entropy-token?via=qr")
    ).toBe(false);
    expect(
      publicAssetQrUrlContainsSecrets(
        "https://www.example.com/request/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"
      )
    ).toBe(true);
    expect(
      publicPortalLockedContext({
        propertyId: "11111111-1111-4111-8111-111111111111",
        propertyLabel: "North Clinic",
        facilityAssetId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        facilityAssetLabel: "Exam Chair 14",
        floorLabel: "3",
        departmentLabel: "Cardiology",
        roomLabel: "312"
      })
    ).toEqual({
      propertyLabel: "North Clinic",
      facilityAssetLabel: "Exam Chair 14",
      floorLabel: "3",
      departmentLabel: "Cardiology",
      roomLabel: "312"
    });
  });
});
