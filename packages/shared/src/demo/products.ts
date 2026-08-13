import { isProductSku, type ProductSku, toSkuLabel } from "../commercial/skus";

/** Demo product keys — one immersive experience each. */
export const DEMO_PRODUCTS = [
  "mpa_property_manager",
  "mpa_facility_operations",
  "mpa_complete_platform"
] as const;

export type DemoProductId = (typeof DEMO_PRODUCTS)[number];

export function isDemoProductId(value: unknown): value is DemoProductId {
  return typeof value === "string" && (DEMO_PRODUCTS as readonly string[]).includes(value);
}

export function demoProductToSku(product: DemoProductId): ProductSku {
  return product;
}

export function parseDemoProduct(value: string | null | undefined): DemoProductId | null {
  if (!value) {
    return null;
  }
  if (isDemoProductId(value)) {
    return value;
  }
  if (isProductSku(value) && isDemoProductId(value)) {
    return value;
  }
  return null;
}

export function toDemoProductLabel(product: DemoProductId): string {
  return `${toSkuLabel(product)} Demo`;
}

export function demoHonestyBanner(product: DemoProductId): string | null {
  if (product === "mpa_facility_operations") {
    return "Synthetic Facility Operations demonstration — work-order style surfaces only; not a live customer workspace.";
  }
  if (product === "mpa_complete_platform") {
    return "Complete Platform demo — one organization with property and facility workspaces; Facility areas show product shape; Property Manager areas are fully interactive.";
  }
  return null;
}
