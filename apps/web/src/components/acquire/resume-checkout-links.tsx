"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ACQ_FUNNEL_EVENTS, emitAcqFunnelEvent } from "../../lib/acquire/funnel";
import { isAcqModuleSelection } from "../../lib/acquire/modules";

/**
 * Resume Checkout after cancel — prefers last intent in sessionStorage.
 */
export function ResumeCheckoutLinks() {
  const [resumeHref, setResumeHref] = useState("/modules");

  useEffect(() => {
    let plan: string | null = null;
    try {
      const raw = window.sessionStorage.getItem("mpa.acq.checkoutIntent");
      if (raw) {
        const intent = JSON.parse(raw) as { plan?: string; interval?: string; modules?: string };
        if (intent.plan) {
          plan = intent.plan;
          const interval = intent.interval === "year" ? "year" : "month";
          const modules =
            typeof intent.modules === "string" && isAcqModuleSelection(intent.modules)
              ? intent.modules
              : null;
          setResumeHref(
            modules
              ? `/acquire/start?plan=${intent.plan}&interval=${interval}&modules=${modules}`
              : "/modules"
          );
        }
      }
    } catch {
      // keep modules
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
        href="/modules"
        className="inline-flex h-11 items-center rounded-[var(--mpa-radius-md)] border border-[var(--mpa-color-border-default)] px-4 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mpa-color-border-focus)]"
      >
        Choose modules
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
