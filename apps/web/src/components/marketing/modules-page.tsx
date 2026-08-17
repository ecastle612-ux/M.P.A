import Link from "next/link";
import {
  PRODUCT_SKUS,
  SKU_SUMMARIES,
  acquisitionHref,
  marketingModulesForSku
} from "@mpa/shared";
import {
  MarketingChrome,
  marketingPageMainClass,
  marketingPrimaryCtaClass,
  marketingSecondaryCtaClass
} from "./marketing-chrome";
import { BACKGROUND_SCREENING_LINE, FutureIntegrationsNote } from "./future-integrations-note";

export function ModulesPage({ isAuthenticated = false }: { isAuthenticated?: boolean }) {
  return (
    <MarketingChrome isAuthenticated={isAuthenticated} denseNav>
      <main className={marketingPageMainClass}>
        <header className="max-w-2xl space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
            Explore Platforms
          </p>
          <h1 className="font-display text-3xl font-semibold text-[var(--mpa-color-text-primary)]">
            Compare Property Manager, Facility Operations, and Complete
          </h1>
          <p className="text-sm leading-6 text-[var(--mpa-color-text-secondary)]">
            Property Manager is Property Operations. Facility Operations is the facility-team
            workspace. Complete is one organization and one subscription that includes both — not two
            accounts. When you are ready to buy, use Get Started for the guided path: questionnaire →
            plan → confirmation → checkout.
          </p>
        </header>

        <p className="max-w-2xl text-sm text-[var(--mpa-color-text-secondary)]">
          Acquisition path:{" "}
          <Link
            href={acquisitionHref("questionnaire")}
            className="font-medium text-[var(--mpa-color-brand-primary)] underline"
          >
            Get Started
          </Link>{" "}
          is the purchase entry. Explore Platforms is discovery only — it does not replace checkout.
        </p>

        <ul className="grid gap-4 md:grid-cols-3">
          {PRODUCT_SKUS.map((sku) => {
            const summary = SKU_SUMMARIES[sku];
            const modules = marketingModulesForSku(sku);
            return (
              <li
                key={sku}
                className="flex flex-col rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] p-5"
              >
                <h2 className="font-display text-xl font-semibold">{summary.label}</h2>
                <p className="mt-2 text-sm leading-6 text-[var(--mpa-color-text-secondary)]">
                  {summary.description}
                </p>
                <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-muted)]">
                  Includes ({modules.length})
                </p>
                <ul className="mt-2 flex-1 space-y-1 text-sm text-[var(--mpa-color-text-secondary)]">
                  {modules.map((module) => (
                    <li key={module.id}>• {module.label}</li>
                  ))}
                  <li className="text-[var(--mpa-color-text-muted)]">• {BACKGROUND_SCREENING_LINE}</li>
                </ul>
                <div className="mt-4 flex flex-col gap-2">
                  <Link
                    href={acquisitionHref("questionnaire", {
                      sku,
                      billingCycle: "monthly"
                    })}
                    className={marketingPrimaryCtaClass}
                  >
                    Get started with {SKU_SUMMARIES[sku].label}
                  </Link>
                  <Link href={acquisitionHref("pricing", sku)} className={marketingSecondaryCtaClass}>
                    View pricing
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>

        <FutureIntegrationsNote />
      </main>
    </MarketingChrome>
  );
}
