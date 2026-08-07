"use client";

import Link from "next/link";
import {
  ACQ_MODULE_OPTIONS,
  modulesPricingHref,
  type AcqModuleSelection
} from "../../lib/acquire/modules";
import { ACQ_FUNNEL_EVENTS, emitAcqFunnelEvent } from "../../lib/acquire/funnel";

export function ModuleSelectionExperience() {
  function onSelect(selection: AcqModuleSelection) {
    emitAcqFunnelEvent(ACQ_FUNNEL_EVENTS.moduleSelected, {
      module_selection: selection
    });
    try {
      window.sessionStorage.setItem("mpa.acq.moduleSelection", selection);
    } catch {
      // Non-fatal
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
      <header className="max-w-2xl">
        <p className="text-sm font-medium text-[var(--mpa-color-brand-primary)]">Step 1 of 2</p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          Choose what you&apos;re buying
        </h1>
        <p className="mt-3 text-[var(--mpa-color-text-secondary)]">
          Select the operating modules your team will run. Next you&apos;ll see plan options and price for that
          choice — Essentials for one module, Professional when you take both. Business adds capacity.
          Enterprise stays Contact Sales.
        </p>
      </header>

      <ul className="mt-10 grid gap-6 lg:grid-cols-3">
        {ACQ_MODULE_OPTIONS.map((option) => (
          <li key={option.id}>
            <Link
              href={modulesPricingHref(option.id)}
              onClick={() => onSelect(option.id)}
              className="group flex h-full flex-col rounded-[var(--mpa-radius-lg)] border border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-surface)] p-5 shadow-[var(--mpa-shadow-xs)] transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-[var(--mpa-color-brand-primary)] hover:shadow-[var(--mpa-shadow-sm)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mpa-color-border-focus)]"
            >
              <h2 className="font-display text-xl font-semibold">{option.title}</h2>
              <p className="mt-2 text-sm font-medium text-[var(--mpa-color-text-primary)]">
                {option.subtitle}
              </p>
              <p className="mt-3 text-sm text-[var(--mpa-color-text-secondary)]">{option.bestFor}</p>
              <p className="mt-2 text-xs font-medium uppercase tracking-wide text-[var(--mpa-color-brand-primary)]">
                {option.packageHint}
              </p>
              <ul className="mt-4 flex-1 space-y-2 text-sm text-[var(--mpa-color-text-secondary)]">
                {option.outcomes.map((outcome) => (
                  <li key={outcome} className="flex gap-2">
                    <span aria-hidden="true" className="mt-1.5 size-1 shrink-0 rounded-full bg-[var(--mpa-color-brand-primary)]" />
                    <span>{outcome}</span>
                  </li>
                ))}
              </ul>
              <span className="mt-6 inline-flex h-11 items-center justify-center rounded-[var(--mpa-radius-md)] bg-[var(--mpa-color-brand-primary)] px-4 text-sm font-semibold text-[var(--mpa-color-text-inverse)] transition-colors group-hover:bg-[var(--mpa-color-brand-primary-hover)]">
                See plans &amp; pricing
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <p className="mt-10 text-sm text-[var(--mpa-color-text-secondary)]">
        You can change modules before checkout. Exact charge is confirmed at Stripe Checkout.
      </p>
      <p className="mt-3 text-sm text-[var(--mpa-color-text-secondary)]">
        Prefer to explore first?{" "}
        <Link href="/tour" className="font-medium underline underline-offset-4">
          Take the optional product tour
        </Link>
        . You can return to module selection anytime.
      </p>
      <p className="mt-3 text-sm text-[var(--mpa-color-text-secondary)]">
        Need custom scale?{" "}
        <Link href="/contact-sales" className="font-medium underline underline-offset-4">
          Contact sales for Enterprise
        </Link>
        .
      </p>
    </div>
  );
}
