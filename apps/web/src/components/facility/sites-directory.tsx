"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Badge, Button, EmptyState, Skeleton } from "@mpa/ui";
import { Breadcrumbs } from "../shell/breadcrumbs";
import { SiteCreateWizard } from "./site-create-wizard";
import { useCommercialContext } from "../shell/commercial-context";
import { skuIncludesPropertyManager } from "@mpa/shared";

type SiteRow = {
  id: string;
  name: string;
  status: string;
  timezone: string;
  facility_locations?: Array<{ id: string }>;
  property_properties?: { id: string; name: string } | null;
};

export function SitesDirectory() {
  const searchParams = useSearchParams();
  const startWithWizard = searchParams.get("new") === "1";
  const { productSku } = useCommercialContext();
  const [sites, setSites] = useState<SiteRow[]>([]);
  const [propertyOptions, setPropertyOptions] = useState<Array<{ id: string; name: string }>>([]);
  const [wizardDismissed, setWizardDismissed] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch("/api/facility/sites");
        const body = await response.json();
        if (!response.ok) {
          throw new Error(body.error ?? "Failed to load sites");
        }
        if (!cancelled) {
          setSites((body.sites ?? []) as SiteRow[]);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load sites");
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

  useEffect(() => {
    if (!productSku || !skuIncludesPropertyManager(productSku)) {
      return;
    }
    let cancelled = false;
    void (async () => {
      const response = await fetch("/api/pm/properties");
      if (!response.ok || cancelled) {
        return;
      }
      const body = (await response.json()) as {
        properties?: Array<{ id: string; name: string }>;
      };
      if (!cancelled) {
        setPropertyOptions(
          (body.properties ?? []).map((property) => ({ id: property.id, name: property.name }))
        );
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [productSku]);

  const empty = !loading && !error && sites.length === 0;
  const creating = manualOpen || ((startWithWizard || empty) && !wizardDismissed);

  return (
    <main className="flex-1 space-y-4 bg-[var(--mpa-color-bg-app)] p-4 md:p-6">
      <Breadcrumbs
        items={[
          { href: "/facility/mission-control", label: "Facility Mission Control" },
          { label: "Facility Sites" }
        ]}
      />

      <header className="flex max-w-3xl flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h1 className="font-display text-3xl font-semibold text-[var(--mpa-color-text-primary)]">
            Facility Sites
          </h1>
          <p className="text-sm text-[var(--mpa-color-text-secondary)]">
            Site profiles establish Facility Operations identity for this organization.
          </p>
        </div>
        {!creating ? (
          <Button
            type="button"
            onClick={() => {
              setWizardDismissed(false);
              setManualOpen(true);
            }}
          >
            Add site
          </Button>
        ) : null}
      </header>

      {creating ? (
        <SiteCreateWizard
          propertyOptions={propertyOptions}
          onCancel={() => {
            setManualOpen(false);
            setWizardDismissed(true);
          }}
        />
      ) : null}

      {loading ? (
        <div className="max-w-3xl space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : null}

      {error ? <EmptyState title="Sites unavailable" description={error} /> : null}

      {!loading && !error && sites.length === 0 && !creating ? (
        <EmptyState
          title="No facility sites"
          description="Create and activate a site to clear Mission Control setup attention."
        />
      ) : null}

      {!loading && sites.length > 0 ? (
        <ul className="max-w-3xl space-y-2">
          {sites.map((site) => (
            <li key={site.id}>
              <Link
                href={`/facility/sites/${site.id}`}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] px-4 py-3 text-sm"
              >
                <span className="font-medium text-[var(--mpa-color-text-primary)]">{site.name}</span>
                <span className="flex flex-wrap items-center gap-2 text-xs text-[var(--mpa-color-text-secondary)]">
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
                  <span>{site.timezone}</span>
                  <span>{site.facility_locations?.length ?? 0} locations</span>
                  {site.property_properties ? <span>· {site.property_properties.name}</span> : null}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </main>
  );
}
