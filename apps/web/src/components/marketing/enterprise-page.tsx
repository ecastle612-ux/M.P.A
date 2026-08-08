import Link from "next/link";
import {
  SKU_SUMMARIES,
  acquisitionHref,
  parseAcquisitionSku,
  type ProductSku
} from "@mpa/shared";
import { MarketingChrome, marketingPrimaryCtaClass, marketingSecondaryCtaClass } from "./marketing-chrome";

/**
 * Enterprise request foundation (COM-002 Slice A).
 * No CRM backend / sales automation in this slice.
 */
export function EnterprisePage({
  isAuthenticated = false,
  selectedSkuRaw
}: {
  isAuthenticated?: boolean;
  selectedSkuRaw?: string | null;
}) {
  const sku = parseAcquisitionSku(selectedSkuRaw);
  const interestLabel = sku ? SKU_SUMMARIES[sku as ProductSku].label : "M.P.A. Enterprise";

  return (
    <MarketingChrome isAuthenticated={isAuthenticated} denseNav>
      <main className="mx-auto max-w-3xl space-y-8 px-4 pb-16 pt-10 md:px-6">
        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
            Enterprise
          </p>
          <h1 className="font-display text-3xl font-semibold">Request Enterprise</h1>
          <p className="text-sm leading-6 text-[var(--mpa-color-text-secondary)]">
            Facility Operations, Complete Platform, and custom Enterprise terms follow a guided sales
            and implementation path — not self-service checkout.
          </p>
        </header>

        <section className="space-y-3 rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-muted)]">
            Product interest
          </p>
          <h2 className="font-display text-2xl font-semibold">{interestLabel}</h2>
          {sku ? (
            <p className="text-sm text-[var(--mpa-color-text-secondary)]">
              {SKU_SUMMARIES[sku].description}
            </p>
          ) : (
            <p className="text-sm text-[var(--mpa-color-text-secondary)]">
              Tell us about your portfolio and which products you need. Our team will schedule a
              consultation.
            </p>
          )}
        </section>

        <section className="space-y-2 rounded-md border border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-subtle,#F7F8FA)] p-4 text-sm text-[var(--mpa-color-text-secondary)]">
          <p className="font-semibold text-[var(--mpa-color-text-primary)]">What happens next</p>
          <ol className="list-decimal space-y-1 pl-5">
            <li>Share your organization details with our team.</li>
            <li>Schedule a consultation.</li>
            <li>Receive a proposal and contract.</li>
            <li>Implementation activates your Enterprise workspace.</li>
          </ol>
          <p className="pt-2 text-xs">
            Lead capture automation ships in a later commercial slice. For now, continue with Property
            Manager self-service or contact your M.P.A. representative.
          </p>
        </section>

        <div className="flex flex-wrap gap-3">
          <Link href={acquisitionHref("modules")} className={marketingSecondaryCtaClass}>
            Back to modules
          </Link>
          <Link
            href={acquisitionHref("pricing", "mpa_property_manager")}
            className={marketingPrimaryCtaClass}
          >
            View Property Manager plans
          </Link>
          <a href="mailto:enterprise@my-property-assistant.com?subject=Enterprise%20request" className={marketingSecondaryCtaClass}>
            Email Enterprise
          </a>
        </div>
      </main>
    </MarketingChrome>
  );
}
