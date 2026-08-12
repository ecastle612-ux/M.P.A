"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
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
import { Button, Skeleton } from "@mpa/ui";
import {
  facilityMissionControlErrorMessage,
  facilityMissionControlGlanceMetrics,
  facilityMissionControlLoadView
} from "../../lib/facility/mission-control-presentation";
import type { FacilityMissionControlSnapshot } from "../../lib/maintenance/maintenance-service";

const CAPABILITIES = [
  {
    title: "Operations",
    href: "/facility/operations",
    summary: "Corrective facility work — create, assign, progress, complete, cancel."
  },
  {
    title: "Assets / Buildings",
    href: "/facility/assets",
    summary: "Buildings and named assets for facility work context."
  },
  {
    title: "Preventive Maintenance",
    href: "/facility/preventive-maintenance",
    summary: "Preventive facility work queues and due tracking."
  },
  {
    title: "Inspections",
    href: "/facility/inspections",
    summary: "Inspection work with evidence notes and completion."
  },
  {
    title: "Compliance",
    href: "/facility/compliance",
    summary: "Compliance and certificate-related facility work."
  },
  {
    title: "Inventory",
    href: "/facility/inventory",
    summary: "Inventory-related facility follow-ups."
  },
  {
    title: "Parts",
    href: "/facility/parts",
    summary: "Parts-related facility work."
  },
  {
    title: "Safety",
    href: "/facility/safety",
    summary: "Safety work orders and corrective follow-ups."
  },
  {
    title: "Building Systems",
    href: "/facility/building-systems",
    summary: "HVAC, electrical, fire, and related systems work."
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

  return (
    <FoPageChrome
      crumbs={[
        { href: "/launcher", label: "Launcher" },
        { label: "Facility Mission Control" }
      ]}
      eyebrow="Facility Operations · Attention home"
      title="Facility Mission Control"
      description="Today’s facility work, emergencies, overdue items, and waiting assignments — then act from Operations."
    >
      <FoQuickActions
        actions={[
          { href: "/facility/operations", label: "Open operations", primary: true },
          { href: "/facility/assets", label: "Buildings" },
          { href: "/shared/documents", label: "Documents" },
          { href: "/shared/communications", label: "Communications" },
          ...(hasPmMaintenance
            ? [
                { href: "/pm/maintenance", label: "PM Maintenance" },
                { href: "/pm/vendors", label: "Vendors" }
              ]
            : []),
          ...(isComplete ? [{ href: "/pm/mission-control", label: "PM Mission Control" }] : [])
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
        <section
          className="space-y-3 rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4"
          role="alert"
        >
          <p className="text-sm font-semibold text-[var(--mpa-color-text-primary)]">
            Facility Mission Control unavailable
          </p>
          <p className="text-sm text-[var(--mpa-color-text-secondary)]">
            {error ?? "We couldn’t load Facility Mission Control. Check your connection and try again."}
          </p>
          <Button type="button" onClick={retry} aria-busy={loading}>
            Retry
          </Button>
        </section>
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
                : "Create facility work from Operations, or add a building in Assets."}
        </p>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-[var(--mpa-color-text-secondary)]">
          <li>
            <Link href="/facility/operations" className="text-[var(--mpa-color-brand-primary)] underline">
              Facility Operations
            </Link>{" "}
            — create → assign → start → progress → complete / cancel.
          </li>
          <li>
            Vendors progress assigned facility work in the{" "}
            <Link href="/portal/vendor" className="text-[var(--mpa-color-brand-primary)] underline">
              vendor portal
            </Link>
            .
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
