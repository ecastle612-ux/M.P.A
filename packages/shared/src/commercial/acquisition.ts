import { isProductSku, SKU_SUMMARIES, type ProductSku } from "./skus";
import { COMMERCIAL_MODULES, modulesForSku, type CommercialModule } from "./modules";

/** Cookie / query key for pre-auth plan selection (acquisition funnel). */
export const ACQUISITION_SKU_PARAM = "intent";
export const ACQUISITION_SKU_COOKIE = "mpa_acquisition_sku";

export function parseAcquisitionSku(value: string | null | undefined): ProductSku | null {
  if (!value || !isProductSku(value)) {
    return null;
  }
  return value;
}

export function acquisitionHref(step: "modules" | "pricing" | "checkout" | "signup", sku?: ProductSku | null): string {
  const q = sku ? `?${ACQUISITION_SKU_PARAM}=${encodeURIComponent(sku)}` : "";
  switch (step) {
    case "modules":
      return `/modules${q}`;
    case "pricing":
      return `/pricing${q}`;
    case "checkout":
      return `/checkout${q}`;
    case "signup":
      return sku
        ? `/login?mode=sign_up&${ACQUISITION_SKU_PARAM}=${encodeURIComponent(sku)}`
        : "/login?mode=sign_up";
    default:
      return "/";
  }
}

/** Marketing catalog: never advertise Capital Projects. */
export function marketingModulesForOwner(
  owner: CommercialModule["owner"]
): CommercialModule[] {
  return COMMERCIAL_MODULES.filter(
    (module) => module.owner === owner && module.id !== "capital_projects"
  );
}

export function marketingModulesForSku(sku: ProductSku): CommercialModule[] {
  return modulesForSku(sku).filter((module) => module.id !== "capital_projects");
}

export function skuComparisonRows(): Array<{
  id: string;
  label: string;
  owner: CommercialModule["owner"];
  pm: boolean;
  fo: boolean;
  complete: boolean;
}> {
  const pm = new Set(marketingModulesForSku("mpa_property_manager").map((m) => m.id));
  const fo = new Set(marketingModulesForSku("mpa_facility_operations").map((m) => m.id));
  const complete = new Set(marketingModulesForSku("mpa_complete_platform").map((m) => m.id));
  const seen = new Set<string>();
  const rows: Array<{
    id: string;
    label: string;
    owner: CommercialModule["owner"];
    pm: boolean;
    fo: boolean;
    complete: boolean;
  }> = [];

  for (const module of COMMERCIAL_MODULES) {
    if (module.id === "capital_projects" || seen.has(module.id)) {
      continue;
    }
    seen.add(module.id);
    rows.push({
      id: module.id,
      label: module.label,
      owner: module.owner,
      pm: pm.has(module.id),
      fo: fo.has(module.id),
      complete: complete.has(module.id)
    });
  }
  return rows;
}

export function describeSkuSelection(sku: ProductSku): { label: string; description: string } {
  const summary = SKU_SUMMARIES[sku];
  return { label: summary.label, description: summary.description };
}
