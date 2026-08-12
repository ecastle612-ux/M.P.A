import { acquisitionHref, commercialContinueHref } from "./acquisition";
import { getCatalogOfferById } from "./catalog";
import type { BillingCycle } from "./plans";
import type { ProductSku } from "./skus";

/**
 * Authoritative recovery context after Stripe Checkout cancel.
 * Unit-volume Checkout uses `?quote=`; legacy offer Checkout uses `?offer=`.
 */
export type CheckoutCancelQuoteContext = {
  quoteId: string;
  productSku: ProductSku;
  billingCycle: BillingCycle;
  snapshotId?: string | null;
  managedUnits?: number | null;
  expired: boolean;
};

export type CheckoutCancelRecoveryInput = {
  quote?: CheckoutCancelQuoteContext | null;
  offerId?: string | null;
};

export type CheckoutCancelRecovery = {
  mode: "quote" | "quote_expired" | "offer" | "fallback";
  retryHref: string;
  pricingHref: string;
  productSku: ProductSku | null;
};

/**
 * Resolve Confirm Plan / pricing recovery after Stripe cancel.
 * Never falls back to Property Manager pricing when a valid non-PM
 * quote or legacy offer context is available.
 */
export function resolveCheckoutCancelRecovery(
  input: CheckoutCancelRecoveryInput
): CheckoutCancelRecovery {
  const quote = input.quote ?? null;
  if (quote) {
    const pricingHref = acquisitionHref("pricing", quote.productSku);
    if (quote.expired) {
      return {
        mode: "quote_expired",
        retryHref: acquisitionHref("questionnaire", {
          sku: quote.productSku,
          billingCycle: quote.billingCycle,
          managedUnits: quote.managedUnits ?? null
        }),
        pricingHref,
        productSku: quote.productSku
      };
    }
    return {
      mode: "quote",
      retryHref: commercialContinueHref({
        productSku: quote.productSku,
        billingCycle: quote.billingCycle,
        quoteId: quote.quoteId,
        snapshotId: quote.snapshotId ?? null
      }),
      pricingHref,
      productSku: quote.productSku
    };
  }

  const offerId = input.offerId?.trim() || null;
  if (offerId) {
    const offer = getCatalogOfferById(offerId);
    if (offer) {
      const cycle = offer.billingCycle ?? "monthly";
      return {
        mode: "offer",
        retryHref: acquisitionHref("checkout", {
          sku: offer.productSku,
          planTier: offer.planTier === "enterprise" ? "professional" : offer.planTier,
          billingCycle: cycle
        }),
        pricingHref: acquisitionHref("pricing", offer.productSku),
        productSku: offer.productSku
      };
    }
  }

  // Missing / unknown context — honest generic recovery (no forced PM SKU).
  return {
    mode: "fallback",
    retryHref: acquisitionHref("questionnaire"),
    pricingHref: acquisitionHref("pricing"),
    productSku: null
  };
}
