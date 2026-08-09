import { cache } from "react";
import {
  PRODUCT_SKUS,
  resolveCatalogOffer,
  type BillingCycle,
  type ProductSku
} from "@mpa/shared";
import { getSaasStripeClient, resolveSaasDisplayPriceId } from "./client";
import {
  cadenceLabelForInterval,
  formatStripeUnitAmount,
  type PublicCatalogPrice,
  type PublicCatalogPriceCatalog
} from "./public-prices";

/** Internal offer mapping for public funnel — not a customer-facing tier. */
const PUBLIC_PLAN = "professional" as const;

const PUBLIC_CYCLES: BillingCycle[] = ["monthly", "annual"];

/**
 * Loads live Stripe Price amounts for public Pricing / Confirm Plan across all three products.
 * Does not invent amounts. Returns an explicit warning when any expected price cannot be retrieved.
 * FO/Complete Price IDs are display-only — Checkout remains FO_READY-gated.
 */
export async function loadPublicCatalogPrices(): Promise<PublicCatalogPriceCatalog> {
  const stripe = getSaasStripeClient();
  if (!stripe) {
    return {
      status: "unavailable",
      warning:
        "Live Stripe pricing is unavailable: Stripe is not configured in this environment. Platform amounts cannot be shown until Price IDs and the secret key are set.",
      bySku: {},
      byCycle: {},
      prices: []
    };
  }

  const prices: PublicCatalogPrice[] = [];
  const failures: string[] = [];
  const expectedSlots = PRODUCT_SKUS.length * PUBLIC_CYCLES.length;

  for (const productSku of PRODUCT_SKUS) {
    for (const billingCycle of PUBLIC_CYCLES) {
      const offer =
        resolveCatalogOffer({
          productSku,
          planTier: PUBLIC_PLAN,
          billingCycle
        }) ?? null;
      if (!offer) {
        failures.push(`${productSku}/${billingCycle}: offer missing`);
        continue;
      }
      const priceId = resolveSaasDisplayPriceId(offer.id);
      if (!priceId) {
        failures.push(`${productSku}/${billingCycle}: Stripe Price ID env not set`);
        continue;
      }
      try {
        const price = await stripe.prices.retrieve(priceId);
        if (typeof price.unit_amount !== "number" || !price.currency) {
          failures.push(`${productSku}/${billingCycle}: Price missing unit_amount/currency`);
          continue;
        }
        const interval = (price.recurring?.interval ??
          (billingCycle === "annual" ? "year" : "month")) as PublicCatalogPrice["interval"];
        prices.push({
          offerId: offer.id,
          productSku: offer.productSku as ProductSku,
          billingCycle,
          currency: price.currency,
          unitAmount: price.unit_amount,
          interval,
          formatted: formatStripeUnitAmount(price.unit_amount, price.currency),
          cadenceLabel: cadenceLabelForInterval(interval, billingCycle)
        });
      } catch {
        failures.push(`${productSku}/${billingCycle}: Stripe Price retrieve failed`);
      }
    }
  }

  const bySku: PublicCatalogPriceCatalog["bySku"] = {};
  const byCycle: PublicCatalogPriceCatalog["byCycle"] = {};
  for (const price of prices) {
    const skuBucket = bySku[price.productSku] ?? {};
    skuBucket[price.billingCycle] = price;
    bySku[price.productSku] = skuBucket;
    if (price.productSku === "mpa_property_manager") {
      byCycle[price.billingCycle] = price;
    }
  }

  if (prices.length === 0) {
    return {
      status: "unavailable",
      warning: `Live Stripe pricing could not be retrieved. ${failures.join(" · ") || "No configured prices."}`,
      bySku: {},
      byCycle: {},
      prices: []
    };
  }

  const status = prices.length === expectedSlots ? "ready" : "partial";
  return {
    status,
    warning:
      status === "ready"
        ? null
        : `Some live Stripe prices could not be retrieved. ${failures.join(" · ")}`,
    bySku,
    byCycle,
    prices
  };
}

/** Request-deduped loader for RSC pages. */
export const getPublicCatalogPrices = cache(loadPublicCatalogPrices);
