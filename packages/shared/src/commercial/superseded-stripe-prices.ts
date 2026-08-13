/**
 * Stripe Price IDs that must never be attached to NEW customer Checkout Sessions.
 *
 * Historical subscriptions may still reference these Prices until an Owner-authorized
 * migration updates them. Do not mutate live subscriptions from this module.
 *
 * `price_1Tw3Cb8jGrZYUXDtQwHvaXFW` = legacy provisional "M.P.A. Professional" $99/mo,
 * superseded by the official $59 PM monthly Price (`mpa_replaces_price` metadata).
 */
export const SUPERSEDED_CHECKOUT_STRIPE_PRICE_IDS = [
  "price_1Tw3Cb8jGrZYUXDtQwHvaXFW"
] as const;

export type SupersededCheckoutStripePriceId =
  (typeof SUPERSEDED_CHECKOUT_STRIPE_PRICE_IDS)[number];

const SUPERSEDED_SET: ReadonlySet<string> = new Set(SUPERSEDED_CHECKOUT_STRIPE_PRICE_IDS);

export function isSupersededCheckoutStripePriceId(priceId: string | null | undefined): boolean {
  return typeof priceId === "string" && SUPERSEDED_SET.has(priceId);
}

export function findSupersededCheckoutStripePriceId(
  priceIds: ReadonlyArray<string | null | undefined>
): string | null {
  for (const priceId of priceIds) {
    if (isSupersededCheckoutStripePriceId(priceId)) {
      return priceId ?? null;
    }
  }
  return null;
}
