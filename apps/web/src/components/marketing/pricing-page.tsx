import Link from "next/link";
import {
  PRODUCT_SKUS,
  SKU_SUMMARIES,
  acquisitionHref,
  marketingModulesForSku,
  parseAcquisitionSku,
  skuComparisonRows,
  type ProductSku
} from "@mpa/shared";
import { MarketingChrome, marketingPrimaryCtaClass, marketingSecondaryCtaClass } from "./marketing-chrome";

export function PricingPage({
  isAuthenticated = false,
  selectedSkuRaw
}: {
  isAuthenticated?: boolean;
  selectedSkuRaw?: string | null;
}) {
  const selected = parseAcquisitionSku(selectedSkuRaw);
  const rows = skuComparisonRows();

  return (
    <MarketingChrome isAuthenticated={isAuthenticated} denseNav>
      <main className="mx-auto max-w-6xl space-y-8 px-4 pb-16 pt-10 md:px-6">
        <header className="max-w-2xl space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
            Get started · Step 2
          </p>
          <h1 className="font-display text-3xl font-semibold">Subscription comparison & pricing</h1>
          <p className="text-sm leading-6 text-[var(--mpa-color-text-secondary)]">
            Compare what each plan includes. Enterprise pricing is finalized with our commercial team
            after account creation — no payment is collected on this page.
          </p>
        </header>

        <ol className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-muted)]">
          <li className="rounded-md bg-[var(--mpa-color-bg-subtle)] px-2 py-1">1 · Modules</li>
          <li className="rounded-md bg-[var(--mpa-color-brand-primary-subtle,#E6F4EF)] px-2 py-1 text-[var(--mpa-color-brand-primary)]">
            2 · Pricing
          </li>
          <li className="rounded-md bg-[var(--mpa-color-bg-subtle)] px-2 py-1">3 · Confirm Plan</li>
          <li className="rounded-md bg-[var(--mpa-color-bg-subtle)] px-2 py-1">4 · Account</li>
        </ol>

        <ul className="grid gap-4 md:grid-cols-3">
          {PRODUCT_SKUS.map((sku) => (
            <PlanCard key={sku} sku={sku} selected={selected === sku} />
          ))}
        </ul>

        <section className="space-y-3">
          <h2 className="font-display text-xl font-semibold">Inclusion matrix</h2>
          <p className="text-sm text-[var(--mpa-color-text-secondary)]">
            Facility Operations areas on Facility and Complete plans are activated with your
            organization during onboarding.
          </p>
          <div className="overflow-x-auto rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)]">
            <table className="w-full min-w-[40rem] border-collapse text-sm">
              <thead className="bg-[var(--mpa-color-bg-subtle,#F7F8FA)]">
                <tr>
                  <th className="px-3 py-2 text-left">Capability</th>
                  <th className="px-3 py-2 text-left">PM</th>
                  <th className="px-3 py-2 text-left">Facility</th>
                  <th className="px-3 py-2 text-left">Complete</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-t border-[var(--mpa-color-border-subtle)]">
                    <td className="px-3 py-2">{row.label}</td>
                    <td className="px-3 py-2">{row.pm ? "●" : "—"}</td>
                    <td className="px-3 py-2">{row.fo ? "●" : "—"}</td>
                    <td className="px-3 py-2">{row.complete ? "●" : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <div className="flex flex-wrap gap-3">
          <Link href={acquisitionHref("modules", selected)} className={marketingSecondaryCtaClass}>
            Back to modules
          </Link>
          <Link
            href={acquisitionHref("checkout", selected ?? "mpa_property_manager")}
            className={marketingPrimaryCtaClass}
          >
            Continue to confirm plan
          </Link>
        </div>
      </main>
    </MarketingChrome>
  );
}

function PlanCard({ sku, selected }: { sku: ProductSku; selected: boolean }) {
  const summary = SKU_SUMMARIES[sku];
  const count = marketingModulesForSku(sku).length;
  return (
    <li
      className={`flex flex-col rounded-md border p-5 ${
        selected
          ? "border-[var(--mpa-color-brand-primary)] bg-[var(--mpa-color-bg-surface)]"
          : "border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)]"
      }`}
    >
      {selected ? (
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-brand-primary)]">
          Selected
        </p>
      ) : null}
      <h2 className="mt-1 font-display text-xl font-semibold">{summary.label}</h2>
      <p className="mt-2 flex-1 text-sm text-[var(--mpa-color-text-secondary)]">{summary.description}</p>
      <p className="mt-4 text-xs uppercase tracking-wide text-[var(--mpa-color-text-muted)]">
        {count} modules included
      </p>
      <p className="mt-1 text-lg font-semibold">Enterprise pricing</p>
      <p className="mt-1 text-xs text-[var(--mpa-color-text-secondary)]">
        Confirmed with our commercial team after account creation.
      </p>
      <Link href={acquisitionHref("checkout", sku)} className={`${marketingPrimaryCtaClass} mt-4`}>
        Confirm {summary.label}
      </Link>
    </li>
  );
}
