"use client";

import Link from "next/link";
import {
  ACQ_MODULE_OPTIONS,
  type AcqCapabilityGroup,
  type AcqModuleOption,
  type AcqModuleSelection
} from "../../lib/acquire/modules";
import { ACQ_FUNNEL_EVENTS, emitAcqFunnelEvent } from "../../lib/acquire/funnel";

function CheckIcon() {
  return (
    <span
      aria-hidden="true"
      className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center text-[var(--mpa-color-brand-primary)]"
    >
      <svg width="14" height="14" viewBox="0 0 16 16" className="block overflow-visible" fill="none">
        <path
          d="M3.5 8.5 6.5 11.5 12.5 4.5"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

function CapabilityGroup({ group }: { group: AcqCapabilityGroup }) {
  const included = group.status === "included";
  return (
    <section className="space-y-2">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-muted)]">
        {group.title}
      </h3>
      <ul className="space-y-1.5">
        {group.items.map((item) => (
          <li key={item} className="flex gap-2 text-sm text-[var(--mpa-color-text-secondary)]">
            {included ? (
              <CheckIcon />
            ) : (
              <span
                aria-hidden="true"
                className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--mpa-color-text-muted)]"
              />
            )}
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ModuleCard({
  option,
  onSelect
}: {
  option: AcqModuleOption;
  onSelect: (selection: AcqModuleSelection) => void;
}) {
  const comingSoon = option.availability === "coming_soon";
  const cardClassName = [
    "flex h-full flex-col rounded-[var(--mpa-radius-lg)] border bg-[var(--mpa-color-bg-surface)] p-5 shadow-[var(--mpa-shadow-xs)] sm:p-6",
    comingSoon
      ? "border-[var(--mpa-color-border-subtle)]"
      : "border-[var(--mpa-color-border-subtle)] transition-[border-color,box-shadow] duration-200 hover:border-[var(--mpa-color-brand-primary)] hover:shadow-[var(--mpa-shadow-sm)]"
  ].join(" ");

  return (
    <article className={cardClassName} aria-labelledby={`module-${option.id}-title`}>
      <header className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h2
            id={`module-${option.id}-title`}
            className="font-display text-2xl font-semibold tracking-tight"
          >
            {option.title}
          </h2>
          {comingSoon ? (
            <span className="inline-flex items-center rounded-[var(--mpa-radius-sm)] border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-app)] px-2.5 py-1 text-xs font-semibold text-[var(--mpa-color-text-primary)]">
              Coming Soon
            </span>
          ) : null}
        </div>
        <p className="text-sm font-medium text-[var(--mpa-color-text-primary)]">{option.subtitle}</p>
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">{option.bestFor}</p>
        <p className="font-display text-lg font-semibold text-[var(--mpa-color-brand-primary)]">
          {option.capabilitySummary}
        </p>
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">{option.packageHint}</p>
      </header>

      {option.composition && option.composition.length > 0 ? (
        <ul className="mt-5 space-y-2 border-t border-[var(--mpa-color-border-subtle)] pt-5">
          {option.composition.map((line) => (
            <li key={line} className="flex gap-2 text-sm font-medium text-[var(--mpa-color-text-primary)]">
              <CheckIcon />
              <span>{line}</span>
            </li>
          ))}
        </ul>
      ) : null}

      {comingSoon ? (
        <p className="mt-5 rounded-[var(--mpa-radius-md)] border border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-app)] px-3 py-2 text-sm text-[var(--mpa-color-text-secondary)]">
          Planned capabilities below are not available for purchase today. Property Manager remains the
          production-certified product you can buy now.
        </p>
      ) : null}

      <div className="mt-5 flex-1 space-y-5 border-t border-[var(--mpa-color-border-subtle)] pt-5">
        {option.groups.map((group) => (
          <CapabilityGroup key={group.title} group={group} />
        ))}
      </div>

      <Link
        href={option.cta.href}
        onClick={() => onSelect(option.id)}
        className={`mt-6 inline-flex h-11 min-h-11 items-center justify-center rounded-[var(--mpa-radius-md)] px-4 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mpa-color-border-focus)] ${
          comingSoon
            ? "border border-[var(--mpa-color-border-default)] text-[var(--mpa-color-text-primary)] hover:bg-[var(--mpa-color-interactive-row-hover)]"
            : "bg-[var(--mpa-color-brand-primary)] text-[var(--mpa-color-text-inverse)] hover:bg-[var(--mpa-color-brand-primary-hover)]"
        }`}
      >
        {option.cta.label}
      </Link>
    </article>
  );
}

export function ModuleSelectionExperience() {
  function onSelect(selection: AcqModuleSelection) {
    const option = ACQ_MODULE_OPTIONS.find((item) => item.id === selection);
    emitAcqFunnelEvent(ACQ_FUNNEL_EVENTS.moduleSelected, {
      module_selection: selection,
      availability: option?.availability ?? "available",
      cta_kind: option?.cta.kind ?? "pricing"
    });

    // Only persist buyable selections into checkout continuity storage.
    if (option?.cta.kind !== "pricing") return;
    try {
      window.sessionStorage.setItem("mpa.acq.moduleSelection", selection);
    } catch {
      // Non-fatal
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <header className="max-w-3xl">
        <p className="text-sm font-medium text-[var(--mpa-color-brand-primary)]">Step 1 of 2</p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          Choose what you&apos;re buying
        </h1>
        <p className="mt-3 text-[var(--mpa-color-text-secondary)]">
          This is a buying decision. Compare exactly what each subscription includes.{" "}
          <span className="font-medium text-[var(--mpa-color-text-primary)]">Property Manager</span> is
          available today.{" "}
          <span className="font-medium text-[var(--mpa-color-text-primary)]">Facility Operations</span> is
          Coming Soon.{" "}
          <span className="font-medium text-[var(--mpa-color-text-primary)]">Complete Platform</span> includes
          Property Manager now and Facility Operations when released.
        </p>
      </header>

      <ul className="mt-10 grid list-none gap-6 lg:grid-cols-3 lg:items-start">
        {ACQ_MODULE_OPTIONS.map((option) => (
          <li key={option.id} className="min-w-0">
            <ModuleCard option={option} onSelect={onSelect} />
          </li>
        ))}
      </ul>

      <p className="mt-10 text-sm text-[var(--mpa-color-text-secondary)]">
        Buyable choices continue to plans &amp; pricing. Facility waitlist requests go to Contact Sales — no
        Facility checkout is offered while it is Coming Soon. Exact charge for Property Manager or Complete
        Platform is confirmed at Stripe Checkout.
      </p>
      <p className="mt-3 text-sm text-[var(--mpa-color-text-secondary)]">
        Prefer to explore first?{" "}
        <Link href="/tour" className="font-medium underline underline-offset-4">
          Take the optional product tour
        </Link>
        .
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
