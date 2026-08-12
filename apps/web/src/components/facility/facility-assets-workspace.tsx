"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { completeWorkspaceLabels } from "@mpa/shared";
import { Alert, Badge, Button, EmptyState, Input, Skeleton } from "@mpa/ui";
import { useCommercialContext } from "../shell/commercial-context";
import { ErrorRetry } from "../shell/error-retry";
import {
  FoDocumentsStrip,
  FoPageChrome,
  FoQuickActions,
  documentsHref
} from "../shell/fo-workspace";

type Building = {
  id: string;
  name: string;
  status: string;
  property_units?: Array<{ id: string; unit_label: string; status: string }>;
};

export function FacilityAssetsWorkspace() {
  const { productSku } = useCommercialContext();
  const isComplete = productSku === "mpa_complete_platform";
  const completeLabels = completeWorkspaceLabels();
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [openByProperty, setOpenByProperty] = useState<Record<string, number>>({});
  const [name, setName] = useState("");
  const [unitCount, setUnitCount] = useState(1);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const [buildingsResponse, operationsResponse] = await Promise.all([
      fetch("/api/facility/buildings"),
      fetch("/api/facility/operations")
    ]);
    const buildingsBody = await buildingsResponse.json();
    const operationsBody = await operationsResponse.json();
    if (!buildingsResponse.ok) {
      throw new Error(buildingsBody.error ?? "Failed to load buildings");
    }
    if (!operationsResponse.ok) {
      throw new Error(operationsBody.error ?? "Failed to load facility work");
    }
    setBuildings((buildingsBody.buildings ?? []) as Building[]);

    const recount: Record<string, number> = {};
    for (const row of (operationsBody.workOrders ?? []) as Array<{
      status: string;
      property_id?: string;
      property_properties?: { id?: string } | null;
    }>) {
      if (["closed", "cancelled"].includes(row.status)) continue;
      const propertyId = row.property_id ?? row.property_properties?.id;
      if (!propertyId) continue;
      recount[propertyId] = (recount[propertyId] ?? 0) + 1;
    }
    setOpenByProperty(recount);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        await refresh();
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  if (loading) {
    return (
      <main className="flex-1 space-y-4 bg-[var(--mpa-color-bg-app)] p-4 md:p-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
      </main>
    );
  }

  return (
    <FoPageChrome
      crumbs={[
        { href: "/facility/mission-control", label: "Facility Mission Control" },
        { label: "Assets" }
      ]}
      eyebrow="Facility Operations"
      title="Buildings & assets"
      description={
        isComplete
          ? completeLabels.buildingCreateClarifier
          : "Buildings are your org properties. Attach an asset or system label when creating facility work."
      }
    >
      <FoQuickActions
        actions={[
          { href: "/facility/operations", label: "Create facility work", primary: true },
          { href: "/facility/mission-control", label: "Mission Control" },
          ...(isComplete
            ? [{ href: "/pm/properties?new=1", label: "Add property" }]
            : []),
          { href: documentsHref(undefined, "manual warranty"), label: "Documents" }
        ]}
      />

      {isComplete ? (
        <p className="rounded-md border border-[var(--mpa-color-border-default)] bg-white px-3 py-2 text-sm text-[var(--mpa-color-text-secondary)]">
          Prefer{" "}
          <Link
            href="/pm/properties?new=1"
            className="font-medium text-[var(--mpa-color-brand-primary)] underline"
          >
            Add property
          </Link>{" "}
          when setting up the portfolio. Use Add building below only if you need a facility-side
          shortcut to the same org property records.
        </p>
      ) : null}

      {error ? (
        <ErrorRetry
          title="Unable to load buildings"
          description={error}
          onRetry={() => {
            void (async () => {
              setError(null);
              setLoading(true);
              try {
                await refresh();
              } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load");
              } finally {
                setLoading(false);
              }
            })();
          }}
        />
      ) : null}
      {notice ? <Alert variant="success">{notice}</Alert> : null}

      <form
        className="grid max-w-xl gap-3 rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4"
        onSubmit={(event) => {
          event.preventDefault();
          void (async () => {
            setBusy(true);
            setError(null);
            setNotice(null);
            try {
              const response = await fetch("/api/facility/buildings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, unitCount })
              });
              const body = await response.json();
              if (!response.ok) {
                throw new Error(body.error ?? "Failed to create building");
              }
              setName("");
              setUnitCount(1);
              setNotice("Building added.");
              await refresh();
            } catch (err) {
              setError(err instanceof Error ? err.message : "Failed to create building");
            } finally {
              setBusy(false);
            }
          })();
        }}
      >
        <h2 className="text-sm font-semibold">Add building</h2>
        <label className="space-y-1 text-xs">
          <span className="font-medium">Building name</span>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            minLength={2}
            placeholder="Main Campus · Building A"
          />
        </label>
        <label className="space-y-1 text-xs">
          <span className="font-medium">Locations / units</span>
          <Input
            type="number"
            min={1}
            max={50}
            value={unitCount}
            onChange={(e) => setUnitCount(Number(e.target.value) || 1)}
          />
        </label>
        <Button type="submit" disabled={busy}>
          Add building
        </Button>
      </form>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold">Buildings</h2>
        {buildings.length === 0 ? (
          <EmptyState
            title="No buildings yet"
            description="Add a building to create facility work against it."
          />
        ) : (
          <ul className="grid gap-3 md:grid-cols-2">
            {buildings.map((building) => (
              <li
                key={building.id}
                className="rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-[var(--mpa-color-text-primary)]">
                      {building.name}
                    </h3>
                    <p className="mt-1 text-xs text-[var(--mpa-color-text-secondary)]">
                      {(building.property_units?.length ?? 0)} locations · {building.status}
                    </p>
                  </div>
                  <Badge variant={(openByProperty[building.id] ?? 0) > 0 ? "warning" : "success"}>
                    {openByProperty[building.id] ?? 0} open work
                  </Badge>
                </div>
                <p className="mt-3 text-sm">
                  <Link
                    href="/facility/operations"
                    className="text-[var(--mpa-color-brand-primary)] underline"
                  >
                    Open operations
                  </Link>
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <FoDocumentsStrip
        title="Equipment manuals & warranties"
        detail="Manuals, warranty files, and service records live in Documents."
        query="manual warranty asset"
      />
    </FoPageChrome>
  );
}
