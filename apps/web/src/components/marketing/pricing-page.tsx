"use client";

import Link from "next/link";
import { useState } from "react";
import {
  BILLING_CYCLES,
  PRODUCT_SKUS,
  SKU_SUMMARIES,
  acquisitionHref,
  commercialContinueHref,
  isSelfServeCheckoutAllowed,
  marketingModulesForSku,
  parseAcquisitionCycle,
  parseAcquisitionSku,
  resolveCatalogOffer,
  skuComparisonRows,
  toBillingCycleLabel,
  type BillingCycle,
  type ProductSku
} from "@mpa/shared";
import {
  MarketingChrome,
  marketingPageMainClass,
  marketingPrimaryCtaClass,
  marketingSecondaryCtaClass
} from "./marketing-chrome";

/** Internal Stripe offer mapping — not shown as a customer-facing tier. */
const CHECKOUT_PLAN = "professional" as const;

export function PricingPage({
  isAuthenticated = false,
  selectedSkuRaw,
  selectedCycleRaw
}: {
  isAuthenticated?: boolean;
  selectedSkuRaw?: string | null;
  selectedPlanRaw?: string | null;
  selectedCycleRaw?: string | null;
}) {
  const selectedSku = parseAcquisitionSku(selectedSkuRaw) ?? "mpa_property_manager";
  const initialCycle = parseAcquisitionCycle(selectedCycleRaw) ?? "monthly";
  const [billingCycle, setBillingCycle] = useState<BillingCycle>(initialCycle);
  const rows = skuComparisonRows();

  return (
    <MarketingChrome isAuthenticated={isAuthenticated} denseNav>
      <main className={marketingPageMainClass}>
        <header className="max-w-2xl space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
            Get started · Step 2
          </p>
          <h1 className="font-display text-3xl font-semibold">Platform pricing</h1>
          <p className="text-sm leading-6 text-[var(--mpa-color-text-secondary)]">
            Choose Property Manager, Facility Operations, or Complete Platform. Select monthly or
            annual billing, then confirm your plan.
          </p>
        </header>

        <ol className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-muted)]">
          <li className="rounded-md bg-[var(--mpa-color-bg-subtle)] px-2 py-1">1 · Modules</li>
          <li className="rounded-md bg-[var(--mpa-color-brand-primary-subtle,#E6F4EF)] px-2 py-1 text-[var(--mpa-color-brand-primary)]">
            2 · Pricing
          </li>
          <li className="rounded-md bg-[var(--mpa-color-bg-subtle)] px-2 py-1">3 · Confirm Plan</li>
          <li className="rounded-md bg-[var(--mpa-color-bg-subtle)] px-2 py-1">4 · Checkout</li>
        </ol>

        <div className="flex flex-wrap gap-2" role="group" aria-label="Billing cycle">
          {BILLING_CYCLES.map((cycle) => (
            <button
              key={cycle}
              type="button"
              aria-pressed={billingCycle === cycle}
              onClick={() => setBillingCycle(cycle)}
              className={`rounded-md px-4 py-2 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mpa-color-border-focus,#0F6B56)] ${
                billingCycle === cycle
                  ? "bg-[var(--mpa-color-brand-primary)] text-white"
                  : "bg-[var(--mpa-color-bg-subtle)] text-[var(--mpa-color-text-secondary)]"
              }`}
            >
              {toBillingCycleLabel(cycle)} pricing
            </button>
          ))}
        </div>

        <ul className="grid gap-4 lg:grid-cols-3">
          {PRODUCT_SKUS.map((sku) => (
            <PlatformPriceCard
              key={sku}
              sku={sku}
              billingCycle={billingCycle}
              highlighted={sku === selectedSku}
            />
          ))}
        </ul>

        <section className="space-y-3">
          <h2 className="font-display text-xl font-semibold">Inclusion matrix</h2>
          <div className="overflow-x-auto rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)]">
            <table className="w-full min-w-[40rem] border-collapse text-sm">
              <thead className="bg-[var(--mpa-color-bg-subtle,#F7F8FA)]">
                <tr>
                  <th scope="col" className="px-3 py-2 text-left font-semibold">
                    Capability
                  </th>
                  <th scope="col" className="px-3 py-2 text-left font-semibold">
                    Property Manager
                  </th>
                  <th scope="col" className="px-3 py-2 text-left font-semibold">
                    Facility Operations
                  </th>
                  <th scope="col" className="px-3 py-2 text-left font-semibold">
                    Complete
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-t border-[var(--mpa-color-border-subtle)]">
                    <th scope="row" className="px-3 py-2 text-left font-normal">
                      {row.label}
                    </th>
                    <td className="px-3 py-2">
                      {row.pm ? (
                        <>
                          <span aria-hidden>●</span>
                          <span className="sr-only">Included</span>
                        </>
                      ) : (
                        <>
                          <span aria-hidden>—</span>
                          <span className="sr-only">Not included</span>
                        </>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      {row.fo ? (
                        <>
                          <span aria-hidden>●</span>
                          <span className="sr-only">Included</span>
                        </>
                      ) : (
                        <>
                          <span aria-hidden>—</span>
                          <span className="sr-only">Not included</span>
                        </>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      {row.complete ? (
                        <>
                          <span aria-hidden>●</span>
                          <span className="sr-only">Included</span>
                        </>
                      ) : (
                        <>
                          <span aria-hidden>—</span>
                          <span className="sr-only">Not included</span>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <div className="flex flex-wrap gap-3">
          <Link href={acquisitionHref("modules", selectedSku)} className={marketingSecondaryCtaClass}>
            Back to modules
          </Link>
          <Link
            href={commercialContinueHref({
              productSku: selectedSku,
              planTier: CHECKOUT_PLAN,
              billingCycle
            })}
            className={marketingPrimaryCtaClass}
          >
            Continue to confirm plan
          </Link>
        </div>
      </main>
    </MarketingChrome>
  );
}

function PlatformPriceCard({
  sku,
  billingCycle,
  highlighted
}: {
  sku: ProductSku;
  billingCycle: BillingCycle;
  highlighted: boolean;
}) {
  const summary = SKU_SUMMARIES[sku];
  const modules = marketingModulesForSku(sku);
  const offer =
    resolveCatalogOffer({
      productSku: sku,
      planTier: CHECKOUT_PLAN,
      billingCycle
    }) ?? null;
  const selfServeReady = offer ? isSelfServeCheckoutAllowed(offer) : false;
  const href = commercialContinueHref({
    productSku: sku,
    planTier: CHECKOUT_PLAN,
    billingCycle
  });

  return (
    <li
      className={`flex flex-col rounded-md border bg-[var(--mpa-color-bg-surface)] p-5 ${
        highlighted
          ? "border-[var(--mpa-color-brand-primary)]"
          : "border-[var(--mpa-color-border-default)]"
      }`}
    >
      <h2 className="font-display text-xl font-semibold">{summary.label}</h2>
      <p className="mt-2 text-sm text-[var(--mpa-color-text-secondary)]">{summary.description}</p>
      <p className="mt-4 text-lg font-semibold text-[var(--mpa-color-text-primary)]">
        {toBillingCycleLabel(billingCycle)} pricing
      </p>
      <p className="mt-1 text-xs leading-5 text-[var(--mpa-color-text-secondary)]">
        {selfServeReady
          ? "Final amount appears in Stripe Checkout after you confirm this plan."
          : "Self-service Stripe Checkout is not available for this platform yet. Confirm Plan explains Property Manager checkout or Enterprise Solutions."}
      </p>
      <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-muted)]">
        Includes ({modules.length})
      </p>
      <ul className="mt-2 flex-1 space-y-1 text-sm text-[var(--mpa-color-text-secondary)]">
        {modules.map((module) => (
          <li key={module.id}>• {module.label}</li>
        ))}
      </ul>
      <Link href={href} className={`${marketingPrimaryCtaClass} mt-5`}>
        Confirm {summary.label}
      </Link>
    </li>
  );
}
