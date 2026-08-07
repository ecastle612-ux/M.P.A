export const PRODUCT_SKUS = [
  "mpa_property_manager",
  "mpa_facility_operations",
  "mpa_complete_platform"
] as const;

export type ProductSku = (typeof PRODUCT_SKUS)[number];

export type CommercialProductId = "property_manager" | "facility_operations" | "complete_platform";

export function isProductSku(value: unknown): value is ProductSku {
  return typeof value === "string" && (PRODUCT_SKUS as readonly string[]).includes(value);
}

export function toSkuLabel(sku: ProductSku): string {
  switch (sku) {
    case "mpa_property_manager":
      return "Property Manager";
    case "mpa_facility_operations":
      return "Facility Operations";
    case "mpa_complete_platform":
      return "Complete Platform";
    default:
      return "Unknown";
  }
}

export function toCommercialProductId(sku: ProductSku): CommercialProductId {
  switch (sku) {
    case "mpa_property_manager":
      return "property_manager";
    case "mpa_facility_operations":
      return "facility_operations";
    case "mpa_complete_platform":
      return "complete_platform";
    default:
      return "property_manager";
  }
}

export function skuIncludesPropertyManager(sku: ProductSku): boolean {
  return sku === "mpa_property_manager" || sku === "mpa_complete_platform";
}

export function skuIncludesFacilityOperations(sku: ProductSku): boolean {
  return sku === "mpa_facility_operations" || sku === "mpa_complete_platform";
}

export const SKU_SUMMARIES: Record<
  ProductSku,
  { id: CommercialProductId; label: string; description: string }
> = {
  mpa_property_manager: {
    id: "property_manager",
    label: "Property Manager",
    description:
      "Portfolio operations you can run after setup — properties, residents, leasing, maintenance, vendors, financial operations, documents, and communications, plus resident, owner, and vendor portals."
  },
  mpa_facility_operations: {
    id: "facility_operations",
    label: "Facility Operations",
    description:
      "M.P.A.'s Facility Operations product for facility and building teams. Includes a dedicated Facility home and module areas for assets, inventory, parts, preventive maintenance, inspections, safety, compliance, and building systems. Your plan is activated with your organization during onboarding."
  },
  mpa_complete_platform: {
    id: "complete_platform",
    label: "Complete Platform",
    description:
      "Property Manager and Facility Operations together — one organization, shared documents and communications, and both product homes. Property Manager access begins at setup; Facility Operations is activated with your organization during onboarding."
  }
};
