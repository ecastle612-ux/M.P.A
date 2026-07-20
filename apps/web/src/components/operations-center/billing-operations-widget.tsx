"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@mpa/ui";
import type { BillingOpsSnapshot } from "../../lib/billing/contracts";
import { formatCurrency } from "../../lib/financial/contracts";
import { readApiError } from "../../lib/api/client-error";

export function BillingOperationsWidget() {
  const [ops, setOps] = useState<BillingOpsSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const res = await fetch("/api/billing?ops=1", { cache: "no-store" });
          const json = (await res.json()) as { ops?: BillingOpsSnapshot };
          if (!res.ok) throw new Error(readApiError(json, "Could not load payment attention items."));
          setOps(json.ops ?? null);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Failed to load");
        }
      })();
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const metrics = [
    {
      label: "Today's payments",
      value: ops ? `${ops.todaysPaymentsCount} · ${formatCurrency(ops.todaysPaymentsAmount)}` : "—",
      href: "/financials"
    },
    { label: "Failed payments", value: ops?.failedPaymentsCount ?? "—", href: "/financials/charges" },
    {
      label: "Outstanding balance",
      value: ops ? formatCurrency(ops.outstandingBalance) : "—",
      href: "/financials"
    },
    { label: "Upcoming late fees", value: ops?.upcomingLateFeesCount ?? "—", href: "/financials/charges" },
    { label: "Collections queue", value: ops?.collectionsQueueCount ?? "—", href: "/financials" },
    { label: "AutoPay %", value: ops ? `${ops.autopayEnrollmentPercent}%` : "—", href: "/financials" },
    {
      label: "Processing health",
      value: ops?.processingHealth ?? "—",
      href: "/financials"
    },
    {
      label: "Awaiting reconciliation",
      value: ops?.awaitingReconciliationCount ?? "—",
      href: "/financials"
    }
  ];

  return (
    <Card className="space-y-3">
      <div>
        <h3 className="text-base font-semibold">Resident payments</h3>
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">
          Billing rails via BillingService → PaymentProvider ({ops?.provider ?? "…"}) — API-005.
        </p>
      </div>
      {error ? <p className="text-sm text-[var(--mpa-color-danger)]">{error}</p> : null}
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => (
          <Link
            key={metric.label}
            href={metric.href}
            className="rounded-md border border-[var(--mpa-color-border)] p-3 text-sm transition hover:border-[var(--mpa-color-brand)]"
          >
            <div className="text-[var(--mpa-color-text-secondary)]">{metric.label}</div>
            <div className="text-xl font-semibold">{metric.value}</div>
          </Link>
        ))}
      </div>
    </Card>
  );
}
