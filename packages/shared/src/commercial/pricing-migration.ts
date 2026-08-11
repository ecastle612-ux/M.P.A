/**
 * Authorized $40 list-price reduction — Stripe Prices created 2026-08-10.
 *
 * Runtime checkout and public Pricing remain Stripe Price–ID driven via Vercel env.
 * NEW Prices exist in production Stripe. Vercel Production env cutover was blocked
 * in this agent (no VERCEL_TOKEN / Vercel MCP unauthenticated).
 *
 * Existing customers remain on existing Prices. FO/Complete stay enterprise-gated.
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
  /** Prior live Stripe unit_amount in cents. */
  currentUnitAmountCents: number | null;
  /** Authorized target unit_amount in cents after $40 reduction. */
  targetUnitAmountCents: number;
  /** Existing production Stripe Price ID (left intact for existing subscriptions). */
  existingStripePriceId: string | null;
  /** NEW Stripe Price created for future checkout / display after env cutover. */
  newStripePriceId: string | null;
  newStripePriceStatus:
    | "PENDING_STRIPE_OPERATOR_CREATION"
    | "CREATED_PENDING_VERCEL_ENV"
    | "LIVE_IN_PRODUCTION";
  selfServeCheckoutToday: boolean;
  notes: string;
};

export const AUTHORIZED_TARGET_UNIT_AMOUNTS_CENTS = {
  "mpa_property_manager__professional__monthly": 5900,
  "mpa_property_manager__professional__annual": 59000,
  "mpa_facility_operations__professional__monthly": 5900,
  "mpa_facility_operations__professional__annual": 59000,
  "mpa_complete_platform__professional__monthly": 10900,
  "mpa_complete_platform__professional__annual": 109000,
  "mpa_property_manager__business__monthly": 20900,
  "mpa_property_manager__business__annual": 245000
} as const satisfies Record<PricingMigrationOfferKey, number>;

/** Prior Prices (still active; existing subscriptions remain attached). */
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

/** NEW Prices created 2026-08-10 (production Stripe). Not yet wired in Vercel Production env. */
export const STRIPE_NEW_PRICES_40_REDUCTION_2026_08_10 = {
  "mpa_property_manager__professional__monthly": "price_1U31Z48jGrZYUXDteGv4gbSw",
  "mpa_property_manager__professional__annual": "price_1U31Z58jGrZYUXDt2d9wqG4p",
  "mpa_property_manager__business__monthly": "price_1U31Z58jGrZYUXDtMKIvMBCo",
  "mpa_property_manager__business__annual": "price_1U31Z68jGrZYUXDtfHZfdUMI",
  "mpa_facility_operations__professional__monthly": "price_1U31Z68jGrZYUXDtxN4pEhmQ",
  "mpa_facility_operations__professional__annual": "price_1U31Z68jGrZYUXDtZbyPva6V",
  "mpa_complete_platform__professional__monthly": "price_1U31Z78jGrZYUXDtZw1c648L",
  "mpa_complete_platform__professional__annual": "price_1U31Z78jGrZYUXDtJuCrMN4V"
} as const satisfies Record<PricingMigrationOfferKey, string>;

/** Required Vercel Production env updates (blocked in this agent — no Vercel credentials). */
export const VERCEL_PRODUCTION_PRICE_ENV_CUTOVER = {
  STRIPE_PRICE_PM_PROFESSIONAL_MONTHLY:
    STRIPE_NEW_PRICES_40_REDUCTION_2026_08_10.mpa_property_manager__professional__monthly,
  STRIPE_PRICE_PM_PROFESSIONAL_ANNUAL:
    STRIPE_NEW_PRICES_40_REDUCTION_2026_08_10.mpa_property_manager__professional__annual,
  STRIPE_PRICE_PM_BUSINESS_MONTHLY:
    STRIPE_NEW_PRICES_40_REDUCTION_2026_08_10.mpa_property_manager__business__monthly,
  STRIPE_PRICE_PM_BUSINESS_ANNUAL:
    STRIPE_NEW_PRICES_40_REDUCTION_2026_08_10.mpa_property_manager__business__annual,
  STRIPE_PRICE_FO_PROFESSIONAL_MONTHLY:
    STRIPE_NEW_PRICES_40_REDUCTION_2026_08_10.mpa_facility_operations__professional__monthly,
  STRIPE_PRICE_FO_PROFESSIONAL_ANNUAL:
    STRIPE_NEW_PRICES_40_REDUCTION_2026_08_10.mpa_facility_operations__professional__annual,
  STRIPE_PRICE_COMPLETE_PROFESSIONAL_MONTHLY:
    STRIPE_NEW_PRICES_40_REDUCTION_2026_08_10.mpa_complete_platform__professional__monthly,
  STRIPE_PRICE_COMPLETE_PROFESSIONAL_ANNUAL:
    STRIPE_NEW_PRICES_40_REDUCTION_2026_08_10.mpa_complete_platform__professional__annual
} as const;

export const PRICING_MIGRATION_ROWS: readonly PricingMigrationRow[] = [
  {
    offerKey: "mpa_property_manager__professional__monthly",
    productSku: "mpa_property_manager",
    planTier: "professional",
    billingCycle: "monthly",
    currentUnitAmountCents: 9900,
    targetUnitAmountCents: 5900,
    existingStripePriceId: STRIPE_INVENTORY_VERIFIED_2026_08_10.pmProfessionalMonthly.id,
    newStripePriceId: STRIPE_NEW_PRICES_40_REDUCTION_2026_08_10.mpa_property_manager__professional__monthly,
    newStripePriceStatus: "CREATED_PENDING_VERCEL_ENV",
    selfServeCheckoutToday: true,
    notes: "NEW Price created. Wire STRIPE_PRICE_PM_PROFESSIONAL_MONTHLY in Vercel Production."
  },
  {
    offerKey: "mpa_property_manager__professional__annual",
    productSku: "mpa_property_manager",
    planTier: "professional",
    billingCycle: "annual",
    currentUnitAmountCents: 99000,
    targetUnitAmountCents: 59000,
    existingStripePriceId: STRIPE_INVENTORY_VERIFIED_2026_08_10.pmProfessionalAnnual.id,
    newStripePriceId: STRIPE_NEW_PRICES_40_REDUCTION_2026_08_10.mpa_property_manager__professional__annual,
    newStripePriceStatus: "CREATED_PENDING_VERCEL_ENV",
    selfServeCheckoutToday: true,
    notes: "Authorized $590/year (not live−$40). Wire STRIPE_PRICE_PM_PROFESSIONAL_ANNUAL."
  },
  {
    offerKey: "mpa_property_manager__business__monthly",
    productSku: "mpa_property_manager",
    planTier: "business",
    billingCycle: "monthly",
    currentUnitAmountCents: 24900,
    targetUnitAmountCents: 20900,
    existingStripePriceId: STRIPE_INVENTORY_VERIFIED_2026_08_10.pmBusinessMonthly.id,
    newStripePriceId: STRIPE_NEW_PRICES_40_REDUCTION_2026_08_10.mpa_property_manager__business__monthly,
    newStripePriceStatus: "CREATED_PENDING_VERCEL_ENV",
    selfServeCheckoutToday: true,
    notes: "Wire STRIPE_PRICE_PM_BUSINESS_MONTHLY. Old Price remains for existing subs."
  },
  {
    offerKey: "mpa_property_manager__business__annual",
    productSku: "mpa_property_manager",
    planTier: "business",
    billingCycle: "annual",
    currentUnitAmountCents: 249000,
    targetUnitAmountCents: 245000,
    existingStripePriceId: STRIPE_INVENTORY_VERIFIED_2026_08_10.pmBusinessAnnual.id,
    newStripePriceId: STRIPE_NEW_PRICES_40_REDUCTION_2026_08_10.mpa_property_manager__business__annual,
    newStripePriceStatus: "CREATED_PENDING_VERCEL_ENV",
    selfServeCheckoutToday: true,
    notes: "Wire STRIPE_PRICE_PM_BUSINESS_ANNUAL. Old Price remains for existing subs."
  },
  {
    offerKey: "mpa_facility_operations__professional__monthly",
    productSku: "mpa_facility_operations",
    planTier: "professional",
    billingCycle: "monthly",
    currentUnitAmountCents: 9900,
    targetUnitAmountCents: 5900,
    existingStripePriceId: STRIPE_INVENTORY_VERIFIED_2026_08_10.foProfessionalMonthly.id,
    newStripePriceId:
      STRIPE_NEW_PRICES_40_REDUCTION_2026_08_10.mpa_facility_operations__professional__monthly,
    newStripePriceStatus: "CREATED_PENDING_VERCEL_ENV",
    selfServeCheckoutToday: false,
    notes: "Display-only after env cutover. Checkout stays enterprise_required."
  },
  {
    offerKey: "mpa_facility_operations__professional__annual",
    productSku: "mpa_facility_operations",
    planTier: "professional",
    billingCycle: "annual",
    currentUnitAmountCents: 99000,
    targetUnitAmountCents: 59000,
    existingStripePriceId: STRIPE_INVENTORY_VERIFIED_2026_08_10.foProfessionalAnnual.id,
    newStripePriceId:
      STRIPE_NEW_PRICES_40_REDUCTION_2026_08_10.mpa_facility_operations__professional__annual,
    newStripePriceStatus: "CREATED_PENDING_VERCEL_ENV",
    selfServeCheckoutToday: false,
    notes: "Display-only after env cutover. Checkout stays enterprise_required."
  },
  {
    offerKey: "mpa_complete_platform__professional__monthly",
    productSku: "mpa_complete_platform",
    planTier: "professional",
    billingCycle: "monthly",
    currentUnitAmountCents: 14900,
    targetUnitAmountCents: 10900,
    existingStripePriceId: STRIPE_INVENTORY_VERIFIED_2026_08_10.completeProfessionalMonthly.id,
    newStripePriceId:
      STRIPE_NEW_PRICES_40_REDUCTION_2026_08_10.mpa_complete_platform__professional__monthly,
    newStripePriceStatus: "CREATED_PENDING_VERCEL_ENV",
    selfServeCheckoutToday: false,
    notes: "Display-only after env cutover. Checkout stays enterprise_required."
  },
  {
    offerKey: "mpa_complete_platform__professional__annual",
    productSku: "mpa_complete_platform",
    planTier: "professional",
    billingCycle: "annual",
    currentUnitAmountCents: 149000,
    targetUnitAmountCents: 109000,
    existingStripePriceId: STRIPE_INVENTORY_VERIFIED_2026_08_10.completeProfessionalAnnual.id,
    newStripePriceId:
      STRIPE_NEW_PRICES_40_REDUCTION_2026_08_10.mpa_complete_platform__professional__annual,
    newStripePriceStatus: "CREATED_PENDING_VERCEL_ENV",
    selfServeCheckoutToday: false,
    notes: "Display-only after env cutover. Checkout stays enterprise_required."
  }
] as const;

export function targetUnitAmountCentsForOffer(offerKey: PricingMigrationOfferKey): number {
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
 * Until Vercel env points at the NEW Price IDs, live display remains on prior Prices.
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
