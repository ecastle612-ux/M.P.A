"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ACQ_FUNNEL_EVENTS, emitAcqFunnelEvent } from "../../lib/acquire/funnel";

/**
 * Resume Checkout after cancel — prefers last intent in sessionStorage.
 */
export function ResumeCheckoutLinks() {
  const [resumeHref, setResumeHref] = useState("/pricing");

  useEffect(() => {
    let plan: string | null = null;
    try {
      const raw = window.sessionStorage.getItem("mpa.acq.checkoutIntent");
      if (raw) {
        const intent = JSON.parse(raw) as { plan?: string; interval?: string };
        if (intent.plan) {
          plan = intent.plan;
          const interval = intent.interval === "year" ? "year" : "month";
          setResumeHref(`/acquire/start?plan=${intent.plan}&interval=${interval}`);
        }
      }
    } catch {
      // keep pricing
    }
    emitAcqFunnelEvent(
      ACQ_FUNNEL_EVENTS.checkoutCanceled,
      { plan_code: plan },
      { oncePerSession: true, dedupeKey: "canceled" }
    );
  }, []);

  return (
    <div className="mt-6 flex flex-wrap gap-3">
      <Link
        href={resumeHref}
        className="inline-flex h-11 items-center rounded-[var(--mpa-radius-md)] bg-[var(--mpa-color-brand-primary)] px-4 text-sm font-semibold text-[var(--mpa-color-text-inverse)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mpa-color-border-focus)]"
      >
        Resume Checkout
      </Link>
      <Link
        href="/pricing"
        className="inline-flex h-11 items-center rounded-[var(--mpa-radius-md)] border border-[var(--mpa-color-border-default)] px-4 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mpa-color-border-focus)]"
      >
        Return to pricing
      </Link>
      <Link
        href="/tour"
        className="inline-flex h-11 items-center px-2 text-sm font-medium underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mpa-color-border-focus)]"
      >
        Take the tour
      </Link>
    </div>
  );
}
