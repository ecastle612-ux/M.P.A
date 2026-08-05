"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { SaasBillingInterval } from "../../lib/integrations/saas-billing/contracts";
import {
  ACQ_DEFAULT_BILLING_INTERVAL,
  type AcqSelfServePlan
} from "../../lib/acquire/decisions";
import {
  buildPlanComparisonRows,
  buildPublicPlanCards,
  checkoutStartHref,
  formatListPrice,
  professionalDisplayName
} from "../../lib/acquire/catalog";
import { ACQ_FUNNEL_EVENTS, emitAcqFunnelEvent } from "../../lib/acquire/funnel";
import {
  moduleSelectionLabel,
  type AcqModuleSelection
} from "../../lib/acquire/modules";

export function PricingExperience({
  initialInterval = ACQ_DEFAULT_BILLING_INTERVAL,
  initialModules = null
}: {
  initialInterval?: SaasBillingInterval;
  initialModules?: AcqModuleSelection | null;
}) {
  const [interval, setInterval] = useState<SaasBillingInterval>(initialInterval);
  const modules = initialModules;
  const cards = useMemo(() => buildPublicPlanCards(interval, modules), [interval, modules]);
  const rows = useMemo(() => buildPlanComparisonRows(modules), [modules]);

  if (!modules) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">Pricing</h1>
        <p className="mt-3 text-[var(--mpa-color-text-secondary)]">
          Choose Property Operations, Facility Operations, or both first. Plan cards and comparison then match
          your operating surface.
        </p>
        <Link
          href="/modules"
          className="mt-8 inline-flex h-11 min-h-11 items-center justify-center rounded-[var(--mpa-radius-md)] bg-[var(--mpa-color-brand-primary)] px-5 text-sm font-semibold text-[var(--mpa-color-text-inverse)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mpa-color-border-focus)]"
        >
          Choose modules
        </Link>
        <p className="mt-6 text-sm text-[var(--mpa-color-text-secondary)]">
          Optional:{" "}
          <Link href="/tour" className="underline underline-offset-4">
            take the product tour
          </Link>{" "}
          anytime — it is not required before Checkout.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <header className="max-w-2xl">
        <p className="text-sm font-medium text-[var(--mpa-color-brand-primary)]">Step 2 of 2</p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">Pricing</h1>
        <p className="mt-3 text-[var(--mpa-color-text-secondary)]">
          Plans for{" "}
          <span className="font-medium text-[var(--mpa-color-text-primary)]">
            {moduleSelectionLabel(modules)}
          </span>
          .{" "}
          {modules === "both"
            ? "Professional includes both modules with bundle savings versus buying separately. "
            : "Essentials covers one module at the base rate. "}
          Business adds capacity. Enterprise is sales-assisted.{" "}
          <Link href="/modules" className="underline underline-offset-4">
            Change modules
          </Link>
          .
        </p>
      </header>

      <div className="mt-8 flex flex-wrap items-center gap-3" role="group" aria-label="Billing interval">
        <span className="text-sm text-[var(--mpa-color-text-secondary)]">Bill</span>
        <div className="inline-flex rounded-[var(--mpa-radius-md)] border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] p-1">
          {(["month", "year"] as const).map((value) => {
            const selected = interval === value;
            return (
              <button
                key={value}
                type="button"
                aria-pressed={selected}
                onClick={() => setInterval(value)}
                className={`min-h-11 rounded-[var(--mpa-radius-sm)] px-4 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mpa-color-border-focus)] ${
                  selected
                    ? "bg-[var(--mpa-color-brand-primary)] text-[var(--mpa-color-text-inverse)]"
                    : "text-[var(--mpa-color-text-secondary)] hover:text-[var(--mpa-color-text-primary)]"
                }`}
              >
                {value === "month" ? "Monthly" : "Annual"}
              </button>
            );
          })}
        </div>
      </div>

      <ul className="mt-10 grid gap-6 lg:grid-cols-3">
        {cards.map((card) => {
          const amount = interval === "year" ? card.listPriceAnnual : card.listPriceMonthly;
          const compareAt = interval === "year" ? card.compareAtAnnual : card.compareAtMonthly;
          const href =
            card.selfServe && card.planCode !== "enterprise"
              ? checkoutStartHref(card.planCode as AcqSelfServePlan, interval, modules)
              : card.ctaHref;
          return (
            <li
              key={card.planCode}
              className={`flex flex-col rounded-[var(--mpa-radius-lg)] border bg-[var(--mpa-color-bg-surface)] p-5 shadow-[var(--mpa-shadow-xs)] ${
                card.highlight
                  ? "border-[var(--mpa-color-brand-primary)] ring-1 ring-[var(--mpa-color-brand-primary)]"
                  : "border-[var(--mpa-color-border-subtle)]"
              }`}
            >
              <h2 className="font-display text-xl font-semibold">{card.name}</h2>
              <p className="mt-2 text-sm text-[var(--mpa-color-text-secondary)]">{card.description}</p>
              <div className="mt-4">
                {compareAt != null && amount != null ? (
                  <p className="text-sm text-[var(--mpa-color-text-muted)] line-through tabular-nums">
                    {formatListPrice(compareAt, interval)}
                  </p>
                ) : null}
                <p className="font-display text-2xl font-semibold tabular-nums">
                  {formatListPrice(amount, interval)}
                </p>
                {card.moduleCount === 2 &&
                (interval === "year" ? card.bundleSavingsAnnual : card.bundleSavingsMonthly) != null ? (
                  <p className="mt-1 text-sm font-medium text-[var(--mpa-color-brand-primary)]">
                    Save $
                    {interval === "year" ? card.bundleSavingsAnnual : card.bundleSavingsMonthly}
                    {interval === "year" ? "/year" : "/month"} compared to purchasing separately.
                  </p>
                ) : card.moduleCount === 1 ? (
                  <p className="mt-1 text-xs text-[var(--mpa-color-text-muted)]">
                    Essentials · one module
                  </p>
                ) : null}
              </div>
              <ul className="mt-4 flex-1 space-y-2 text-sm text-[var(--mpa-color-text-secondary)]">
                {card.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
              <Link
                href={href}
                onClick={() => {
                  if (card.selfServe && card.planCode !== "enterprise") {
                    emitAcqFunnelEvent(ACQ_FUNNEL_EVENTS.planSelected, {
                      plan_code: card.planCode,
                      interval,
                      module_selection: modules
                    });
                  }
                }}
                className={`mt-6 inline-flex h-11 min-h-11 items-center justify-center rounded-[var(--mpa-radius-md)] px-4 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mpa-color-border-focus)] ${
                  card.selfServe
                    ? "bg-[var(--mpa-color-brand-primary)] text-[var(--mpa-color-text-inverse)] hover:bg-[var(--mpa-color-brand-primary-hover)]"
                    : "border border-[var(--mpa-color-border-default)] text-[var(--mpa-color-text-primary)] hover:bg-[var(--mpa-color-interactive-row-hover)]"
                }`}
              >
                {card.ctaLabel}
              </Link>
            </li>
          );
        })}
      </ul>

      <p className="mt-8 text-sm text-[var(--mpa-color-text-secondary)]">
        Optional before Checkout:{" "}
        <Link href="/tour" className="underline underline-offset-4">
          product tour
        </Link>
        .
      </p>

      <section className="mt-16" aria-labelledby="compare-heading">
        <h2 id="compare-heading" className="font-display text-2xl font-semibold">
          Plan comparison
        </h2>
        <p className="mt-2 text-sm text-[var(--mpa-color-text-secondary)]">
          Caps match the subscription capability matrix. Exact Stripe charges are confirmed at Checkout.
        </p>
        <div className="mt-6 overflow-x-auto rounded-[var(--mpa-radius-lg)] border border-[var(--mpa-color-border-subtle)]">
          <table className="min-w-full border-collapse text-left text-sm">
            <caption className="sr-only">
              Feature comparison across {professionalDisplayName(modules)}, Business, and Enterprise plans
            </caption>
            <thead className="bg-[var(--mpa-color-bg-surface)]">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">
                  Capability
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  {professionalDisplayName(modules)}
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Business
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Enterprise
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.label} className="border-t border-[var(--mpa-color-border-subtle)]">
                  <th scope="row" className="px-4 py-3 text-left font-medium">
                    {row.label}
                  </th>
                  <td className="px-4 py-3 text-[var(--mpa-color-text-secondary)]">{row.professional}</td>
                  <td className="px-4 py-3 text-[var(--mpa-color-text-secondary)]">{row.business}</td>
                  <td className="px-4 py-3 text-[var(--mpa-color-text-secondary)]">{row.enterprise}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-16 max-w-2xl" aria-labelledby="faq-heading">
        <h2 id="faq-heading" className="font-display text-2xl font-semibold">
          Frequently asked questions
        </h2>
        <dl className="mt-6 space-y-6">
          <div>
            <dt className="font-medium">How do modules work?</dt>
            <dd className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
              You choose Property Operations, Facility Operations, or both before selecting Professional or
              Business. That choice shapes the plan summary you see here.
            </dd>
          </div>
          <div>
            <dt className="font-medium">What happens after I pay?</dt>
            <dd className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
              We create your organization, assign the plan, and email Organization Administrator credentials for
              first login and Guided Setup.
            </dd>
          </div>
          <div>
            <dt className="font-medium">Can I invite my team?</dt>
            <dd className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
              Yes — within purchased seat limits. Team members join by invitation only; there is no public team
              signup.
            </dd>
          </div>
          <div>
            <dt className="font-medium">Is tenant rent part of this subscription?</dt>
            <dd className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
              No. M.P.A. subscription billing is separate from resident rent collection and owner payouts.
            </dd>
          </div>
          <div>
            <dt className="font-medium">Do you offer Enterprise?</dt>
            <dd className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
              Yes — <Link href="/contact-sales" className="underline">contact sales</Link> for custom limits and
              assisted onboarding.
            </dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
