"use client";

import { Alert } from "@mpa/ui";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  SKU_SUMMARIES,
  toBillingCycleLabel,
  type BillingCycle,
  type ProductSku
} from "@mpa/shared";
import { MarketingChrome, marketingPrimaryCtaClass, marketingSecondaryCtaClass } from "./marketing-chrome";

type SessionStatus = {
  status: string;
  productSku?: ProductSku;
  billingCycle: BillingCycle;
  workspacePreparing?: boolean;
  provisioned?: boolean;
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
            After purchase
          </p>
          <h1 className="font-display text-3xl font-semibold">
            {paid ? "Purchase successful" : "Confirming payment…"}
          </h1>
          <p className="text-sm leading-6 text-[var(--mpa-color-text-secondary)]">
            {paid
              ? "Your subscription is secured. Continue to claim your workspace — Guided Setup is next."
              : "Waiting for payment confirmation. If you just finished paying, this updates automatically."}
          </p>
        </header>

        {error ? (
          <Alert variant="danger">{error}</Alert>
        ) : null}

        {status ? (
          <section
            aria-label="Purchase summary"
            className="space-y-2 rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] p-5 text-sm"
          >
            <p>
              <span className="font-semibold">Platform:</span>{" "}
              {SKU_SUMMARIES[status.productSku ?? "mpa_property_manager"].label} ·{" "}
              {toBillingCycleLabel(status.billingCycle)} billing
            </p>
            <p>
              <span className="font-semibold">Payment:</span>{" "}
              {paid ? "Confirmed" : "Confirming…"}
            </p>
            <p>
              <span className="font-semibold">Workspace:</span>{" "}
              {status.workspacePreparing === false
                ? "Ready — continue to claim access"
                : "Preparing automatically after you continue"}
            </p>
          </section>
        ) : null}

        <div className="space-y-3">
          <p className="text-sm font-semibold text-[var(--mpa-color-text-primary)]">
            What to do next
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href={continueHref} className={marketingPrimaryCtaClass}>
              Continue to claim workspace
            </Link>
            <Link href="/pricing" className={marketingSecondaryCtaClass}>
              Back to pricing
            </Link>
          </div>
          <p className="text-xs text-[var(--mpa-color-text-muted)]">
            Next: set password with your purchase email → claim organization → Guided Setup → Mission
            Control.
          </p>
        </div>
      </main>
    </MarketingChrome>
  );
}
