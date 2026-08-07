"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Badge, Button, EmptyState, Skeleton, TimelineView } from "@mpa/ui";
import { Breadcrumbs } from "../shell/breadcrumbs";

type SystemProfile = {
  system: {
    id: string;
    name: string;
    status: string;
    system_type: string;
    criticality: string;
    notes: string | null;
    facility_sites?: { id: string; name: string } | null;
    facility_asset_systems?: Array<{
      asset_id: string;
      facility_assets?: { id: string; name: string; status: string } | null;
    }>;
  };
  timeline: Array<{ id: string; title: string; detail: string; occurredAt: string }>;
  assistantRecommendation: string;
  siteLink: { href: string; label: string };
  propertyLink: { href: string; label: string } | null;
  documentsHref: string;
};

export function SystemCommandCenter({ systemId }: { systemId: string }) {
  const [data, setData] = useState<SystemProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  async function load() {
    const response = await fetch(`/api/facility/systems/${systemId}`);
    const body = await response.json();
    if (!response.ok) {
      throw new Error(body.error ?? "Failed to load system");
    }
    setData(body as SystemProfile);
  }

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        await load();
        if (!cancelled) setError(null);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load system");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [systemId]);

  async function setStatus(status: string) {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/facility/systems/${systemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.error ?? "Failed to update status");
      }
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <main className="flex-1 space-y-4 p-4 md:p-6">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-32 w-full" />
      </main>
    );
  }

  if (!data) {
    return (
      <main className="flex-1 p-4 md:p-6">
        <EmptyState title="System unavailable" description={error ?? "Try again shortly."} />
      </main>
    );
  }

  const system = data.system;

  return (
    <main className="flex-1 space-y-6 bg-[var(--mpa-color-bg-app)] p-4 md:p-6">
      <Breadcrumbs
        items={[
          { href: "/facility/mission-control", label: "Facility Mission Control" },
          { href: "/facility/building-systems", label: "Building Systems" },
          { label: system.name }
        ]}
      />

      <header className="max-w-3xl space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
          System Command Center
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-3xl font-semibold">{system.name}</h1>
          <Badge
            variant={
              system.status === "down"
                ? "danger"
                : system.status === "degraded"
                  ? "warning"
                  : system.status === "active"
                    ? "success"
                    : "neutral"
            }
          >
            {system.status}
          </Badge>
        </div>
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">
          {system.system_type} · {system.criticality} · {system.facility_sites?.name}
        </p>
      </header>

      {error ? <p className="text-sm text-[var(--mpa-color-status-danger)]">{error}</p> : null}

      <section className="max-w-3xl space-y-3 rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
          M.P.A. Assistant
        </p>
        <p className="text-base font-medium">{data.assistantRecommendation}</p>
        <div className="flex flex-wrap gap-2">
          {system.status !== "active" && system.status !== "decommissioned" ? (
            <Button type="button" disabled={busy} onClick={() => void setStatus("active")}>
              Mark active
            </Button>
          ) : null}
          {system.status !== "degraded" && system.status !== "decommissioned" ? (
            <Button
              type="button"
              variant="secondary"
              disabled={busy}
              onClick={() => void setStatus("degraded")}
            >
              Mark degraded
            </Button>
          ) : null}
          {system.status !== "down" && system.status !== "decommissioned" ? (
            <Button type="button" disabled={busy} onClick={() => void setStatus("down")}>
              Mark down
            </Button>
          ) : null}
          {system.status !== "decommissioned" ? (
            <Button
              type="button"
              variant="secondary"
              disabled={busy}
              onClick={() => void setStatus("decommissioned")}
            >
              Decommission
            </Button>
          ) : null}
        </div>
      </section>

      <section className="max-w-3xl space-y-2 rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] p-4 text-sm">
        <h2 className="font-semibold">Associations</h2>
        <p>
          Site:{" "}
          <Link href={data.siteLink.href} className="underline">
            {data.siteLink.label}
          </Link>
        </p>
        {data.propertyLink ? (
          <p>
            Property:{" "}
            <Link href={data.propertyLink.href} className="underline">
              {data.propertyLink.label}
            </Link>
          </p>
        ) : null}
        <p>
          Documents:{" "}
          <Link href={data.documentsHref} className="underline">
            Shared Documents
          </Link>
        </p>
        <div>
          <p className="font-medium">Linked assets</p>
          {(system.facility_asset_systems ?? []).length === 0 ? (
            <p className="text-[var(--mpa-color-text-secondary)]">None linked</p>
          ) : (
            <ul className="mt-1 space-y-1">
              {(system.facility_asset_systems ?? []).map((link) => (
                <li key={link.asset_id}>
                  <Link href={`/facility/assets/${link.asset_id}`} className="underline">
                    {link.facility_assets?.name ?? link.asset_id}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="max-w-3xl space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
          Timeline
        </h2>
        <TimelineView
          items={data.timeline.map((item) => ({
            id: item.id,
            title: item.title,
            detail: item.detail,
            occurredAtLabel: item.occurredAt
          }))}
          empty={<p className="text-sm text-[var(--mpa-color-text-secondary)]">No events yet.</p>}
        />
      </section>
    </main>
  );
}
