import { describe, expect, it } from "vitest";
import {
  createPartInputSchema,
  deriveStockHealth,
  issueInventoryInputSchema
} from "./inventory-schemas";

describe("facility inventory schemas (E.5)", () => {
  it("derives stock health from quantity and thresholds", () => {
    expect(deriveStockHealth(10, 5, 0)).toBe("in_stock");
    expect(deriveStockHealth(3, 5, 0)).toBe("low");
    expect(deriveStockHealth(0, 5, 0)).toBe("stockout");
    expect(deriveStockHealth(2, 5, 3)).toBe("stockout");
  });

  it("requires sku and name for parts", () => {
    const parsed = createPartInputSchema.safeParse({
      sku: "FLT-20",
      name: "20x20 filter"
    });
    expect(parsed.success).toBe(true);
  });

  it("requires work order for issue", () => {
    const parsed = issueInventoryInputSchema.safeParse({
      partId: "11111111-1111-4111-8111-111111111111",
      inventoryLocationId: "22222222-2222-4222-8222-222222222222",
      quantity: 2
    });
    expect(parsed.success).toBe(false);
  });
});
