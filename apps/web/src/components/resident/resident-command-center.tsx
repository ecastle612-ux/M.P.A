"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Badge, EmptyState, Skeleton, TimelineView } from "@mpa/ui";
import { Breadcrumbs } from "../shell/breadcrumbs";
import { PmDocumentsStrip, PmQuickActions, documentsHref } from "../shell/pm-workspace";

type CommandCenter = {
  resident: {
    id: string;
    displayName: string;
    email: string;
    status: string;
    statusLabel: string;
    portalStatus: string;
    portalStatusLabel: string;
    propertyId: string;
    propertyName: string;
    unitId: string;
    unitLabel: string;
    createdAt: string;
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
  integrations: {
    propertyCommandCenter: string;
    residentDirectory: string;
    financialOperations: string;
    maintenance: string;
    portal?: string;
  };
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

export function ResidentCommandCenter({ residentId }: { residentId: string }) {
  const searchParams = useSearchParams();
  const justCreated = searchParams.get("created") === "1";
  const [data, setData] = useState<CommandCenter | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch(`/api/pm/residents/${residentId}`);
        const body = await response.json();
        if (!response.ok) {
          throw new Error(body.error ?? "Failed to load resident");
        }
        if (!cancelled) {
          setData(body as CommandCenter);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load resident");
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
  }, [residentId]);

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
        <EmptyState title="Resident unavailable" description={error ?? "Try again shortly."} />
      </main>
    );
  }

  return (
    <main className="flex-1 space-y-6 bg-[var(--mpa-color-bg-app)] p-4 md:p-6">
      <Breadcrumbs
        items={[
          { href: "/pm/mission-control", label: "Mission Control" },
          { href: "/pm/residents", label: "Residents" },
          { label: data.resident.displayName }
        ]}
      />

      <header className="max-w-3xl space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
          Resident Command Center
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-3xl font-semibold text-[var(--mpa-color-text-primary)]">
            {data.resident.displayName}
          </h1>
          <Badge variant="neutral">{data.resident.statusLabel}</Badge>
          <Badge
            variant={data.resident.portalStatus === "pending_activation" ? "warning" : "success"}
          >
            Portal: {data.resident.portalStatusLabel}
          </Badge>
        </div>
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">
          {data.resident.propertyName} · Unit {data.resident.unitLabel} · {data.resident.email}
        </p>
        <PmQuickActions
          actions={[
            { href: `/pm/properties/${data.resident.propertyId}`, label: "Property" },
            { href: "/pm/leasing", label: "Leasing" },
            { href: "/shared/communications", label: "Communications" },
            { href: documentsHref("resident", data.resident.displayName), label: "Files" }
          ]}
        />
      </header>

      <PmDocumentsStrip
        entityType="resident"
        title="Resident files"
        detail="Identity, notices, and resident paperwork attach in Documents — ready for Document Intelligence."
      />

      {justCreated ? (
        <section
          aria-live="polite"
          className="max-w-3xl rounded-md border border-emerald-200 bg-emerald-50 p-4"
        >
          <p className="text-base font-semibold text-emerald-900">{data.readyMessage}</p>
          <p className="mt-1 text-sm text-emerald-800">
            {data.resident.displayName} is visible on the property, in the directory, search,
            timeline, and audit.
          </p>
        </section>
      ) : null}

      {data.resident.portalStatus === "pending_activation" ? (
        <section
          aria-label="Portal status"
          className="max-w-3xl rounded-md border border-amber-200 bg-amber-50 p-4"
        >
          <p className="text-sm font-semibold text-amber-900">Resident Portal · Pending Activation</p>
          <p className="mt-1 text-sm text-amber-800">
            The portal is provisioned for this resident. Activation completes after the lease is
            signed.
          </p>
        </section>
      ) : null}

      {data.resident.portalStatus === "active" ? (
        <section
          aria-label="Portal status"
          className="max-w-3xl rounded-md border border-emerald-200 bg-emerald-50 p-4"
        >
          <p className="text-sm font-semibold text-emerald-900">Resident Portal · Active</p>
          <p className="mt-1 text-sm text-emerald-800">
            The resident can open the portal for welcome, lease, rent, maintenance, and documents.
          </p>
          {data.integrations.portal ? (
            <Link
              href={data.integrations.portal}
              className="mt-2 inline-flex text-sm font-medium text-emerald-900 underline"
            >
              Open Resident Portal
            </Link>
          ) : null}
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

      <section className="grid max-w-5xl gap-4 lg:grid-cols-2">
        <div className="rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4">
          <h2 className="text-base font-semibold text-[var(--mpa-color-text-primary)]">Assignment</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between gap-3 border-b border-[var(--mpa-color-border-default)] py-2">
              <dt className="text-[var(--mpa-color-text-secondary)]">Property</dt>
              <dd>
                <Link
                  href={data.integrations.propertyCommandCenter}
                  className="text-[var(--mpa-color-brand-primary)] underline"
                >
                  {data.resident.propertyName}
                </Link>
              </dd>
            </div>
            <div className="flex justify-between gap-3 border-b border-[var(--mpa-color-border-default)] py-2">
              <dt className="text-[var(--mpa-color-text-secondary)]">Unit</dt>
              <dd>Unit {data.resident.unitLabel}</dd>
            </div>
            <div className="flex justify-between gap-3 py-2">
              <dt className="text-[var(--mpa-color-text-secondary)]">Lifecycle status</dt>
              <dd>{data.resident.statusLabel}</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4">
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
                  No resident timeline events yet.
                </p>
              }
            />
          </div>
        </div>
      </section>

      <p className="max-w-3xl text-sm text-[var(--mpa-color-text-secondary)]">
        Future-ready surfaces:{" "}
        <Link
          className="text-[var(--mpa-color-brand-primary)] underline"
          href={data.integrations.financialOperations}
        >
          Financial Operations
        </Link>
        {" · "}
        <Link
          className="text-[var(--mpa-color-brand-primary)] underline"
          href={data.integrations.maintenance}
        >
          Maintenance
        </Link>
        . Resident create stays on Residents — one creation path.
      </p>
    </main>
  );
}
