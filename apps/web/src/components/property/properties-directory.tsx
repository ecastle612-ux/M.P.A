"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Badge, Button, EmptyState, Skeleton } from "@mpa/ui";
import { Breadcrumbs } from "../shell/breadcrumbs";
import { PropertyCreateWizard } from "./property-create-wizard";

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
  }, []);

  const empty = !loading && !error && properties.length === 0;
  const showWizard = manualOpen || ((startWithWizard || empty) && !wizardDismissed);

  return (
    <main className="flex-1 space-y-4 bg-[var(--mpa-color-bg-app)] p-4 md:p-6">
      <Breadcrumbs
        items={[
          { href: "/pm/mission-control", label: "Mission Control" },
          { label: "Properties" }
        ]}
      />

      <header className="flex max-w-3xl flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-[var(--mpa-color-text-primary)]">
            Properties
          </h1>
          <p className="mt-2 text-sm text-[var(--mpa-color-text-secondary)]">
            Your portfolio directory. Create a property once — it appears across Mission Control,
            search, and operations.
          </p>
        </div>
        <Button
          type="button"
          onClick={() => {
            setWizardDismissed(false);
            setManualOpen(true);
          }}
        >
          Add property
        </Button>
      </header>

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
        <div className="space-y-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : null}

      {error ? <EmptyState title="Unable to load properties" description={error} /> : null}

      {!loading && !error && properties.length > 0 ? (
        <ul className="grid gap-3 lg:grid-cols-2">
          {properties.map((property) => {
            const unitCount = property.property_units?.length ?? 0;
            return (
              <li
                key={property.id}
                className="rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h2 className="text-base font-semibold">
                      <Link
                        href={`/pm/properties/${property.id}`}
                        className="text-[var(--mpa-color-brand-primary)] underline"
                      >
                        {property.name}
                      </Link>
                    </h2>
                    <p className="mt-1 text-xs text-[var(--mpa-color-text-secondary)]">
                      {unitCount} unit{unitCount === 1 ? "" : "s"}
                    </p>
                  </div>
                  <Badge variant={property.status === "active" ? "success" : "neutral"}>
                    {property.status}
                  </Badge>
                </div>
                <p className="mt-3 text-sm text-[var(--mpa-color-text-secondary)]">
                  Open Property Command Center to continue.
                </p>
              </li>
            );
          })}
        </ul>
      ) : null}
    </main>
  );
}
