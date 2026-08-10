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
  publicPurchaseMotionForSku,
  resolveCatalogOffer,
  skuComparisonRows,
  toBillingCycleLabel,
  type BillingCycle,
  type ProductSku
} from "@mpa/shared";
import {
  priceForSkuCycle,
  type PublicCatalogPriceCatalog
} from "../../lib/saas-stripe/public-prices";
import {
  MarketingChrome,
  marketingPageMainClass,
  marketingPrimaryCtaClass,
  marketingSecondaryCtaClass
} from "./marketing-chrome";
import {
  BACKGROUND_SCREENING_LABEL,
  BACKGROUND_SCREENING_LINE,
  FutureIntegrationsNote,
  PlannedIntegrationCell
} from "./future-integrations-note";

/** Internal Stripe offer mapping — not shown as a customer-facing tier. */
const CHECKOUT_PLAN = "professional" as const;

export function PricingPage({
  isAuthenticated = false,
  selectedSkuRaw,
  selectedCycleRaw,
  priceCatalog
}: {
  isAuthenticated?: boolean;
  selectedSkuRaw?: string | null;
  selectedPlanRaw?: string | null;
  selectedCycleRaw?: string | null;
  priceCatalog: PublicCatalogPriceCatalog;
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
            Monthly and Annual list prices for Property Manager, Facility Operations, and Complete
            Platform. Amounts come from live Stripe Prices (never invented). Only Property Manager
            can be purchased online today — Facility Operations and Complete Platform use early
            access or consultation until FO_READY certification.
          </p>
        </header>

        {priceCatalog.warning ? (
          <p
            className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950"
            role="status"
          >
            <span className="font-semibold">Pricing system warning: </span>
            {priceCatalog.warning}
          </p>
        ) : null}

        <ol className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-muted)]">
          <li className="rounded-md bg-[var(--mpa-color-bg-subtle)] px-2 py-1">1 · Modules</li>
          <li className="rounded-md bg-[var(--mpa-color-brand-primary-subtle,#E6F4EF)] px-2 py-1 text-[var(--mpa-color-brand-primary)]">
            2 · Pricing
          </li>
          <li className="rounded-md bg-[var(--mpa-color-bg-subtle)] px-2 py-1">3 · Confirm Plan</li>
          <li className="rounded-md bg-[var(--mpa-color-bg-subtle)] px-2 py-1">4 · Checkout</li>
        </ol>

        <div className="flex flex-wrap items-center gap-3" role="group" aria-label="Billing cycle">
          {BILLING_CYCLES.map((cycle) => (
            <button
              key={cycle}
              type="button"
              aria-pressed={billingCycle === cycle}
              onClick={() => setBillingCycle(cycle)}
              className={`rounded-md px-4 py-2 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mpa-color-border-focus,#0F6B56)] ${
                billingCycle === cycle
                  ? "bg-[var(--mpa-color-brand-primary)] text-white shadow-[0_6px_16px_rgba(15,107,86,0.2)]"
                  : "bg-[var(--mpa-color-bg-subtle)] text-[var(--mpa-color-text-secondary)]"
              }`}
            >
              {toBillingCycleLabel(cycle)} pricing
            </button>
          ))}
          {billingCycle === "annual" ? (
            <span className="rounded-md bg-[var(--mpa-color-brand-primary-subtle,#E6F4EF)] px-3 py-1.5 text-xs font-semibold text-[var(--mpa-color-brand-primary)]">
              Annual billing · best value vs monthly
            </span>
          ) : null}
        </div>

        <ul className="grid gap-4 lg:grid-cols-3">
          {PRODUCT_SKUS.map((sku) => (
            <PlatformPriceCard
              key={sku}
              sku={sku}
              billingCycle={billingCycle}
              highlighted={sku === selectedSku}
              priceCatalog={priceCatalog}
            />
          ))}
        </ul>

        <section className="space-y-3">
          <h2 className="font-display text-xl font-semibold">Inclusion matrix</h2>
          <ul className="grid gap-3 md:hidden">
            {rows.map((row) => (
              <li
                key={row.id}
                className="rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] p-3 text-sm"
              >
                <p className="font-semibold text-[var(--mpa-color-text-primary)]">{row.label}</p>
                <dl className="mt-2 space-y-1 text-[var(--mpa-color-text-secondary)]">
                  <div className="flex justify-between gap-2">
                    <dt>Property Manager</dt>
                    <dd>{row.pm ? "Included" : "—"}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt>Facility Operations</dt>
                    <dd>{row.fo ? "Included" : "—"}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt>Complete</dt>
                    <dd>{row.complete ? "Included" : "—"}</dd>
                  </div>
                </dl>
              </li>
            ))}
          </ul>
          <div className="hidden overflow-x-auto rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] md:block">
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
                <tr className="border-t border-[var(--mpa-color-border-subtle)]">
                  <th scope="row" className="px-3 py-2 text-left font-normal">
                    {BACKGROUND_SCREENING_LABEL}
                  </th>
                  <td className="px-3 py-2">
                    <PlannedIntegrationCell />
                  </td>
                  <td className="px-3 py-2">
                    <PlannedIntegrationCell />
                  </td>
                  <td className="px-3 py-2">
                    <PlannedIntegrationCell />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <FutureIntegrationsNote />
        </section>

        <div className="flex flex-wrap gap-3">
          <Link href={acquisitionHref("modules", selectedSku)} className={marketingSecondaryCtaClass}>
            Back to modules
          </Link>
          <Link
            href={
              publicPurchaseMotionForSku(selectedSku).kind === "self_serve"
                ? commercialContinueHref({
                    productSku: selectedSku,
                    planTier: CHECKOUT_PLAN,
                    billingCycle
                  })
                : acquisitionHref("enterprise", selectedSku)
            }
            className={marketingPrimaryCtaClass}
          >
            {publicPurchaseMotionForSku(selectedSku).kind === "self_serve"
              ? "Continue to confirm plan"
              : publicPurchaseMotionForSku(selectedSku).ctaLabel}
          </Link>
        </div>
      </main>
    </MarketingChrome>
  );
}

function PlatformPriceCard({
  sku,
  billingCycle,
  highlighted,
  priceCatalog
}: {
  sku: ProductSku;
  billingCycle: BillingCycle;
  highlighted: boolean;
  priceCatalog: PublicCatalogPriceCatalog;
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
  const motion = publicPurchaseMotionForSku(sku);
  const livePrice = priceForSkuCycle(priceCatalog, sku, billingCycle);
  const href =
    motion.kind === "self_serve"
      ? commercialContinueHref({
          productSku: sku,
          planTier: CHECKOUT_PLAN,
          billingCycle
        })
      : acquisitionHref("enterprise", sku);

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
      <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-brand-primary)]">
        {motion.availabilityLabel}
      </p>
      <p className="mt-4 text-lg font-semibold text-[var(--mpa-color-text-primary)]">
        {toBillingCycleLabel(billingCycle)} pricing
      </p>
      {livePrice ? (
        <div className="mt-1 space-y-1">
          <p className="font-display text-3xl font-semibold text-[var(--mpa-color-text-primary)]">
            {livePrice.formatted}
            <span className="ml-1 text-sm font-medium text-[var(--mpa-color-text-secondary)]">
              / {billingCycle === "annual" ? "year" : "month"}
            </span>
          </p>
          <p className="text-xs text-[var(--mpa-color-text-secondary)]">{livePrice.cadenceLabel}</p>
          <p className="text-xs text-[var(--mpa-color-text-muted)]">
            {selfServeReady
              ? "Amount from live Stripe Price · confirmed again in Checkout"
              : "List amount from live Stripe Price · online checkout not enabled for this platform yet"}
          </p>
        </div>
      ) : (
        <p
          className="mt-1 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-950"
          role="status"
        >
          Live Stripe price for this platform and billing cycle could not be retrieved. No amount is
          invented here.
        </p>
      )}
      <p className="mt-3 text-xs leading-5 text-[var(--mpa-color-text-secondary)]">{motion.explanation}</p>
      <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-muted)]">
        Includes ({modules.length})
      </p>
      <ul className="mt-2 flex-1 space-y-1 text-sm text-[var(--mpa-color-text-secondary)]">
        {modules.map((module) => (
          <li key={module.id}>• {module.label}</li>
        ))}
        <li className="text-[var(--mpa-color-text-muted)]">• {BACKGROUND_SCREENING_LINE}</li>
      </ul>
      <Link href={href} className={`${marketingPrimaryCtaClass} mt-5`}>
        {motion.ctaLabel}
      </Link>
    </li>
  );
}
