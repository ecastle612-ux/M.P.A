import Link from "next/link";
import {
  SKU_SUMMARIES,
  acquisitionHref,
  parseAcquisitionSku,
  type ProductSku
} from "@mpa/shared";
import {
  MarketingChrome,
  marketingNarrowMainClass,
  marketingPrimaryCtaClass,
  marketingSecondaryCtaClass
} from "./marketing-chrome";

/**
 * Enterprise Solutions — optional purchasing/onboarding path for very large organizations.
 * Not a product. Not a pricing tier.
 */
export function EnterprisePage({
  isAuthenticated = false,
  selectedSkuRaw
}: {
  isAuthenticated?: boolean;
  selectedSkuRaw?: string | null;
}) {
  const sku = parseAcquisitionSku(selectedSkuRaw);
  const interestLabel = sku ? SKU_SUMMARIES[sku as ProductSku].label : null;

  return (
    <MarketingChrome isAuthenticated={isAuthenticated} denseNav>
      <main className={marketingNarrowMainClass}>
        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
            Optional sales path
          </p>
          <h1 className="font-display text-3xl font-semibold">Enterprise Solutions</h1>
          <p className="text-sm leading-6 text-[var(--mpa-color-text-secondary)]">
            For very large organizations that need custom contracts, SSO, integrations, or dedicated
            onboarding. Enterprise is not a product and not a pricing tier — Property Manager,
            Facility Operations, and Complete Platform remain the platforms.
          </p>
        </header>

        {interestLabel ? (
          <section className="space-y-3 rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-muted)]">
              Platform interest
            </p>
            <h2 className="font-display text-2xl font-semibold">{interestLabel}</h2>
            <p className="text-sm text-[var(--mpa-color-text-secondary)]">
              {SKU_SUMMARIES[sku!].description}
            </p>
          </section>
        ) : null}

        <section className="space-y-2 rounded-md border border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-subtle,#F7F8FA)] p-4 text-sm text-[var(--mpa-color-text-secondary)]">
          <p className="font-semibold text-[var(--mpa-color-text-primary)]">When Enterprise fits</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Custom contracts and commercial terms</li>
            <li>SSO and advanced identity requirements</li>
            <li>Integrations beyond standard self-service</li>
            <li>Dedicated onboarding and implementation</li>
          </ul>
          <p className="pt-2 text-xs">
            Most teams should choose a platform on Pricing and continue through Confirm Plan.
          </p>
        </section>

        <div className="flex flex-wrap gap-3">
          <Link href="/pricing" className={marketingPrimaryCtaClass}>
            View platform pricing
          </Link>
          <Link href={acquisitionHref("modules")} className={marketingSecondaryCtaClass}>
            Choose Your Platform
          </Link>
          <a
            href="mailto:enterprise@my-property-assistant.com?subject=Enterprise%20Solutions"
            className={marketingSecondaryCtaClass}
          >
            Email Enterprise
          </a>
        </div>
      </main>
    </MarketingChrome>
  );
}
