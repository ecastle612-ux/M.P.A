import { requiresEnterpriseMotion, validateCommercialSelection } from "./catalog";
import { isBillingCycle, isPlanTier, type BillingCycle, type PlanTier } from "./plans";
import { isProductSku, SKU_SUMMARIES, type ProductSku } from "./skus";
import { COMMERCIAL_MODULES, modulesForSku, type CommercialModule } from "./modules";

/** Cookie / query key for pre-auth plan selection (acquisition funnel). */
export const ACQUISITION_SKU_PARAM = "intent";
export const ACQUISITION_PLAN_PARAM = "plan";
export const ACQUISITION_CYCLE_PARAM = "cycle";
export const ACQUISITION_SKU_COOKIE = "mpa_acquisition_sku";
export const ACQUISITION_OFFER_COOKIE = "mpa_acquisition_offer";

export function parseAcquisitionSku(value: string | null | undefined): ProductSku | null {
  if (!value || !isProductSku(value)) {
    return null;
  }
  return value;
}

export function parseAcquisitionPlan(value: string | null | undefined): PlanTier | null {
  return isPlanTier(value) ? value : null;
}

export function parseAcquisitionCycle(value: string | null | undefined): BillingCycle | null {
  return isBillingCycle(value) ? value : null;
}

export type AcquisitionQuery = {
  sku?: ProductSku | null;
  planTier?: PlanTier | null;
  billingCycle?: BillingCycle | null;
};

function buildQuery(parts: AcquisitionQuery): string {
  const params = new URLSearchParams();
  if (parts.sku) {
    params.set(ACQUISITION_SKU_PARAM, parts.sku);
  }
  if (parts.planTier) {
    params.set(ACQUISITION_PLAN_PARAM, parts.planTier);
  }
  if (parts.billingCycle) {
    params.set(ACQUISITION_CYCLE_PARAM, parts.billingCycle);
  }
  const q = params.toString();
  return q ? `?${q}` : "";
}

export type AcquisitionStep =
  | "modules"
  | "pricing"
  | "checkout"
  | "signup"
  | "enterprise";

/**
 * Builds public funnel hrefs. FO/Complete (pre–FO-READY) resolve to Enterprise.
 */
export function acquisitionHref(
  step: AcquisitionStep,
  skuOrQuery?: ProductSku | null | AcquisitionQuery
): string {
  const query: AcquisitionQuery =
    typeof skuOrQuery === "string" || skuOrQuery === null || skuOrQuery === undefined
      ? { sku: skuOrQuery ?? null }
      : skuOrQuery;

  if (step === "enterprise") {
    return `/enterprise${buildQuery({ sku: query.sku ?? null })}`;
  }

  if (query.sku && requiresEnterpriseMotion(query.sku) && (step === "checkout" || step === "signup")) {
    return `/enterprise${buildQuery({ sku: query.sku })}`;
  }

  if (query.sku && step === "checkout") {
    const validation = validateCommercialSelection({
      productSku: query.sku,
      planTier: query.planTier ?? "professional",
      billingCycle: query.billingCycle ?? "monthly"
    });
    if (validation.route === "enterprise") {
      return `/enterprise${buildQuery({ sku: query.sku })}`;
    }
  }

  const q = buildQuery(query);
  switch (step) {
    case "modules":
      return `/modules${q}`;
    case "pricing":
      return `/pricing${q}`;
    case "checkout":
      return `/checkout${q}`;
    case "signup":
      return query.sku
        ? `/login?mode=sign_up&${ACQUISITION_SKU_PARAM}=${encodeURIComponent(query.sku)}`
        : "/login?mode=sign_up";
    default:
      return "/";
  }
}

/** Next href after pricing/confirm selection — Confirm Plan or Enterprise. */
export function commercialContinueHref(input: {
  productSku: ProductSku;
  planTier: PlanTier;
  billingCycle: BillingCycle;
}): string {
  const result = validateCommercialSelection(input);
  if (result.route === "enterprise") {
    return acquisitionHref("enterprise", { sku: input.productSku });
  }
  return acquisitionHref("checkout", {
    sku: input.productSku,
    planTier: input.planTier,
    billingCycle: input.billingCycle
  });
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
