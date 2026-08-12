"use client";

import Link from "next/link";
import { useState } from "react";
import {
  BILLING_CYCLES,
  FO_ANNUAL_USD,
  PRODUCT_SKUS,
  PUBLIC_PRICING_MODEL_COPY,
  SKU_SUMMARIES,
  acquisitionHref,
  calculateUnitVolumeDisplay,
  commercialContinueHref,
  formatUsdAmount,
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
            Property Manager, Facility Operations, and Complete Platform are available online with
            managed-unit pricing.
          </p>
        </header>

        <ol className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-muted)]">
          <li className="rounded-md bg-[var(--mpa-color-brand-primary-subtle,#E6F4EF)] px-2 py-1 text-[var(--mpa-color-brand-primary)]">
            1 · Pricing
          </li>
          <li className="rounded-md bg-[var(--mpa-color-bg-subtle)] px-2 py-1">2 · Get Started</li>
          <li className="rounded-md bg-[var(--mpa-color-bg-subtle)] px-2 py-1">3 · Questionnaire</li>
          <li className="rounded-md bg-[var(--mpa-color-bg-subtle)] px-2 py-1">4 · Quote</li>
          <li className="rounded-md bg-[var(--mpa-color-bg-subtle)] px-2 py-1">5 · Confirm Plan</li>
          <li className="rounded-md bg-[var(--mpa-color-bg-subtle)] px-2 py-1">6 · Checkout</li>
        </ol>

        <p className="max-w-3xl text-sm text-[var(--mpa-color-text-secondary)]">
          {PUBLIC_PRICING_MODEL_COPY.journeyNote}
        </p>

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

        <section className="grid gap-4 md:grid-cols-2" aria-label="Pricing transparency">
          <article className="space-y-2 rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] p-4">
            <h2 className="font-display text-lg font-semibold">
              {PUBLIC_PRICING_MODEL_COPY.unitDefinitionTitle}
            </h2>
            <p className="text-sm leading-6 text-[var(--mpa-color-text-secondary)]">
              {PUBLIC_PRICING_MODEL_COPY.unitDefinition}
            </p>
          </article>
          <article className="space-y-2 rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] p-4">
            <h2 className="font-display text-lg font-semibold">Additional Unit Capacity</h2>
            <p className="text-sm leading-6 text-[var(--mpa-color-text-secondary)]">
              {PUBLIC_PRICING_MODEL_COPY.includedCapacityPlain}{" "}
              {PUBLIC_PRICING_MODEL_COPY.additionalCapacityPlain}
            </p>
            <p className="text-sm leading-6 text-[var(--mpa-color-text-secondary)]">
              Monthly examples for Property Manager or Facility Operations: 500 → $59 · 501–1,000 →
              $98 · 1,001–1,500 → $137. Complete Platform: 500 → $109 · 501–1,000 → $148 · 1,001–1,500
              → $187.
            </p>
          </article>
          <article className="space-y-2 rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] p-4">
            <h2 className="font-display text-lg font-semibold">
              {PUBLIC_PRICING_MODEL_COPY.trialTitle}
            </h2>
            <p className="text-sm leading-6 text-[var(--mpa-color-text-secondary)]">
              {PUBLIC_PRICING_MODEL_COPY.trialEligible}
            </p>
            <p className="text-sm leading-6 text-[var(--mpa-color-text-secondary)]">
              {PUBLIC_PRICING_MODEL_COPY.trialIneligible}
            </p>
          </article>
          <article className="space-y-2 rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] p-4">
            <h2 className="font-display text-lg font-semibold">Billing transparency</h2>
            <p className="text-sm leading-6 text-[var(--mpa-color-text-secondary)]">
              {PUBLIC_PRICING_MODEL_COPY.billingMonthly}
            </p>
            <p className="text-sm leading-6 text-[var(--mpa-color-text-secondary)]">
              {PUBLIC_PRICING_MODEL_COPY.billingAnnual}
            </p>
          </article>
          <article className="space-y-2 rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] p-4">
            <h2 className="font-display text-lg font-semibold">
              {PUBLIC_PRICING_MODEL_COPY.capacityChangeTitle}
            </h2>
            <p className="text-sm leading-6 text-[var(--mpa-color-text-secondary)]">
              {PUBLIC_PRICING_MODEL_COPY.capacityChange}
            </p>
          </article>
          <article className="space-y-2 rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] p-4">
            <h2 className="font-display text-lg font-semibold">
              {PUBLIC_PRICING_MODEL_COPY.cancellationTitle}
            </h2>
            <p className="text-sm leading-6 text-[var(--mpa-color-text-secondary)]">
              {PUBLIC_PRICING_MODEL_COPY.cancellationSummary}
            </p>
          </article>
          <article className="space-y-2 rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] p-4">
            <h2 className="font-display text-lg font-semibold">Enterprise</h2>
            <p className="text-sm leading-6 text-[var(--mpa-color-text-secondary)]">
              {PUBLIC_PRICING_MODEL_COPY.enterpriseNotProduct}
            </p>
          </article>
        </section>

        <section className="space-y-3" aria-labelledby="all-product-examples">
          <h2 id="all-product-examples" className="font-display text-xl font-semibold">
            Price examples by product
          </h2>
          <p className="text-sm text-[var(--mpa-color-text-secondary)]">
            Same server formula as Checkout. Use the calculator above for your exact unit count.
          </p>
          <div className="grid gap-4 lg:grid-cols-3">
            {(
              [
                "mpa_property_manager",
                "mpa_facility_operations",
                "mpa_complete_platform"
              ] as const
            ).map((sku) => {
              const examples = calculateUnitVolumeDisplay({
                module: sku,
                managedUnits: 500,
                billingInterval: "monthly"
              }).examples;
              return (
                <div
                  key={sku}
                  className="overflow-x-auto rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] p-3"
                >
                  <table className="w-full min-w-[16rem] border-collapse text-sm">
                    <caption className="pb-2 text-left text-sm font-semibold">
                      {SKU_SUMMARIES[sku].label}
                    </caption>
                    <thead>
                      <tr className="border-b border-[var(--mpa-color-border-subtle)] text-left">
                        <th className="py-1 pr-2 font-semibold">Units</th>
                        <th className="py-1 pr-2 font-semibold">Monthly</th>
                        <th className="py-1 font-semibold">Annual</th>
                      </tr>
                    </thead>
                    <tbody>
                      {examples.map((row) => (
                        <tr key={row.units} className="border-b border-[var(--mpa-color-border-subtle)]">
                          <td className="py-1 pr-2">{row.units.toLocaleString("en-US")}</td>
                          <td className="py-1 pr-2">{formatUsdAmount(row.monthly)}</td>
                          <td className="py-1">{formatUsdAmount(row.annual)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })}
          </div>
        </section>

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
              ? "Get Started"
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
            {billingCycle === "annual"
              ? PUBLIC_PRICING_MODEL_COPY.foHeadlineAnnual
              : PUBLIC_PRICING_MODEL_COPY.foHeadlineMonthly}
          </p>
          <p className="text-sm text-[var(--mpa-color-text-secondary)]">
            {PUBLIC_PRICING_MODEL_COPY.foIncludes}
          </p>
          <p className="text-sm font-medium text-[var(--mpa-color-text-primary)]">
            Additional Unit Capacity: {PUBLIC_PRICING_MODEL_COPY.additionalCapacityLine}
          </p>
          <p className="text-xs text-[var(--mpa-color-text-muted)]">
            {billingCycle === "annual"
              ? `Base annual is $${FO_ANNUAL_USD}. Additional Unit Capacity annual = +$468 per 500 units.`
              : "Use the calculator below for your managed-unit total."}
          </p>
        </div>
      ) : null}

      {sku === "mpa_complete_platform" ? (
        <div className="mt-4 space-y-1">
          <p className="font-display text-3xl font-semibold text-[var(--mpa-color-text-primary)]">
            {billingCycle === "annual"
              ? PUBLIC_PRICING_MODEL_COPY.completeHeadlineAnnual
              : PUBLIC_PRICING_MODEL_COPY.completeHeadlineMonthly}
          </p>
          <p className="text-sm text-[var(--mpa-color-text-secondary)]">
            {PUBLIC_PRICING_MODEL_COPY.completeIncludes}
          </p>
          <p className="text-sm font-medium text-[var(--mpa-color-text-primary)]">
            Additional Unit Capacity: {PUBLIC_PRICING_MODEL_COPY.additionalCapacityLine}
          </p>
          <p className="text-xs text-[var(--mpa-color-text-muted)]">
            {billingCycle === "annual"
              ? "Annual = monthly × 12 (example: $109 → $1,308/year at 500 units)."
              : "Use Get Started to confirm your managed-unit plan."}
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
