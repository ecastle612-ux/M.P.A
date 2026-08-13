"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { completeWorkspaceLabels } from "@mpa/shared";
import { Button, EmptyState, Skeleton } from "@mpa/ui";
import { PropertyCreateWizard } from "./property-create-wizard";
import { useCommercialContext } from "../shell/commercial-context";
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
  const { productSku } = useCommercialContext();
  const isComplete = productSku === "mpa_complete_platform";
  const completeLabels = completeWorkspaceLabels();
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
  const propertiesWithUnits = properties.filter(
    (property) => (property.property_units?.length ?? 0) > 0
  ).length;
  const propertiesWithoutUnits = properties.filter(
    (property) => (property.property_units?.length ?? 0) === 0
  ).length;

  return (
    <PmPageChrome
      crumbs={[
        { href: "/pm/mission-control", label: "Property Manager Mission Control" },
        { label: "Properties" }
      ]}
      eyebrow={isComplete ? "Property Operations · Portfolio" : "Property Manager · Portfolio"}
      title="Properties"
      description={
        isComplete
          ? `${completeLabels.propertyCreateClarifier} Open a property for units, residents, maintenance, and documents.`
          : "Your portfolio directory. Open a property for units, residents, maintenance, and documents — then act from Mission Control."
      }
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
          { href: "/pm/mission-control", label: "Property Manager Mission Control" },
          { href: "/pm/maintenance", label: "Maintenance" },
          { href: documentsHref("property"), label: "Property documents" },
          ...(isComplete
            ? [{ href: "/facility/assets", label: "Facility buildings" }]
            : [])
        ]}
      />

      {isComplete ? (
        <p className="rounded-md border border-[var(--mpa-color-border-default)] bg-white px-3 py-2 text-sm text-[var(--mpa-color-text-secondary)]">
          Complete tip: add buildings once here as properties. Facility Operations uses the same
          records under Assets — you do not need a separate portfolio.
        </p>
      ) : null}

      {!loading && !error && properties.length > 0 ? (
        <p
          className="rounded-md border border-[var(--mpa-color-brand-primary)]/30 bg-[var(--mpa-color-brand-primary-subtle,#E6F4EF)] px-3 py-2 text-sm text-[var(--mpa-color-text-secondary)]"
          data-testid="pm-units-day1-guidance"
        >
          {propertiesWithUnits > 0
            ? "Open a property to manage units (add, edit, archive), then continue to residents and leasing."
            : propertiesWithoutUnits > 0
              ? "Open a property and add units to begin resident and leasing workflows."
              : "Create a property, then manage units before residents and leasing."}
        </p>
      ) : null}

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
