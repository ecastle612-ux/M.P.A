import { isBillingCycle, isPlanTier, type BillingCycle, type PlanTier } from "./plans";
import { isProductSku, SKU_SUMMARIES, type ProductSku } from "./skus";
import { COMMERCIAL_MODULES, modulesForSku, type CommercialModule } from "./modules";

/** Cookie / query key for pre-auth plan selection (acquisition funnel). */
export const ACQUISITION_SKU_PARAM = "intent";
export const ACQUISITION_PLAN_PARAM = "plan";
export const ACQUISITION_CYCLE_PARAM = "cycle";
export const ACQUISITION_UNITS_PARAM = "units";
export const ACQUISITION_QUOTE_PARAM = "quote";
export const ACQUISITION_SNAPSHOT_PARAM = "snapshot";
/** Browser session key — carry calculator units into the questionnaire. */
export const ACQUISITION_UNITS_SESSION_KEY = "mpa_acquisition_managed_units";
export const ACQUISITION_SKU_COOKIE = "mpa_acquisition_sku";
export const ACQUISITION_OFFER_COOKIE = "mpa_acquisition_offer";
export const ACQUISITION_QUOTE_COOKIE = "mpa_acquisition_quote";
export const ACQUISITION_SNAPSHOT_COOKIE = "mpa_acquisition_snapshot";

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
  managedUnits?: number | null;
  quoteId?: string | null;
  snapshotId?: string | null;
};

export function parseAcquisitionUnits(value: string | null | undefined): number | null {
  if (value == null || value === "") return null;
  const n = Number(String(value).replace(/,/g, "").trim());
  if (!Number.isFinite(n) || !Number.isInteger(n) || n <= 0) return null;
  return n;
}

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
  if (parts.managedUnits != null && parts.managedUnits > 0) {
    params.set(ACQUISITION_UNITS_PARAM, String(Math.floor(parts.managedUnits)));
  }
  if (parts.quoteId) {
    params.set(ACQUISITION_QUOTE_PARAM, parts.quoteId);
  }
  if (parts.snapshotId) {
    params.set(ACQUISITION_SNAPSHOT_PARAM, parts.snapshotId);
  }
  const q = params.toString();
  return q ? `?${q}` : "";
}

export type AcquisitionStep =
  | "questionnaire"
  | "modules"
  | "pricing"
  | "checkout"
  | "signup"
  | "enterprise";

/**
 * Builds public funnel hrefs for the three platform products.
 * Enterprise is a dedicated optional path (`step: "enterprise"`), not a product substitute.
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

  const q = buildQuery(query);
  switch (step) {
    case "questionnaire":
      return `/get-started${q}`;
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

/**
 * Next href after pricing — acquisition questionnaire, then Confirm Plan.
 * When a quote already exists, callers may use `acquisitionHref("checkout", { quoteId })`.
 * `planTier` is omitted from customer URLs (not a commercial product tier).
 */
/**
 * Stripe cancel return path for quote-authoritative (unit-volume) Checkout.
 * Must stay aligned with checkout cancel page recovery (`?quote=`).
 */
export function unitVolumeCheckoutCancelPath(quoteId: string): string {
  return `/checkout/cancel?${ACQUISITION_QUOTE_PARAM}=${encodeURIComponent(quoteId)}`;
}

/**
 * Stripe cancel return path for legacy offer-based Checkout.
 */
export function legacyOfferCheckoutCancelPath(offerId: string): string {
  return `/checkout/cancel?offer=${encodeURIComponent(offerId)}`;
}

export function commercialContinueHref(input: {
  productSku: ProductSku;
  planTier?: PlanTier | null;
  billingCycle: BillingCycle;
  managedUnits?: number | null;
  quoteId?: string | null;
  snapshotId?: string | null;
}): string {
  if (input.quoteId) {
    return acquisitionHref("checkout", {
      sku: input.productSku,
      billingCycle: input.billingCycle,
      quoteId: input.quoteId,
      snapshotId: input.snapshotId ?? null
    });
  }
  return acquisitionHref("questionnaire", {
    sku: input.productSku,
    billingCycle: input.billingCycle,
    managedUnits: input.managedUnits ?? null
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
