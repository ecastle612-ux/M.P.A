"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@mpa/ui";
import type { ScreeningOpsSnapshot } from "../../lib/screening/contracts";

export function ScreeningOperationsWidget() {
  const [ops, setOps] = useState<ScreeningOpsSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/screening?ops=1", { cache: "no-store" });
        const json = (await res.json()) as { ops?: ScreeningOpsSnapshot; error?: { message?: string } };
        if (!res.ok) throw new Error(json.error?.message ?? "Failed to load screening ops");
        setOps(json.ops ?? null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load");
      }
    })();
  }, []);

  const metrics = [
    { label: "Pending screenings", value: ops?.pendingScreenings ?? "—", href: "/applicants" },
    { label: "Awaiting consent", value: ops?.awaitingConsent ?? "—", href: "/applicants" },
    { label: "Ready for review", value: ops?.readyForReview ?? "—", href: "/applicants" },
    { label: "Flagged applicants", value: ops?.flaggedApplicants ?? "—", href: "/applicants" },
    { label: "Provider failures", value: ops?.providerFailures ?? "—", href: "/applicants" },
    {
      label: "Avg turnaround (hrs)",
      value: ops?.averageTurnaroundHours ?? "—",
      href: "/applicants"
    },
    { label: "Completed today", value: ops?.completedToday ?? "—", href: "/applicants" }
  ];

  return (
    <Card className="space-y-3">
      <div>
        <h3 className="text-base font-semibold">Background screening</h3>
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">
          Consent, provider status, and review queues (API-003).
        </p>
      </div>
      {error ? <p className="text-sm text-[var(--mpa-color-danger)]">{error}</p> : null}
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
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
