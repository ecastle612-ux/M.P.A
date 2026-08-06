"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatMoney } from "@mpa/shared";
import { Badge, EmptyState, Skeleton } from "@mpa/ui";

type Summary = {
  monthLabel: string;
  currentMonthIncome: number;
  currentMonthExpenses: number;
  outstandingRent: number;
  vendorPayments: number;
  netOperationalCash: number;
  occupancy: { unitsTotal: number; unitsOccupied: number; occupancyRate: number };
  properties: Array<{
    propertyId: string;
    propertyName: string;
    rentCollectedThisMonth: number;
    outstandingRent: number;
    vendorPaidThisMonth: number;
    netOperationalCash: number;
    occupancyRate: number;
    unitsOccupied: number;
    unitsTotal: number;
    alerts: string[];
  }>;
  alerts: string[];
  assistantRecommendation: string;
};

export function OwnerFinancialSummary() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch("/api/finance/reports/owner");
        const body = await response.json();
        if (!response.ok) {
          throw new Error(body.error ?? "Failed to load owner summary");
        }
        if (!cancelled) {
          setSummary(body.summary as Summary);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load owner summary");
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
  }, []);

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-28 w-full" />
      </div>
    );
  }

  if (error || !summary) {
    return <EmptyState title="Owner summary unavailable" description={error ?? "Try again shortly."} />;
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
            Owner financial summary
          </p>
          <h1 className="mt-1 font-display text-2xl font-semibold">{summary.monthLabel}</h1>
          <p className="mt-1 max-w-2xl text-sm text-[var(--mpa-color-text-secondary)]">
            Simple operational view of income, expenses, outstanding rent, and occupancy. Not accounting.
          </p>
        </div>
        <a
          href="/api/finance/reports/owner?format=csv"
          className="rounded-md border border-[var(--mpa-color-border-default)] bg-white px-3 py-1.5 text-sm"
        >
          Download summary CSV
        </a>
      </header>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <Metric label="Current month income" value={formatMoney(summary.currentMonthIncome)} />
        <Metric label="Current month expenses" value={formatMoney(summary.currentMonthExpenses)} />
        <Metric label="Outstanding rent" value={formatMoney(summary.outstandingRent)} />
        <Metric label="Vendor payments" value={formatMoney(summary.vendorPayments)} />
        <Metric label="Net operational snapshot" value={formatMoney(summary.netOperationalCash)} />
        <Metric
          label="Occupancy"
          value={`${summary.occupancy.unitsOccupied}/${summary.occupancy.unitsTotal} · ${summary.occupancy.occupancyRate}%`}
        />
      </div>

      <section
        aria-label="Assistant recommendation"
        className="rounded-md border border-[var(--mpa-color-border-default)] bg-white px-4 py-3"
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
          Assistant recommendation
        </p>
        <p className="mt-1 text-sm">{summary.assistantRecommendation}</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold">Property financial snapshot</h2>
        {summary.properties.length === 0 ? (
          <EmptyState title="No properties yet" description="When properties are added, portfolio money will show here." />
        ) : (
          <ul className="space-y-3">
            {summary.properties.map((property) => (
              <li
                key={property.propertyId}
                className="rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-medium">{property.propertyName}</h3>
                  <Badge variant={property.outstandingRent > 0 ? "info" : "success"}>
                    {property.outstandingRent > 0 ? "Open balances" : "Current"}
                  </Badge>
                </div>
                <dl className="mt-3 grid gap-2 text-sm md:grid-cols-4">
                  <div>
                    <dt className="text-xs text-[var(--mpa-color-text-secondary)]">Income</dt>
                    <dd>{formatMoney(property.rentCollectedThisMonth)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-[var(--mpa-color-text-secondary)]">Outstanding rent</dt>
                    <dd>{formatMoney(property.outstandingRent)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-[var(--mpa-color-text-secondary)]">Vendor payments</dt>
                    <dd>{formatMoney(property.vendorPaidThisMonth)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-[var(--mpa-color-text-secondary)]">Occupancy</dt>
                    <dd>
                      {property.unitsOccupied}/{property.unitsTotal} · {property.occupancyRate}%
                    </dd>
                  </div>
                </dl>
                {property.alerts[0] ? (
                  <p className="mt-2 text-xs text-[var(--mpa-color-text-secondary)]">{property.alerts[0]}</p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4">
        <h2 className="text-sm font-semibold">Alerts</h2>
        <ul className="mt-2 space-y-1 text-sm text-[var(--mpa-color-text-secondary)]">
          {summary.alerts.map((alert) => (
            <li key={alert}>• {alert}</li>
          ))}
        </ul>
        <Link href="/pm/financial-operations" className="mt-3 inline-block text-sm text-[var(--mpa-color-brand-primary)] underline">
          View manager Command Center
        </Link>
      </section>
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
