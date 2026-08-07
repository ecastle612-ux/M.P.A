"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Badge, Button, EmptyState, Skeleton, TimelineView } from "@mpa/ui";
import { Breadcrumbs } from "../shell/breadcrumbs";

type AssetProfile = {
  asset: {
    id: string;
    name: string;
    status: string;
    criticality: string;
    asset_tag: string | null;
    manufacturer: string | null;
    model: string | null;
    serial_number: string | null;
    installed_on: string | null;
    warranty_until: string | null;
    notes: string | null;
    parent_asset_id: string | null;
    facility_sites?: { id: string; name: string } | null;
    facility_locations?: { id: string; name: string } | null;
    facility_asset_categories?: { id: string; name: string } | null;
    facility_asset_systems?: Array<{
      system_id: string;
      facility_systems?: { id: string; name: string; status: string } | null;
    }>;
  };
  timeline: Array<{ id: string; title: string; detail: string; occurredAt: string }>;
  assistantRecommendation: string;
  siteLink: { href: string; label: string };
  propertyLink: { href: string; label: string } | null;
  documentsHref: string;
};

export function AssetCommandCenter({ assetId }: { assetId: string }) {
  const searchParams = useSearchParams();
  const justCreated = searchParams.get("created") === "1";
  const [data, setData] = useState<AssetProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  async function load() {
    const response = await fetch(`/api/facility/assets/${assetId}`);
    const body = await response.json();
    if (!response.ok) {
      throw new Error(body.error ?? "Failed to load asset");
    }
    setData(body as AssetProfile);
  }

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        await load();
        if (!cancelled) setError(null);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load asset");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assetId]);

  async function transition(status: string) {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/facility/assets/${assetId}/lifecycle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.error ?? "Lifecycle update failed");
      }
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lifecycle update failed");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <main className="flex-1 space-y-4 p-4 md:p-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
      </main>
    );
  }

  if (!data) {
    return (
      <main className="flex-1 p-4 md:p-6">
        <EmptyState title="Asset unavailable" description={error ?? "Try again shortly."} />
      </main>
    );
  }

  const asset = data.asset;

  return (
    <main className="flex-1 space-y-6 bg-[var(--mpa-color-bg-app)] p-4 md:p-6">
      <Breadcrumbs
        items={[
          { href: "/facility/mission-control", label: "Facility Mission Control" },
          { href: "/facility/assets", label: "Assets" },
          { label: asset.name }
        ]}
      />

      <header className="max-w-3xl space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
          Asset Command Center
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-3xl font-semibold">{asset.name}</h1>
          <Badge
            variant={
              asset.status === "active"
                ? "success"
                : asset.status === "in_repair"
                  ? "warning"
                  : asset.status === "decommissioned"
                    ? "danger"
                    : "neutral"
            }
          >
            {asset.status}
          </Badge>
          <Badge variant="neutral">{asset.criticality}</Badge>
        </div>
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">
          {asset.facility_sites?.name ?? "Site"}
          {asset.facility_locations ? ` · ${asset.facility_locations.name}` : ""}
          {asset.asset_tag ? ` · Tag ${asset.asset_tag}` : ""}
        </p>
      </header>

      {justCreated ? (
        <section className="max-w-3xl rounded-md border border-emerald-200 bg-emerald-50 p-4">
          <p className="font-semibold text-emerald-900">Asset registered.</p>
          <p className="mt-1 text-sm text-emerald-800">{data.assistantRecommendation}</p>
        </section>
      ) : null}

      {error ? <p className="text-sm text-[#C0392B]">{error}</p> : null}

      <section className="max-w-3xl space-y-3 rounded-md border border-[var(--mpa-color-border-default)] bg-white p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
          M.P.A. Assistant
        </p>
        <p className="text-base font-medium">{data.assistantRecommendation}</p>
        <div className="flex flex-wrap gap-2">
          {asset.status === "intake" ? (
            <Button type="button" disabled={busy} onClick={() => void transition("active")}>
              Activate
            </Button>
          ) : null}
          {asset.status === "active" ? (
            <Button type="button" disabled={busy} onClick={() => void transition("in_repair")}>
              Mark in repair
            </Button>
          ) : null}
          {asset.status === "in_repair" ? (
            <Button type="button" disabled={busy} onClick={() => void transition("active")}>
              Return to active
            </Button>
          ) : null}
          {asset.status !== "decommissioned" ? (
            <Button
              type="button"
              variant="secondary"
              disabled={busy}
              onClick={() => void transition("decommissioned")}
            >
              Decommission
            </Button>
          ) : null}
        </div>
      </section>

      <section className="grid max-w-4xl gap-4 md:grid-cols-2">
        <div className="space-y-2 rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4 text-sm">
          <h2 className="font-semibold">Identity</h2>
          <p>Category: {asset.facility_asset_categories?.name ?? "—"}</p>
          <p>Manufacturer: {asset.manufacturer ?? "—"}</p>
          <p>Model: {asset.model ?? "—"}</p>
          <p>Serial: {asset.serial_number ?? "—"}</p>
          <p>Installed: {asset.installed_on ?? "—"}</p>
          <p>Warranty until: {asset.warranty_until ?? "—"}</p>
        </div>
        <div className="space-y-2 rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4 text-sm">
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
          ) : (
            <p className="text-[var(--mpa-color-text-secondary)]">No property link on site</p>
          )}
          <p>
            Documents:{" "}
            <Link href={data.documentsHref} className="underline">
              Shared Documents
            </Link>
          </p>
          <div>
            <p className="font-medium">Building systems</p>
            {(asset.facility_asset_systems ?? []).length === 0 ? (
              <p className="text-[var(--mpa-color-text-secondary)]">None linked</p>
            ) : (
              <ul className="mt-1 space-y-1">
                {(asset.facility_asset_systems ?? []).map((link) => (
                  <li key={link.system_id}>
                    <Link
                      href={`/facility/building-systems/${link.system_id}`}
                      className="underline"
                    >
                      {link.facility_systems?.name ?? link.system_id}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
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
