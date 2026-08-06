"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatMoney } from "@mpa/shared";
import { Badge, EmptyState, Skeleton, TimelineView } from "@mpa/ui";

type Snapshot = {
  propertyId: string;
  propertyName: string;
  expectedRentThisMonth: number;
  rentCollectedThisMonth: number;
  outstandingRent: number;
  outstandingBalance: number;
  delinquencyCount: number;
  totalDelinquency: number;
  vendorPayablesOpen: number;
  vendorPaidThisMonth: number;
  netOperationalCash: number;
  unitsTotal: number;
  unitsOccupied: number;
  occupancyRate: number;
  upcomingChargesCount: number;
  alerts: string[];
};

type Activity = {
  id: string;
  title: string;
  detail: string;
  occurredAt: string;
  amount: number;
};

function formatWhen(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function PropertyFinancialPanel({ propertyId }: { propertyId: string }) {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch(`/api/finance/reports/properties/${propertyId}`);
        const body = await response.json();
        if (!response.ok) {
          throw new Error(body.error ?? "Failed to load property money");
        }
        if (!cancelled) {
          setSnapshot(body.snapshot as Snapshot);
          setActivity((body.recentActivity as Activity[]) ?? []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load property money");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [propertyId]);

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (error || !snapshot) {
    return <EmptyState title="Property money unavailable" description={error ?? "Try again shortly."} />;
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
            Property money
          </p>
          <h1 className="mt-1 font-display text-2xl font-semibold text-[var(--mpa-color-text-primary)]">
            {snapshot.propertyName}
          </h1>
          <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
            Monthly rent, balances, vendor spend, delinquency, and recent activity — operational, not accounting.
          </p>
        </div>
        <Badge variant={snapshot.delinquencyCount > 0 ? "danger" : "success"}>
          {snapshot.delinquencyCount > 0 ? "Needs attention" : "Healthy"}
        </Badge>
      </header>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Metric label="Monthly rent" value={formatMoney(snapshot.expectedRentThisMonth)} />
        <Metric label="Collected this month" value={formatMoney(snapshot.rentCollectedThisMonth)} />
        <Metric label="Outstanding balances" value={formatMoney(snapshot.outstandingBalance)} />
        <Metric label="Vendor expenses paid" value={formatMoney(snapshot.vendorPaidThisMonth)} />
        <Metric label="Past due" value={formatMoney(snapshot.totalDelinquency)} />
        <Metric label="Vendor bills open" value={formatMoney(snapshot.vendorPayablesOpen)} />
        <Metric
          label="Occupancy"
          value={`${snapshot.unitsOccupied}/${snapshot.unitsTotal} · ${snapshot.occupancyRate}%`}
        />
        <Metric label="Net this month" value={formatMoney(snapshot.netOperationalCash)} />
      </div>

      <section
        aria-label="Assistant insights"
        className="rounded-md border border-[var(--mpa-color-border-default)] bg-white px-4 py-3"
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
          Assistant insights
        </p>
        <p className="mt-1 text-sm">
          {snapshot.delinquencyCount > 0
            ? `${snapshot.delinquencyCount} resident(s) are past due for ${formatMoney(snapshot.totalDelinquency)}. Open Financial Operations to send reminders or record an arrangement.`
            : snapshot.outstandingRent > 0
              ? `${formatMoney(snapshot.outstandingRent)} rent is still open. Confirm residents can pay online.`
              : "This property looks current. Keep next month’s rent posts on schedule."}
        </p>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4">
          <h2 className="text-sm font-semibold">Financial alerts</h2>
          <ul className="mt-2 space-y-1 text-sm text-[var(--mpa-color-text-secondary)]">
            {snapshot.alerts.map((alert) => (
              <li key={alert}>• {alert}</li>
            ))}
          </ul>
          <Link
            href="/pm/financial-operations"
            className="mt-3 inline-block text-sm text-[var(--mpa-color-brand-primary)] underline"
          >
            Open Financial Operations
          </Link>
        </div>
        <div className="rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4">
          <h2 className="text-sm font-semibold">Timeline</h2>
          <div className="mt-3">
            {activity.length === 0 ? (
              <p className="text-sm text-[var(--mpa-color-text-secondary)]">No recent money activity yet.</p>
            ) : (
              <TimelineView
                items={activity.map((item) => ({
                  id: item.id,
                  title: item.title,
                  detail: `${item.detail} · ${formatMoney(item.amount)}`,
                  occurredAtLabel: formatWhen(item.occurredAt)
                }))}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-[var(--mpa-color-border-default)] bg-white px-4 py-3">
      <p className="text-xs uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">{label}</p>
      <p className="mt-1 font-display text-xl font-semibold text-[var(--mpa-color-text-primary)]">{value}</p>
    </div>
  );
}
