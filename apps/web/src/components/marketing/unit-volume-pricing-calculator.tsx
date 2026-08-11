"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ACQUISITION_UNITS_SESSION_KEY,
  BILLING_CYCLES,
  calculateUnitVolumeDisplay,
  commercialContinueHref,
  formatUsdAmount,
  toBillingCycleLabel,
  type BillingCycle
} from "@mpa/shared";
import { marketingPrimaryCtaClass } from "./marketing-chrome";

type UnitVolumePricingCalculatorProps = {
  initialUnits?: number | null;
  initialCycle?: BillingCycle;
};

/**
 * Property Manager pricing calculator.
 * Display math uses shared `quoteUnitVolume` (same domain as server quotes).
 * Continue carries units into the questionnaire → server quote → Confirm Plan.
 */
export function UnitVolumePricingCalculator({
  initialUnits = 500,
  initialCycle = "monthly"
}: UnitVolumePricingCalculatorProps) {
  const [unitsInput, setUnitsInput] = useState(String(initialUnits ?? 500));
  const [billingInterval, setBillingInterval] = useState<BillingCycle>(initialCycle);
  const [serverQuote, setServerQuote] = useState<{
    monthly_amount: number;
    annual_amount: number;
    trial_eligible: boolean;
    additional_blocks: number;
    quote_id: string;
  } | null>(null);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [quoting, setQuoting] = useState(false);

  const managedUnits = useMemo(() => {
    const n = Number(unitsInput.replace(/,/g, "").trim());
    if (!Number.isFinite(n) || n <= 0) return 500;
    return Math.floor(n);
  }, [unitsInput]);

  const display = useMemo(
    () =>
      calculateUnitVolumeDisplay({
        module: "mpa_property_manager",
        managedUnits,
        billingInterval
      }),
    [managedUnits, billingInterval]
  );

  // Server-authoritative quote for the amounts shown as “your plan”.
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
          operationalNeed: "property_resident_leasing",
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
            };
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
  }, [managedUnits, billingInterval]);

  const monthly = serverQuote?.monthly_amount ?? display.monthlyPriceUsd;
  const annual = serverQuote?.annual_amount ?? display.annualPriceUsd;
  const selected = billingInterval === "annual" ? annual : monthly;
  const trialEligible = serverQuote?.trial_eligible ?? display.trialEligible;
  const additionalBlocks = serverQuote?.additional_blocks ?? display.additionalBlocks;

  // Continuity: Pricing → Get Started (questionnaire) with units carried forward.
  // Do not skip the questionnaire by jumping straight to Confirm Plan.
  const continueHref = commercialContinueHref({
    productSku: "mpa_property_manager",
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
      aria-labelledby="pm-calculator-title"
      className="space-y-4 rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] p-5"
    >
      <header className="space-y-1">
        <h2 id="pm-calculator-title" className="font-display text-xl font-semibold">
          Property Manager calculator
        </h2>
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">
          Enter your managed unit count. Amounts come from the server quote — the same calculation
          used on Confirm Plan.
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
            aria-describedby="pm-calculator-hint"
          />
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
      <p id="pm-calculator-hint" className="text-xs text-[var(--mpa-color-text-muted)]">
        Examples: 500 → $59 · 501 → $98 · 1,000 → $98 · 1,001 → $137 per month
        {quoting ? " · Updating quote…" : ""}
      </p>

      <dl className="grid gap-3 text-sm sm:grid-cols-2">
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
          <p className="font-semibold text-[var(--mpa-color-text-primary)]">30 days free</p>
          <p>Valid payment card required.</p>
          <p>Your subscription automatically begins billing after the free trial.</p>
        </div>
      ) : (
        <div className="space-y-1 rounded-md border border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-subtle,#F7F8FA)] px-3 py-3 text-sm">
          <p className="font-semibold text-[var(--mpa-color-text-primary)]">
            Additional Unit Capacity
          </p>
          <p>
            Portfolios over 500 managed units are not eligible for the free trial. Recurring amount:{" "}
            {formatUsdAmount(selected)}/{billingInterval === "annual" ? "year" : "month"}.
          </p>
          <p>Valid payment card required at checkout.</p>
        </div>
      )}

      {quoteError ? (
        <p className="text-xs text-[var(--mpa-color-text-muted)]" role="status">
          Showing shared calculator while the server quote refreshes: {quoteError}
        </p>
      ) : null}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[20rem] border-collapse text-sm">
          <caption className="sr-only">Property Manager price examples</caption>
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
        Continue to Get Started
      </Link>
    </section>
  );
}
