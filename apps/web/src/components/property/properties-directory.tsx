"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button, EmptyState, Skeleton } from "@mpa/ui";
import { PropertyCreateWizard } from "./property-create-wizard";
import {
  PmDirectoryToolbar,
  PmDocumentsStrip,
  PmEntityCard,
  PmErrorRetry,
  PmPageChrome,
  PmQuickActions,
  documentsHref
} from "../shell/pm-workspace";

type PortfolioProperty = {
  id: string;
  name: string;
  status: string;
  property_units?: Array<{ id: string; unit_label: string; status: string }>;
};

export function PropertiesDirectory() {
  const searchParams = useSearchParams();
  const startWithWizard = searchParams.get("new") === "1";
  const [properties, setProperties] = useState<PortfolioProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [wizardDismissed, setWizardDismissed] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch("/api/pm/properties");
        const body = (await response.json()) as {
          properties?: PortfolioProperty[];
          error?: string;
        };
        if (!response.ok) {
          throw new Error(body.error ?? "Failed to load properties");
        }
        if (!cancelled) {
          setProperties(body.properties ?? []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load properties");
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
  }, [reloadKey]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return properties;
    return properties.filter((property) => {
      const units = (property.property_units ?? []).map((u) => u.unit_label).join(" ");
      return `${property.name} ${property.status} ${units}`.toLowerCase().includes(q);
    });
  }, [properties, query]);

  const empty = !loading && !error && properties.length === 0;
  const showWizard = manualOpen || ((startWithWizard || empty) && !wizardDismissed);

  return (
    <PmPageChrome
      crumbs={[
        { href: "/pm/mission-control", label: "Mission Control" },
        { label: "Properties" }
      ]}
      eyebrow="Property Manager · Portfolio"
      title="Properties"
      description="Your portfolio directory. Open a property for units, residents, maintenance, and documents — then act from Mission Control."
      actions={
        <Button
          type="button"
          onClick={() => {
            setWizardDismissed(false);
            setManualOpen(true);
          }}
        >
          Add property
        </Button>
      }
    >
      <PmQuickActions
        actions={[
          { href: "/pm/mission-control", label: "Mission Control" },
          { href: "/pm/maintenance", label: "Maintenance" },
          { href: documentsHref("property"), label: "Property documents" }
        ]}
      />

      {showWizard ? (
        <PropertyCreateWizard
          {...(empty
            ? {}
            : {
                onCancel: () => {
                  setManualOpen(false);
                  setWizardDismissed(true);
                }
              })}
        />
      ) : null}

      {loading ? (
        <div className="space-y-3" aria-busy="true">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : null}

      {error ? (
        <PmErrorRetry
          title="Unable to load properties"
          description={error}
          onRetry={() => {
            setLoading(true);
            setError(null);
            setReloadKey((k) => k + 1);
          }}
        />
      ) : null}

      {!loading && !error && properties.length > 0 ? (
        <>
          <PmDirectoryToolbar
            id="pm-properties-search"
            value={query}
            onChange={setQuery}
            placeholder="Search properties or units…"
            showing={filtered.length}
            total={properties.length}
          />
          {filtered.length === 0 ? (
            <EmptyState
              title="No matching properties"
              description="Try a different name or clear the search."
            />
          ) : (
            <ul className="grid gap-3 lg:grid-cols-2">
              {filtered.map((property) => {
                const unitCount = property.property_units?.length ?? 0;
                const available =
                  property.property_units?.filter((u) => u.status === "available").length ?? 0;
                return (
                  <PmEntityCard
                    key={property.id}
                    title={property.name}
                    href={`/pm/properties/${property.id}`}
                    meta={`${unitCount} unit${unitCount === 1 ? "" : "s"} · ${available} available`}
                    status={property.status}
                    footer="Open Property Command Center for units, residents, maintenance, and documents."
                  >
                    <div className="mt-3 flex flex-wrap gap-2 text-xs">
                      <a
                        href={documentsHref("property", property.name)}
                        className="text-[var(--mpa-color-brand-primary)] underline"
                      >
                        Documents
                      </a>
                      <a
                        href={`/pm/properties/${property.id}/money`}
                        className="text-[var(--mpa-color-brand-primary)] underline"
                      >
                        Money
                      </a>
                    </div>
                  </PmEntityCard>
                );
              })}
            </ul>
          )}
        </>
      ) : null}

      {!loading && !error ? <PmDocumentsStrip entityType="property" title="Property documents" /> : null}
    </PmPageChrome>
  );
}
