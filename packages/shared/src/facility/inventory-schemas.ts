import { z } from "zod";

export const PART_UOMS = ["ea", "box", "ft", "m", "gal", "L", "kg", "lb", "set", "other"] as const;
export type PartUom = (typeof PART_UOMS)[number];

export const INVENTORY_MOVEMENT_TYPES = ["receive", "issue", "adjust", "return"] as const;
export type InventoryMovementType = (typeof INVENTORY_MOVEMENT_TYPES)[number];

export const STOCK_HEALTH_STATUSES = ["in_stock", "low", "stockout"] as const;
export type StockHealthStatus = (typeof STOCK_HEALTH_STATUSES)[number];

export function deriveStockHealth(
  quantityOnHand: number,
  reorderThreshold: number,
  minimumStock: number = 0
): StockHealthStatus {
  if (quantityOnHand <= 0 || quantityOnHand < minimumStock) {
    return "stockout";
  }
  if (quantityOnHand <= reorderThreshold) {
    return "low";
  }
  return "in_stock";
}

export const createPartCategoryInputSchema = z.object({
  name: z.string().trim().min(2).max(120)
});
export type CreatePartCategoryInput = z.infer<typeof createPartCategoryInputSchema>;

export const createPartInputSchema = z.object({
  sku: z.string().trim().min(1).max(80),
  name: z.string().trim().min(2).max(160),
  categoryId: z.string().uuid().nullable().optional(),
  uom: z.enum(PART_UOMS).default("ea"),
  manufacturer: z.string().trim().max(160).nullable().optional(),
  supplierName: z.string().trim().max(160).nullable().optional(),
  supplierReference: z.string().trim().max(160).nullable().optional(),
  criticalPart: z.boolean().default(false),
  reorderThresholdDefault: z.number().min(0).default(0),
  minimumStockDefault: z.number().min(0).default(0),
  notes: z.string().trim().max(4000).nullable().optional(),
  compatibleAssetIds: z.array(z.string().uuid()).default([]),
  compatibleSystemIds: z.array(z.string().uuid()).default([])
});
export type CreatePartInput = z.infer<typeof createPartInputSchema>;

export const createInventoryLocationInputSchema = z.object({
  siteId: z.string().uuid(),
  facilityLocationId: z.string().uuid().nullable().optional(),
  name: z.string().trim().min(2).max(160)
});
export type CreateInventoryLocationInput = z.infer<typeof createInventoryLocationInputSchema>;

export const receiveInventoryInputSchema = z.object({
  partId: z.string().uuid(),
  inventoryLocationId: z.string().uuid(),
  quantity: z.number().positive(),
  reason: z.string().trim().max(1000).default("Received shipment")
});
export type ReceiveInventoryInput = z.infer<typeof receiveInventoryInputSchema>;

export const adjustInventoryInputSchema = z.object({
  partId: z.string().uuid(),
  inventoryLocationId: z.string().uuid(),
  /** Signed delta: positive increases, negative decreases. */
  quantityDelta: z.number().refine((value) => value !== 0, "Adjustment cannot be zero"),
  reason: z.string().trim().min(3).max(1000)
});
export type AdjustInventoryInput = z.infer<typeof adjustInventoryInputSchema>;

export const issueInventoryInputSchema = z.object({
  partId: z.string().uuid(),
  inventoryLocationId: z.string().uuid(),
  quantity: z.number().positive(),
  workOrderId: z.string().uuid(),
  reason: z.string().trim().max(1000).default("Issued to work order")
});
export type IssueInventoryInput = z.infer<typeof issueInventoryInputSchema>;

export const returnInventoryInputSchema = z.object({
  partId: z.string().uuid(),
  inventoryLocationId: z.string().uuid(),
  quantity: z.number().positive(),
  workOrderId: z.string().uuid().nullable().optional(),
  reason: z.string().trim().max(1000).default("Returned unused inventory")
});
export type ReturnInventoryInput = z.infer<typeof returnInventoryInputSchema>;

export const updateStockThresholdsInputSchema = z.object({
  stockId: z.string().uuid(),
  reorderThreshold: z.number().min(0),
  minimumStock: z.number().min(0)
});
export type UpdateStockThresholdsInput = z.infer<typeof updateStockThresholdsInputSchema>;
