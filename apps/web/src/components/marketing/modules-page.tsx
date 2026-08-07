import Link from "next/link";
import {
  PRODUCT_SKUS,
  SKU_SUMMARIES,
  acquisitionHref,
  marketingModulesForSku,
  requiresEnterpriseMotion
} from "@mpa/shared";
import { MarketingChrome, marketingPrimaryCtaClass, marketingSecondaryCtaClass } from "./marketing-chrome";

export function ModulesPage({ isAuthenticated = false }: { isAuthenticated?: boolean }) {
  return (
    <MarketingChrome isAuthenticated={isAuthenticated} denseNav>
      <main className="mx-auto max-w-6xl space-y-8 px-4 pb-16 pt-10 md:px-6">
        <header className="max-w-2xl space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
            Get started · Step 1
          </p>
          <h1 className="font-display text-3xl font-semibold text-[var(--mpa-color-text-primary)]">
            Choose Modules
          </h1>
          <p className="text-sm leading-6 text-[var(--mpa-color-text-secondary)]">
            Select Property Manager to continue self-service. Facility Operations and Complete
            Platform are available through Enterprise.
          </p>
        </header>

        <ol className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-muted)]">
          <li className="rounded-md bg-[var(--mpa-color-brand-primary-subtle,#E6F4EF)] px-2 py-1 text-[var(--mpa-color-brand-primary)]">
            1 · Modules
          </li>
          <li className="rounded-md bg-[var(--mpa-color-bg-subtle)] px-2 py-1">2 · Pricing</li>
          <li className="rounded-md bg-[var(--mpa-color-bg-subtle)] px-2 py-1">3 · Confirm Plan</li>
          <li className="rounded-md bg-[var(--mpa-color-bg-subtle)] px-2 py-1">4 · Account</li>
        </ol>

        <ul className="grid gap-4 md:grid-cols-3">
          {PRODUCT_SKUS.map((sku) => {
            const summary = SKU_SUMMARIES[sku];
            const modules = marketingModulesForSku(sku);
            const enterprise = requiresEnterpriseMotion(sku);
            return (
              <li
                key={sku}
                className="flex flex-col rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] p-5"
              >
                <div className="flex items-start justify-between gap-2">
                  <h2 className="font-display text-xl font-semibold">{summary.label}</h2>
                  {enterprise ? (
                    <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-[var(--mpa-color-text-muted)]">
                      Enterprise
                    </span>
                  ) : (
                    <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-[var(--mpa-color-brand-primary)]">
                      Self-service
                    </span>
                  )}
                </div>
                <p className="mt-2 flex-1 text-sm leading-6 text-[var(--mpa-color-text-secondary)]">
                  {summary.description}
                </p>
                <p className="mt-4 text-xs text-[var(--mpa-color-text-muted)]">
                  {modules.length} modules · Capital Projects excluded
                </p>
                <div className="mt-4 flex flex-col gap-2">
                  {enterprise ? (
                    <Link
                      href={acquisitionHref("enterprise", sku)}
                      className={marketingPrimaryCtaClass}
                    >
                      Request Enterprise
                    </Link>
                  ) : (
                    <>
                      <Link href={acquisitionHref("pricing", sku)} className={marketingPrimaryCtaClass}>
                        Compare & continue
                      </Link>
                      <Link
                        href={acquisitionHref("checkout", {
                          sku,
                          planTier: "professional",
                          billingCycle: "monthly"
                        })}
                        className={marketingSecondaryCtaClass}
                      >
                        Skip to confirm plan
                      </Link>
                    </>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </main>
    </MarketingChrome>
  );
}
