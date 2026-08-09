"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ACQUISITION_OFFER_COOKIE,
  ACQUISITION_SKU_COOKIE,
  COM_002_FLAGS,
  SKU_SUMMARIES,
  acquisitionHref,
  isSelfServeCheckoutAllowed,
  marketingModulesForSku,
  parseAcquisitionCycle,
  parseAcquisitionSku,
  publicPurchaseMotionForSku,
  resolveCatalogOffer,
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
  marketingNarrowMainClass,
  marketingPrimaryCtaClass,
  marketingSecondaryCtaClass
} from "./marketing-chrome";

/** Internal Stripe offer mapping — not shown as a customer-facing tier. */
const CHECKOUT_PLAN = "professional" as const;

/**
 * Confirm Plan → Stripe Checkout (payment before account) for Property Manager only.
 * FO / Complete show list pricing + Request Early Access / Request Consultation (FO_READY gate).
 */
export function CheckoutPage({
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
  const sku: ProductSku = parseAcquisitionSku(selectedSkuRaw) ?? "mpa_property_manager";
  const billingCycle: BillingCycle = parseAcquisitionCycle(selectedCycleRaw) ?? "monthly";
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");

  const offer =
    resolveCatalogOffer({
      productSku: sku,
      planTier: CHECKOUT_PLAN,
      billingCycle
    }) ?? null;
  const selfServeReady = offer ? isSelfServeCheckoutAllowed(offer) : false;
  const motion = publicPurchaseMotionForSku(sku);
  const summary = SKU_SUMMARIES[sku];
  const modules = marketingModulesForSku(sku);
  const livePrice = priceForSkuCycle(priceCatalog, sku, billingCycle);

  useEffect(() => {
    document.cookie = `${ACQUISITION_SKU_COOKIE}=${encodeURIComponent(sku)}; Path=/; Max-Age=${60 * 60 * 24 * 30}; SameSite=Lax`;
    if (offer) {
      document.cookie = `${ACQUISITION_OFFER_COOKIE}=${encodeURIComponent(offer.id)}; Path=/; Max-Age=${60 * 60 * 24 * 30}; SameSite=Lax`;
    }
  }, [sku, offer]);

  async function startStripeCheckout() {
    if (!COM_002_FLAGS.sliceC_stripeCheckout) {
      setError("Checkout is not enabled.");
      return;
    }
    if (!selfServeReady) {
      setError(
        "Self-service checkout for this platform is not available yet. Use Request Early Access or Request Consultation, or choose Property Manager."
      );
      return;
    }
    setBusy(true);
    setError(null);
    const idempotencyKey = `ui_${crypto.randomUUID()}`;
    const res = await fetch("/api/commerce/checkout", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        productSku: sku,
        planTier: CHECKOUT_PLAN,
        billingCycle,
        customerEmail: email.trim() || undefined,
        idempotencyKey
      })
    });
    const data = (await res.json().catch(() => ({}))) as {
      url?: string;
      error?: string;
      redirectTo?: string;
      message?: string;
    };
    setBusy(false);
    if (res.status === 409 && data.redirectTo) {
      setError(
        "Self-service checkout for this platform is not available yet. Use Request Early Access or Request Consultation, or choose Property Manager."
      );
      return;
    }
    if (!res.ok || !data.url) {
      setError(data.message ?? data.error ?? "Could not start Stripe Checkout. Please retry.");
      return;
    }
    window.location.assign(data.url);
  }

  return (
    <MarketingChrome isAuthenticated={isAuthenticated} denseNav>
      <main className={marketingNarrowMainClass}>
        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
            Get started · Step 3
          </p>
          <h1 className="font-display text-3xl font-semibold">Confirm Plan</h1>
          <p className="text-sm leading-6 text-[var(--mpa-color-text-secondary)]">
            Confirm your platform, billing cycle, and amount. Property Manager continues to secure
            Stripe Checkout. Facility Operations and Complete Platform keep the FO_READY purchase
            gate — request early access or consultation instead of online checkout.
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
          <li className="rounded-md bg-[var(--mpa-color-bg-subtle)] px-2 py-1">2 · Pricing</li>
          <li className="rounded-md bg-[var(--mpa-color-brand-primary-subtle,#E6F4EF)] px-2 py-1 text-[var(--mpa-color-brand-primary)]">
            3 · Confirm Plan
          </li>
          <li className="rounded-md bg-[var(--mpa-color-bg-subtle)] px-2 py-1">4 · Checkout</li>
        </ol>

        <section className="space-y-4 rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] p-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-muted)]">
              Selected platform
            </p>
            <h2 className="mt-1 font-display text-2xl font-semibold">{summary.label}</h2>
            <p className="mt-2 text-sm text-[var(--mpa-color-text-secondary)]">
              {toBillingCycleLabel(billingCycle)} billing
            </p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-brand-primary)]">
              {motion.availabilityLabel}
            </p>
            <p className="mt-2 text-sm text-[var(--mpa-color-text-secondary)]">{summary.description}</p>
          </div>

          {livePrice ? (
            <div className="rounded-md border border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-subtle,#F7F8FA)] p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-muted)]">
                Amount
              </p>
              <p className="mt-1 font-display text-3xl font-semibold">
                {livePrice.formatted}
                <span className="ml-2 text-sm font-medium text-[var(--mpa-color-text-secondary)]">
                  / {billingCycle === "annual" ? "year" : "month"}
                </span>
              </p>
              <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
                {livePrice.cadenceLabel}
              </p>
              <p className="mt-2 text-xs text-[var(--mpa-color-text-muted)]">
                {selfServeReady
                  ? "From live Stripe Price · you will confirm again in Stripe Checkout"
                  : "List amount from live Stripe Price · online checkout is not enabled for this platform yet"}
              </p>
            </div>
          ) : (
            <p
              className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-950"
              role="status"
            >
              Live Stripe amount could not be retrieved for this selection. No amount is invented
              here.
            </p>
          )}

          {!selfServeReady ? (
            <div className="space-y-2 rounded-md border border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-subtle,#F7F8FA)] p-3 text-sm text-[var(--mpa-color-text-secondary)]">
              <p className="font-semibold text-[var(--mpa-color-text-primary)]">
                {motion.ctaLabel} — online checkout not available yet
              </p>
              <p>{motion.explanation}</p>
            </div>
          ) : null}

          <div>
            <p className="text-sm font-semibold">Included modules ({modules.length})</p>
            <ul className="mt-2 grid gap-1 text-sm text-[var(--mpa-color-text-secondary)] sm:grid-cols-2">
              {modules.map((module) => (
                <li key={module.id}>• {module.label}</li>
              ))}
            </ul>
          </div>
          {selfServeReady ? (
            <label className="block space-y-1 text-sm">
              <span className="font-semibold">Checkout email (optional)</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@company.com"
                autoComplete="email"
                className="w-full rounded-md border border-[var(--mpa-color-border-default)] px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mpa-color-border-focus,#0F6B56)]"
              />
            </label>
          ) : null}
        </section>

        {error ? (
          <p className="text-sm text-red-700" role="alert">
            {error}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <Link
            href={acquisitionHref("pricing", { sku, billingCycle })}
            className={marketingSecondaryCtaClass}
          >
            Back to pricing
          </Link>
          {selfServeReady ? (
            <button
              type="button"
              disabled={busy}
              aria-busy={busy}
              onClick={() => void startStripeCheckout()}
              className={marketingPrimaryCtaClass}
            >
              {busy ? "Starting Checkout…" : "Continue to secure checkout"}
            </button>
          ) : (
            <>
              <Link href={acquisitionHref("enterprise", sku)} className={marketingPrimaryCtaClass}>
                {motion.ctaLabel}
              </Link>
              <Link
                href={acquisitionHref("checkout", {
                  sku: "mpa_property_manager",
                  billingCycle
                })}
                className={marketingSecondaryCtaClass}
              >
                Choose Property Manager (online)
              </Link>
            </>
          )}
        </div>
      </main>
    </MarketingChrome>
  );
}
