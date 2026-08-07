"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ACQUISITION_OFFER_COOKIE,
  ACQUISITION_SKU_COOKIE,
  SKU_SUMMARIES,
  acquisitionHref,
  marketingModulesForSku,
  parseAcquisitionCycle,
  parseAcquisitionPlan,
  parseAcquisitionSku,
  requiresEnterpriseMotion,
  resolveCatalogOffer,
  toBillingCycleLabel,
  toPlanTierLabel,
  type BillingCycle,
  type PlanTier,
  type ProductSku
} from "@mpa/shared";
import { MarketingChrome, marketingPrimaryCtaClass, marketingSecondaryCtaClass } from "./marketing-chrome";

/**
 * Confirm Plan (Slice A) — no payment.
 * FO/Complete selections redirect to Enterprise.
 */
export function CheckoutPage({
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
  const router = useRouter();
  const sku = parseAcquisitionSku(selectedSkuRaw) ?? "mpa_property_manager";
  const planTier = (parseAcquisitionPlan(selectedPlanRaw) ?? "professional") as PlanTier;
  const billingCycle = (parseAcquisitionCycle(selectedCycleRaw) ?? "monthly") as BillingCycle;

  useEffect(() => {
    if (requiresEnterpriseMotion(sku) || planTier === "enterprise") {
      router.replace(acquisitionHref("enterprise", sku));
    }
  }, [sku, planTier, router]);

  const offer =
    resolveCatalogOffer({
      productSku: sku,
      planTier: planTier === "enterprise" ? "professional" : planTier,
      billingCycle
    }) ?? null;
  const summary = SKU_SUMMARIES[sku];
  const modules = marketingModulesForSku(sku);

  useEffect(() => {
    if (requiresEnterpriseMotion(sku)) {
      return;
    }
    document.cookie = `${ACQUISITION_SKU_COOKIE}=${encodeURIComponent(sku)}; Path=/; Max-Age=${60 * 60 * 24 * 30}; SameSite=Lax`;
    if (offer) {
      document.cookie = `${ACQUISITION_OFFER_COOKIE}=${encodeURIComponent(offer.id)}; Path=/; Max-Age=${60 * 60 * 24 * 30}; SameSite=Lax`;
    }
  }, [sku, offer]);

  if (requiresEnterpriseMotion(sku) || planTier === "enterprise") {
    return (
      <MarketingChrome isAuthenticated={isAuthenticated} denseNav>
        <main className="mx-auto max-w-3xl space-y-6 px-4 pb-16 pt-10 md:px-6">
          <h1 className="font-display text-3xl font-semibold">Enterprise</h1>
          <p className="text-sm text-[var(--mpa-color-text-secondary)]">
            Redirecting to Request Enterprise…
          </p>
          <Link href={acquisitionHref("enterprise", sku)} className={marketingPrimaryCtaClass}>
            Continue to Request Enterprise
          </Link>
        </main>
      </MarketingChrome>
    );
  }

  return (
    <MarketingChrome isAuthenticated={isAuthenticated} denseNav>
      <main className="mx-auto max-w-3xl space-y-8 px-4 pb-16 pt-10 md:px-6">
        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
            Get started · Step 3
          </p>
          <h1 className="font-display text-3xl font-semibold">Confirm Plan</h1>
          <p className="text-sm leading-6 text-[var(--mpa-color-text-secondary)]">
            Review your Property Manager plan. No card payment is collected here — billing is
            finalized during onboarding until self-service checkout ships.
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
            <p className="mt-2 text-sm text-[var(--mpa-color-text-secondary)]">
              {toPlanTierLabel(planTier === "enterprise" ? "professional" : planTier)} ·{" "}
              {toBillingCycleLabel(billingCycle)}
            </p>
            <p className="mt-2 text-sm text-[var(--mpa-color-text-secondary)]">{summary.description}</p>
          </div>
          <div>
            <p className="text-sm font-semibold">Limits</p>
            <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
              {offer?.seatLimit ?? "—"} seats · {offer?.propertyLimit ?? "—"} properties
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold">Pricing</p>
            <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
              Enterprise pricing — finalized during onboarding. No payment on this page.
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

        <section className="space-y-2 rounded-md border border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-subtle,#F7F8FA)] p-4 text-sm text-[var(--mpa-color-text-secondary)]">
          <p className="font-semibold text-[var(--mpa-color-text-primary)]">What happens next</p>
          <ol className="list-decimal space-y-1 pl-5">
            <li>Create your account.</li>
            <li>Complete Guided Setup to create your organization.</li>
            <li>Confirm your plan and receive working access.</li>
            <li>Enter Mission Control to begin portfolio operations.</li>
          </ol>
        </section>

        <div className="flex flex-wrap gap-3">
          <Link
            href={acquisitionHref("pricing", {
              sku,
              planTier: planTier === "enterprise" ? "professional" : planTier,
              billingCycle
            })}
            className={marketingSecondaryCtaClass}
          >
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
