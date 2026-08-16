"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { buttonClassName, Alert, Badge, Skeleton, TimelineView } from "@mpa/ui";
import { Breadcrumbs } from "../shell/breadcrumbs";
import { ErrorRetry } from "../shell/error-retry";
import { PmDocumentsStrip, PmQuickActions, documentsHref } from "../shell/pm-workspace";
import { MoveOutPanel } from "./move-out-panel";

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
  occupancies?: Array<{
    id: string;
    occupy_from: string;
    occupy_to: string | null;
    occupancy_status: string;
  }>;
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
  const [reloadToken, setReloadToken] = useState(0);

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
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setData(null);
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
  }, [residentId, reloadToken]);

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
        <ErrorRetry
          title="Resident unavailable"
          description={error ?? "We couldn’t load this resident. Check your connection and try again."}
          onRetry={() => {
            setLoading(true);
            setError(null);
            setReloadToken((value) => value + 1);
          }}
        />
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
            { href: `/shared/communications?residentId=${data.resident.id}`, label: "Message tenant" },
            { href: "/shared/communications", label: "Communications" },
            { href: documentsHref("resident", data.resident.displayName), label: "Files" }
          ]}
        />
      </header>

      {(data.occupancies ?? []).map((occupancy) => (
        <MoveOutPanel
          key={occupancy.id}
          occupancy={occupancy}
          tenantName={data.resident.displayName}
          propertyName={data.resident.propertyName}
          unitLabel={data.resident.unitLabel}
          onDone={() => setReloadToken((value) => value + 1)}
        />
      ))}

      <PmDocumentsStrip
        entityType="resident"
        title="Resident files"
        detail="Identity, notices, and resident paperwork attach in Documents — ready for Document Intelligence."
      />

      {justCreated ? (
        <Alert
          variant="success"
          className="max-w-3xl"
          title={data.readyMessage}
          aria-live="polite"
        >
          <p>
            {data.resident.displayName} is visible on the property, in the directory, search,
            timeline, and audit.
          </p>
        </Alert>
      ) : null}

      {data.resident.portalStatus === "pending_activation" ? (
        <Alert
          variant="warning"
          className="max-w-3xl"
          title="Resident Portal · Pending Activation"
          aria-label="Portal status"
        >
          <p>
            The portal is provisioned for this resident. Activation completes after the lease is
            signed.
          </p>
        </Alert>
      ) : null}

      {data.resident.portalStatus === "active" ? (
        <Alert
          variant="success"
          className="max-w-3xl"
          title="Resident Portal · Active"
          aria-label="Portal status"
          {...(data.integrations.portal
            ? {
                action: (
                  <Link
                    href={data.integrations.portal}
                    className="text-sm font-medium underline"
                  >
                    Open Resident Portal
                  </Link>
                )
              }
            : {})}
        >
          <p>
            The resident can open the portal for welcome, lease, rent, maintenance, and documents.
          </p>
        </Alert>
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
          className={buttonClassName()}
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
