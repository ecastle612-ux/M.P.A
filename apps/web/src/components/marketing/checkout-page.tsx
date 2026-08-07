"use client";

import Link from "next/link";
import { useEffect } from "react";
import {
  ACQUISITION_SKU_COOKIE,
  SKU_SUMMARIES,
  acquisitionHref,
  marketingModulesForSku,
  parseAcquisitionSku,
  skuIncludesFacilityOperations,
  type ProductSku
} from "@mpa/shared";
import { MarketingChrome, marketingPrimaryCtaClass, marketingSecondaryCtaClass } from "./marketing-chrome";

/**
 * Pre-auth plan confirmation for the public commercial funnel.
 * URL remains /checkout; customer-facing copy uses "Confirm Plan".
 */
export function CheckoutPage({
  isAuthenticated = false,
  selectedSkuRaw
}: {
  isAuthenticated?: boolean;
  selectedSkuRaw?: string | null;
}) {
  const sku = parseAcquisitionSku(selectedSkuRaw) ?? "mpa_property_manager";
  const summary = SKU_SUMMARIES[sku];
  const modules = marketingModulesForSku(sku);

  useEffect(() => {
    document.cookie = `${ACQUISITION_SKU_COOKIE}=${encodeURIComponent(sku)}; Path=/; Max-Age=${60 * 60 * 24 * 30}; SameSite=Lax`;
  }, [sku]);

  return (
    <MarketingChrome isAuthenticated={isAuthenticated} denseNav>
      <main className="mx-auto max-w-3xl space-y-8 px-4 pb-16 pt-10 md:px-6">
        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
            Get started · Step 3
          </p>
          <h1 className="font-display text-3xl font-semibold">Confirm Plan</h1>
          <p className="text-sm leading-6 text-[var(--mpa-color-text-secondary)]">
            Review your selected plan, then continue to account creation. Enterprise pricing and
            subscription billing are finalized with our commercial team during onboarding — no card
            payment is collected on this page.
          </p>
        </header>

        <ol className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-muted)]">
          <li className="rounded-md bg-[var(--mpa-color-bg-subtle)] px-2 py-1">1 · Modules</li>
          <li className="rounded-md bg-[var(--mpa-color-bg-subtle)] px-2 py-1">2 · Pricing</li>
          <li className="rounded-md bg-[var(--mpa-color-brand-primary-subtle,#E6F4EF)] px-2 py-1 text-[var(--mpa-color-brand-primary)]">
            3 · Confirm Plan
          </li>
          <li className="rounded-md bg-[var(--mpa-color-bg-subtle)] px-2 py-1">4 · Account</li>
        </ol>

        <section className="space-y-4 rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] p-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-muted)]">
              Selected plan
            </p>
            <h2 className="mt-1 font-display text-2xl font-semibold">{summary.label}</h2>
            <p className="mt-2 text-sm text-[var(--mpa-color-text-secondary)]">{summary.description}</p>
          </div>
          <div>
            <p className="text-sm font-semibold">Pricing</p>
            <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
              Enterprise pricing — confirmed with our commercial team during onboarding.
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold">Included modules ({modules.length})</p>
            <ul className="mt-2 grid gap-1 text-sm text-[var(--mpa-color-text-secondary)] sm:grid-cols-2">
              {modules.map((module) => (
                <li key={module.id}>• {module.label}</li>
              ))}
            </ul>
          </div>
        </section>

        <WhatHappensNext sku={sku} />

        <div className="flex flex-wrap gap-3">
          <Link href={acquisitionHref("pricing", sku)} className={marketingSecondaryCtaClass}>
            Back to pricing
          </Link>
          {isAuthenticated ? (
            <Link href="/setup" className={marketingPrimaryCtaClass}>
              Continue to Guided Setup
            </Link>
          ) : (
            <Link href={acquisitionHref("signup", sku)} className={marketingPrimaryCtaClass}>
              Create account
            </Link>
          )}
        </div>
      </main>
    </MarketingChrome>
  );
}

function WhatHappensNext({ sku }: { sku: ProductSku }) {
  const includesFacility = skuIncludesFacilityOperations(sku);

  return (
    <section className="space-y-2 rounded-md border border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-subtle,#F7F8FA)] p-4 text-sm text-[var(--mpa-color-text-secondary)]">
      <p className="font-semibold text-[var(--mpa-color-text-primary)]">What happens next</p>
      <ol className="list-decimal space-y-1 pl-5">
        <li>Create your account (no sign-in required before this step).</li>
        <li>Complete Guided Setup to create your organization.</li>
        <li>Confirm your plan and receive your working role access.</li>
        {includesFacility ? (
          <li>
            Your organization begins with Property Manager access. Our commercial team activates{" "}
            {SKU_SUMMARIES[sku].label} with your organization during onboarding so Facility areas
            become available under your plan.
          </li>
        ) : (
          <li>Enter Mission Control to begin portfolio operations.</li>
        )}
        {includesFacility ? <li>Enter Mission Control once setup is complete.</li> : null}
      </ol>
    </section>
  );
}
