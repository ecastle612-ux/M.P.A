"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ACQUISITION_UNITS_SESSION_KEY,
  BILLING_CYCLES,
  OPERATIONAL_NEEDS,
  SKU_SUMMARIES,
  calculateUnitVolumeDisplay,
  commercialContinueHref,
  formatUsdAmount,
  operationalNeedLabel,
  recommendModuleForNeed,
  toBillingCycleLabel,
  type BillingCycle,
  type OperationalNeed,
  type ProductSku
} from "@mpa/shared";
import { marketingPrimaryCtaClass } from "./marketing-chrome";

type UnitVolumePricingCalculatorProps = {
  initialUnits?: number | null;
  initialCycle?: BillingCycle;
  initialNeed?: OperationalNeed;
};

/**
 * Unit-volume pricing calculator for all three products.
 * Display math uses shared `quoteUnitVolume` (same domain as server quotes).
 * Operational need drives the recommended product; Continue carries units into
 * questionnaire → server quote → Confirm Plan → Checkout.
 */
export function UnitVolumePricingCalculator({
  initialUnits = 500,
  initialCycle = "monthly",
  initialNeed = "property_resident_leasing"
}: UnitVolumePricingCalculatorProps) {
  const [unitsInput, setUnitsInput] = useState(String(initialUnits ?? 500));
  const [billingInterval, setBillingInterval] = useState<BillingCycle>(initialCycle);
  const [operationalNeed, setOperationalNeed] = useState<OperationalNeed>(initialNeed);
  const [serverQuote, setServerQuote] = useState<{
    monthly_amount: number;
    annual_amount: number;
    trial_eligible: boolean;
    additional_blocks: number;
    quote_id: string;
    module?: ProductSku;
    recommendation?: { recommendedModule?: ProductSku };
  } | null>(null);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [quoting, setQuoting] = useState(false);

  const managedUnits = useMemo(() => {
    const n = Number(unitsInput.replace(/,/g, "").trim());
    if (!Number.isFinite(n) || n <= 0) return 500;
    return Math.floor(n);
  }, [unitsInput]);

  const recommendation = useMemo(
    () => recommendModuleForNeed(operationalNeed),
    [operationalNeed]
  );
  const recommendedSku = recommendation.recommendedModule;

  const display = useMemo(
    () =>
      calculateUnitVolumeDisplay({
        module: recommendedSku,
        managedUnits,
        billingInterval
      }),
    [recommendedSku, managedUnits, billingInterval]
  );

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setQuoting(true);
      setQuoteError(null);
      void fetch("/api/commerce/quote", {
        method: "POST",
        headers: { "content-type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          managedUnits,
          operationalNeed,
          billingInterval
        })
      })
        .then(async (res) => {
          const data = (await res.json().catch(() => ({}))) as {
            quote?: {
              monthly_amount: number;
              annual_amount: number;
              trial_eligible: boolean;
              additional_blocks: number;
              quote_id: string;
              module?: ProductSku;
              recommendation?: { recommendedModule?: ProductSku };
            };
            snapshot?: { recommended_module?: ProductSku; selected_module?: ProductSku };
            error?: string;
            message?: string;
          };
          if (controller.signal.aborted) return;
          if (!res.ok || !data.quote) {
            setServerQuote(null);
            setQuoteError(data.message ?? data.error ?? "Could not refresh server quote.");
            setQuoting(false);
            return;
          }
          setServerQuote(data.quote);
          setQuoteError(null);
          setQuoting(false);
        })
        .catch((err: unknown) => {
          if (controller.signal.aborted) return;
          setServerQuote(null);
          setQuoteError(err instanceof Error ? err.message : "Could not refresh server quote.");
          setQuoting(false);
        });
    }, 350);
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [managedUnits, billingInterval, operationalNeed]);

  const monthly = serverQuote?.monthly_amount ?? display.monthlyPriceUsd;
  const annual = serverQuote?.annual_amount ?? display.annualPriceUsd;
  const selected = billingInterval === "annual" ? annual : monthly;
  const trialEligible = serverQuote?.trial_eligible ?? display.trialEligible;
  const additionalBlocks = serverQuote?.additional_blocks ?? display.additionalBlocks;
  const shownSku =
    serverQuote?.module ??
    serverQuote?.recommendation?.recommendedModule ??
    recommendedSku;
  const productLabel = SKU_SUMMARIES[shownSku].label;

  const continueHref = commercialContinueHref({
    productSku: shownSku,
    billingCycle: billingInterval,
    managedUnits
  });

  function persistUnitsAndContinue() {
    try {
      sessionStorage.setItem(ACQUISITION_UNITS_SESSION_KEY, String(managedUnits));
    } catch {
      // ignore private-mode storage failures
    }
  }

  return (
    <section
      aria-labelledby="unit-calculator-title"
      className="space-y-4 rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] p-5"
    >
      <header className="space-y-1">
        <h2 id="unit-calculator-title" className="font-display text-xl font-semibold">
          Pricing calculator
        </h2>
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">
          Enter your approximate managed unit count and what you need to run. Amounts come from the
          server quote — the same calculation used on Confirm Plan and Checkout.
        </p>
      </header>

      <div className="flex flex-wrap items-end gap-4">
        <label className="block min-w-[10rem] flex-1 space-y-1 text-sm">
          <span className="font-semibold">Managed units</span>
          <input
            inputMode="numeric"
            value={unitsInput}
            onChange={(event) => setUnitsInput(event.target.value)}
            className="w-full rounded-md border border-[var(--mpa-color-border-default)] px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mpa-color-border-focus,#0F6B56)]"
            aria-describedby="unit-calculator-hint"
          />
        </label>
        <label className="block min-w-[14rem] flex-[1.4] space-y-1 text-sm">
          <span className="font-semibold">What do you need?</span>
          <select
            value={operationalNeed}
            onChange={(event) => setOperationalNeed(event.target.value as OperationalNeed)}
            className="w-full rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mpa-color-border-focus,#0F6B56)]"
          >
            {OPERATIONAL_NEEDS.map((need) => (
              <option key={need} value={need}>
                {operationalNeedLabel(need)}
              </option>
            ))}
          </select>
        </label>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Billing interval">
          {BILLING_CYCLES.map((cycle) => (
            <button
              key={cycle}
              type="button"
              aria-pressed={billingInterval === cycle}
              onClick={() => setBillingInterval(cycle)}
              className={`rounded-md px-3 py-2 text-sm font-semibold ${
                billingInterval === cycle
                  ? "bg-[var(--mpa-color-brand-primary)] text-white"
                  : "bg-[var(--mpa-color-bg-subtle)] text-[var(--mpa-color-text-secondary)]"
              }`}
            >
              {toBillingCycleLabel(cycle)}
            </button>
          ))}
        </div>
      </div>
      <p id="unit-calculator-hint" className="text-xs text-[var(--mpa-color-text-muted)]">
        {shownSku === "mpa_complete_platform"
          ? "Examples: 500 → $109 · 501 → $148 · 1,000 → $148 · 1,001 → $187 per month"
          : "Examples: 500 → $59 · 501 → $98 · 1,000 → $98 · 1,001 → $137 per month"}
        {quoting ? " · Updating quote…" : ""}
      </p>

      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        <div className="sm:col-span-2">
          <dt className="text-[var(--mpa-color-text-muted)]">Recommended product</dt>
          <dd className="font-semibold text-[var(--mpa-color-text-primary)]">
            {productLabel}
            <span className="ml-2 text-xs font-normal text-[var(--mpa-color-text-secondary)]">
              ({recommendation.reason})
            </span>
          </dd>
        </div>
        <div>
          <dt className="text-[var(--mpa-color-text-muted)]">Included units</dt>
          <dd className="font-semibold">{display.includedUnits.toLocaleString("en-US")}</dd>
        </div>
        <div>
          <dt className="text-[var(--mpa-color-text-muted)]">Additional Unit Capacity</dt>
          <dd className="font-semibold">
            {additionalBlocks === 0
              ? "None"
              : `${additionalBlocks} × ${display.includedUnits}-unit block${additionalBlocks === 1 ? "" : "s"}`}
          </dd>
        </div>
        <div>
          <dt className="text-[var(--mpa-color-text-muted)]">Monthly</dt>
          <dd className="font-semibold">{formatUsdAmount(monthly)}</dd>
        </div>
        <div>
          <dt className="text-[var(--mpa-color-text-muted)]">Annual</dt>
          <dd className="font-semibold">{formatUsdAmount(annual)}</dd>
        </div>
        <div>
          <dt className="text-[var(--mpa-color-text-muted)]">Trial eligibility</dt>
          <dd className="font-semibold">{trialEligible ? "30 DAYS FREE" : "Not eligible"}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-[var(--mpa-color-text-muted)]">Selected</dt>
          <dd className="font-display text-3xl font-semibold">
            {formatUsdAmount(selected)}
            <span className="ml-2 text-sm font-medium text-[var(--mpa-color-text-secondary)]">
              / {billingInterval === "annual" ? "year" : "month"}
            </span>
          </dd>
        </div>
      </dl>

      {trialEligible ? (
        <div className="space-y-1 rounded-md border border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-subtle,#F7F8FA)] px-3 py-3 text-sm">
          <p className="font-semibold text-[var(--mpa-color-text-primary)]">30 DAYS FREE</p>
          <p>Payment card required at signup.</p>
          <p>After the free trial, automatic billing begins unless you cancel.</p>
          <p>
            Cancel anytime — access continues through the paid period end. No refunds or prorated
            refunds.
          </p>
        </div>
      ) : (
        <div className="space-y-1 rounded-md border border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-subtle,#F7F8FA)] px-3 py-3 text-sm">
          <p className="font-semibold text-[var(--mpa-color-text-primary)]">
            No free trial above 500 units
          </p>
          <p>
            Payment card required. Recurring amount before Checkout:{" "}
            {formatUsdAmount(selected)}/{billingInterval === "annual" ? "year" : "month"}.
          </p>
          <p>
            Cancel anytime — access continues through the paid period end. No refunds or prorated
            refunds.
          </p>
        </div>
      )}

      {quoteError ? (
        <p className="text-xs text-[var(--mpa-color-text-muted)]" role="status">
          Showing shared calculator while the server quote refreshes: {quoteError}
        </p>
      ) : null}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[20rem] border-collapse text-sm">
          <caption className="py-2 text-left text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-muted)]">
            {productLabel} price examples
          </caption>
          <thead>
            <tr className="border-b border-[var(--mpa-color-border-subtle)] text-left">
              <th className="py-2 pr-3 font-semibold">Managed units</th>
              <th className="py-2 pr-3 font-semibold">Monthly</th>
              <th className="py-2 font-semibold">Annual</th>
            </tr>
          </thead>
          <tbody>
            {display.examples.map((row) => (
              <tr key={row.units} className="border-b border-[var(--mpa-color-border-subtle)]">
                <td className="py-2 pr-3">{row.units.toLocaleString("en-US")}</td>
                <td className="py-2 pr-3">{formatUsdAmount(row.monthly)}</td>
                <td className="py-2">{formatUsdAmount(row.annual)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Link
        href={continueHref}
        className={marketingPrimaryCtaClass}
        onClick={persistUnitsAndContinue}
      >
        Get Started
      </Link>
    </section>
  );
}
