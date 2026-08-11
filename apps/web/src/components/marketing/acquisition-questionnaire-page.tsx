"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import {
  UNIT_COUNT_RANGES,
  acquisitionHref,
  parseAcquisitionCycle,
  parseAcquisitionSku,
  parseAcquisitionUnits,
  type BillingCycle,
  type OperationalNeed,
  type ProductSku,
  type UnitCountRangeId
} from "@mpa/shared";
import {
  MarketingChrome,
  marketingNarrowMainClass,
  marketingPrimaryCtaClass,
  marketingSecondaryCtaClass
} from "./marketing-chrome";

const NEED_OPTIONS: Array<{ id: OperationalNeed; label: string; help: string }> = [
  {
    id: "property_resident_leasing",
    label: "Properties, residents, and leasing",
    help: "Portfolio operations, residents, leasing, and day-to-day property management."
  },
  {
    id: "facility_maintenance",
    label: "Buildings, work orders, and facility maintenance",
    help: "Facility operations, maintenance, and work-order workflows."
  },
  {
    id: "both",
    label: "Both",
    help: "Property management and facility operations together."
  }
];

export function AcquisitionQuestionnairePage({
  isAuthenticated = false,
  initialSkuRaw,
  initialCycleRaw,
  initialUnitsRaw
}: {
  isAuthenticated?: boolean;
  initialSkuRaw?: string | null;
  initialCycleRaw?: string | null;
  initialUnitsRaw?: string | null;
}) {
  const router = useRouter();
  const initialSku = parseAcquisitionSku(initialSkuRaw);
  const initialCycle = parseAcquisitionCycle(initialCycleRaw) ?? "monthly";
  const unitsFromQuery = parseAcquisitionUnits(initialUnitsRaw);

  const [rangeId, setRangeId] = useState<UnitCountRangeId | "">("");
  // Units from pricing calculator arrive via `?units=` (SSR-safe continuity).
  const [exactUnits, setExactUnits] = useState(
    unitsFromQuery != null ? String(unitsFromQuery) : ""
  );
  const [need, setNeed] = useState<OperationalNeed | "">(
    initialSku === "mpa_facility_operations"
      ? "facility_maintenance"
      : initialSku === "mpa_complete_platform"
        ? "both"
        : initialSku === "mpa_property_manager"
          ? "property_resident_leasing"
          : ""
  );
  const [billingInterval, setBillingInterval] = useState<BillingCycle>(initialCycle);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    const managedUnits = Number(exactUnits.replace(/,/g, "").trim());
    const res = await fetch("/api/commerce/quote", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        managedUnits,
        operationalNeed: need,
        billingInterval,
        notes: notes.trim() || undefined,
        unitRangeId: rangeId || undefined
      })
    });
    const data = (await res.json().catch(() => ({}))) as {
      error?: string;
      message?: string;
      confirmPlanPath?: string;
      quote?: { module: ProductSku };
    };
    setBusy(false);
    if (!res.ok || !data.confirmPlanPath) {
      setError(data.message ?? data.error ?? "Could not create your plan quote. Please retry.");
      return;
    }
    router.push(data.confirmPlanPath);
  }

  return (
    <MarketingChrome isAuthenticated={isAuthenticated} denseNav>
      <main className={marketingNarrowMainClass}>
        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
            Get started · Step 2
          </p>
          <h1 className="font-display text-3xl font-semibold">A few quick questions</h1>
          <p className="text-sm leading-6 text-[var(--mpa-color-text-secondary)]">
            Tell us about your portfolio. We’ll recommend a platform and show your managed-unit
            plan before checkout. Facility Operations and Complete Platform may be recommended but
            remain gated until they are online.
          </p>
        </header>

        <ol className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-muted)]">
          <li className="rounded-md bg-[var(--mpa-color-bg-subtle)] px-2 py-1">1 · Pricing</li>
          <li className="rounded-md bg-[var(--mpa-color-brand-primary-subtle,#E6F4EF)] px-2 py-1 text-[var(--mpa-color-brand-primary)]">
            2 · Questionnaire
          </li>
          <li className="rounded-md bg-[var(--mpa-color-bg-subtle)] px-2 py-1">3 · Confirm Plan</li>
          <li className="rounded-md bg-[var(--mpa-color-bg-subtle)] px-2 py-1">4 · Checkout</li>
        </ol>

        <form onSubmit={(event) => void onSubmit(event)} className="space-y-6">
          <section className="space-y-3 rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] p-5">
            <h2 className="font-display text-xl font-semibold">How many units do you manage?</h2>
            <p className="text-sm text-[var(--mpa-color-text-secondary)]">
              Count every unit (occupied, available, or offline). Multiple residents in one unit
              still count as one unit. Exact number is used for your quote.
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {UNIT_COUNT_RANGES.map((range) => (
                <label
                  key={range.id}
                  className="flex cursor-pointer items-center gap-2 rounded-md border border-[var(--mpa-color-border-subtle)] px-3 py-2 text-sm"
                >
                  <input
                    type="radio"
                    name="unitRange"
                    value={range.id}
                    checked={rangeId === range.id}
                    onChange={() => {
                      setRangeId(range.id);
                      if (!exactUnits) {
                        setExactUnits(String(range.min));
                      }
                    }}
                  />
                  {range.label}
                </label>
              ))}
            </div>
            <label className="block space-y-1 text-sm">
              <span className="font-semibold">Exact unit count</span>
              <input
                required
                inputMode="numeric"
                pattern="[0-9,]*"
                value={exactUnits}
                onChange={(event) => setExactUnits(event.target.value)}
                placeholder="e.g. 480"
                className="w-full rounded-md border border-[var(--mpa-color-border-default)] px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mpa-color-border-focus,#0F6B56)]"
              />
            </label>
          </section>

          <section className="space-y-3 rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] p-5">
            <h2 className="font-display text-xl font-semibold">What do you primarily need help managing?</h2>
            <div className="space-y-2">
              {NEED_OPTIONS.map((option) => (
                <label
                  key={option.id}
                  className="flex cursor-pointer gap-3 rounded-md border border-[var(--mpa-color-border-subtle)] px-3 py-3 text-sm"
                >
                  <input
                    type="radio"
                    name="need"
                    required
                    value={option.id}
                    checked={need === option.id}
                    onChange={() => setNeed(option.id)}
                    className="mt-1"
                  />
                  <span>
                    <span className="font-semibold text-[var(--mpa-color-text-primary)]">
                      {option.label}
                    </span>
                    <span className="mt-1 block text-[var(--mpa-color-text-secondary)]">
                      {option.help}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </section>

          <section className="space-y-3 rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] p-5">
            <h2 className="font-display text-xl font-semibold">Billing preference</h2>
            <p className="text-sm text-[var(--mpa-color-text-secondary)]">
              Annual equals monthly × 12 — no discount.
            </p>
            <div className="flex flex-wrap gap-3">
              {(
                [
                  { id: "monthly", label: "Monthly" },
                  { id: "annual", label: "Annual" }
                ] as const
              ).map((option) => (
                <label
                  key={option.id}
                  className="flex cursor-pointer items-center gap-2 rounded-md border border-[var(--mpa-color-border-subtle)] px-3 py-2 text-sm"
                >
                  <input
                    type="radio"
                    name="billing"
                    value={option.id}
                    checked={billingInterval === option.id}
                    onChange={() => setBillingInterval(option.id)}
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </section>

          <section className="space-y-3 rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] p-5">
            <h2 className="font-display text-xl font-semibold">Anything else we should know?</h2>
            <p className="text-sm text-[var(--mpa-color-text-secondary)]">Optional.</p>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              maxLength={500}
              rows={3}
              placeholder="Optional notes (avoid passwords or sensitive personal data)"
              className="w-full rounded-md border border-[var(--mpa-color-border-default)] px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mpa-color-border-focus,#0F6B56)]"
            />
          </section>

          {error ? (
            <p className="text-sm text-red-700" role="alert">
              {error}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <Link
              href={acquisitionHref("pricing", {
                sku: initialSku,
                billingCycle: billingInterval,
                managedUnits: exactUnits ? Number(exactUnits.replace(/,/g, "")) || null : null
              })}
              className={marketingSecondaryCtaClass}
            >
              Back to pricing
            </Link>
            <button
              type="submit"
              disabled={busy}
              aria-busy={busy}
              className={marketingPrimaryCtaClass}
            >
              {busy ? "Calculating…" : "See my plan"}
            </button>
            <Link href={acquisitionHref("pricing")} className={marketingSecondaryCtaClass}>
              Compare platforms
            </Link>
          </div>
        </form>
      </main>
    </MarketingChrome>
  );
}
