"use client";

import Link from "next/link";
import { useState } from "react";
import {
  BILLING_CYCLES,
  FO_ANNUAL_USD,
  FO_MONTHLY_USD,
  PRODUCT_SKUS,
  PUBLIC_PRICING_MODEL_COPY,
  SKU_SUMMARIES,
  acquisitionHref,
  commercialContinueHref,
  marketingModulesForSku,
  parseAcquisitionCycle,
  parseAcquisitionSku,
  parseAcquisitionUnits,
  publicPurchaseMotionForSku,
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
import {
  BACKGROUND_SCREENING_LABEL,
  BACKGROUND_SCREENING_LINE,
  FutureIntegrationsNote,
  PlannedIntegrationCell
} from "./future-integrations-note";
import { UnitVolumePricingCalculator } from "./unit-volume-pricing-calculator";

export function PricingPage({
  isAuthenticated = false,
  selectedSkuRaw,
  selectedCycleRaw,
  selectedUnitsRaw
}: {
  isAuthenticated?: boolean;
  selectedSkuRaw?: string | null;
  selectedPlanRaw?: string | null;
  selectedCycleRaw?: string | null;
  selectedUnitsRaw?: string | null;
}) {
  const selectedSku = parseAcquisitionSku(selectedSkuRaw) ?? "mpa_property_manager";
  const initialCycle = parseAcquisitionCycle(selectedCycleRaw) ?? "monthly";
  const initialUnits = parseAcquisitionUnits(selectedUnitsRaw) ?? 500;
  const [billingCycle, setBillingCycle] = useState<BillingCycle>(initialCycle);
  const rows = skuComparisonRows();

  return (
    <MarketingChrome isAuthenticated={isAuthenticated} denseNav>
      <main className={marketingPageMainClass}>
        <header className="max-w-2xl space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
            Pricing
          </p>
          <h1 className="font-display text-3xl font-semibold">Platform pricing</h1>
          <p className="text-sm leading-6 text-[var(--mpa-color-text-secondary)]">
            Property Manager is available online today with managed-unit pricing. Facility Operations
            and Complete Platform are not online yet — early access and consultation only.
          </p>
        </header>

        <ol className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-muted)]">
          <li className="rounded-md bg-[var(--mpa-color-brand-primary-subtle,#E6F4EF)] px-2 py-1 text-[var(--mpa-color-brand-primary)]">
            1 · Pricing
          </li>
          <li className="rounded-md bg-[var(--mpa-color-bg-subtle)] px-2 py-1">2 · Get Started</li>
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
              {toBillingCycleLabel(cycle)}
            </button>
          ))}
          <span className="text-xs text-[var(--mpa-color-text-secondary)]">
            {PUBLIC_PRICING_MODEL_COPY.annualNote}
          </span>
        </div>

        <ul className="grid gap-4 lg:grid-cols-3">
          {PRODUCT_SKUS.map((sku) => (
            <PlatformPriceCard
              key={sku}
              sku={sku}
              billingCycle={billingCycle}
              highlighted={sku === selectedSku}
              managedUnits={initialUnits}
            />
          ))}
        </ul>

        <UnitVolumePricingCalculator
          key={`${billingCycle}-${initialUnits}`}
          initialUnits={initialUnits}
          initialCycle={billingCycle}
        />

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
                    billingCycle,
                    managedUnits: initialUnits
                  })
                : acquisitionHref("enterprise", selectedSku)
            }
            className={marketingPrimaryCtaClass}
          >
            {publicPurchaseMotionForSku(selectedSku).kind === "self_serve"
              ? "Continue to Get Started"
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
  managedUnits
}: {
  sku: ProductSku;
  billingCycle: BillingCycle;
  highlighted: boolean;
  managedUnits: number;
}) {
  const summary = SKU_SUMMARIES[sku];
  const modules = marketingModulesForSku(sku);
  const motion = publicPurchaseMotionForSku(sku);
  const href =
    motion.kind === "self_serve"
      ? commercialContinueHref({
          productSku: sku,
          billingCycle,
          managedUnits
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

      {sku === "mpa_property_manager" ? (
        <div className="mt-4 space-y-1">
          <p className="font-display text-3xl font-semibold text-[var(--mpa-color-text-primary)]">
            {PUBLIC_PRICING_MODEL_COPY.pmHeadline}
          </p>
          <p className="text-sm text-[var(--mpa-color-text-secondary)]">
            {PUBLIC_PRICING_MODEL_COPY.pmIncludes}
          </p>
          <p className="text-sm font-medium text-[var(--mpa-color-text-primary)]">
            Additional Unit Capacity: {PUBLIC_PRICING_MODEL_COPY.additionalCapacityLine}
          </p>
          <p className="text-xs text-[var(--mpa-color-text-muted)]">
            {billingCycle === "annual"
              ? "Annual = monthly × 12 (example: $59 → $708/year at 500 units)."
              : "Use the calculator below for your managed-unit total."}
          </p>
        </div>
      ) : null}

      {sku === "mpa_facility_operations" ? (
        <div className="mt-4 space-y-1">
          <p className="font-display text-3xl font-semibold text-[var(--mpa-color-text-primary)]">
            ${billingCycle === "annual" ? FO_ANNUAL_USD : FO_MONTHLY_USD}
            <span className="ml-1 text-sm font-medium text-[var(--mpa-color-text-secondary)]">
              / {billingCycle === "annual" ? "year" : "month"}
            </span>
          </p>
          <p className="text-xs font-semibold text-[var(--mpa-color-text-primary)]">
            Not online · not purchasable
          </p>
          <p className="text-xs text-[var(--mpa-color-text-muted)]">
            Flat Facility Operations price when the product is online. Not available for self-service
            checkout today.
          </p>
        </div>
      ) : null}

      {sku === "mpa_complete_platform" ? (
        <div className="mt-4 space-y-1">
          <p className="font-display text-3xl font-semibold text-[var(--mpa-color-text-primary)]">
            ${PUBLIC_PRICING_MODEL_COPY.completeBaseMonthly}/month
          </p>
          <p className="text-sm text-[var(--mpa-color-text-secondary)]">
            Includes up to {PUBLIC_PRICING_MODEL_COPY.includedUnits} managed units
          </p>
          <p className="text-sm font-medium text-[var(--mpa-color-text-primary)]">
            Additional Unit Capacity: {PUBLIC_PRICING_MODEL_COPY.additionalCapacityLine}
          </p>
          <p className="text-xs font-semibold text-[var(--mpa-color-text-primary)]">
            Not online · not purchasable
          </p>
        </div>
      ) : null}

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
      <Link
        href={href}
        className={`${marketingPrimaryCtaClass} mt-5 ${
          motion.kind !== "self_serve" ? "opacity-95" : ""
        }`}
        aria-disabled={motion.kind !== "self_serve" ? undefined : undefined}
      >
        {motion.ctaLabel}
      </Link>
    </li>
  );
}
