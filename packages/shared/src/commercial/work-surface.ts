import type { WorkSurface } from "../maintenance/schemas";
import type { ProductSku } from "./skus";

/** Mirrors SQL public.org_allows_work_surface (ADR-026). No new entitlement keys. */
export function orgAllowsWorkSurface(sku: ProductSku | null | undefined, surface: WorkSurface): boolean {
  if (!sku) {
    return false;
  }
  if (surface === "residential") {
    return sku === "mpa_property_manager" || sku === "mpa_complete_platform";
  }
  return sku === "mpa_facility_operations" || sku === "mpa_complete_platform";
}
