import { FO_READY } from "./commerce-flags";
import { entitlementsForSku, type EntitlementKey } from "./entitlements";
import {
  BILLING_CYCLES,
  type BillingCycle,
  type PlanTier,
  isBillingCycle,
  isPlanTier
} from "./plans";
import { PRODUCT_SKUS, type ProductSku, isProductSku } from "./skus";

export type CommercialMotion = "self_serve" | "enterprise_sales";

/**
 * Canonical sellable offer — future Stripe Price ids plug in here (Slice C).
 * Seat/property commercial limits removed — unit-volume is the capacity model.
 */
export type CatalogOffer = {
  id: string;
  productSku: ProductSku;
  planTier: PlanTier;
  billingCycle: BillingCycle | null;
  motion: CommercialMotion;
  /** False until FO-READY for FO/Complete; always false for Enterprise / Business. */
  selfServeEligible: boolean;
  /** Reserved for Slice C — null until Prices are published. */
  stripePriceId: string | null;
  label: string;
};

function offerId(sku: ProductSku, tier: PlanTier, cycle: BillingCycle | null): string {
  return cycle ? `${sku}__${tier}__${cycle}` : `${sku}__${tier}`;
}

function buildSelfServePmOffers(): CatalogOffer[] {
  const offers: CatalogOffer[] = [];
  for (const tier of ["professional", "business"] as const) {
    for (const cycle of BILLING_CYCLES) {
      offers.push({
        id: offerId("mpa_property_manager", tier, cycle),
        productSku: "mpa_property_manager",
        planTier: tier,
        billingCycle: cycle,
        motion: "self_serve",
        // Business is not a customer product — keep offer id for legacy mapping only.
        selfServeEligible: tier === "professional",
        stripePriceId: null,
        label:
          tier === "professional"
            ? `Property Manager (${cycle})`
            : `Property Manager legacy business (${cycle})`
      });
    }
  }
  return offers;
}

function buildEnterpriseOffers(): CatalogOffer[] {
  return PRODUCT_SKUS.map((sku) => ({
    id: offerId(sku, "enterprise", null),
    productSku: sku,
    planTier: "enterprise" as const,
    billingCycle: null,
    motion: "enterprise_sales" as const,
    selfServeEligible: false,
    stripePriceId: null,
    label: `${sku === "mpa_property_manager" ? "Property Manager" : sku === "mpa_facility_operations" ? "Facility Operations" : "Complete Platform"} Enterprise`
  }));
}

/** FO / Complete self-serve placeholders — not eligible until FO_READY. */
function buildFutureFoSelfServeOffers(): CatalogOffer[] {
  const skus: ProductSku[] = ["mpa_facility_operations", "mpa_complete_platform"];
  const offers: CatalogOffer[] = [];
  for (const sku of skus) {
    for (const tier of ["professional", "business"] as const) {
      for (const cycle of BILLING_CYCLES) {
        offers.push({
          id: offerId(sku, tier, cycle),
          productSku: sku,
          planTier: tier,
          billingCycle: cycle,
          motion: "self_serve",
          selfServeEligible: FO_READY && tier === "professional",
          stripePriceId: null,
          label: `${sku} ${tier} ${cycle}`
        });
      }
    }
  }
  return offers;
}

/** Full catalog — single source of truth for Slice A+. */
export const CATALOG_OFFERS: readonly CatalogOffer[] = [
  ...buildSelfServePmOffers(),
  ...buildFutureFoSelfServeOffers(),
  ...buildEnterpriseOffers()
];

export function listCatalogOffers(): readonly CatalogOffer[] {
  return CATALOG_OFFERS;
}

export function getCatalogOfferById(id: string): CatalogOffer | null {
  return CATALOG_OFFERS.find((offer) => offer.id === id) ?? null;
}

export function resolveCatalogOffer(input: {
  productSku: ProductSku;
  planTier: PlanTier;
  billingCycle?: BillingCycle | null;
}): CatalogOffer | null {
  const cycle = input.planTier === "enterprise" ? null : (input.billingCycle ?? null);
  if (input.planTier !== "enterprise" && !cycle) {
    return null;
  }
  return (
    CATALOG_OFFERS.find(
      (offer) =>
        offer.productSku === input.productSku &&
        offer.planTier === input.planTier &&
        offer.billingCycle === cycle
    ) ?? null
  );
}

export function isSelfServeCheckoutAllowed(offer: CatalogOffer): boolean {
  return offer.motion === "self_serve" && offer.selfServeEligible === true;
}

/**
 * Entitlement preparation for an offer — module keys only.
 * Capacity is unit-volume (see `unit-volume.ts`), not seat/property caps.
 */
export type OfferEntitlementPrep = {
  offerId: string;
  productSku: ProductSku;
  planTier: PlanTier;
  entitlementKeys: EntitlementKey[];
};

export function prepareOfferEntitlements(offer: CatalogOffer): OfferEntitlementPrep {
  return {
    offerId: offer.id,
    productSku: offer.productSku,
    planTier: offer.planTier,
    entitlementKeys: entitlementsForSku(offer.productSku)
  };
}

/** Product requires Enterprise workflow (not Confirm Plan / future Checkout). */
export function requiresEnterpriseMotion(productSku: ProductSku): boolean {
  if (productSku === "mpa_property_manager") {
    return false;
  }
  return !FO_READY;
}

export function selfServeOffersForSku(productSku: ProductSku): CatalogOffer[] {
  return CATALOG_OFFERS.filter(
    (offer) => offer.productSku === productSku && isSelfServeCheckoutAllowed(offer)
  );
}

export function parseOfferQuery(params: {
  intent?: string | null;
  plan?: string | null;
  cycle?: string | null;
}): { productSku: ProductSku | null; planTier: PlanTier | null; billingCycle: BillingCycle | null } {
  const productSku = isProductSku(params.intent) ? params.intent : null;
  const planTier = isPlanTier(params.plan) ? params.plan : null;
  const billingCycle = isBillingCycle(params.cycle) ? params.cycle : null;
  return { productSku, planTier, billingCycle };
}

export type OfferValidationResult =
  | { ok: true; offer: CatalogOffer; route: "confirm_plan" }
  | { ok: true; offer: CatalogOffer; route: "enterprise" }
  | { ok: false; reason: string; route: "enterprise" | "modules" };

/**
 * Validates a commercial selection for the public funnel (Slice A — no payment).
 */
export function validateCommercialSelection(input: {
  productSku: ProductSku;
  planTier?: PlanTier | null;
  billingCycle?: BillingCycle | null;
}): OfferValidationResult {
  if (requiresEnterpriseMotion(input.productSku) || input.planTier === "enterprise") {
    const offer =
      resolveCatalogOffer({
        productSku: input.productSku,
        planTier: "enterprise",
        billingCycle: null
      }) ?? CATALOG_OFFERS.find((o) => o.productSku === input.productSku && o.planTier === "enterprise");
    if (!offer) {
      return { ok: false, reason: "enterprise_offer_missing", route: "enterprise" };
    }
    return { ok: true, offer, route: "enterprise" };
  }

  const planTier = input.planTier ?? "professional";
  const billingCycle = input.billingCycle ?? "monthly";

  const offer = resolveCatalogOffer({
    productSku: input.productSku,
    planTier,
    billingCycle
  });
  if (!offer) {
    return { ok: false, reason: "offer_not_found", route: "modules" };
  }
  if (!isSelfServeCheckoutAllowed(offer)) {
    return { ok: true, offer, route: "enterprise" };
  }
  return { ok: true, offer, route: "confirm_plan" };
}
