import type { BillingCycle, ProductSku } from "@mpa/shared";

/** Public display shape for a configured self-serve Stripe Price. */
export type PublicCatalogPrice = {
  offerId: string;
  productSku: ProductSku;
  billingCycle: BillingCycle;
  currency: string;
  /** Amount in the smallest currency unit (e.g. cents). */
  unitAmount: number;
  interval: "month" | "year" | "week" | "day";
  formatted: string;
  cadenceLabel: string;
};

export type PublicCatalogPriceCatalog = {
  status: "ready" | "unavailable";
  warning: string | null;
  /** Self-serve Property Manager professional prices keyed by billing cycle. */
  byCycle: Partial<Record<BillingCycle, PublicCatalogPrice>>;
  prices: PublicCatalogPrice[];
};

export function formatStripeUnitAmount(unitAmount: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: unitAmount % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2
  }).format(unitAmount / 100);
}

export function cadenceLabelForInterval(interval: string, billingCycle: BillingCycle): string {
  if (billingCycle === "annual" || interval === "year") {
    return "Billed annually · renews automatically";
  }
  return "Billed monthly · renews automatically";
}
