"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Badge, Button, EmptyState, Skeleton } from "@mpa/ui";
import { RESIDENT_STATUS_LABELS, type ResidentStatus } from "@mpa/shared";
import { Breadcrumbs } from "../shell/breadcrumbs";
import { ResidentCreateWizard } from "./resident-create-wizard";

type DirectoryResident = {
  id: string;
  display_name: string;
  email: string;
  status: string;
  portal_status: string;
  property_properties?: { id: string; name: string } | null;
  property_units?: { id: string; unit_label: string } | null;
};

function statusLabel(status: string): string {
  if (status in RESIDENT_STATUS_LABELS) {
    return RESIDENT_STATUS_LABELS[status as ResidentStatus];
  }
  return status;
}

export function ResidentsDirectory() {
  const searchParams = useSearchParams();
  const startWithWizard = searchParams.get("new") === "1";
  const [residents, setResidents] = useState<DirectoryResident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [wizardDismissed, setWizardDismissed] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch("/api/pm/residents");
        const body = (await response.json()) as {
          residents?: DirectoryResident[];
          error?: string;
        };
        if (!response.ok) {
          throw new Error(body.error ?? "Failed to load residents");
        }
        if (!cancelled) {
          setResidents(body.residents ?? []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load residents");
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

  const empty = !loading && !error && residents.length === 0;
  const showWizard = manualOpen || ((startWithWizard || empty) && !wizardDismissed);

  return (
    <main className="flex-1 space-y-4 bg-[var(--mpa-color-bg-app)] p-4 md:p-6">
      <Breadcrumbs
        items={[
          { href: "/pm/mission-control", label: "Mission Control" },
          { label: "Residents" }
        ]}
      />

      <header className="flex max-w-3xl flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-[var(--mpa-color-text-primary)]">
            Residents
          </h1>
          <p className="mt-2 text-sm text-[var(--mpa-color-text-secondary)]">
            Your resident directory. Create a resident once — they appear across property, search,
            timeline, and Mission Control.
          </p>
        </div>
        <Button
          type="button"
          onClick={() => {
            setWizardDismissed(false);
            setManualOpen(true);
          }}
        >
          Add resident
        </Button>
      </header>

      {showWizard ? (
        <ResidentCreateWizard
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

      {error ? <EmptyState title="Unable to load residents" description={error} /> : null}

      {!loading && !error && residents.length > 0 ? (
        <ul className="grid gap-3 lg:grid-cols-2">
          {residents.map((resident) => (
            <li
              key={resident.id}
              className="rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h2 className="text-base font-semibold">
                    <Link
                      href={`/pm/residents/${resident.id}`}
                      className="text-[var(--mpa-color-brand-primary)] underline"
                    >
                      {resident.display_name}
                    </Link>
                  </h2>
                  <p className="mt-1 text-xs text-[var(--mpa-color-text-secondary)]">
                    {resident.property_properties?.name ?? "Property"} · Unit{" "}
                    {resident.property_units?.unit_label ?? "—"}
                  </p>
                  <p className="mt-1 text-xs text-[var(--mpa-color-text-secondary)]">
                    {resident.email}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge variant="neutral">{statusLabel(resident.status)}</Badge>
                  {resident.portal_status === "pending_activation" ? (
                    <Badge variant="warning">Pending Activation</Badge>
                  ) : null}
                </div>
              </div>
              <p className="mt-3 text-sm text-[var(--mpa-color-text-secondary)]">
                Open Resident Command Center to continue.
              </p>
            </li>
          ))}
        </ul>
      ) : null}
    </main>
  );
}
