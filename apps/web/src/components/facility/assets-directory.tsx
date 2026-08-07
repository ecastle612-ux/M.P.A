"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Badge, Button, EmptyState, Skeleton } from "@mpa/ui";
import { Breadcrumbs } from "../shell/breadcrumbs";
import { AssetCreateWizard } from "./asset-create-wizard";

type AssetRow = {
  id: string;
  name: string;
  status: string;
  criticality: string;
  asset_tag: string | null;
  facility_sites?: { id: string; name: string } | null;
  facility_locations?: { id: string; name: string } | null;
  facility_asset_categories?: { id: string; name: string } | null;
};

export function AssetsDirectory() {
  const searchParams = useSearchParams();
  const startWithWizard = searchParams.get("new") === "1";
  const [assets, setAssets] = useState<AssetRow[]>([]);
  const [wizardDismissed, setWizardDismissed] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch("/api/facility/assets");
        const body = await response.json();
        if (!response.ok) {
          throw new Error(body.error ?? "Failed to load assets");
        }
        if (!cancelled) {
          setAssets((body.assets ?? []) as AssetRow[]);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load assets");
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

  const empty = !loading && !error && assets.length === 0;
  const creating = manualOpen || ((startWithWizard || empty) && !wizardDismissed);

  return (
    <main className="flex-1 space-y-4 bg-[var(--mpa-color-bg-app)] p-4 md:p-6">
      <Breadcrumbs
        items={[
          { href: "/facility/mission-control", label: "Facility Mission Control" },
          { label: "Assets" }
        ]}
      />

      <header className="flex max-w-4xl flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h1 className="font-display text-3xl font-semibold text-[var(--mpa-color-text-primary)]">
            Asset registry
          </h1>
          <p className="text-sm text-[var(--mpa-color-text-secondary)]">
            Enterprise registry of what Facility Operations maintains — identity, location, and
            lifecycle.
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
            Register asset
          </Button>
        ) : null}
      </header>

      {creating ? (
        <AssetCreateWizard
          onCancel={() => {
            setManualOpen(false);
            setWizardDismissed(true);
          }}
        />
      ) : null}

      {loading ? (
        <div className="max-w-4xl space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : null}

      {error ? <EmptyState title="Assets unavailable" description={error} /> : null}

      {!loading && !error && assets.length === 0 && !creating ? (
        <EmptyState
          title="No assets yet"
          description="Register the first asset for an active facility site."
        />
      ) : null}

      {!loading && assets.length > 0 ? (
        <div className="max-w-4xl overflow-hidden rounded-md border border-[var(--mpa-color-border-default)] bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-[var(--mpa-color-bg-subtle,#f7faf9)] text-xs uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
              <tr>
                <th className="px-4 py-3 font-semibold">Asset</th>
                <th className="px-4 py-3 font-semibold">Site / location</th>
                <th className="px-4 py-3 font-semibold">Category</th>
                <th className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {assets.map((asset) => (
                <tr key={asset.id} className="border-t border-[var(--mpa-color-border-subtle)]">
                  <td className="px-4 py-3">
                    <Link
                      href={`/facility/assets/${asset.id}`}
                      className="font-medium text-[var(--mpa-color-text-primary)] underline"
                    >
                      {asset.name}
                    </Link>
                    <div className="mt-0.5 text-xs text-[var(--mpa-color-text-secondary)]">
                      {asset.asset_tag ? `${asset.asset_tag} · ` : ""}
                      {asset.criticality}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[var(--mpa-color-text-secondary)]">
                    {asset.facility_sites?.name ?? "—"}
                    {asset.facility_locations ? ` · ${asset.facility_locations.name}` : ""}
                  </td>
                  <td className="px-4 py-3 text-[var(--mpa-color-text-secondary)]">
                    {asset.facility_asset_categories?.name ?? "—"}
                  </td>
                  <td className="px-4 py-3">
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
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </main>
  );
}
