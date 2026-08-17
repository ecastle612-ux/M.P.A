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
      "Property operations for residential portfolios — properties and units, residents and leases, Tenant Portal, maintenance, vendors, documents and tables, reports, communications, and operational finance. Take rent online with Stripe. Choose bank payments, cards, or both."
  },
  mpa_facility_operations: {
    id: "facility_operations",
    label: "Facility Operations",
    description:
      "Facility operations for building teams — Mission Control, work orders, assignments, technician execution, vendors, assets, inventory, evidence, reports, and operational visibility across facility work categories."
  },
  mpa_complete_platform: {
    id: "complete_platform",
    label: "Complete Platform",
    description:
      "One organization and one subscription that includes both Property Operations and Facility Operations. Oversee both yourself, assign each side to a manager, keep an owner view of both, and move between work surfaces with the Complete launcher. Take rent online with Stripe — bank payments, cards, or both — when you operate in residential / property scope."
  }
};
