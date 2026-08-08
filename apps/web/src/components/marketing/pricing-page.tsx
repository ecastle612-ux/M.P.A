"use client";

import Link from "next/link";
import { useState } from "react";
import {
  BILLING_CYCLES,
  PROPERTY_LIMITS,
  SEAT_LIMITS,
  SELF_SERVE_PLAN_TIERS,
  SKU_SUMMARIES,
  acquisitionHref,
  commercialContinueHref,
  marketingModulesForSku,
  parseAcquisitionCycle,
  parseAcquisitionPlan,
  parseAcquisitionSku,
  requiresEnterpriseMotion,
  skuComparisonRows,
  toBillingCycleLabel,
  toPlanTierLabel,
  type BillingCycle,
  type ProductSku,
  type SelfServePlanTier
} from "@mpa/shared";
import { MarketingChrome, marketingPrimaryCtaClass, marketingSecondaryCtaClass } from "./marketing-chrome";

export function PricingPage({
  isAuthenticated = false,
  selectedSkuRaw,
  selectedPlanRaw,
  selectedCycleRaw
}: {
  isAuthenticated?: boolean;
  selectedSkuRaw?: string | null;
  selectedPlanRaw?: string | null;
  selectedCycleRaw?: string | null;
}) {
  const selectedSku = parseAcquisitionSku(selectedSkuRaw) ?? "mpa_property_manager";
  const parsedPlan = parseAcquisitionPlan(selectedPlanRaw);
  const initialPlan: SelfServePlanTier =
    parsedPlan === "business" ? "business" : "professional";
  const initialCycle = parseAcquisitionCycle(selectedCycleRaw) ?? "monthly";
  const [planTier, setPlanTier] = useState<SelfServePlanTier>(initialPlan);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>(initialCycle);
  const rows = skuComparisonRows();
  const enterpriseProduct = requiresEnterpriseMotion(selectedSku);

  const continueHref = enterpriseProduct
    ? acquisitionHref("enterprise", selectedSku)
    : commercialContinueHref({
        productSku: selectedSku,
        planTier,
        billingCycle
      });

  return (
    <MarketingChrome isAuthenticated={isAuthenticated} denseNav>
      <main className="mx-auto max-w-6xl space-y-8 px-4 pb-16 pt-10 md:px-6">
        <header className="max-w-2xl space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
            Get started · Step 2
          </p>
          <h1 className="font-display text-3xl font-semibold">Subscription comparison & pricing</h1>
          <p className="text-sm leading-6 text-[var(--mpa-color-text-secondary)]">
            Choose Professional or Business for Property Manager. Facility Operations and Complete
            Platform use Enterprise — no payment is collected on this page.
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

        {enterpriseProduct ? (
          <section className="space-y-4 rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] p-5">
            <h2 className="font-display text-xl font-semibold">{SKU_SUMMARIES[selectedSku].label}</h2>
            <p className="text-sm text-[var(--mpa-color-text-secondary)]">
              {SKU_SUMMARIES[selectedSku].description}
            </p>
            <Link href={acquisitionHref("enterprise", selectedSku)} className={marketingPrimaryCtaClass}>
              Request Enterprise
            </Link>
          </section>
        ) : (
          <section className="space-y-6">
            <div>
              <h2 className="font-display text-xl font-semibold">
                {SKU_SUMMARIES.mpa_property_manager.label}
              </h2>
              <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
                Self-service plans — select tier and billing cycle.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {SELF_SERVE_PLAN_TIERS.map((tier) => (
                <button
                  key={tier}
                  type="button"
                  onClick={() => setPlanTier(tier)}
                  className={`rounded-md border p-5 text-left transition-colors ${
                    planTier === tier
                      ? "border-[var(--mpa-color-brand-primary)] bg-[var(--mpa-color-bg-surface)]"
                      : "border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)]"
                  }`}
                >
                  <p className="font-display text-lg font-semibold">{toPlanTierLabel(tier)}</p>
                  <p className="mt-2 text-sm text-[var(--mpa-color-text-secondary)]">
                    {SEAT_LIMITS[tier]} seats · {PROPERTY_LIMITS[tier]} properties
                  </p>
                  <p className="mt-3 text-lg font-semibold">Self-serve subscription</p>
                  <p className="mt-1 text-xs text-[var(--mpa-color-text-secondary)]">
                    Confirm Plan continues to secure Stripe Checkout — payment before account creation.
                  </p>
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {BILLING_CYCLES.map((cycle) => (
                <button
                  key={cycle}
                  type="button"
                  onClick={() => setBillingCycle(cycle)}
                  className={`rounded-md px-3 py-2 text-sm font-semibold ${
                    billingCycle === cycle
                      ? "bg-[var(--mpa-color-brand-primary)] text-white"
                      : "bg-[var(--mpa-color-bg-subtle)] text-[var(--mpa-color-text-secondary)]"
                  }`}
                >
                  {toBillingCycleLabel(cycle)}
                </button>
              ))}
            </div>
            <p className="text-sm text-[var(--mpa-color-text-secondary)]">
              {marketingModulesForSku("mpa_property_manager").length} modules included · Capital
              Projects excluded
            </p>
          </section>
        )}

        <EnterpriseCtas />

        <section className="space-y-3">
          <h2 className="font-display text-xl font-semibold">Inclusion matrix</h2>
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
          <Link href={acquisitionHref("modules", selectedSku)} className={marketingSecondaryCtaClass}>
            Back to modules
          </Link>
          <Link href={continueHref} className={marketingPrimaryCtaClass}>
            {enterpriseProduct ? "Request Enterprise" : "Continue to confirm plan"}
          </Link>
        </div>
      </main>
    </MarketingChrome>
  );
}

function EnterpriseCtas() {
  const skus: ProductSku[] = ["mpa_facility_operations", "mpa_complete_platform"];
  return (
    <section className="grid gap-4 md:grid-cols-2">
      {skus.map((sku) => (
        <div
          key={sku}
          className="rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-subtle,#F7F8FA)] p-5"
        >
          <h3 className="font-display text-lg font-semibold">{SKU_SUMMARIES[sku].label}</h3>
          <p className="mt-2 text-sm text-[var(--mpa-color-text-secondary)]">
            {SKU_SUMMARIES[sku].description}
          </p>
          <Link
            href={acquisitionHref("enterprise", sku)}
            className={`${marketingSecondaryCtaClass} mt-4`}
          >
            Request Enterprise
          </Link>
        </div>
      ))}
    </section>
  );
}
