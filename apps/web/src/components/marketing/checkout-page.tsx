"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ACQUISITION_OFFER_COOKIE,
  ACQUISITION_SKU_COOKIE,
  COM_002_FLAGS,
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
  type PlanTier
} from "@mpa/shared";
import { MarketingChrome, marketingPrimaryCtaClass, marketingSecondaryCtaClass } from "./marketing-chrome";

/**
 * Confirm Plan → Stripe Checkout (Slice C).
 * No account / org provisioning here.
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
  const parsedPlan = parseAcquisitionPlan(selectedPlanRaw) ?? "professional";
  const billingCycle = parseAcquisitionCycle(selectedCycleRaw) ?? "monthly";
  const enterpriseSelection = requiresEnterpriseMotion(sku) || parsedPlan === "enterprise";
  const planTier: PlanTier = parsedPlan === "enterprise" ? "professional" : parsedPlan;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (enterpriseSelection) {
      router.replace(acquisitionHref("enterprise", sku));
    }
  }, [sku, enterpriseSelection, router]);

  const offer =
    resolveCatalogOffer({
      productSku: sku,
      planTier,
      billingCycle
    }) ?? null;
  const summary = SKU_SUMMARIES[sku];
  const modules = marketingModulesForSku(sku);

  useEffect(() => {
    if (enterpriseSelection) {
      return;
    }
    document.cookie = `${ACQUISITION_SKU_COOKIE}=${encodeURIComponent(sku)}; Path=/; Max-Age=${60 * 60 * 24 * 30}; SameSite=Lax`;
    if (offer) {
      document.cookie = `${ACQUISITION_OFFER_COOKIE}=${encodeURIComponent(offer.id)}; Path=/; Max-Age=${60 * 60 * 24 * 30}; SameSite=Lax`;
    }
  }, [sku, offer, enterpriseSelection]);

  async function startStripeCheckout() {
    if (!COM_002_FLAGS.sliceC_stripeCheckout) {
      setError("Checkout is not enabled.");
      return;
    }
    setBusy(true);
    setError(null);
    const idempotencyKey =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? `ui_${crypto.randomUUID()}`
        : `ui_${Date.now()}`;
    const res = await fetch("/api/commerce/checkout", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        productSku: sku,
        planTier,
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
      router.push(data.redirectTo);
      return;
    }
    if (!res.ok || !data.url) {
      setError(data.message ?? data.error ?? "Could not start Stripe Checkout. Please retry.");
      return;
    }
    window.location.assign(data.url);
  }

  if (enterpriseSelection) {
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
            Review your Property Manager plan, then continue to secure Stripe Checkout. Payment
            succeeds before account creation — no organization is provisioned on this step.
          </p>
        </header>

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
              Selected plan
            </p>
            <h2 className="mt-1 font-display text-2xl font-semibold">{summary.label}</h2>
            <p className="mt-2 text-sm text-[var(--mpa-color-text-secondary)]">
              {toPlanTierLabel(planTier)} · {toBillingCycleLabel(billingCycle)}
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
            <p className="text-sm font-semibold">Included modules ({modules.length})</p>
            <ul className="mt-2 grid gap-1 text-sm text-[var(--mpa-color-text-secondary)] sm:grid-cols-2">
              {modules.map((module) => (
                <li key={module.id}>• {module.label}</li>
              ))}
            </ul>
          </div>
          <label className="block space-y-1 text-sm">
            <span className="font-semibold">Checkout email (optional)</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@company.com"
              className="w-full rounded-md border border-[var(--mpa-color-border-default)] px-3 py-2"
            />
          </label>
        </section>

        {error ? (
          <p className="text-sm text-red-700" role="alert">
            {error}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <Link
            href={acquisitionHref("pricing", { sku, planTier, billingCycle })}
            className={marketingSecondaryCtaClass}
          >
            Back to pricing
          </Link>
          <button
            type="button"
            disabled={busy}
            onClick={() => void startStripeCheckout()}
            className={marketingPrimaryCtaClass}
          >
            {busy ? "Starting Checkout…" : "Continue to secure checkout"}
          </button>
        </div>
      </main>
    </MarketingChrome>
  );
}
