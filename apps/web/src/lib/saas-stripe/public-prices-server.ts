import { cache } from "react";
import {
  resolveCatalogOffer,
  type BillingCycle,
  type ProductSku
} from "@mpa/shared";
import { getSaasStripeClient, resolveSaasPriceId } from "./client";
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
 * Loads live Stripe Price amounts for public Property Manager professional offers.
 * Does not invent amounts. Returns an explicit warning when prices cannot be retrieved.
 */
export async function loadPublicCatalogPrices(): Promise<PublicCatalogPriceCatalog> {
  const stripe = getSaasStripeClient();
  if (!stripe) {
    return {
      status: "unavailable",
      warning:
        "Live Stripe pricing is unavailable: Stripe is not configured in this environment. Self-service checkout cannot show amounts until Price IDs and the secret key are set.",
      byCycle: {},
      prices: []
    };
  }

  const prices: PublicCatalogPrice[] = [];
  const failures: string[] = [];

  for (const billingCycle of PUBLIC_CYCLES) {
    const offer =
      resolveCatalogOffer({
        productSku: "mpa_property_manager",
        planTier: PUBLIC_PLAN,
        billingCycle
      }) ?? null;
    if (!offer) {
      failures.push(`${billingCycle}: offer missing`);
      continue;
    }
    const priceId = resolveSaasPriceId(offer.id);
    if (!priceId) {
      failures.push(`${billingCycle}: Stripe Price ID env not set`);
      continue;
    }
    try {
      const price = await stripe.prices.retrieve(priceId);
      if (typeof price.unit_amount !== "number" || !price.currency) {
        failures.push(`${billingCycle}: Price missing unit_amount/currency`);
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
      failures.push(`${billingCycle}: Stripe Price retrieve failed`);
    }
  }

  if (prices.length === 0) {
    return {
      status: "unavailable",
      warning: `Live Stripe pricing could not be retrieved. ${failures.join(" · ") || "No configured prices."}`,
      byCycle: {},
      prices: []
    };
  }

  const byCycle: PublicCatalogPriceCatalog["byCycle"] = {};
  for (const price of prices) {
    byCycle[price.billingCycle] = price;
  }

  return {
    status: prices.length === PUBLIC_CYCLES.length ? "ready" : "unavailable",
    warning:
      prices.length === PUBLIC_CYCLES.length
        ? null
        : `Some live Stripe prices could not be retrieved. ${failures.join(" · ")}`,
    byCycle,
    prices
  };
}

/** Request-deduped loader for RSC pages. */
export const getPublicCatalogPrices = cache(loadPublicCatalogPrices);
