"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  toBillingCycleLabel,
  toPlanTierLabel,
  type BillingCycle,
  type PlanTier
} from "@mpa/shared";
import { MarketingChrome, marketingPrimaryCtaClass, marketingSecondaryCtaClass } from "./marketing-chrome";

type SessionStatus = {
  sessionId: string;
  status: string;
  offerId: string;
  planTier: PlanTier;
  billingCycle: BillingCycle;
  provisioned: boolean;
  organizationId: string | null;
  userId: string | null;
  continuePath: string | null;
};

/**
 * Purchase successful — hand off to automatic provisioning continue page.
 */
export function CheckoutSuccessPage({
  sessionId,
  isAuthenticated = false
}: {
  sessionId: string | null;
  isAuthenticated?: boolean;
}) {
  const [status, setStatus] = useState<SessionStatus | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const missingSessionError = sessionId ? null : "Missing checkout session.";

  useEffect(() => {
    if (!sessionId) {
      return;
    }
    let cancelled = false;
    async function load() {
      const res = await fetch(
        `/api/commerce/checkout/session?session_id=${encodeURIComponent(sessionId!)}`
      );
      if (!res.ok) {
        if (!cancelled) setLoadError("Could not verify purchase. Refresh to retry.");
        return;
      }
      const data = (await res.json()) as SessionStatus;
      if (!cancelled) {
        setLoadError(null);
        setStatus(data);
      }
    }
    void load();
    const timer = window.setInterval(() => void load(), 2500);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [sessionId]);

  const paid = status?.status === "checkout_completed";
  const error = missingSessionError ?? loadError;
  const continueHref =
    status?.continuePath ??
    (sessionId ? `/commerce/continue?session_id=${encodeURIComponent(sessionId)}` : "/commerce/continue");

  return (
    <MarketingChrome isAuthenticated={isAuthenticated} denseNav>
      <main className="mx-auto max-w-3xl space-y-8 px-4 pb-16 pt-10 md:px-6">
        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
            Stripe Checkout
          </p>
          <h1 className="font-display text-3xl font-semibold">
            {paid ? "Purchase Successful" : "Confirming payment…"}
          </h1>
          <p className="text-sm leading-6 text-[var(--mpa-color-text-secondary)]">
            {paid
              ? "Your subscription is secured. Continue to automatic workspace provisioning — no employee involvement required."
              : "Waiting for Stripe confirmation. If you just finished paying, this updates automatically."}
          </p>
        </header>

        {error ? (
          <p className="text-sm text-red-700" role="alert">
            {error}
          </p>
        ) : null}

        {status ? (
          <section className="space-y-2 rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] p-5 text-sm">
            <p>
              <span className="font-semibold">Plan:</span>{" "}
              {toPlanTierLabel(status.planTier)} · {toBillingCycleLabel(status.billingCycle)}
            </p>
            <p>
              <span className="font-semibold">Status:</span> {status.status}
            </p>
            <p>
              <span className="font-semibold">Provisioning:</span>{" "}
              {status.provisioned ? "complete" : "automatic — in progress after continue"}
            </p>
            <p className="font-mono text-xs text-[var(--mpa-color-text-muted)]">{status.sessionId}</p>
          </section>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <Link href={continueHref} className={marketingPrimaryCtaClass}>
            Continue to workspace setup
          </Link>
          <Link href="/pricing" className={marketingSecondaryCtaClass}>
            Back to pricing
          </Link>
        </div>
        <p className="text-xs text-[var(--mpa-color-text-muted)]">
          Next: verify email, create your password, claim your organization, then Guided Setup →
          Mission Control.
        </p>
      </main>
    </MarketingChrome>
  );
}
