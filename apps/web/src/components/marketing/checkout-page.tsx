"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ACQUISITION_OFFER_COOKIE,
  ACQUISITION_QUOTE_COOKIE,
  ACQUISITION_SKU_COOKIE,
  ACQUISITION_SNAPSHOT_COOKIE,
  ONLINE_RENT_COLLECTION_OPTIONAL_SETUP,
  ONLINE_RENT_COLLECTION_PRICING_LINE,
  PUBLIC_PRICING_MODEL_COPY,
  skuIncludesOnlineRentCollection,
  SKU_SUMMARIES,
  acquisitionHref,
  confirmPlanCapacityLines,
  formatUsdAmount,
  marketingModulesForSku,
  parseAcquisitionCycle,
  parseAcquisitionSku,
  toBillingCycleLabel,
  type BillingCycle,
  type CommercialQuote,
  type ProductSku
} from "@mpa/shared";
import {
  MarketingChrome,
  marketingNarrowMainClass,
  marketingPrimaryCtaClass,
  marketingSecondaryCtaClass
} from "./marketing-chrome";

/**
 * Confirm Plan — shows server quote (managed units / capacity / trial).
 * Slice 2: does **not** create Stripe Checkout Sessions.
 */
export function CheckoutPage({
  isAuthenticated = false,
  selectedSkuRaw,
  selectedCycleRaw,
  quoteIdRaw,
  snapshotIdRaw
}: {
  isAuthenticated?: boolean;
  selectedSkuRaw?: string | null;
  selectedPlanRaw?: string | null;
  selectedCycleRaw?: string | null;
  quoteIdRaw?: string | null;
  snapshotIdRaw?: string | null;
}) {
  const fallbackSku: ProductSku = parseAcquisitionSku(selectedSkuRaw) ?? "mpa_property_manager";
  const fallbackCycle: BillingCycle = parseAcquisitionCycle(selectedCycleRaw) ?? "monthly";
  const [quote, setQuote] = useState<CommercialQuote | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(() => Boolean(quoteIdRaw));
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (!quoteIdRaw) {
      return;
    }
    const controller = new AbortController();
    void fetch(`/api/commerce/quote?id=${encodeURIComponent(quoteIdRaw)}`, {
      signal: controller.signal
    })
      .then(async (res) => {
        const data = (await res.json().catch(() => ({}))) as {
          quote?: CommercialQuote;
          error?: string;
          message?: string;
          regeneratePath?: string;
        };
        if (controller.signal.aborted) return;
        if (res.status === 410) {
          setLoadError(data.message ?? "This quote expired. Please answer the questionnaire again.");
          setQuote(null);
          setLoading(false);
          return;
        }
        if (!res.ok || !data.quote) {
          setLoadError(data.message ?? data.error ?? "Could not load your plan quote.");
          setQuote(null);
          setLoading(false);
          return;
        }
        setQuote(data.quote);
        setLoadError(null);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setLoadError(err instanceof Error ? err.message : "Could not load your plan quote.");
        setLoading(false);
      });
    return () => controller.abort();
  }, [quoteIdRaw]);

  const sku = quote?.module ?? fallbackSku;
  const billingCycle = quote?.billing_interval ?? fallbackCycle;
  const summary = SKU_SUMMARIES[sku];
  const modules = marketingModulesForSku(sku);
  const capacity = quote ? confirmPlanCapacityLines(quote) : null;
  const gated = quote?.recommendation.gated ?? false;

  useEffect(() => {
    if (!quote) return;
    document.cookie = `${ACQUISITION_SKU_COOKIE}=${encodeURIComponent(quote.module)}; Path=/; Max-Age=${60 * 60 * 24 * 30}; SameSite=Lax`;
    document.cookie = `${ACQUISITION_QUOTE_COOKIE}=${encodeURIComponent(quote.quote_id)}; Path=/; Max-Age=${60 * 60 * 24 * 30}; SameSite=Lax`;
    if (snapshotIdRaw) {
      document.cookie = `${ACQUISITION_SNAPSHOT_COOKIE}=${encodeURIComponent(snapshotIdRaw)}; Path=/; Max-Age=${60 * 60 * 24 * 30}; SameSite=Lax`;
    }
    document.cookie = `${ACQUISITION_OFFER_COOKIE}=${encodeURIComponent(`${quote.module}__unit_volume__${quote.billing_interval}`)}; Path=/; Max-Age=${60 * 60 * 24 * 30}; SameSite=Lax`;
  }, [quote, snapshotIdRaw]);

  return (
    <MarketingChrome isAuthenticated={isAuthenticated} denseNav>
      <main className={marketingNarrowMainClass}>
        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
            Get started · Step 3
          </p>
          <h1 className="font-display text-3xl font-semibold">Confirm Plan</h1>
          <p className="text-sm leading-6 text-[var(--mpa-color-text-secondary)]">
            Review your recommended platform, managed units, Additional Unit Capacity, price, and
            trial status before secure checkout.
          </p>
        </header>

        <ol className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-muted)]">
          <li className="rounded-md bg-[var(--mpa-color-bg-subtle)] px-2 py-1">1 · Pricing</li>
          <li className="rounded-md bg-[var(--mpa-color-bg-subtle)] px-2 py-1">2 · Questionnaire</li>
          <li className="rounded-md bg-[var(--mpa-color-brand-primary-subtle,#E6F4EF)] px-2 py-1 text-[var(--mpa-color-brand-primary)]">
            3 · Confirm Plan
          </li>
          <li className="rounded-md bg-[var(--mpa-color-bg-subtle)] px-2 py-1">4 · Checkout</li>
        </ol>

        {loading ? (
          <p className="text-sm text-[var(--mpa-color-text-secondary)]">Loading your plan quote…</p>
        ) : null}

        {loadError ? (
          <div className="space-y-3 rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            <p>{loadError}</p>
            <Link href={acquisitionHref("questionnaire")} className={marketingPrimaryCtaClass}>
              Restart questionnaire
            </Link>
          </div>
        ) : null}

        {!loading && !quote && !loadError ? (
          <section className="space-y-3 rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] p-5">
            <h2 className="font-display text-xl font-semibold">Complete the questionnaire first</h2>
            <p className="text-sm text-[var(--mpa-color-text-secondary)]">
              Confirm Plan uses a server-calculated quote from your managed unit count and needs.
            </p>
            <Link
              href={acquisitionHref("questionnaire", { sku: fallbackSku, billingCycle: fallbackCycle })}
              className={marketingPrimaryCtaClass}
            >
              Start questionnaire
            </Link>
          </section>
        ) : null}

        {quote && capacity ? (
          <section className="space-y-4 rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] p-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-muted)]">
                Selected platform
              </p>
              <h2 className="mt-1 font-display text-2xl font-semibold">{summary.label}</h2>
              <p className="mt-2 text-sm text-[var(--mpa-color-text-secondary)]">
                Recommended because: {quote.recommendation.reason}
              </p>
              <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
                {toBillingCycleLabel(billingCycle)} billing
              </p>
            </div>

            {capacity.additionalUnitCapacityNotice ? (
              <p className="rounded-md border border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-subtle,#F7F8FA)] px-3 py-2 text-sm font-medium text-[var(--mpa-color-text-primary)]">
                {capacity.additionalUnitCapacityNotice}
              </p>
            ) : null}

            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-[var(--mpa-color-text-muted)]">Managed units</dt>
                <dd className="font-semibold">{quote.managed_units.toLocaleString("en-US")}</dd>
              </div>
              <div>
                <dt className="text-[var(--mpa-color-text-muted)]">Base capacity</dt>
                <dd className="font-semibold">{capacity.baseCapacity}</dd>
              </div>
              <div>
                <dt className="text-[var(--mpa-color-text-muted)]">Additional Unit Capacity</dt>
                <dd className="font-semibold">{capacity.additionalCapacity}</dd>
              </div>
              <div>
                <dt className="text-[var(--mpa-color-text-muted)]">Selected interval</dt>
                <dd className="font-semibold">{toBillingCycleLabel(billingCycle)}</dd>
              </div>
              <div>
                <dt className="text-[var(--mpa-color-text-muted)]">Trial status</dt>
                <dd className="font-semibold">
                  {quote.trial_eligible ? "30-Day Free Trial" : capacity.trialLabel}
                </dd>
              </div>
              <div>
                <dt className="text-[var(--mpa-color-text-muted)]">Trial duration</dt>
                <dd className="font-semibold">
                  {quote.trial_eligible ? `${quote.trial_days} days` : "None"}
                </dd>
              </div>
              <div>
                <dt className="text-[var(--mpa-color-text-muted)]">Payment card</dt>
                <dd className="font-semibold">Required</dd>
              </div>
              <div>
                <dt className="text-[var(--mpa-color-text-muted)]">Monthly</dt>
                <dd className="font-semibold">{formatUsdAmount(quote.monthly_amount)}</dd>
              </div>
              <div>
                <dt className="text-[var(--mpa-color-text-muted)]">Annual</dt>
                <dd className="font-semibold">{formatUsdAmount(quote.annual_amount)}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-[var(--mpa-color-text-muted)]">Selected amount</dt>
                <dd className="font-display text-3xl font-semibold">
                  {formatUsdAmount(quote.selected_amount)}
                  <span className="ml-2 text-sm font-medium text-[var(--mpa-color-text-secondary)]">
                    / {billingCycle === "annual" ? "year" : "month"}
                  </span>
                </dd>
                {billingCycle === "annual" ? (
                  <p className="mt-1 text-sm font-medium text-[var(--mpa-color-brand-primary)]">
                    {PUBLIC_PRICING_MODEL_COPY.annualSavingsCopy}.
                  </p>
                ) : null}
              </div>
            </dl>

            <p className="text-sm text-[var(--mpa-color-text-secondary)]">
              {quote.capacity_description}
            </p>
            <p className="text-sm text-[var(--mpa-color-text-secondary)]">
              {quote.first_billing_description}
            </p>
            {quote.trial_eligible ? (
              <ul className="list-disc space-y-1 pl-5 text-sm text-[var(--mpa-color-text-secondary)]">
                <li>30 days free</li>
                <li>Valid payment card required.</li>
                <li>Your subscription automatically begins billing after the free trial.</li>
              </ul>
            ) : null}

            {gated && quote.recommendation.gatedExplanation ? (
              <div className="space-y-2 rounded-md border border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-subtle,#F7F8FA)] p-3 text-sm text-[var(--mpa-color-text-secondary)]">
                <p className="font-semibold text-[var(--mpa-color-text-primary)]">
                  Not available for self-service yet
                </p>
                <p>{quote.recommendation.gatedExplanation}</p>
              </div>
            ) : null}

            <div>
              <p className="text-sm font-semibold">Included modules ({modules.length})</p>
              <ul className="mt-2 grid gap-1 text-sm text-[var(--mpa-color-text-secondary)] sm:grid-cols-2">
                {modules.map((module) => (
                  <li key={module.id}>• {module.label}</li>
                ))}
              </ul>
              {skuIncludesOnlineRentCollection(sku) ? (
                <p className="mt-3 text-sm text-[var(--mpa-color-text-secondary)]">
                  {ONLINE_RENT_COLLECTION_PRICING_LINE}. {ONLINE_RENT_COLLECTION_OPTIONAL_SETUP}
                </p>
              ) : null}
            </div>

            <div className="rounded-md border border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-subtle,#F7F8FA)] px-3 py-2">
              <p className="text-sm font-semibold text-[var(--mpa-color-text-primary)]">
                {PUBLIC_PRICING_MODEL_COPY.cancellationTitle}
              </p>
              <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
                {PUBLIC_PRICING_MODEL_COPY.cancellationSummary}
              </p>
            </div>

            {quote && !gated ? (
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

            {confirmed ? (
              <p
                className="rounded-md border border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-subtle,#F7F8FA)] px-3 py-2 text-sm text-[var(--mpa-color-text-secondary)]"
                role="status"
              >
                Starting secure checkout from your server quote…
              </p>
            ) : null}
          </section>
        ) : null}

        {checkoutError ? (
          <p className="text-sm text-red-700" role="alert">
            {checkoutError}
          </p>
        ) : null}

        <p className="text-sm leading-6 text-[var(--mpa-color-text-secondary)]">
          Review the{" "}
          <Link
            href="/privacy"
            className="font-medium text-[var(--mpa-color-text-primary)] underline-offset-2 hover:underline"
          >
            Privacy Policy
          </Link>{" "}
          and{" "}
          <Link
            href="/terms"
            className="font-medium text-[var(--mpa-color-text-primary)] underline-offset-2 hover:underline"
          >
            Terms
          </Link>{" "}
          before continuing to secure checkout.
        </p>

        <div className="flex flex-wrap gap-3">
          <Link href={acquisitionHref("questionnaire")} className={marketingSecondaryCtaClass}>
            Back to questionnaire
          </Link>
          {quote && gated ? (
            <>
              <Link href={acquisitionHref("enterprise", sku)} className={marketingPrimaryCtaClass}>
                {quote.recommendation.nextActionLabel}
              </Link>
              <Link
                href={acquisitionHref("questionnaire", {
                  sku: "mpa_property_manager",
                  billingCycle
                })}
                className={marketingSecondaryCtaClass}
              >
                Continue with Property Manager
              </Link>
            </>
          ) : null}
          {quote && !gated ? (
            <button
              type="button"
              className={marketingPrimaryCtaClass}
              disabled={busy}
              aria-busy={busy}
              onClick={() => {
                setBusy(true);
                setCheckoutError(null);
                setConfirmed(true);
                void fetch("/api/commerce/checkout", {
                  method: "POST",
                  headers: { "content-type": "application/json" },
                  body: JSON.stringify({
                    quoteId: quote.quote_id,
                    customerEmail: email.trim() || undefined,
                    idempotencyKey: `ui_${crypto.randomUUID()}`
                  })
                })
                  .then(async (res) => {
                    const data = (await res.json().catch(() => ({}))) as {
                      url?: string;
                      error?: string;
                      message?: string;
                      detail?: string;
                      redirectTo?: string;
                    };
                    if (res.status === 503) {
                      setCheckoutError(
                        data.message ??
                          data.detail ??
                          "Secure checkout Prices are not configured yet. Your quote is saved — unit-volume Price env vars must be published before Checkout can start."
                      );
                      setBusy(false);
                      return;
                    }
                    if (!res.ok || !data.url) {
                      setCheckoutError(
                        data.message ?? data.error ?? "Could not start secure checkout."
                      );
                      setBusy(false);
                      return;
                    }
                    window.location.assign(data.url);
                  })
                  .catch(() => {
                    setCheckoutError("Could not start secure checkout.");
                    setBusy(false);
                  });
              }}
            >
              {busy ? "Starting Checkout…" : "Continue to secure checkout"}
            </button>
          ) : null}
        </div>
      </main>
    </MarketingChrome>
  );
}
