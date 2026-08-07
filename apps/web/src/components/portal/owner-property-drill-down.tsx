"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatMoney } from "@mpa/shared";
import { Badge, EmptyState, Skeleton, TimelineView } from "@mpa/ui";

type DrillDown = {
  property: {
    id: string;
    name: string;
    status: string;
    unitCount: number;
    unitsOccupied: number;
    unitsAvailable: number;
    residentsAssigned: number;
  };
  occupancy: {
    unitsOccupied: number;
    unitsTotal: number;
    unitsAvailable: number;
    residentsAssigned: number;
  };
  residents: Array<{
    id: string;
    displayName: string;
    unitLabel: string;
    status: string;
    portalStatus: string;
  }>;
  activeLeases: Array<{
    id: string;
    residentName: string;
    unitLabel: string;
    rentAmount: number;
    nextRentDate: string | null;
    status: string;
  }>;
  financialSnapshot: {
    rentCollectedThisMonth: number;
    outstandingRent: number;
    vendorPaidThisMonth: number;
    vendorPayablesOpen: number;
    netOperationalCash: number;
    occupancyRate: number;
    alerts: string[];
  };
  maintenance: {
    openCount: number;
    emergencyCount: number;
    openWorkOrders: Array<{
      id: string;
      title: string;
      status: string;
      priority: string;
      vendorName: string | null;
    }>;
    recentlyCompleted: Array<{ id: string; title: string; status: string }>;
  } | null;
  recentActivity: Array<{
    id: string;
    title: string;
    detail: string;
    amount: number;
    occurredAt: string;
  }>;
  timeline: Array<{
    id: string;
    title: string;
    detail: string;
    occurredAt: string;
  }>;
  assistantRecommendation: string;
  documentsHonesty: string;
};

export function OwnerPropertyDrillDown({ propertyId }: { propertyId: string }) {
  const [data, setData] = useState<DrillDown | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch(`/api/portal/owner/properties/${propertyId}`);
        const body = await response.json();
        if (!response.ok) {
          throw new Error(body.error ?? "Failed to load property");
        }
        if (!cancelled) {
          setData(body as DrillDown);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load property");
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
      <div className="space-y-3" aria-busy="true">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-28 w-full" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <EmptyState title="Property unavailable" description={error ?? "Try again shortly."} />
    );
  }

  const money = data.financialSnapshot;

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs">
          <Link href="/portal/owner" className="text-[var(--mpa-color-brand-primary)] underline">
            ← Portfolio home
          </Link>
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="font-display text-2xl font-semibold text-[var(--mpa-color-text-primary)]">
            {data.property.name}
          </h1>
          <Badge variant="info">{data.property.status}</Badge>
        </div>
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">
          Property drill-down reuses Property Command Center and Financial Operations snapshots.
        </p>
      </header>

      <section
        aria-label="Assistant"
        className="rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] px-4 py-3"
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
          Assistant
        </p>
        <p className="mt-1 text-sm">{data.assistantRecommendation}</p>
      </section>

      <section aria-label="Occupancy" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          label="Occupancy"
          value={`${data.occupancy.unitsOccupied}/${data.occupancy.unitsTotal} · ${money.occupancyRate}%`}
        />
        <Metric label="Residents" value={String(data.occupancy.residentsAssigned)} />
        <Metric label="Active leases" value={String(data.activeLeases.length)} />
        <Metric
          label="Open maintenance"
          value={String(data.maintenance?.openCount ?? 0)}
        />
      </section>

      <section aria-label="Financial snapshot" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Rent collected" value={formatMoney(money.rentCollectedThisMonth)} />
        <Metric label="Outstanding rent" value={formatMoney(money.outstandingRent)} />
        <Metric label="Vendor paid" value={formatMoney(money.vendorPaidThisMonth)} />
        <Metric label="Net operational" value={formatMoney(money.netOperationalCash)} />
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] p-4">
          <h2 className="text-sm font-semibold">Residents</h2>
          {data.residents.length === 0 ? (
            <p className="mt-2 text-sm text-[var(--mpa-color-text-secondary)]">No residents assigned.</p>
          ) : (
            <ul className="mt-2 space-y-2 text-sm">
              {data.residents.map((resident) => (
                <li key={resident.id}>
                  {resident.displayName}
                  <span className="block text-xs text-[var(--mpa-color-text-secondary)]">
                    Unit {resident.unitLabel} · {resident.status} · portal {resident.portalStatus}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] p-4">
          <h2 className="text-sm font-semibold">Active leases</h2>
          {data.activeLeases.length === 0 ? (
            <p className="mt-2 text-sm text-[var(--mpa-color-text-secondary)]">No active leases.</p>
          ) : (
            <ul className="mt-2 space-y-2 text-sm">
              {data.activeLeases.map((lease) => (
                <li key={lease.id}>
                  {lease.residentName}
                  <span className="block text-xs text-[var(--mpa-color-text-secondary)]">
                    Unit {lease.unitLabel} · {formatMoney(lease.rentAmount)}
                    {lease.nextRentDate ? ` · next ${lease.nextRentDate}` : ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] p-4">
          <h2 className="text-sm font-semibold">Maintenance summary</h2>
          {!data.maintenance || data.maintenance.openWorkOrders.length === 0 ? (
            <p className="mt-2 text-sm text-[var(--mpa-color-text-secondary)]">
              No open maintenance on this property.
            </p>
          ) : (
            <ul className="mt-2 space-y-2 text-sm">
              {data.maintenance.openWorkOrders.map((item) => (
                <li key={item.id}>
                  {item.title}
                  <span className="block text-xs text-[var(--mpa-color-text-secondary)]">
                    {item.priority} · {item.status}
                    {item.vendorName ? ` · ${item.vendorName}` : ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] p-4">
          <h2 className="text-sm font-semibold">Recent money activity</h2>
          {data.recentActivity.length === 0 ? (
            <p className="mt-2 text-sm text-[var(--mpa-color-text-secondary)]">No recent activity.</p>
          ) : (
            <ul className="mt-2 space-y-2 text-sm">
              {data.recentActivity.map((item) => (
                <li key={item.id} className="flex justify-between gap-2">
                  <span>
                    {item.title}
                    <span className="block text-xs text-[var(--mpa-color-text-secondary)]">
                      {item.detail}
                    </span>
                  </span>
                  <span>{formatMoney(item.amount)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] p-4">
        <h2 className="text-sm font-semibold">Documents</h2>
        <p className="mt-2 text-sm text-[var(--mpa-color-text-secondary)]">{data.documentsHonesty}</p>
      </section>

      <section aria-label="Recent activity timeline" className="space-y-2">
        <h2 className="text-sm font-semibold">Recent activity</h2>
        <TimelineView
          items={data.timeline.map((event) => ({
            id: event.id,
            title: event.title,
            detail: event.detail,
            occurredAtLabel: formatWhen(event.occurredAt)
          }))}
          empty={
            <p className="text-sm text-[var(--mpa-color-text-secondary)]">No recent timeline events.</p>
          }
        />
      </section>
    </div>
  );
}

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

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] px-4 py-3">
      <p className="text-xs uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
        {label}
      </p>
      <p className="mt-1 font-display text-xl font-semibold text-[var(--mpa-color-text-primary)]">
        {value}
      </p>
    </div>
  );
}
