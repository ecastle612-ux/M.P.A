import Link from "next/link";
import { acquisitionHref, getCatalogOfferById } from "@mpa/shared";
import { MarketingChrome, marketingPrimaryCtaClass, marketingSecondaryCtaClass } from "./marketing-chrome";

export function CheckoutCancelPage({
  offerId,
  isAuthenticated = false
}: {
  offerId?: string | null;
  isAuthenticated?: boolean;
}) {
  const offer = offerId ? getCatalogOfferById(offerId) : null;
  const retryHref = offer
    ? acquisitionHref("checkout", {
        sku: offer.productSku,
        planTier: offer.planTier === "enterprise" ? "professional" : offer.planTier,
        billingCycle: offer.billingCycle ?? "monthly"
      })
    : acquisitionHref("pricing", "mpa_property_manager");

  return (
    <MarketingChrome isAuthenticated={isAuthenticated} denseNav>
      <main className="mx-auto max-w-3xl space-y-8 px-4 pb-16 pt-10 md:px-6">
        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
            Stripe Checkout
          </p>
          <h1 className="font-display text-3xl font-semibold">Checkout canceled</h1>
          <p className="text-sm leading-6 text-[var(--mpa-color-text-secondary)]">
            No payment was collected. You can retry checkout or choose a different plan. Duplicate
            subscriptions are prevented by offer validation and Stripe idempotency.
          </p>
        </header>
        <div className="flex flex-wrap gap-3">
          <Link href={retryHref} className={marketingPrimaryCtaClass}>
            Retry confirm plan
          </Link>
          <Link href={acquisitionHref("pricing", "mpa_property_manager")} className={marketingSecondaryCtaClass}>
            Review pricing
          </Link>
        </div>
      </main>
    </MarketingChrome>
  );
}
