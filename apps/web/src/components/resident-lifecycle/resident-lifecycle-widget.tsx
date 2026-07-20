"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, Skeleton } from "@mpa/ui";
import type { ResidentLifecycleOpsMetrics } from "../../lib/resident-lifecycle/contracts";
import { readApiError } from "../../lib/api/client-error";

export function ResidentLifecycleWidget() {
  const [metrics, setMetrics] = useState<ResidentLifecycleOpsMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const res = await fetch("/api/resident-lifecycle", { cache: "no-store" });
          const json = (await res.json()) as { metrics?: ResidentLifecycleOpsMetrics };
          if (!res.ok) throw new Error(readApiError(json, "Failed to load lifecycle metrics"));
          setMetrics(json.metrics ?? null);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Failed to load");
        } finally {
          setLoading(false);
        }
      })();
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const items = [
    { label: "Pending move-ins", value: metrics?.pendingMoveIns, href: "/residents/move-in" },
    { label: "Pending move-outs", value: metrics?.pendingMoveOuts, href: "/residents/move-out" },
    { label: "Awaiting invitation", value: metrics?.awaitingInvitation, href: "/residents/bulk" },
    { label: "Missing lease", value: metrics?.missingLease, href: "/leases" },
    { label: "Missing deposit", value: metrics?.missingDeposit, href: "/financials/charges" },
    { label: "Missing documents", value: metrics?.missingDocuments, href: "/tenants" },
    { label: "Units becoming vacant", value: metrics?.unitsBecomingVacant, href: "/units" },
    { label: "Lease expirations (60d)", value: metrics?.upcomingLeaseExpirations, href: "/leases" }
  ].filter((item) => loading || (item.value ?? 0) > 0 || ["Pending move-ins", "Pending move-outs"].includes(item.label));

  return (
    <Card className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-base font-semibold">Resident attention</h3>
          <p className="text-sm text-[var(--mpa-color-text-secondary)]">
            Move-ins, move-outs, invites, and readiness gaps.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/residents/move-in" className="text-sm text-[var(--mpa-color-brand-primary)]">
            Move in
          </Link>
          <Link href="/residents/move-out" className="text-sm text-[var(--mpa-color-brand-primary)]">
            Move out
          </Link>
          <Link href="/residents/transfer" className="text-sm text-[var(--mpa-color-brand-primary)]">
            Transfer
          </Link>
        </div>
      </div>
      {error ? <p className="text-sm text-[var(--mpa-color-danger)]">{error}</p> : null}
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-20 rounded-md" />)
          : items.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="rounded-md border border-[var(--mpa-color-border)] p-3 text-sm transition hover:border-[var(--mpa-color-brand)]"
              >
                <div className="text-[var(--mpa-color-text-secondary)]">{item.label}</div>
                <div className="text-xl font-semibold">{item.value ?? 0}</div>
              </Link>
            ))}
      </div>
    </Card>
  );
}
