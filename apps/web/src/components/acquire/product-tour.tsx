"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { TOUR_STEPS } from "../../lib/acquire/catalog";
import { ACQ_FUNNEL_EVENTS, emitAcqFunnelEvent } from "../../lib/acquire/funnel";

export function ProductTour() {
  const [index, setIndex] = useState(0);
  const step = TOUR_STEPS[index] ?? TOUR_STEPS[0];
  const total = TOUR_STEPS.length;
  const isLast = index >= total - 1;

  useEffect(() => {
    emitAcqFunnelEvent(ACQ_FUNNEL_EVENTS.tourStarted, {}, { oncePerSession: true, dedupeKey: "tour" });
  }, []);

  useEffect(() => {
    emitAcqFunnelEvent(ACQ_FUNNEL_EVENTS.tourStep, {
      step_index: index + 1,
      step_id: step?.id ?? null
    });
    if (isLast) {
      emitAcqFunnelEvent(
        ACQ_FUNNEL_EVENTS.tourCompleted,
        { steps: total },
        { oncePerSession: true, dedupeKey: "tour_completed" }
      );
    }
  }, [index, isLast, step?.id, total]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <header>
        <p className="text-sm font-medium text-[var(--mpa-color-brand-primary)]">
          Step {index + 1} of {total}
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">Product tour</h1>
        <p className="mt-3 text-[var(--mpa-color-text-secondary)]">
          Six short stops. Skip anytime — the tour is optional and never required before Checkout.
        </p>
      </header>

      <div
        className="mt-10 overflow-hidden rounded-[var(--mpa-radius-lg)] border border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-surface)]"
        aria-live="polite"
      >
        <div
          className="h-40 bg-[linear-gradient(135deg,color-mix(in_srgb,var(--mpa-color-brand-primary)_35%,transparent),color-mix(in_srgb,var(--mpa-color-bg-app)_80%,#0f172a)),radial-gradient(circle_at_20%_20%,color-mix(in_srgb,var(--mpa-color-brand-primary)_25%,transparent),transparent_55%)] motion-safe:transition-[background-position] motion-safe:duration-500 motion-reduce:transition-none"
          aria-hidden
        />
        <div className="p-6 sm:p-8">
          <h2 className="font-display text-2xl font-semibold">{step?.title}</h2>
          <p className="mt-3 text-[var(--mpa-color-text-secondary)]">{step?.body}</p>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <button
          type="button"
          className="inline-flex h-11 min-h-11 items-center rounded-[var(--mpa-radius-md)] border border-[var(--mpa-color-border-default)] px-4 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mpa-color-border-focus)] disabled:opacity-40"
          disabled={index === 0}
          onClick={() => setIndex((value) => Math.max(0, value - 1))}
        >
          Back
        </button>
        {!isLast ? (
          <button
            type="button"
            className="inline-flex h-11 min-h-11 items-center rounded-[var(--mpa-radius-md)] bg-[var(--mpa-color-brand-primary)] px-4 text-sm font-semibold text-[var(--mpa-color-text-inverse)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mpa-color-border-focus)]"
            onClick={() => setIndex((value) => Math.min(total - 1, value + 1))}
          >
            Next
          </button>
        ) : (
          <Link
            href="/modules"
            className="inline-flex h-11 min-h-11 items-center rounded-[var(--mpa-radius-md)] bg-[var(--mpa-color-brand-primary)] px-4 text-sm font-semibold text-[var(--mpa-color-text-inverse)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mpa-color-border-focus)]"
          >
            Choose modules
          </Link>
        )}
        <Link
          href="/modules"
          className="inline-flex h-11 min-h-11 items-center px-2 text-sm font-medium text-[var(--mpa-color-text-secondary)] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mpa-color-border-focus)]"
          onClick={() =>
            emitAcqFunnelEvent(ACQ_FUNNEL_EVENTS.tourSkipped, { from_step: index + 1 })
          }
        >
          Skip to modules
        </Link>
      </div>

      <ol className="mt-10 flex gap-2" aria-label="Tour progress">
        {TOUR_STEPS.map((item, stepIndex) => (
          <li key={item.id}>
            <button
              type="button"
              aria-label={`Go to step ${stepIndex + 1}: ${item.title}`}
              aria-current={stepIndex === index ? "step" : undefined}
              className={`flex min-h-11 min-w-11 items-center justify-center rounded-[var(--mpa-radius-md)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mpa-color-border-focus)]`}
              onClick={() => setIndex(stepIndex)}
            >
              <span
                className={`block h-2.5 w-8 rounded-full ${
                  stepIndex === index
                    ? "bg-[var(--mpa-color-brand-primary)]"
                    : "bg-[var(--mpa-color-border-default)]"
                }`}
                aria-hidden
              />
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}
