"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatMoney } from "@mpa/shared";
import { Badge, EmptyState, Skeleton } from "@mpa/ui";

type PropertySnapshot = {
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

type Report = {
  monthLabel: string;
  financialSnapshot: {
    expectedRentThisMonth: number;
    rentCollectedThisMonth: number;
    outstandingRent: number;
    outstandingBalance: number;
    totalDelinquency: number;
    delinquencyCount: number;
    vendorPayablesOpen: number;
    vendorPaidThisMonth: number;
    vendorInvoicesAwaitingApproval: number;
    vendorPaymentsDue: number;
    upcomingCharges: number;
    netOperationalCash: number;
  };
  properties: PropertySnapshot[];
  recentActivity: Array<{
    id: string;
    title: string;
    detail: string;
    amount: number;
    occurredAt: string;
    href?: string;
  }>;
  assistantRecommendation: string;
  alerts: string[];
  quickActions: Array<{ id: string; label: string; href: string }>;
};

function formatWhen(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function ReportingDesk() {
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch("/api/finance/reports/command-center");
        const body = await response.json();
        if (!response.ok) {
          throw new Error(body.error ?? "Failed to load financial snapshot");
        }
        if (!cancelled) {
          setReport(body.report as Report);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load report");
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
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (error || !report) {
    return <EmptyState title="Financial snapshot unavailable" description={error ?? "Try again shortly."} />;
  }

  const snap = report.financialSnapshot;

  return (
    <div className="space-y-6">
      <section id="reports" className="scroll-mt-24 space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold">Financial snapshot · {report.monthLabel}</h3>
            <p className="text-xs text-[var(--mpa-color-text-secondary)]">
              Operational view of expected rent, collections, delinquency, and vendor obligations.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/portal/owner/financials"
              className="rounded-md border border-[var(--mpa-color-border-default)] bg-white px-3 py-1.5 text-sm"
            >
              Owner summary
            </Link>
            <a
              href="/api/finance/reports/owner?format=csv"
              className="rounded-md border border-[var(--mpa-color-border-default)] bg-white px-3 py-1.5 text-sm"
            >
              Download CSV
            </a>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Metric label="Rent expected" value={formatMoney(snap.expectedRentThisMonth)} />
          <Metric label="Rent collected" value={formatMoney(snap.rentCollectedThisMonth)} />
          <Metric label="Outstanding rent" value={formatMoney(snap.outstandingRent)} />
          <Metric label="Net this month" value={formatMoney(snap.netOperationalCash)} />
          <Metric label="Past due residents" value={String(snap.delinquencyCount)} />
          <Metric label="Total past due" value={formatMoney(snap.totalDelinquency)} />
          <Metric label="Vendor bills open" value={formatMoney(snap.vendorPayablesOpen)} />
          <Metric label="Upcoming charges" value={String(snap.upcomingCharges)} />
        </div>

        <section
          aria-label="Assistant recommendation"
          className="rounded-md border border-[var(--mpa-color-border-default)] bg-white px-4 py-3"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
            Assistant recommendation
          </p>
          <p className="mt-1 text-sm text-[var(--mpa-color-text-primary)]">{report.assistantRecommendation}</p>
        </section>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4">
            <h4 className="text-sm font-semibold">Financial alerts</h4>
            <ul className="mt-2 space-y-1 text-sm text-[var(--mpa-color-text-secondary)]">
              {report.alerts.map((alert) => (
                <li key={alert}>• {alert}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4">
            <h4 className="text-sm font-semibold">Quick actions</h4>
            <ul className="mt-2 flex flex-wrap gap-2">
              {report.quickActions.map((action) => (
                <li key={action.id}>
                  <Link
                    href={action.href}
                    className="inline-block rounded-md border border-[var(--mpa-color-border-default)] px-3 py-1.5 text-sm text-[var(--mpa-color-text-primary)] hover:border-[var(--mpa-color-brand-primary)]"
                  >
                    {action.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section id="properties" className="scroll-mt-24 space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold">Property financial health</h3>
            <p className="text-xs text-[var(--mpa-color-text-secondary)]">
              Every property surfaces rent, balances, vendor spend, delinquency, and alerts.
            </p>
          </div>
          <Link href="/pm/properties" className="text-sm text-[var(--mpa-color-brand-primary)] underline">
            Open properties
          </Link>
        </div>

        {report.properties.length === 0 ? (
          <EmptyState
            title="No properties yet"
            description="Add a property from the billing desk to see portfolio money health."
          />
        ) : (
          <div className="overflow-x-auto rounded-md border border-[var(--mpa-color-border-default)] bg-white">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b text-[var(--mpa-color-text-secondary)]">
                  <th className="px-3 py-2">Property</th>
                  <th className="px-3 py-2">Collected</th>
                  <th className="px-3 py-2">Outstanding</th>
                  <th className="px-3 py-2">Past due</th>
                  <th className="px-3 py-2">Vendor open</th>
                  <th className="px-3 py-2">Occupancy</th>
                  <th className="px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {report.properties.map((property) => (
                  <tr key={property.propertyId} className="border-b border-[var(--mpa-color-border-subtle)]">
                    <td className="px-3 py-2">
                      <Link
                        href={`/pm/properties/${property.propertyId}`}
                        className="text-[var(--mpa-color-brand-primary)] underline"
                      >
                        {property.propertyName}
                      </Link>
                    </td>
                    <td className="px-3 py-2">{formatMoney(property.rentCollectedThisMonth)}</td>
                    <td className="px-3 py-2">{formatMoney(property.outstandingRent)}</td>
                    <td className="px-3 py-2">{formatMoney(property.totalDelinquency)}</td>
                    <td className="px-3 py-2">{formatMoney(property.vendorPayablesOpen)}</td>
                    <td className="px-3 py-2">
                      {property.unitsOccupied}/{property.unitsTotal} · {property.occupancyRate}%
                    </td>
                    <td className="px-3 py-2">
                      <Badge variant={property.delinquencyCount > 0 ? "danger" : "success"}>
                        {property.delinquencyCount > 0 ? "Needs attention" : "Healthy"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold">Recent financial activity</h3>
        {report.recentActivity.length === 0 ? (
          <EmptyState title="No recent activity" description="Payments, charges, and vendor bills will appear here." />
        ) : (
          <ul className="space-y-2 rounded-md border border-[var(--mpa-color-border-default)] bg-white p-3 text-sm">
            {report.recentActivity.map((item) => (
              <li
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--mpa-color-border-subtle)] py-2 last:border-0"
              >
                <div>
                  <p className="font-medium">{item.title}</p>
                  <p className="text-xs text-[var(--mpa-color-text-secondary)]">
                    {item.detail} · {formatWhen(item.occurredAt)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span>{formatMoney(item.amount)}</span>
                  {item.href ? (
                    <Link href={item.href} className="text-xs text-[var(--mpa-color-brand-primary)] underline">
                      Open
                    </Link>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
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
