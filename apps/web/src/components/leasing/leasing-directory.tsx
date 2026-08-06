"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Badge, Button, EmptyState, Skeleton } from "@mpa/ui";
import { LEASE_STATUS_LABELS, type LeaseStatus } from "@mpa/shared";
import { Breadcrumbs } from "../shell/breadcrumbs";
import { LeaseCreateWizard } from "./lease-create-wizard";

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

export function LeasingDirectory() {
  const searchParams = useSearchParams();
  const startWithWizard = searchParams.get("new") === "1";
  const [leases, setLeases] = useState<DirectoryLease[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [wizardDismissed, setWizardDismissed] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);

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
  }, []);

  const empty = !loading && !error && leases.length === 0;
  const showWizard = manualOpen || ((startWithWizard || empty) && !wizardDismissed);

  return (
    <main className="flex-1 space-y-4 bg-[var(--mpa-color-bg-app)] p-4 md:p-6">
      <Breadcrumbs
        items={[
          { href: "/pm/mission-control", label: "Mission Control" },
          { label: "Leasing" }
        ]}
      />

      <header className="flex max-w-3xl flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-[var(--mpa-color-text-primary)]">
            Leasing
          </h1>
          <p className="mt-2 text-sm text-[var(--mpa-color-text-secondary)]">
            One lease creation path. Create, send through SignWell, activate, and manage the resident
            lifecycle.
          </p>
        </div>
        <Button
          type="button"
          onClick={() => {
            setWizardDismissed(false);
            setManualOpen(true);
          }}
        >
          Create lease
        </Button>
      </header>

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
        <div className="space-y-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : null}

      {error ? <EmptyState title="Unable to load leases" description={error} /> : null}

      {!loading && !error && leases.length > 0 ? (
        <ul className="grid gap-3 lg:grid-cols-2">
          {leases.map((lease) => (
            <li
              key={lease.id}
              className="rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h2 className="text-base font-semibold">
                    <Link
                      href={`/pm/leasing/${lease.id}`}
                      className="text-[var(--mpa-color-brand-primary)] underline"
                    >
                      {lease.pm_residents?.display_name ?? "Lease"}
                    </Link>
                  </h2>
                  <p className="mt-1 text-xs text-[var(--mpa-color-text-secondary)]">
                    {lease.property_properties?.name ?? "Property"} · Unit{" "}
                    {lease.property_units?.unit_label ?? "—"}
                  </p>
                </div>
                <Badge variant={lease.status === "active" ? "success" : "neutral"}>
                  {statusLabel(lease.status)}
                </Badge>
              </div>
              <p className="mt-3 text-sm text-[var(--mpa-color-text-secondary)]">
                Open lease to review, send for signature, or activate.
              </p>
            </li>
          ))}
        </ul>
      ) : null}
    </main>
  );
}
