"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button, EmptyState, Skeleton } from "@mpa/ui";
import { LEASE_STATUS_LABELS, type LeaseStatus } from "@mpa/shared";
import { LeaseCreateWizard } from "./lease-create-wizard";
import {
  PmDirectoryToolbar,
  PmDocumentsStrip,
  PmEntityCard,
  PmErrorRetry,
  PmPageChrome,
  PmQuickActions,
  documentsHref
} from "../shell/pm-workspace";

type DirectoryLease = {
  id: string;
  status: string;
  rent_amount: number;
  currency: string;
  property_properties?: { name: string } | null;
  property_units?: { unit_label: string } | null;
  pm_residents?: { display_name: string; email: string } | null;
};

function statusLabel(status: string): string {
  if (status in LEASE_STATUS_LABELS) {
    return LEASE_STATUS_LABELS[status as LeaseStatus];
  }
  return status;
}

function formatRent(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
      maximumFractionDigits: 0
    }).format(amount);
  } catch {
    return `${amount} ${currency}`;
  }
}

export function LeasingDirectory() {
  const searchParams = useSearchParams();
  const startWithWizard = searchParams.get("new") === "1";
  const [leases, setLeases] = useState<DirectoryLease[]>([]);
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
        const response = await fetch("/api/pm/leasing");
        const body = (await response.json()) as { leases?: DirectoryLease[]; error?: string };
        if (!response.ok) {
          throw new Error(body.error ?? "Failed to load leases");
        }
        if (!cancelled) {
          setLeases(body.leases ?? []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load leases");
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
    if (!q) return leases;
    return leases.filter((lease) =>
      `${lease.pm_residents?.display_name ?? ""} ${lease.pm_residents?.email ?? ""} ${lease.status} ${lease.property_properties?.name ?? ""} ${lease.property_units?.unit_label ?? ""}`
        .toLowerCase()
        .includes(q)
    );
  }, [leases, query]);

  const empty = !loading && !error && leases.length === 0;
  const showWizard = manualOpen || ((startWithWizard || empty) && !wizardDismissed);
  const activeCount = leases.filter((l) => l.status === "active").length;

  return (
    <PmPageChrome
      crumbs={[
        { href: "/pm/mission-control", label: "Mission Control" },
        { label: "Leasing" }
      ]}
      eyebrow="Property Manager · Occupancy"
      title="Leasing"
      description="Create, send for signature, activate, and manage leases. Lease agreements stay with the lease and Documents."
      actions={
        <Button
          type="button"
          onClick={() => {
            setWizardDismissed(false);
            setManualOpen(true);
          }}
        >
          Create lease
        </Button>
      }
    >
      <PmQuickActions
        actions={[
          { href: "/pm/residents", label: "Residents" },
          { href: documentsHref("lease"), label: "Lease agreements" },
          { href: "/pm/mission-control", label: "Mission Control" }
        ]}
      />

      {!loading && !error && leases.length > 0 ? (
        <p className="text-xs text-[var(--mpa-color-text-secondary)]">
          {leases.length} leases · {activeCount} active
        </p>
      ) : null}

      {showWizard ? (
        <LeaseCreateWizard
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
          title="Unable to load leases"
          description={error}
          onRetry={() => setReloadKey((k) => k + 1)}
        />
      ) : null}

      {!loading && !error && leases.length > 0 ? (
        <>
          <PmDirectoryToolbar
            id="pm-leasing-search"
            value={query}
            onChange={setQuery}
            placeholder="Search resident, property, unit, or status…"
            showing={filtered.length}
            total={leases.length}
          />
          {filtered.length === 0 ? (
            <EmptyState title="No matching leases" description="Try a different search." />
          ) : (
            <ul className="grid gap-3 lg:grid-cols-2">
              {filtered.map((lease) => (
                <PmEntityCard
                  key={lease.id}
                  title={lease.pm_residents?.display_name ?? "Lease"}
                  href={`/pm/leasing/${lease.id}`}
                  meta={`${lease.property_properties?.name ?? "Property"} · Unit ${lease.property_units?.unit_label ?? "—"} · ${formatRent(lease.rent_amount, lease.currency)}`}
                  status={statusLabel(lease.status)}
                  footer="Open lease to review, send for signature, or activate."
                >
                  <div className="mt-3">
                    <a
                      href={documentsHref("lease", lease.pm_residents?.display_name)}
                      className="text-xs text-[var(--mpa-color-brand-primary)] underline"
                    >
                      Lease documents
                    </a>
                  </div>
                </PmEntityCard>
              ))}
            </ul>
          )}
        </>
      ) : null}

      {!loading && !error ? (
        <PmDocumentsStrip entityType="lease" title="Lease agreements" />
      ) : null}
    </PmPageChrome>
  );
}
