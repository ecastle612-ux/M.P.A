"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { formatMoney } from "@mpa/shared";
import { Badge, EmptyState, Input, Skeleton, TimelineView } from "@mpa/ui";

type PortfolioHome = {
  greeting: string;
  successCopy: string;
  assistantSummary: string;
  ownerPortfolioReady: boolean;
  portfolioSummary: {
    monthLabel: string;
    propertyCount: number;
    currentMonthIncome: number;
    currentMonthExpenses: number;
    outstandingRent: number;
    vendorPayments: number;
    netOperationalCash: number;
    occupancy: { unitsTotal: number; unitsOccupied: number; occupancyRate: number };
    activeLeaseCount: number;
    openMaintenanceCount: number;
  };
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
    href: string;
  }>;
  outstandingRent: { total: number; label: string };
  recentPayments: Array<{
    id: string;
    title: string;
    detail: string;
    amount: number;
    occurredAt: string;
  }>;
  openMaintenance: Array<{
    id: string;
    title: string;
    status: string;
    priority: string;
    vendorName: string | null;
    href: string;
  }>;
  vendorActivity: Array<{
    id: string;
    title: string;
    detail: string;
    amount: number;
    occurredAt: string;
  }>;
  activeLeases: Array<{
    id: string;
    residentName: string;
    propertyName: string;
    rentAmount: number;
    href: string;
  }>;
  recentDocuments: {
    available: boolean;
    honesty: string | null;
    items: Array<{ id: string; title: string; detail?: string; href?: string }>;
  };
  recentTimeline: Array<{
    id: string;
    title: string;
    detail: string;
    occurredAt: string;
  }>;
  financeAlerts: string[];
};

function formatWhen(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
      timeStyle: "short"
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function OwnerPortfolioHome() {
  const [data, setData] = useState<PortfolioHome | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch("/api/portal/owner/portfolio");
        const body = await response.json();
        if (!response.ok) {
          throw new Error(body.error ?? "Failed to load portfolio");
        }
        if (!cancelled) {
          setData(body as PortfolioHome);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load portfolio");
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

  const filteredProperties = useMemo(() => {
    if (!data) {
      return [];
    }
    const needle = query.trim().toLowerCase();
    if (!needle) {
      return data.properties;
    }
    return data.properties.filter((property) =>
      property.propertyName.toLowerCase().includes(needle)
    );
  }, [data, query]);

  if (loading) {
    return (
      <div className="space-y-3" aria-busy="true">
        <Skeleton className="h-8 w-72" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <EmptyState title="Owner portfolio unavailable" description={error ?? "Try again shortly."} />
    );
  }

  const summary = data.portfolioSummary;

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
            Owner Portfolio Home
          </p>
          {data.ownerPortfolioReady ? <Badge variant="success">Portfolio reviewed</Badge> : null}
        </div>
        <h1 className="font-display text-2xl font-semibold text-[var(--mpa-color-text-primary)]">
          {data.greeting}
        </h1>
        <p className="max-w-3xl text-sm text-[var(--mpa-color-text-secondary)]">
          Operational insight for {summary.monthLabel} — occupancy, rent collected, balances,
          maintenance, and recent activity. Not accounting or investment analytics.
        </p>
      </header>

      <section
        aria-label="Assistant summary"
        className="rounded-md border border-[var(--mpa-color-border-default)] bg-white px-4 py-3"
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
          Assistant summary
        </p>
        <p className="mt-1 text-sm text-[var(--mpa-color-text-primary)]">{data.assistantSummary}</p>
        {data.ownerPortfolioReady ? (
          <p className="mt-2 text-sm font-medium text-[var(--mpa-color-text-primary)]">
            {data.successCopy}
          </p>
        ) : null}
      </section>

      <section aria-label="Portfolio summary" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          label="Occupancy"
          value={`${summary.occupancy.unitsOccupied}/${summary.occupancy.unitsTotal} · ${summary.occupancy.occupancyRate}%`}
        />
        <Metric label="Rent collected" value={formatMoney(summary.currentMonthIncome)} />
        <Metric label="Outstanding rent" value={formatMoney(summary.outstandingRent)} />
        <Metric label="Vendor expenses" value={formatMoney(summary.vendorPayments)} />
        <Metric label="Open maintenance" value={String(summary.openMaintenanceCount)} />
        <Metric label="Active leases" value={String(summary.activeLeaseCount)} />
        <Metric label="Properties" value={String(summary.propertyCount)} />
        <Metric label="Net operational" value={formatMoney(summary.netOperationalCash)} />
      </section>

      <section className="space-y-3" aria-label="Property performance">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-[var(--mpa-color-text-primary)]">
              Property performance
            </h2>
            <p className="text-xs text-[var(--mpa-color-text-secondary)]">
              Open a property for occupancy, residents, leases, money, and maintenance.
            </p>
          </div>
          <label className="min-w-[200px] space-y-1 text-sm">
            <span className="text-xs text-[var(--mpa-color-text-secondary)]">Find a property</span>
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by name"
              aria-label="Search properties by name"
            />
          </label>
        </div>
        {filteredProperties.length === 0 ? (
          <EmptyState
            title="No matching properties"
            description="Add properties in Property Manager, or clear the search."
          />
        ) : (
          <ul className="space-y-3">
            {filteredProperties.map((property) => (
              <li
                key={property.propertyId}
                className="rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="font-medium text-[var(--mpa-color-text-primary)]">
                      <Link
                        href={property.href}
                        className="text-[var(--mpa-color-brand-primary)] underline"
                      >
                        {property.propertyName}
                      </Link>
                    </h3>
                    <p className="text-xs text-[var(--mpa-color-text-secondary)]">
                      {property.unitsOccupied}/{property.unitsTotal} occupied ·{" "}
                      {property.occupancyRate}%
                    </p>
                  </div>
                  <Badge variant={property.outstandingRent > 0 ? "info" : "success"}>
                    {property.outstandingRent > 0 ? "Open balances" : "Current"}
                  </Badge>
                </div>
                <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
                  <div>
                    <dt className="text-xs text-[var(--mpa-color-text-secondary)]">Collected</dt>
                    <dd>{formatMoney(property.rentCollectedThisMonth)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-[var(--mpa-color-text-secondary)]">Outstanding</dt>
                    <dd>{formatMoney(property.outstandingRent)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-[var(--mpa-color-text-secondary)]">Vendor paid</dt>
                    <dd>{formatMoney(property.vendorPaidThisMonth)}</dd>
                  </div>
                </dl>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <ListSection title="Outstanding rent">
          <p className="text-sm">{data.outstandingRent.label}</p>
          <Link
            href="/portal/owner/financials"
            className="mt-2 inline-block text-sm text-[var(--mpa-color-brand-primary)] underline"
          >
            Open financial summary
          </Link>
        </ListSection>

        <ListSection title="Recent payments">
          {data.recentPayments.length === 0 ? (
            <p className="text-sm text-[var(--mpa-color-text-secondary)]">No recent payments</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {data.recentPayments.map((item) => (
                <li key={item.id} className="flex justify-between gap-2">
                  <span>
                    {item.title}
                    <span className="block text-xs text-[var(--mpa-color-text-secondary)]">
                      {item.detail} · {formatWhen(item.occurredAt)}
                    </span>
                  </span>
                  <span>{formatMoney(item.amount)}</span>
                </li>
              ))}
            </ul>
          )}
        </ListSection>

        <ListSection title="Open maintenance">
          {data.openMaintenance.length === 0 ? (
            <p className="text-sm text-[var(--mpa-color-text-secondary)]">No open maintenance</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {data.openMaintenance.map((item) => (
                <li key={item.id}>
                  <Link href={item.href} className="text-[var(--mpa-color-brand-primary)] underline">
                    {item.title}
                  </Link>
                  <span className="block text-xs text-[var(--mpa-color-text-secondary)]">
                    {item.priority} · {item.status}
                    {item.vendorName ? ` · ${item.vendorName}` : ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </ListSection>

        <ListSection title="Vendor activity">
          {data.vendorActivity.length === 0 ? (
            <p className="text-sm text-[var(--mpa-color-text-secondary)]">No recent vendor activity</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {data.vendorActivity.map((item) => (
                <li key={item.id} className="flex justify-between gap-2">
                  <span>
                    {item.title}
                    <span className="block text-xs text-[var(--mpa-color-text-secondary)]">
                      {item.detail} · {formatWhen(item.occurredAt)}
                    </span>
                  </span>
                  <span>{formatMoney(item.amount)}</span>
                </li>
              ))}
            </ul>
          )}
        </ListSection>

        <ListSection title="Active leases">
          {data.activeLeases.length === 0 ? (
            <p className="text-sm text-[var(--mpa-color-text-secondary)]">No active leases</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {data.activeLeases.map((lease) => (
                <li key={lease.id}>
                  <Link href={lease.href} className="text-[var(--mpa-color-brand-primary)] underline">
                    {lease.residentName}
                  </Link>
                  <span className="block text-xs text-[var(--mpa-color-text-secondary)]">
                    {lease.propertyName} · {formatMoney(lease.rentAmount)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </ListSection>

        <ListSection title="Recent documents">
          {data.recentDocuments.items.length > 0 ? (
            <ul className="space-y-2 text-sm">
              {data.recentDocuments.items.map((item) => (
                <li key={item.id}>
                  <Link
                    href={item.href ?? "/shared/documents"}
                    className="text-[var(--mpa-color-brand-primary)] underline"
                  >
                    {item.title}
                  </Link>
                  {item.detail ? (
                    <span className="block text-xs text-[var(--mpa-color-text-secondary)]">
                      {item.detail}
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-[var(--mpa-color-text-secondary)]">
              {data.recentDocuments.honesty ?? "No recent documents."}
            </p>
          )}
        </ListSection>
      </div>

      <section aria-label="Recent timeline" className="space-y-2">
        <h2 className="text-sm font-semibold">Recent timeline</h2>
        <TimelineView
          items={data.recentTimeline.map((event) => ({
            id: event.id,
            title: event.title,
            detail: event.detail,
            occurredAtLabel: formatWhen(event.occurredAt)
          }))}
          empty={
            <p className="text-sm text-[var(--mpa-color-text-secondary)]">
              No timeline yet. Activity will appear as operations run.
            </p>
          }
        />
      </section>

      {data.financeAlerts.length > 0 ? (
        <section
          aria-label="Portfolio alerts"
          className="rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4"
        >
          <h2 className="text-sm font-semibold">Alerts</h2>
          <ul className="mt-2 space-y-1 text-sm text-[var(--mpa-color-text-secondary)]">
            {data.financeAlerts.map((alert) => (
              <li key={alert}>• {alert}</li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-[var(--mpa-color-border-default)] bg-white px-4 py-3">
      <p className="text-xs uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
        {label}
      </p>
      <p className="mt-1 font-display text-xl font-semibold text-[var(--mpa-color-text-primary)]">
        {value}
      </p>
    </div>
  );
}

function ListSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section
      aria-label={title}
      className="rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4"
    >
      <h2 className="text-sm font-semibold">{title}</h2>
      <div className="mt-2">{children}</div>
    </section>
  );
}
