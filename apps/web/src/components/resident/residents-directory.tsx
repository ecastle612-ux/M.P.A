"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Badge, Button, EmptyState, Skeleton } from "@mpa/ui";
import { RESIDENT_STATUS_LABELS, type ResidentStatus } from "@mpa/shared";
import { ResidentCreateWizard } from "./resident-create-wizard";
import {
  PmDirectoryToolbar,
  PmDocumentsStrip,
  PmEntityCard,
  PmErrorRetry,
  PmPageChrome,
  PmQuickActions,
  documentsHref
} from "../shell/pm-workspace";

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
  const [query, setQuery] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/pm/residents");
      const body = (await response.json()) as {
        residents?: DirectoryResident[];
        error?: string;
      };
      if (!response.ok) {
        throw new Error(body.error ?? "Failed to load residents");
      }
      setResidents(body.residents ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load residents");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load, reloadKey]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return residents;
    return residents.filter((resident) =>
      `${resident.display_name} ${resident.email} ${resident.status} ${resident.property_properties?.name ?? ""} ${resident.property_units?.unit_label ?? ""}`
        .toLowerCase()
        .includes(q)
    );
  }, [residents, query]);

  const empty = !loading && !error && residents.length === 0;
  const showWizard = manualOpen || ((startWithWizard || empty) && !wizardDismissed);
  const pendingActivation = residents.filter((r) => r.portal_status === "pending_activation").length;

  return (
    <PmPageChrome
      crumbs={[
        { href: "/pm/mission-control", label: "Mission Control" },
        { label: "Residents" }
      ]}
      eyebrow="Property Manager · People"
      title="Residents"
      description="Resident directory with portal status. Open a resident for lease context, communications, and files."
      actions={
        <Button
          type="button"
          onClick={() => {
            setWizardDismissed(false);
            setManualOpen(true);
          }}
        >
          Add resident
        </Button>
      }
    >
      <PmQuickActions
        actions={[
          { href: "/pm/leasing", label: "Leasing" },
          { href: "/shared/communications", label: "Communications" },
          { href: documentsHref("resident"), label: "Resident files" }
        ]}
      />

      {!loading && !error && residents.length > 0 ? (
        <p className="text-xs text-[var(--mpa-color-text-secondary)]">
          {residents.length} residents
          {pendingActivation > 0 ? ` · ${pendingActivation} pending portal activation` : ""}
        </p>
      ) : null}

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
        <div className="space-y-3" aria-busy="true">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : null}

      {error ? (
        <PmErrorRetry
          title="Unable to load residents"
          description={error}
          onRetry={() => setReloadKey((k) => k + 1)}
        />
      ) : null}

      {!loading && !error && residents.length > 0 ? (
        <>
          <PmDirectoryToolbar
            id="pm-residents-search"
            value={query}
            onChange={setQuery}
            placeholder="Search name, email, property, or unit…"
            showing={filtered.length}
            total={residents.length}
          />
          {filtered.length === 0 ? (
            <EmptyState title="No matching residents" description="Try a different search." />
          ) : (
            <ul className="grid gap-3 lg:grid-cols-2">
              {filtered.map((resident) => (
                <PmEntityCard
                  key={resident.id}
                  title={resident.display_name}
                  href={`/pm/residents/${resident.id}`}
                  meta={`${resident.property_properties?.name ?? "Property"} · Unit ${resident.property_units?.unit_label ?? "—"} · ${resident.email}`}
                  status={statusLabel(resident.status)}
                  footer="Open Resident Command Center to continue."
                >
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {resident.portal_status === "pending_activation" ? (
                      <Badge variant="warning">Pending Activation</Badge>
                    ) : null}
                    <a
                      href={documentsHref("resident", resident.display_name)}
                      className="text-xs text-[var(--mpa-color-brand-primary)] underline"
                    >
                      Files
                    </a>
                  </div>
                </PmEntityCard>
              ))}
            </ul>
          )}
        </>
      ) : null}

      {!loading && !error ? <PmDocumentsStrip entityType="resident" title="Resident files" /> : null}
    </PmPageChrome>
  );
}
