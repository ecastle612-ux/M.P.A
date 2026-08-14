"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ownerDay1ChecklistForSku } from "@mpa/shared";
import {
  FoCapabilityCard,
  FoDocumentsStrip,
  FoGlanceCard,
  FoPageChrome,
  FoPriorityLegend,
  FoQuickActions,
  documentsHref
} from "../shell/fo-workspace";
import { useCommercialContext } from "../shell/commercial-context";
import { Skeleton } from "@mpa/ui";
import {
  facilityMissionControlErrorMessage,
  facilityMissionControlGlanceMetrics,
  facilityMissionControlLoadView
} from "../../lib/facility/mission-control-presentation";
import type { FacilityMissionControlSnapshot } from "../../lib/maintenance/maintenance-service";
import { ErrorRetry } from "../shell/error-retry";
import { OwnerDay1ChecklistCard } from "../commercial/owner-day1-checklist";

const CAPABILITIES = [
  {
    title: "Operations",
    href: "/facility/operations",
    summary: "Corrective facility work — create, assign, progress, complete, cancel."
  },
  {
    title: "Assets",
    href: "/facility/assets",
    summary: "Equipment registry — location, lifecycle, photos, and work history."
  },
  {
    title: "Preventive Work",
    href: "/facility/preventive-maintenance",
    summary: "Work-order queue for preventive facility tasks."
  },
  {
    title: "Inspection Work",
    href: "/facility/inspections",
    summary: "Work-order queue for inspection tasks."
  },
  {
    title: "Compliance Work",
    href: "/facility/compliance",
    summary: "Work-order queue for compliance-related facility tasks."
  },
  {
    title: "Inventory",
    href: "/facility/inventory",
    summary: "Stock ledger — on-hand quantities, movements, and reorder levels."
  },
  {
    title: "Parts Work",
    href: "/facility/parts",
    summary: "Work-order queue for parts-related facility tasks."
  },
  {
    title: "Safety Work",
    href: "/facility/safety",
    summary: "Work-order queue for safety-related facility tasks."
  },
  {
    title: "Building Systems Work",
    href: "/facility/building-systems",
    summary: "Work-order queue for building-systems facility tasks."
  }
] as const;

export function FacilityMissionControlPage() {
  const { productSku, canAccess } = useCommercialContext();
  const isComplete = productSku === "mpa_complete_platform";
  const hasPmMaintenance = canAccess("pm.maintenance") || isComplete;
  const [snapshot, setSnapshot] = useState<FacilityMissionControlSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/facility/mission-control", { signal: controller.signal })
      .then(async (response) => {
        const body = (await response.json().catch(() => ({}))) as {
          error?: string;
          snapshot?: FacilityMissionControlSnapshot;
        };
        if (!response.ok || !body.snapshot) {
          throw new Error(body.error ?? "Failed to load Facility Mission Control");
        }
        if (controller.signal.aborted) {
          return;
        }
        setSnapshot(body.snapshot);
        setError(null);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) {
          return;
        }
        setError(facilityMissionControlErrorMessage(err));
        setLoading(false);
      });
    return () => controller.abort();
  }, [reloadToken]);

  function retry() {
    setLoading(true);
    setError(null);
    setReloadToken((value) => value + 1);
  }

  const view = facilityMissionControlLoadView({
    loading,
    error,
    hasSnapshot: Boolean(snapshot)
  });
  const glanceMetrics = snapshot ? facilityMissionControlGlanceMetrics(snapshot) : [];
  const isFirstRun =
    view === "ready" &&
    Boolean(snapshot) &&
    (snapshot?.open ?? 0) === 0 &&
    (snapshot?.emergency ?? 0) === 0 &&
    (snapshot?.overdue ?? 0) === 0;

  return (
    <FoPageChrome
      crumbs={[
        { href: "/launcher", label: "Launcher" },
        { label: "Facility Mission Control" }
      ]}
      eyebrow={
        isFirstRun
          ? "Facility Operations · Getting started"
          : "Facility Operations · Attention home"
      }
      title="Facility Mission Control"
      description={
        isFirstRun
          ? "Your attention home after Guided Setup — activate your facility operation with one clear Day-1 path."
          : "Today’s facility work, emergencies, overdue items, and waiting assignments — then act from Operations."
      }
    >
      <FoQuickActions
        actions={[
          { href: "/facility/operations", label: "Open operations", primary: true },
          { href: "/facility/vendors", label: "Vendors" },
          { href: "/facility/assets", label: "Buildings" },
          { href: "/shared/documents", label: "Documents" },
          { href: "/shared/communications", label: "Communications" },
          ...(hasPmMaintenance
            ? [
                {
                  href: "/pm/maintenance",
                  label: isComplete ? "Property maintenance" : "PM Maintenance"
                }
              ]
            : []),
          ...(isComplete
            ? [{ href: "/pm/mission-control", label: "Property Operations" }]
            : [])
        ]}
      />

      {view === "loading" ? (
        <section
          className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
          aria-busy="true"
          aria-label="Loading Facility Mission Control"
        >
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </section>
      ) : null}

      {view === "error" ? (
        <ErrorRetry
          title="Facility Mission Control unavailable"
          description={
            error ??
            "We couldn’t load Facility Mission Control. Check your connection and try again."
          }
          onRetry={retry}
        />
      ) : null}

      {isFirstRun ? (
        <section
          aria-label="Welcome"
          className="space-y-2 rounded-md border border-[var(--mpa-color-brand-primary)]/30 bg-[var(--mpa-color-brand-primary-subtle,#E6F4EF)] p-5"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-brand-primary)]">
            Welcome
          </p>
          <p className="text-base font-semibold text-[var(--mpa-color-text-primary)]">
            Congratulations. Your facility organization is ready.
          </p>
          <p className="text-sm text-[var(--mpa-color-text-secondary)]">
            You are the Organization Admin. Start with a building or site, invite technicians, then
            create and complete your first facility work order.
          </p>
        </section>
      ) : null}

      {isFirstRun ? (
        <OwnerDay1ChecklistCard
          checklist={ownerDay1ChecklistForSku(
            isComplete ? "mpa_complete_platform" : "mpa_facility_operations"
          )}
          showOwnerClarity={!isComplete}
        />
      ) : null}

      {view === "ready" && snapshot ? (
        <section aria-label="At a glance" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {glanceMetrics.map((metric) => (
            <FoGlanceCard
              key={metric.id}
              label={metric.label}
              value={String(metric.value)}
              hint={metric.hint}
              tone={metric.tone}
            />
          ))}
        </section>
      ) : null}

      <section
        aria-label="What to do next"
        className="rounded-md border border-[var(--mpa-color-brand-primary)]/30 bg-white p-4"
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-brand-primary)]">
          What to do next
        </p>
        <p className="mt-1 text-sm font-semibold text-[var(--mpa-color-text-primary)]">
          {snapshot?.emergency
            ? "Triage emergency facility work in Operations."
            : snapshot?.overdue
              ? "Clear overdue facility work first."
              : snapshot?.open
                ? "Work the open facility queue — assign, start, and complete."
                : "Add a building in Assets, then create your first work order in Operations."}
        </p>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-[var(--mpa-color-text-secondary)]">
          <li>
            <Link href="/facility/assets" className="text-[var(--mpa-color-brand-primary)] underline">
              Buildings &amp; Sites
            </Link>{" "}
            — add the place facility work will reference.
          </li>
          <li>
            <Link href="/facility/operations" className="text-[var(--mpa-color-brand-primary)] underline">
              Facility Operations
            </Link>{" "}
            — create → assign → start → progress → complete / cancel.
          </li>
          <li>
            <Link href="/settings/team" className="text-[var(--mpa-color-brand-primary)] underline">
              Team
            </Link>{" "}
            — invite Maintenance Technicians to execute work.
          </li>
          {isComplete ? (
            <li>
              Complete Platform: residential maintenance stays in{" "}
              <Link href="/pm/maintenance" className="text-[var(--mpa-color-brand-primary)] underline">
                Property Manager Maintenance
              </Link>
              ; facility work stays here.
            </li>
          ) : null}
        </ul>
      </section>

      <FoPriorityLegend />

      <section aria-label="Facility workspaces" className="space-y-3">
        <div>
          <h2 className="font-display text-lg font-semibold text-[var(--mpa-color-text-primary)]">
            Facility workspaces
          </h2>
          <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
            Live operational queues on the shared work-order model.
          </p>
        </div>
        <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <FoCapabilityCard
            title="Mission Control"
            href="/facility/mission-control"
            status="aligned"
            summary="This attention home — today’s work, emergencies, and waiting assignments."
            documentsHref={documentsHref()}
          />
          {CAPABILITIES.map((item) => (
            <FoCapabilityCard
              key={item.href}
              title={item.title}
              href={item.href}
              status="aligned"
              summary={item.summary}
              documentsHref={documentsHref("maintenance")}
            />
          ))}
        </ul>
      </section>

      <FoDocumentsStrip
        title="Facility document library"
        detail="Equipment manuals, maintenance records, inspection reports, vendor contracts, certificates, and photos."
      />
    </FoPageChrome>
  );
}
