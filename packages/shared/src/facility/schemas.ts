import { z } from "zod";

export const FACILITY_ASSET_TYPES = [
  "hvac",
  "medical",
  "furniture",
  "appliance",
  "electrical",
  "plumbing",
  "safety",
  "other"
] as const;
export type FacilityAssetType = (typeof FACILITY_ASSET_TYPES)[number];

export const FACILITY_ASSET_TYPE_LABELS: Record<FacilityAssetType, string> = {
  hvac: "HVAC",
  medical: "Medical equipment",
  furniture: "Furniture",
  appliance: "Appliances",
  electrical: "Electrical systems",
  plumbing: "Plumbing systems",
  safety: "Safety equipment",
  other: "Other"
};

export const FACILITY_ASSET_STATUSES = ["active", "maintenance", "retired", "replaced"] as const;
export type FacilityAssetStatus = (typeof FACILITY_ASSET_STATUSES)[number];

export const FACILITY_ASSET_STATUS_LABELS: Record<FacilityAssetStatus, string> = {
  active: "Active",
  maintenance: "Out of Service",
  retired: "Retired",
  replaced: "Replaced"
};

export const FACILITY_LOCATION_SCOPES = ["property", "building", "unit", "common_area"] as const;
export type FacilityLocationScope = (typeof FACILITY_LOCATION_SCOPES)[number];

export const FACILITY_STOCK_CATEGORIES = [
  "filters",
  "cleaning",
  "parts",
  "safety",
  "office",
  "other"
] as const;
export type FacilityStockCategory = (typeof FACILITY_STOCK_CATEGORIES)[number];

export const FACILITY_STOCK_CATEGORY_LABELS: Record<FacilityStockCategory, string> = {
  filters: "Filters",
  cleaning: "Cleaning supplies",
  parts: "Replacement parts",
  safety: "Safety supplies",
  office: "Office supplies",
  other: "Other"
};

export const FACILITY_STOCK_UNITS = ["each", "box", "case", "gallon", "liter", "roll", "pair"] as const;
export type FacilityStockUnit = (typeof FACILITY_STOCK_UNITS)[number];

export const FACILITY_STOCK_MOVEMENT_TYPES = ["receive", "issue", "adjust", "usage"] as const;
export type FacilityStockMovementType = (typeof FACILITY_STOCK_MOVEMENT_TYPES)[number];

export const FACILITY_MANAGER_ROLES = ["organization_admin", "property_manager"] as const;
export const FACILITY_ASSET_READ_ROLES = [
  ...FACILITY_MANAGER_ROLES,
  "maintenance_technician"
] as const;

export const createFacilityAssetInputSchema = z
  .object({
    name: z.string().trim().min(2).max(160),
    assetType: z.enum(FACILITY_ASSET_TYPES),
    customTypeLabel: z.string().trim().max(80).optional(),
    assetCode: z.string().trim().min(1).max(64).optional(),
    propertyPropertyId: z.string().uuid(),
    locationScope: z.enum(FACILITY_LOCATION_SCOPES).default("property"),
    buildingLabel: z.string().trim().max(80).optional(),
    floorLabel: z.string().trim().max(40).optional(),
    departmentLabel: z.string().trim().max(80).optional(),
    roomLabel: z.string().trim().max(80).optional(),
    locationNote: z.string().trim().max(240).optional(),
    manufacturer: z.string().trim().max(120).optional(),
    model: z.string().trim().max(120).optional(),
    serialNumber: z.string().trim().max(120).optional(),
    purchaseDate: z.string().date().optional(),
    warrantyStartsOn: z.string().date().optional(),
    warrantyEndsOn: z.string().date().optional(),
    warrantyNotes: z.string().trim().max(400).optional(),
    vendorId: z.string().uuid().optional(),
    scanCode: z.string().trim().max(120).optional(),
    notes: z.string().trim().max(2000).optional(),
    replacedAssetId: z.string().uuid().optional()
  })
  .superRefine((value, ctx) => {
    if (value.assetType === "other" && !value.customTypeLabel) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["customTypeLabel"],
        message: "Custom type label is required when type is Other."
      });
    }
  });
export type CreateFacilityAssetInput = z.infer<typeof createFacilityAssetInputSchema>;

export const updateFacilityAssetInputSchema = z
  .object({
    name: z.string().trim().min(2).max(160).optional(),
    assetType: z.enum(FACILITY_ASSET_TYPES).optional(),
    customTypeLabel: z.string().trim().max(80).optional(),
    assetCode: z.string().trim().min(1).max(64).optional(),
    propertyPropertyId: z.string().uuid().optional(),
    locationScope: z.enum(FACILITY_LOCATION_SCOPES).optional(),
    buildingLabel: z.string().trim().max(80).optional(),
    floorLabel: z.string().trim().max(40).optional(),
    departmentLabel: z.string().trim().max(80).optional(),
    roomLabel: z.string().trim().max(80).optional(),
    locationNote: z.string().trim().max(240).optional(),
    manufacturer: z.string().trim().max(120).optional(),
    model: z.string().trim().max(120).optional(),
    serialNumber: z.string().trim().max(120).optional(),
    purchaseDate: z.string().date().optional(),
    warrantyStartsOn: z.string().date().optional(),
    warrantyEndsOn: z.string().date().optional(),
    warrantyNotes: z.string().trim().max(400).optional(),
    vendorId: z.string().uuid().optional(),
    scanCode: z.string().trim().max(120).optional(),
    notes: z.string().trim().max(2000).optional(),
    replacedAssetId: z.string().uuid().optional(),
    status: z.enum(FACILITY_ASSET_STATUSES).optional()
  })
  .superRefine((value, ctx) => {
    if (value.assetType === "other" && !value.customTypeLabel) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["customTypeLabel"],
        message: "Custom type label is required when type is Other."
      });
    }
  });
export type UpdateFacilityAssetInput = z.infer<typeof updateFacilityAssetInputSchema>;

export const createFacilityAssetQrInputSchema = z.object({
  formId: z.string().uuid()
});
export type CreateFacilityAssetQrInput = z.infer<typeof createFacilityAssetQrInputSchema>;

export const createFacilityStockItemInputSchema = z.object({
  name: z.string().trim().min(2).max(160),
  category: z.enum(FACILITY_STOCK_CATEGORIES),
  unitOfMeasure: z.enum(FACILITY_STOCK_UNITS),
  propertyPropertyId: z.string().uuid(),
  storageLocationLabel: z.string().trim().min(1).max(160),
  minThreshold: z.number().nonnegative().optional(),
  reorderLevel: z.number().nonnegative().optional(),
  vendorId: z.string().uuid().optional(),
  skuCode: z.string().trim().max(80).optional(),
  notes: z.string().trim().max(2000).optional()
});
export type CreateFacilityStockItemInput = z.infer<typeof createFacilityStockItemInputSchema>;

export const applyFacilityStockMovementInputSchema = z.object({
  movementType: z.enum(FACILITY_STOCK_MOVEMENT_TYPES),
  quantity: z.number().refine((value) => value !== 0, "Quantity must be non-zero"),
  reason: z.string().trim().max(400).optional(),
  workOrderId: z.string().uuid().optional()
});
export type ApplyFacilityStockMovementInput = z.infer<typeof applyFacilityStockMovementInputSchema>;

export const FACILITY_ASSET_REPORT_TYPES = [
  "asset_list",
  "asset_status",
  "repair_history",
  "repair_frequency"
] as const;
export type FacilityAssetReportType = (typeof FACILITY_ASSET_REPORT_TYPES)[number];

export const FACILITY_INVENTORY_REPORT_TYPES = [
  "current_stock",
  "low_stock",
  "usage",
  "reorder"
] as const;
export type FacilityInventoryReportType = (typeof FACILITY_INVENTORY_REPORT_TYPES)[number];

export function isLowStock(input: {
  quantityOnHand: number;
  reorderLevel?: number | null;
  minThreshold?: number | null;
}): boolean {
  const threshold = input.reorderLevel ?? input.minThreshold;
  if (threshold == null) {
    return false;
  }
  return input.quantityOnHand <= threshold;
}

export function suggestedReorderQuantity(input: {
  quantityOnHand: number;
  reorderLevel?: number | null;
  minThreshold?: number | null;
}): number {
  const target = input.reorderLevel ?? input.minThreshold ?? 0;
  return Math.max(0, target - input.quantityOnHand);
}
