import { memberAllowsWorkSurface } from "../auth/operating-scope";
import type { WorkSurface } from "../maintenance/schemas";
import type { ProductSku } from "./skus";

/** Mirrors SQL public.org_allows_work_surface (ADR-026). SKU outer boundary only. */
export function orgAllowsWorkSurface(sku: ProductSku | null | undefined, surface: WorkSurface): boolean {
  return memberAllowsWorkSurface({ sku, storedScope: "both", surface });
}
