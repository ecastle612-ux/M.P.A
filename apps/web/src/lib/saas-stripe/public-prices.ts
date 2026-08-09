import type { BillingCycle, ProductSku } from "@mpa/shared";

/** Public display shape for a configured Stripe Price (checkout or display-only). */
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
  status: "ready" | "partial" | "unavailable";
  warning: string | null;
  /**
   * Live amounts keyed by product SKU then billing cycle.
   * Property Manager uses Checkout Price IDs; FO/Complete use display Price IDs when configured.
   */
  bySku: Partial<Record<ProductSku, Partial<Record<BillingCycle, PublicCatalogPrice>>>>;
  /**
   * @deprecated Prefer bySku[mpa_property_manager] — kept for Confirm Plan PM convenience.
   */
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

export function priceForSkuCycle(
  catalog: PublicCatalogPriceCatalog,
  sku: ProductSku,
  billingCycle: BillingCycle
): PublicCatalogPrice | undefined {
  return catalog.bySku[sku]?.[billingCycle];
}
