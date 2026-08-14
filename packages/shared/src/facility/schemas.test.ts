import { describe, expect, it } from "vitest";
import {
  applyFacilityStockMovementInputSchema,
  createFacilityAssetInputSchema,
  createFacilityStockItemInputSchema,
  isLowStock,
  suggestedReorderQuantity,
  updateFacilityAssetInputSchema
} from "./schemas";

const SITE = "11111111-1111-4111-8111-111111111111";

describe("FAC-003 asset and inventory schemas", () => {
  it("creates an asset with lifecycle and location fields", () => {
    const parsed = createFacilityAssetInputSchema.safeParse({
      name: "Rooftop AHU-2",
      assetType: "hvac",
      assetCode: "AHU-2",
      propertyPropertyId: SITE,
      floorLabel: "Roof",
      roomLabel: "Penthouse",
      purchaseDate: "2024-03-01",
      scanCode: "SCAN-AHU-2"
    });
    expect(parsed.success).toBe(true);
  });

  it("requires a custom type label when type is other", () => {
    const parsed = createFacilityAssetInputSchema.safeParse({
      name: "Lab freezer",
      assetType: "other",
      assetCode: "LAB-1",
      propertyPropertyId: SITE
    });
    expect(parsed.success).toBe(false);
  });

  it("accepts maintenance lifecycle on update", () => {
    const parsed = updateFacilityAssetInputSchema.safeParse({ status: "maintenance" });
    expect(parsed.success).toBe(true);
  });

  it("creates a stock item without using serialized inventory", () => {
    const parsed = createFacilityStockItemInputSchema.safeParse({
      name: "MERV-13 filter",
      category: "filters",
      unitOfMeasure: "each",
      propertyPropertyId: SITE,
      storageLocationLabel: "Boiler room cage",
      reorderLevel: 6
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects zero-quantity movements", () => {
    expect(
      applyFacilityStockMovementInputSchema.safeParse({
        movementType: "receive",
        quantity: 0
      }).success
    ).toBe(false);
  });

  it("uses reorder_level when set, otherwise min_threshold", () => {
    expect(isLowStock({ quantityOnHand: 4, reorderLevel: 6, minThreshold: 2 })).toBe(true);
    expect(isLowStock({ quantityOnHand: 4, reorderLevel: null, minThreshold: 2 })).toBe(false);
    expect(isLowStock({ quantityOnHand: 2, reorderLevel: null, minThreshold: 2 })).toBe(true);
    expect(isLowStock({ quantityOnHand: 8 })).toBe(false);
    expect(suggestedReorderQuantity({ quantityOnHand: 4, reorderLevel: 6 })).toBe(2);
    expect(suggestedReorderQuantity({ quantityOnHand: 10, reorderLevel: 6 })).toBe(0);
  });
});
