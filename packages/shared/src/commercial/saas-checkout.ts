import {
  getCatalogOfferById,
  isSelfServeCheckoutAllowed,
  resolveCatalogOffer,
  type CatalogOffer
} from "./catalog";
import { COM_002_FLAGS } from "./commerce-flags";
import type { BillingCycle, PlanTier } from "./plans";
import type { ProductSku } from "./skus";

/** SaaS money-domain marker — never reuse FIN-OPS handlers. */
export const SAAS_MONEY_DOMAIN = "saas_billing" as const;

export const SAAS_METADATA_KEYS = {
  moneyDomain: "mpa_money_domain",
  productSku: "mpa_product_sku",
  planTier: "mpa_plan_tier",
  billingCycle: "mpa_billing_cycle",
  catalogOfferId: "mpa_catalog_offer_id",
  seatLimit: "mpa_seat_limit",
  propertyLimit: "mpa_property_limit",
  demoSessionId: "mpa_demo_session_id"
} as const;

/** Env var names holding Stripe Price ids for self-serve PM offers. */
export const SAAS_PRICE_ENV_KEYS = {
  "mpa_property_manager__professional__monthly": "STRIPE_PRICE_PM_PROFESSIONAL_MONTHLY",
  "mpa_property_manager__professional__annual": "STRIPE_PRICE_PM_PROFESSIONAL_ANNUAL",
  "mpa_property_manager__business__monthly": "STRIPE_PRICE_PM_BUSINESS_MONTHLY",
  "mpa_property_manager__business__annual": "STRIPE_PRICE_PM_BUSINESS_ANNUAL"
} as const;

export type SaasPriceOfferId = keyof typeof SAAS_PRICE_ENV_KEYS;

export function saasPriceEnvKeyForOfferId(offerId: string): string | null {
  if (offerId in SAAS_PRICE_ENV_KEYS) {
    return SAAS_PRICE_ENV_KEYS[offerId as SaasPriceOfferId];
  }
  return null;
}

export type SaasCheckoutRequest = {
  productSku: ProductSku;
  planTier: PlanTier;
  billingCycle: BillingCycle;
  customerEmail?: string | null;
  demoSessionId?: string | null;
  /** Client idempotency token (optional). */
  idempotencyKey?: string | null;
};

export type SaasCheckoutValidation =
  | {
      ok: true;
      offer: CatalogOffer;
    }
  | {
      ok: false;
      reason:
        | "slice_disabled"
        | "enterprise_required"
        | "offer_not_found"
        | "not_self_serve"
        | "invalid_plan"
        | "price_unconfigured";
      route?: "enterprise" | "pricing";
    };

export function validateSaasCheckoutRequest(
  input: SaasCheckoutRequest,
  resolvePriceId: (offerId: string) => string | null = () => null
): SaasCheckoutValidation {
  if (!COM_002_FLAGS.sliceC_stripeCheckout) {
    return { ok: false, reason: "slice_disabled" };
  }
  if (input.productSku !== "mpa_property_manager" || input.planTier === "enterprise") {
    return { ok: false, reason: "enterprise_required", route: "enterprise" };
  }
  if (input.planTier !== "professional" && input.planTier !== "business") {
    return { ok: false, reason: "invalid_plan", route: "pricing" };
  }

  const offer = resolveCatalogOffer({
    productSku: input.productSku,
    planTier: input.planTier,
    billingCycle: input.billingCycle
  });
  if (!offer) {
    return { ok: false, reason: "offer_not_found", route: "pricing" };
  }
  if (!isSelfServeCheckoutAllowed(offer)) {
    return { ok: false, reason: "not_self_serve", route: "enterprise" };
  }
  const priceId = resolvePriceId(offer.id) ?? offer.stripePriceId;
  if (!priceId) {
    return { ok: false, reason: "price_unconfigured", route: "pricing" };
  }
  return { ok: true, offer: { ...offer, stripePriceId: priceId } };
}

export function buildSaasCheckoutMetadata(input: {
  offer: CatalogOffer;
  demoSessionId?: string | null;
}): Record<string, string> {
  const meta: Record<string, string> = {
    [SAAS_METADATA_KEYS.moneyDomain]: SAAS_MONEY_DOMAIN,
    [SAAS_METADATA_KEYS.productSku]: input.offer.productSku,
    [SAAS_METADATA_KEYS.planTier]: input.offer.planTier,
    [SAAS_METADATA_KEYS.billingCycle]: input.offer.billingCycle ?? "",
    [SAAS_METADATA_KEYS.catalogOfferId]: input.offer.id,
    [SAAS_METADATA_KEYS.seatLimit]: String(input.offer.seatLimit ?? ""),
    [SAAS_METADATA_KEYS.propertyLimit]: String(input.offer.propertyLimit ?? "")
  };
  if (input.demoSessionId) {
    meta[SAAS_METADATA_KEYS.demoSessionId] = input.demoSessionId;
  }
  return meta;
}

export function isSaasCheckoutMetadata(meta: Record<string, string> | null | undefined): boolean {
  return meta?.[SAAS_METADATA_KEYS.moneyDomain] === SAAS_MONEY_DOMAIN;
}

export function assertSaasOfferMatchesPrice(input: {
  offerId: string;
  priceId: string;
  resolvePriceId: (offerId: string) => string | null;
}): boolean {
  const expected = input.resolvePriceId(input.offerId);
  return Boolean(expected && expected === input.priceId);
}

export function getSelfServeSaasOffers(): CatalogOffer[] {
  return ["professional", "business"].flatMap((tier) =>
    (["monthly", "annual"] as const).map((cycle) => {
      const id = `mpa_property_manager__${tier}__${cycle}`;
      return getCatalogOfferById(id)!;
    })
  );
}

/** Pending purchase record — Slice C only; provisioning is Slice D. */
export type SaasPurchaseRecord = {
  id: string;
  stripeCheckoutSessionId: string;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  catalogOfferId: string;
  productSku: ProductSku;
  planTier: PlanTier;
  billingCycle: BillingCycle;
  status:
    | "checkout_created"
    | "checkout_completed"
    | "checkout_expired"
    | "checkout_canceled"
    | "payment_failed";
  customerEmail: string | null;
  createdAt: string;
  updatedAt: string;
  /** Explicitly false until Slice D. */
  provisioned: false;
  organizationId: null;
  userId: null;
};
