"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Badge, EmptyState, Skeleton } from "@mpa/ui";
import { Breadcrumbs } from "../shell/breadcrumbs";

type SiteRow = {
  id: string;
  name: string;
  status: string;
  timezone: string;
  facility_locations?: Array<{ id: string }>;
  property_properties?: { id: string; name: string } | null;
};

export function FacilityOverviewPage() {
  const [sites, setSites] = useState<SiteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch("/api/facility/sites");
        const body = await response.json();
        if (!response.ok) {
          throw new Error(body.error ?? "Failed to load overview");
        }
        if (!cancelled) {
          setSites((body.sites ?? []) as SiteRow[]);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load overview");
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

  const active = sites.filter((site) => site.status === "active");
  const draft = sites.filter((site) => site.status === "draft");

  return (
    <main className="flex-1 space-y-4 bg-[var(--mpa-color-bg-app)] p-4 md:p-6">
      <Breadcrumbs
        items={[
          { href: "/facility/mission-control", label: "Facility Mission Control" },
          { label: "Facility Overview" }
        ]}
      />

      <header className="max-w-3xl space-y-2">
        <h1 className="font-display text-3xl font-semibold text-[var(--mpa-color-text-primary)]">
          Facility Overview
        </h1>
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">
          One workspace for site identity across the organization. Phase E.1 covers sites and
          locations only.
        </p>
        <div className="flex flex-wrap gap-2 text-sm text-[var(--mpa-color-text-secondary)]">
          <Badge variant="success">{active.length} active</Badge>
          <Badge variant="warning">{draft.length} draft</Badge>
          <Badge variant="neutral">{sites.length} total</Badge>
        </div>
      </header>

      <div className="flex flex-wrap gap-3 text-sm">
        <Link href="/facility/sites?new=1" className="underline">
          Add site
        </Link>
        <Link href="/facility/mission-control" className="underline">
          Mission Control
        </Link>
        <Link href="/settings/facility-sites" className="underline">
          Site settings
        </Link>
      </div>

      {loading ? <Skeleton className="h-32 w-full max-w-3xl" /> : null}
      {error ? <EmptyState title="Overview unavailable" description={error} /> : null}

      {!loading && !error && sites.length === 0 ? (
        <EmptyState
          title="No sites yet"
          description="Create a facility site to populate Overview and clear setup attention."
        />
      ) : null}

      {!loading && sites.length > 0 ? (
        <ul className="max-w-3xl space-y-2">
          {sites.map((site) => (
            <li key={site.id}>
              <Link
                href={`/facility/sites/${site.id}`}
                className="block rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] px-4 py-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium text-[var(--mpa-color-text-primary)]">{site.name}</span>
                  <Badge
                    variant={
                      site.status === "active"
                        ? "success"
                        : site.status === "draft"
                          ? "warning"
                          : "neutral"
                    }
                  >
                    {site.status}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-[var(--mpa-color-text-secondary)]">
                  {site.timezone} · {site.facility_locations?.length ?? 0} locations
                  {site.property_properties ? ` · Linked: ${site.property_properties.name}` : ""}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </main>
  );
}
