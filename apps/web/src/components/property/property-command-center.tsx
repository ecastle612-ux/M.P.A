"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Badge, EmptyState, Skeleton, TimelineView } from "@mpa/ui";
import { Breadcrumbs } from "../shell/breadcrumbs";

type CommandCenter = {
  property: {
    id: string;
    name: string;
    status: string;
    unitCount: number;
    unitsAvailable: number;
    unitsOccupied: number;
    residentsAssigned: number;
    unitsAssigned: number;
    createdAt: string;
  };
  units: Array<{
    id: string;
    unit_label: string;
    status: string;
    assignedResident?: string | null;
  }>;
  residents: Array<{
    id: string;
    displayName: string;
    email: string;
    status: string;
    portalStatus: string;
    unitId: string;
    unitLabel: string;
  }>;
  activeLeases: Array<{
    id: string;
    status: string;
    residentName: string;
    portalStatus: string | null;
    unitLabel: string;
    rentAmount: number;
    currency: string;
    nextRentDate: string | null;
    financialStatus: string;
  }>;
  maintenance?: {
    openCount: number;
    emergencyCount: number;
    openWorkOrders: Array<{
      id: string;
      title: string;
      status: string;
      priority: string;
      assigneeType: string;
      vendorName: string | null;
    }>;
    recentlyCompleted: Array<{ id: string; title: string; status: string }>;
  };
  timeline: Array<{
    id: string;
    title: string;
    detail: string;
    occurredAt: string;
    kind: string;
  }>;
  assistantRecommendation: string;
  readyMessage: string;
  nextJourney: { title: string; href: string; detail: string };
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

export function PropertyCommandCenter({ propertyId }: { propertyId: string }) {
  const searchParams = useSearchParams();
  const justCreated = searchParams.get("created") === "1";
  const [data, setData] = useState<CommandCenter | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch(`/api/pm/properties/${propertyId}`);
        const body = await response.json();
        if (!response.ok) {
          throw new Error(body.error ?? "Failed to load property");
        }
        if (!cancelled) {
          setData(body as CommandCenter);
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
      <main className="flex-1 space-y-4 bg-[var(--mpa-color-bg-app)] p-4 md:p-6">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-32 w-full" />
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="flex-1 p-4 md:p-6">
        <EmptyState title="Property unavailable" description={error ?? "Try again shortly."} />
      </main>
    );
  }

  return (
    <main className="flex-1 space-y-6 bg-[var(--mpa-color-bg-app)] p-4 md:p-6">
      <Breadcrumbs
        items={[
          { href: "/pm/mission-control", label: "Mission Control" },
          { href: "/pm/properties", label: "Properties" },
          { label: data.property.name }
        ]}
      />

      <header className="max-w-3xl space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
          Property Command Center
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-3xl font-semibold text-[var(--mpa-color-text-primary)]">
            {data.property.name}
          </h1>
          <Badge variant={data.property.status === "active" ? "success" : "neutral"}>
            {data.property.status}
          </Badge>
        </div>
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">
          {data.property.unitCount} units · {data.property.unitsAvailable} available ·{" "}
          {data.property.unitsOccupied} occupied · {data.property.residentsAssigned} residents
          assigned ({data.property.unitsAssigned} units)
        </p>
      </header>

      {justCreated || data.property.status === "active" ? (
        <section
          aria-live="polite"
          className="max-w-3xl rounded-md border border-emerald-200 bg-emerald-50 p-4"
        >
          <p className="text-base font-semibold text-emerald-900">{data.readyMessage}</p>
          <p className="mt-1 text-sm text-emerald-800">
            {data.property.name} is active and visible across the platform.
          </p>
        </section>
      ) : null}

      <section
        aria-label="M.P.A. Assistant"
        className="max-w-3xl space-y-3 rounded-md border border-[var(--mpa-color-border-default)] bg-white p-5"
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
          M.P.A. Assistant
        </p>
        <p className="text-lg font-semibold text-[var(--mpa-color-text-primary)]">
          {data.assistantRecommendation}
        </p>
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">{data.nextJourney.detail}</p>
        <Link
          href={data.nextJourney.href}
          className="inline-flex h-9 items-center justify-center rounded-md bg-[var(--mpa-color-brand-primary)] px-4 text-sm font-medium text-white hover:bg-[#0C5A48]"
        >
          {data.nextJourney.title}
        </Link>
      </section>

      <section className="grid max-w-5xl gap-4 lg:grid-cols-3">
        <div className="rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4">
          <h2 className="text-base font-semibold text-[var(--mpa-color-text-primary)]">Units</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {data.units.map((unit) => (
              <li
                key={unit.id}
                className="flex items-center justify-between gap-3 border-b border-[var(--mpa-color-border-default)] py-2 last:border-0"
              >
                <span>
                  Unit {unit.unit_label}
                  {unit.assignedResident ? (
                    <span className="mt-0.5 block text-xs text-[var(--mpa-color-text-secondary)]">
                      {unit.assignedResident}
                    </span>
                  ) : null}
                </span>
                <Badge variant="neutral">{unit.status}</Badge>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4">
          <h2 className="text-base font-semibold text-[var(--mpa-color-text-primary)]">
            Residents & leases
          </h2>
          {(data.activeLeases ?? []).length > 0 ? (
            <ul className="mt-3 space-y-2 text-sm">
              {(data.activeLeases ?? []).map((lease) => (
                <li
                  key={lease.id}
                  className="border-b border-[var(--mpa-color-border-default)] py-2 last:border-0"
                >
                  <Link
                    href={`/pm/leasing/${lease.id}`}
                    className="font-medium text-[var(--mpa-color-brand-primary)] underline"
                  >
                    {lease.residentName}
                  </Link>
                  <span className="mt-0.5 block text-xs text-[var(--mpa-color-text-secondary)]">
                    Active lease · Unit {lease.unitLabel} · Occupied · Next rent{" "}
                    {lease.nextRentDate ?? "—"} · {lease.financialStatus}
                  </span>
                </li>
              ))}
            </ul>
          ) : data.residents.length === 0 ? (
            <p className="mt-3 text-sm text-[var(--mpa-color-text-secondary)]">
              No residents assigned yet.
            </p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm">
              {data.residents.map((resident) => (
                <li
                  key={resident.id}
                  className="border-b border-[var(--mpa-color-border-default)] py-2 last:border-0"
                >
                  <Link
                    href={`/pm/residents/${resident.id}`}
                    className="font-medium text-[var(--mpa-color-brand-primary)] underline"
                  >
                    {resident.displayName}
                  </Link>
                  <span className="mt-0.5 block text-xs text-[var(--mpa-color-text-secondary)]">
                    Unit {resident.unitLabel}
                    {resident.portalStatus === "pending_activation"
                      ? " · Portal Pending Activation"
                      : ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4">
          <h2 className="text-base font-semibold text-[var(--mpa-color-text-primary)]">
            Maintenance
          </h2>
          <p className="mt-1 text-xs text-[var(--mpa-color-text-secondary)]">
            {data.maintenance?.openCount ?? 0} open · {data.maintenance?.emergencyCount ?? 0}{" "}
            emergency
          </p>
          {(data.maintenance?.openWorkOrders.length ?? 0) === 0 ? (
            <p className="mt-3 text-sm text-[var(--mpa-color-text-secondary)]">
              No open work orders.{" "}
              <Link href="/pm/maintenance" className="underline">
                Maintenance Command Center
              </Link>
            </p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm">
              {data.maintenance?.openWorkOrders.map((row) => (
                <li
                  key={row.id}
                  className="border-b border-[var(--mpa-color-border-default)] py-2 last:border-0"
                >
                  <Link
                    href="/pm/maintenance"
                    className="font-medium text-[var(--mpa-color-brand-primary)] underline"
                  >
                    {row.title}
                  </Link>
                  <span className="mt-0.5 block text-xs text-[var(--mpa-color-text-secondary)]">
                    {row.status} · {row.priority}
                    {row.assigneeType === "vendor" && row.vendorName
                      ? ` · Vendor ${row.vendorName}`
                      : row.assigneeType === "technician"
                        ? " · Technician assigned"
                        : " · Unassigned"}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {(data.maintenance?.recentlyCompleted.length ?? 0) > 0 ? (
            <div className="mt-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
                Recently completed
              </p>
              <ul className="mt-1 space-y-1 text-xs text-[var(--mpa-color-text-secondary)]">
                {data.maintenance?.recentlyCompleted.map((row) => (
                  <li key={row.id}>
                    {row.title} · {row.status}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </section>

      <section className="max-w-5xl rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4">
        <h2 className="text-base font-semibold text-[var(--mpa-color-text-primary)]">Timeline</h2>
        <div className="mt-3">
          <TimelineView
            items={data.timeline.map((item) => ({
              id: item.id,
              title: item.title,
              detail: item.detail,
              occurredAtLabel: formatWhen(item.occurredAt)
            }))}
            empty={
              <p className="text-sm text-[var(--mpa-color-text-secondary)]">
                No property timeline events yet.
              </p>
            }
          />
        </div>
      </section>

      <p className="max-w-3xl text-sm text-[var(--mpa-color-text-secondary)]">
        Money health:{" "}
        <Link
          className="text-[var(--mpa-color-brand-primary)] underline"
          href={`/pm/properties/${propertyId}/money`}
        >
          Property money panel
        </Link>
        {" · "}
        <Link
          className="text-[var(--mpa-color-brand-primary)] underline"
          href="/pm/financial-operations"
        >
          Financial Operations
        </Link>
        . Portfolio create stays on Properties — one creation path.
      </p>
    </main>
  );
}
