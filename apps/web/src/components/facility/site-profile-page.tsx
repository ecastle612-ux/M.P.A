"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Badge, Button, EmptyState, Skeleton, TimelineView } from "@mpa/ui";
import { Breadcrumbs } from "../shell/breadcrumbs";

type SiteProfile = {
  site: {
    id: string;
    name: string;
    status: string;
    timezone: string;
    address_line1: string | null;
    city: string | null;
    region: string | null;
    postal_code: string | null;
    property_id: string | null;
    facility_locations?: Array<{
      id: string;
      name: string;
      location_type: string;
      status: string;
    }>;
    property_properties?: { id: string; name: string; status: string } | null;
  };
  timeline: Array<{
    id: string;
    title: string;
    detail: string;
    occurredAt: string;
    kind: string;
  }>;
  assistantRecommendation: string;
  propertyLink: { href: string; label: string } | null;
};

export function SiteProfilePage({ siteId }: { siteId: string }) {
  const searchParams = useSearchParams();
  const justCreated = searchParams.get("created") === "1";
  const [data, setData] = useState<SiteProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState(false);

  async function load() {
    const response = await fetch(`/api/facility/sites/${siteId}`);
    const body = await response.json();
    if (!response.ok) {
      throw new Error(body.error ?? "Failed to load facility site");
    }
    setData(body as SiteProfile);
  }

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        await load();
        if (!cancelled) {
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load facility site");
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteId]);

  async function activate() {
    setActivating(true);
    setError(null);
    try {
      const response = await fetch(`/api/facility/sites/${siteId}/activate`, { method: "POST" });
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.error ?? "Failed to activate site");
      }
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to activate site");
    } finally {
      setActivating(false);
    }
  }

  if (loading) {
    return (
      <main className="flex-1 space-y-4 bg-[var(--mpa-color-bg-app)] p-4 md:p-6">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-32 w-full" />
      </main>
    );
  }

  if (error && !data) {
    return (
      <main className="flex-1 p-4 md:p-6">
        <EmptyState title="Facility site unavailable" description={error} />
      </main>
    );
  }

  if (!data) {
    return null;
  }

  const site = data.site;

  return (
    <main className="flex-1 space-y-6 bg-[var(--mpa-color-bg-app)] p-4 md:p-6">
      <Breadcrumbs
        items={[
          { href: "/facility/mission-control", label: "Facility Mission Control" },
          { href: "/facility/sites", label: "Facility Sites" },
          { label: site.name }
        ]}
      />

      <header className="max-w-3xl space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
          Facility site profile
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-3xl font-semibold text-[var(--mpa-color-text-primary)]">
            {site.name}
          </h1>
          <Badge
            variant={
              site.status === "active" ? "success" : site.status === "draft" ? "warning" : "neutral"
            }
          >
            {site.status}
          </Badge>
        </div>
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">
          {site.timezone}
          {site.city ? ` · ${site.city}` : ""}
          {site.address_line1 ? ` · ${site.address_line1}` : ""}
        </p>
      </header>

      {justCreated || site.status === "active" ? (
        <section
          aria-live="polite"
          className="max-w-3xl rounded-md border border-emerald-200 bg-emerald-50 p-4"
        >
          <p className="text-base font-semibold text-emerald-900">
            {site.status === "active" ? "Facility site is active." : "Facility site created."}
          </p>
          <p className="mt-1 text-sm text-emerald-800">{data.assistantRecommendation}</p>
        </section>
      ) : null}

      {error ? <p className="text-sm text-[#C0392B]">{error}</p> : null}

      <section
        aria-label="M.P.A. Assistant"
        className="max-w-3xl space-y-3 rounded-md border border-[var(--mpa-color-border-default)] bg-white p-5"
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
          M.P.A. Assistant
        </p>
        <p className="text-base font-medium text-[var(--mpa-color-text-primary)]">
          {data.assistantRecommendation}
        </p>
        <div className="flex flex-wrap gap-2">
          {site.status === "draft" ? (
            <Button type="button" disabled={activating} onClick={() => void activate()}>
              {activating ? "Activating…" : "Activate site"}
            </Button>
          ) : null}
          <Link
            href="/facility/overview"
            className="inline-flex rounded-md border border-[var(--mpa-color-border-default)] px-4 py-2 text-sm"
          >
            Facility Overview
          </Link>
          {data.propertyLink ? (
            <Link
              href={data.propertyLink.href}
              className="inline-flex rounded-md border border-[var(--mpa-color-border-default)] px-4 py-2 text-sm"
            >
              Property record · {data.propertyLink.label}
            </Link>
          ) : null}
        </div>
      </section>

      <section className="max-w-3xl space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
          Locations
        </h2>
        <ul className="space-y-2">
          {(site.facility_locations ?? []).map((location) => (
            <li
              key={location.id}
              className="rounded-md border border-[var(--mpa-color-border-subtle)] bg-white px-3 py-2 text-sm"
            >
              <span className="font-medium">{location.name}</span>
              <span className="ml-2 text-xs text-[var(--mpa-color-text-secondary)]">
                {location.location_type} · {location.status}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="max-w-3xl space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
          Timeline
        </h2>
        {data.timeline.length === 0 ? (
          <p className="text-sm text-[var(--mpa-color-text-secondary)]">No timeline events yet.</p>
        ) : (
          <TimelineView
            items={data.timeline.map((item) => ({
              id: item.id,
              title: item.title,
              detail: item.detail,
              occurredAtLabel: item.occurredAt
            }))}
          />
        )}
      </section>
    </main>
  );
}
