"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@mpa/ui";
import type { SignatureOpsSnapshot } from "../../lib/signature/contracts";
import { readApiError } from "../../lib/api/client-error";

export function SignatureOperationsWidget() {
  const [ops, setOps] = useState<SignatureOpsSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const res = await fetch("/api/signatures?ops=1", { cache: "no-store" });
          const json = (await res.json()) as { ops?: SignatureOpsSnapshot };
          if (!res.ok) throw new Error(readApiError(json, "Could not load pending signatures."));
          setOps(json.ops ?? null);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Failed to load");
        }
      })();
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const metrics = [
    { label: "Pending signatures", value: ops?.pendingSignatures ?? "—", href: "/leases?status=draft" },
    { label: "Completed today", value: ops?.completedToday ?? "—", href: "/leases?status=signed" },
    { label: "Expired requests", value: ops?.expiredRequests ?? "—", href: "/leases?status=draft" },
    { label: "Reminder queue", value: ops?.reminderQueue ?? "—", href: "/leases?status=draft" },
    { label: "Provider failures", value: ops?.providerFailures ?? "—", href: "/leases" },
    { label: "Awaiting vault sync", value: ops?.awaitingVaultSync ?? "—", href: "/leases" },
    {
      label: "Avg completion (hrs)",
      value: ops?.averageCompletionHours ?? "—",
      href: "/leases?status=draft"
    }
  ];

  return (
    <Card className="space-y-3">
      <div>
        <h3 className="text-base font-semibold">Electronic signatures</h3>
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">
          Packages, reminders, vault sync, and completion (API-004).
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
