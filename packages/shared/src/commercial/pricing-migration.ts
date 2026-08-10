/**
 * Authorized $40 list-price reduction — preparation only.
 *
 * Runtime checkout and public Pricing remain Stripe Price–ID driven via env.
 * This module records TARGET unit amounts and migration status. It does NOT
 * invent production Stripe Price IDs and does NOT migrate existing subscriptions.
 *
 * Activation: Stripe operator creates NEW Prices at these targets, then updates
 * Vercel `STRIPE_PRICE_*` env mappings. Existing customers stay on existing Prices.
 */

import type { BillingCycle } from "./plans";
import type { ProductSku } from "./skus";

/** Public / checkout-facing offers in the authorized reduction (professional catalog). */
export type PublicPricingOfferKey =
  | "mpa_property_manager__professional__monthly"
  | "mpa_property_manager__professional__annual"
  | "mpa_facility_operations__professional__monthly"
  | "mpa_facility_operations__professional__annual"
  | "mpa_complete_platform__professional__monthly"
  | "mpa_complete_platform__professional__annual";

/** Internal PM Business offers (not customer-facing SaaS tiers on marketing). */
export type PmBusinessOfferKey =
  | "mpa_property_manager__business__monthly"
  | "mpa_property_manager__business__annual";

export type PricingMigrationOfferKey = PublicPricingOfferKey | PmBusinessOfferKey;

export type PricingMigrationRow = {
  offerKey: PricingMigrationOfferKey;
  productSku: ProductSku;
  planTier: "professional" | "business";
  billingCycle: BillingCycle;
  /** Verified live Stripe unit_amount in cents (read-only inventory), when known. */
  currentUnitAmountCents: number | null;
  /** Authorized target unit_amount in cents after $40 reduction. */
  targetUnitAmountCents: number;
  /**
   * Existing production Stripe Price ID when verified in the Stripe account.
   * Null when operator must confirm Vercel env mapping.
   */
  existingStripePriceId: string | null;
  /** Always pending until operator creates a NEW Price (never invent). */
  newStripePriceId: null;
  newStripePriceStatus: "PENDING_STRIPE_OPERATOR_CREATION";
  /**
   * Public self-serve checkout today? FO/Complete remain enterprise-gated until FO_READY.
   */
  selfServeCheckoutToday: boolean;
  notes: string;
};

/**
 * Authorized TARGET list prices (Owner-authorized preparation).
 * Annual targets are absolute Owner figures ($590 / $1,090), not “live − $40”
 * when live annual differs from the audit’s stated current annual.
 */
export const AUTHORIZED_TARGET_UNIT_AMOUNTS_CENTS = {
  "mpa_property_manager__professional__monthly": 5900,
  "mpa_property_manager__professional__annual": 59000,
  "mpa_facility_operations__professional__monthly": 5900,
  "mpa_facility_operations__professional__annual": 59000,
  "mpa_complete_platform__professional__monthly": 10900,
  "mpa_complete_platform__professional__annual": 109000,
  /** Business: verified live $249 / $2,490 → $40 reduction. */
  "mpa_property_manager__business__monthly": 20900,
  "mpa_property_manager__business__annual": 245000
} as const satisfies Record<PricingMigrationOfferKey, number>;

/**
 * Read-only Stripe inventory snapshot (2026-08-10) from the production Stripe account.
 * Provisional Professional/Business products are the only PM amounts present;
 * official catalog lookup keys exist for FO/Complete only.
 *
 * Vercel env → Price ID binding still requires operator confirmation.
 */
export const STRIPE_INVENTORY_VERIFIED_2026_08_10 = {
  pmProfessionalMonthly: {
    id: "price_1Tw3Cb8jGrZYUXDtQwHvaXFW",
    unitAmountCents: 9900,
    interval: "month" as const,
    productName: "M.P.A. Professional",
    provisional: true
  },
  pmProfessionalAnnual: {
    id: "price_1Tw3Cc8jGrZYUXDtoMZ4ypxU",
    unitAmountCents: 99000,
    interval: "year" as const,
    productName: "M.P.A. Professional",
    provisional: true
  },
  pmBusinessMonthly: {
    id: "price_1Tw3Cd8jGrZYUXDtQTEZdC4G",
    unitAmountCents: 24900,
    interval: "month" as const,
    productName: "M.P.A. Business",
    provisional: true
  },
  pmBusinessAnnual: {
    id: "price_1Tw3Cd8jGrZYUXDt8nQgBomF",
    unitAmountCents: 249000,
    interval: "year" as const,
    productName: "M.P.A. Business",
    provisional: true
  },
  foProfessionalMonthly: {
    id: "price_1U2O9M8jGrZYUXDtuoUU9jVQ",
    unitAmountCents: 9900,
    interval: "month" as const,
    lookupKey: "mpa_facility_operations__professional__monthly"
  },
  foProfessionalAnnual: {
    id: "price_1U2O9N8jGrZYUXDt28S1FwxK",
    unitAmountCents: 99000,
    interval: "year" as const,
    lookupKey: "mpa_facility_operations__professional__annual"
  },
  completeProfessionalMonthly: {
    id: "price_1U2O9N8jGrZYUXDtqwDqgobS",
    unitAmountCents: 14900,
    interval: "month" as const,
    lookupKey: "mpa_complete_platform__professional__monthly"
  },
  completeProfessionalAnnual: {
    id: "price_1U2O9N8jGrZYUXDtsAhAkcTD",
    unitAmountCents: 149000,
    interval: "year" as const,
    lookupKey: "mpa_complete_platform__professional__annual"
  }
} as const;

/** Migration table — new Price IDs remain pending. */
export const PRICING_MIGRATION_ROWS: readonly PricingMigrationRow[] = [
  {
    offerKey: "mpa_property_manager__professional__monthly",
    productSku: "mpa_property_manager",
    planTier: "professional",
    billingCycle: "monthly",
    currentUnitAmountCents: 9900,
    targetUnitAmountCents: 5900,
    existingStripePriceId: STRIPE_INVENTORY_VERIFIED_2026_08_10.pmProfessionalMonthly.id,
    newStripePriceId: null,
    newStripePriceStatus: "PENDING_STRIPE_OPERATOR_CREATION",
    selfServeCheckoutToday: true,
    notes:
      "Public PM monthly. Live inventory is provisional Professional $99. Confirm Vercel STRIPE_PRICE_PM_PROFESSIONAL_MONTHLY maps to this ID before cutover."
  },
  {
    offerKey: "mpa_property_manager__professional__annual",
    productSku: "mpa_property_manager",
    planTier: "professional",
    billingCycle: "annual",
    currentUnitAmountCents: 99000,
    targetUnitAmountCents: 59000,
    existingStripePriceId: STRIPE_INVENTORY_VERIFIED_2026_08_10.pmProfessionalAnnual.id,
    newStripePriceId: null,
    newStripePriceStatus: "PENDING_STRIPE_OPERATOR_CREATION",
    selfServeCheckoutToday: true,
    notes:
      "Live Stripe annual is $990 (10× monthly), not the audit’s stated $630. Authorized TARGET remains $590/year. Confirm Vercel STRIPE_PRICE_PM_PROFESSIONAL_ANNUAL."
  },
  {
    offerKey: "mpa_property_manager__business__monthly",
    productSku: "mpa_property_manager",
    planTier: "business",
    billingCycle: "monthly",
    currentUnitAmountCents: 24900,
    targetUnitAmountCents: 20900,
    existingStripePriceId: STRIPE_INVENTORY_VERIFIED_2026_08_10.pmBusinessMonthly.id,
    newStripePriceId: null,
    newStripePriceStatus: "PENDING_STRIPE_OPERATOR_CREATION",
    selfServeCheckoutToday: true,
    notes:
      "Internal PM Business monthly — verified live $249. Target $209 ($40 off). Confirm Vercel STRIPE_PRICE_PM_BUSINESS_MONTHLY."
  },
  {
    offerKey: "mpa_property_manager__business__annual",
    productSku: "mpa_property_manager",
    planTier: "business",
    billingCycle: "annual",
    currentUnitAmountCents: 249000,
    targetUnitAmountCents: 245000,
    existingStripePriceId: STRIPE_INVENTORY_VERIFIED_2026_08_10.pmBusinessAnnual.id,
    newStripePriceId: null,
    newStripePriceStatus: "PENDING_STRIPE_OPERATOR_CREATION",
    selfServeCheckoutToday: true,
    notes:
      "Internal PM Business annual — verified live $2,490. Target $2,450 ($40 off). Confirm Vercel STRIPE_PRICE_PM_BUSINESS_ANNUAL."
  },
  {
    offerKey: "mpa_facility_operations__professional__monthly",
    productSku: "mpa_facility_operations",
    planTier: "professional",
    billingCycle: "monthly",
    currentUnitAmountCents: 9900,
    targetUnitAmountCents: 5900,
    existingStripePriceId: STRIPE_INVENTORY_VERIFIED_2026_08_10.foProfessionalMonthly.id,
    newStripePriceId: null,
    newStripePriceStatus: "PENDING_STRIPE_OPERATOR_CREATION",
    selfServeCheckoutToday: false,
    notes: "Display-only until FO_READY. Keep EARLY ACCESS · NOT ONLINE YET. Checkout stays enterprise_required."
  },
  {
    offerKey: "mpa_facility_operations__professional__annual",
    productSku: "mpa_facility_operations",
    planTier: "professional",
    billingCycle: "annual",
    currentUnitAmountCents: 99000,
    targetUnitAmountCents: 59000,
    existingStripePriceId: STRIPE_INVENTORY_VERIFIED_2026_08_10.foProfessionalAnnual.id,
    newStripePriceId: null,
    newStripePriceStatus: "PENDING_STRIPE_OPERATOR_CREATION",
    selfServeCheckoutToday: false,
    notes:
      "Live annual $990; authorized TARGET $590/year. Display-only; enterprise-gated checkout."
  },
  {
    offerKey: "mpa_complete_platform__professional__monthly",
    productSku: "mpa_complete_platform",
    planTier: "professional",
    billingCycle: "monthly",
    currentUnitAmountCents: 14900,
    targetUnitAmountCents: 10900,
    existingStripePriceId: STRIPE_INVENTORY_VERIFIED_2026_08_10.completeProfessionalMonthly.id,
    newStripePriceId: null,
    newStripePriceStatus: "PENDING_STRIPE_OPERATOR_CREATION",
    selfServeCheckoutToday: false,
    notes: "Display-only until FO_READY. Keep CONSULTATION · NOT ONLINE YET."
  },
  {
    offerKey: "mpa_complete_platform__professional__annual",
    productSku: "mpa_complete_platform",
    planTier: "professional",
    billingCycle: "annual",
    currentUnitAmountCents: 149000,
    targetUnitAmountCents: 109000,
    existingStripePriceId: STRIPE_INVENTORY_VERIFIED_2026_08_10.completeProfessionalAnnual.id,
    newStripePriceId: null,
    newStripePriceStatus: "PENDING_STRIPE_OPERATOR_CREATION",
    selfServeCheckoutToday: false,
    notes:
      "Live annual $1,490; authorized TARGET $1,090/year. Display-only; enterprise-gated checkout."
  }
] as const;

export function targetUnitAmountCentsForOffer(
  offerKey: PricingMigrationOfferKey
): number {
  return AUTHORIZED_TARGET_UNIT_AMOUNTS_CENTS[offerKey];
}

export function pricingMigrationRowForOffer(
  offerKey: PricingMigrationOfferKey
): PricingMigrationRow {
  const row = PRICING_MIGRATION_ROWS.find((r) => r.offerKey === offerKey);
  if (!row) {
    throw new Error(`Missing pricing migration row for ${offerKey}`);
  }
  return row;
}

/**
 * Truth rule: public UI must not show a list amount that Checkout cannot charge.
 * Until new Stripe Prices exist and env mappings point at them, live display stays
 * Stripe-retrieve based (current Prices). Targets are preparation-only.
 */
export function publicListPriceMayShowTarget(input: {
  offerKey: PublicPricingOfferKey;
  configuredCheckoutPriceId: string | null;
  newStripePriceId: string | null;
}): boolean {
  if (!input.configuredCheckoutPriceId || !input.newStripePriceId) {
    return false;
  }
  return input.configuredCheckoutPriceId === input.newStripePriceId;
}
