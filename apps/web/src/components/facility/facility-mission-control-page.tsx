"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
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

type Snapshot = {
  todayOpen: number;
  emergency: number;
  open: number;
  overdue: number;
  waitingOnVendor: number;
  waitingOnTechnician: number;
  completedRecently: number;
};

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
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const response = await fetch("/api/facility/mission-control");
    const body = await response.json();
    if (!response.ok) {
      throw new Error(body.error ?? "Failed to load Facility Mission Control");
    }
    setSnapshot(body.snapshot as Snapshot);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        await load();
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load");
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
  }, [load]);

  const waiting = (snapshot?.waitingOnVendor ?? 0) + (snapshot?.waitingOnTechnician ?? 0);

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

      {error ? (
        <p className="rounded-md border border-[#C0392B] bg-[#FCE8E6] px-3 py-2 text-sm text-[#C0392B]">
          {error}
        </p>
      ) : null}

      {loading || !snapshot ? (
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </section>
      ) : (
        <section aria-label="At a glance" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <FoGlanceCard
            label="Today's work"
            value={String(snapshot.todayOpen)}
            hint="Open work submitted or due today"
            tone={snapshot.todayOpen > 0 ? "watch" : "ok"}
          />
          <FoGlanceCard
            label="Emergency / critical"
            value={String(snapshot.emergency)}
            hint="Open emergency-priority facility work"
            tone={snapshot.emergency > 0 ? "critical" : "ok"}
          />
          <FoGlanceCard
            label="Open work"
            value={String(snapshot.open)}
            hint={`${snapshot.overdue} overdue`}
            tone={snapshot.overdue > 0 ? "watch" : "neutral"}
          />
          <FoGlanceCard
            label="Waiting on others"
            value={String(waiting)}
            hint={`${snapshot.waitingOnTechnician} tech · ${snapshot.waitingOnVendor} vendor`}
            tone={waiting > 0 ? "watch" : "neutral"}
          />
          <FoGlanceCard
            label="Assigned work"
            value={String(waiting)}
            hint="Assigned and awaiting start or progress"
            tone="neutral"
          />
          <FoGlanceCard
            label="Recently completed"
            value={String(snapshot.completedRecently)}
            hint="Completed or closed in the last 7 days"
            tone="ok"
          />
        </section>
      )}

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
