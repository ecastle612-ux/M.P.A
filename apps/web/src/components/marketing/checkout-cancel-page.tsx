import Link from "next/link";
import { resolveCheckoutCancelRecovery, type BillingCycle, type ProductSku } from "@mpa/shared";
import { MarketingChrome, marketingPrimaryCtaClass, marketingSecondaryCtaClass } from "./marketing-chrome";

export type CheckoutCancelQuoteContext = {
  productSku: ProductSku;
  billingCycle: BillingCycle;
  snapshotId?: string | null;
  managedUnits?: number | null;
  expired: boolean;
};

export function CheckoutCancelPage({
  quoteId,
  offerId,
  quoteContext,
  isAuthenticated = false
}: {
  quoteId?: string | null;
  offerId?: string | null;
  quoteContext?: CheckoutCancelQuoteContext | null;
  isAuthenticated?: boolean;
}) {
  const recovery = resolveCheckoutCancelRecovery(
    quoteId
      ? quoteContext
        ? {
            quote: {
              quoteId,
              productSku: quoteContext.productSku,
              billingCycle: quoteContext.billingCycle,
              snapshotId: quoteContext.snapshotId ?? null,
              managedUnits: quoteContext.managedUnits ?? null,
              expired: quoteContext.expired
            }
          }
        : {}
      : { offerId: offerId ?? null }
  );

  const quoteMissing = Boolean(quoteId && !quoteContext);
  const detail =
    recovery.mode === "quote_expired"
      ? "Your quote expired before checkout finished. Continue Get Started to generate a fresh quote for the same product — no payment was collected."
      : quoteMissing
        ? "We could not reload that quote. Continue Get Started to create a fresh quote — no payment was collected."
        : "No payment was collected. You can retry Confirm Plan or choose a different plan.";

  const retryLabel =
    recovery.mode === "quote_expired" || quoteMissing
      ? "Continue Get Started"
      : "Retry confirm plan";

  return (
    <MarketingChrome isAuthenticated={isAuthenticated} denseNav>
      <main className="mx-auto max-w-3xl space-y-8 px-4 pb-16 pt-10 md:px-6">
        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
            Checkout
          </p>
          <h1 className="font-display text-3xl font-semibold">Checkout canceled</h1>
          <p className="text-sm leading-6 text-[var(--mpa-color-text-secondary)]">{detail}</p>
        </header>
        <div className="flex flex-wrap gap-3">
          <Link href={recovery.retryHref} className={marketingPrimaryCtaClass}>
            {retryLabel}
          </Link>
          <Link href={recovery.pricingHref} className={marketingSecondaryCtaClass}>
            Review pricing
          </Link>
        </div>
      </main>
    </MarketingChrome>
  );
}
