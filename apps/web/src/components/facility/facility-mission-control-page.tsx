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
import { Badge, Skeleton } from "@mpa/ui";
import {
  facilityAttentionActionLabel,
  facilityMissionControlAttentionEmpty,
  facilityMissionControlAttentionSections,
  facilityMissionControlErrorMessage,
  facilityMissionControlGlanceMetrics,
  facilityMissionControlLoadView,
  facilityMissionControlQuickActions
} from "../../lib/facility/mission-control-presentation";
import type { FacilityMissionControlSnapshot } from "../../lib/facility/mission-control-service";
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
  const hasPmMaintenance = canAccess("pm.maintenance");
  const canManageRequestForms = canAccess("facility.request_forms");
  const quickActions = facilityMissionControlQuickActions({ productSku, canAccess });
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
  const attentionSections = snapshot ? facilityMissionControlAttentionSections(snapshot) : [];
  const attentionCaughtUp = snapshot ? facilityMissionControlAttentionEmpty(snapshot) : false;
  const isTechnicianViewer = snapshot?.viewerMode === "technician";
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
          : isTechnicianViewer
            ? "Operational overview. Your assigned jobs live in My Work."
            : "What needs your attention right now — then act on the exact work order."
      }
    >
      <FoQuickActions actions={quickActions} />

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
            isComplete && canAccess("pm.mission_control")
              ? "mpa_complete_platform"
              : "mpa_facility_operations"
          )}
          showOwnerClarity={!isComplete}
        />
      ) : null}

      {view === "ready" && snapshot && isTechnicianViewer ? (
        <section
          aria-label="Technician My Work"
          className="rounded-md border border-[var(--mpa-color-brand-primary)]/30 bg-white p-4"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-brand-primary)]">
            Your work
          </p>
          <p className="mt-1 text-sm font-semibold text-[var(--mpa-color-text-primary)]">
            Assigned facility jobs are in My Work — not this attention queue.
          </p>
          <p className="mt-2 text-sm text-[var(--mpa-color-text-secondary)]">
            Open My Work for today, overdue, and upcoming assignments with checklists and evidence.
          </p>
          <Link
            href="/facility/my-work"
            className="mt-3 inline-flex min-h-11 items-center rounded-md bg-[var(--mpa-color-brand-primary)] px-4 text-sm font-semibold text-white"
          >
            Open My Work
          </Link>
        </section>
      ) : null}

      {view === "ready" && snapshot && !isTechnicianViewer ? (
        <section aria-label="Needs Attention" className="space-y-3">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className="font-display text-lg font-semibold text-[var(--mpa-color-text-primary)]">
                Needs Attention
              </h2>
              <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
                What needs action now — open the exact work order.
              </p>
            </div>
            {snapshot.attentionTotal > 0 ? (
              <Badge variant="warning">{snapshot.attentionTotal} needing action</Badge>
            ) : null}
          </div>

          {attentionCaughtUp ? (
            <div className="rounded-md border border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-surface-subtle,#F7F8F7)] p-4">
              <p className="text-sm font-semibold text-[var(--mpa-color-text-primary)]">
                You&apos;re caught up.
              </p>
              <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
                No urgent or overdue facility work needs attention.
              </p>
            </div>
          ) : null}

          {attentionSections.map((section) => (
            <div
              key={section.category}
              className="rounded-md border border-[var(--mpa-color-border-subtle)] bg-white"
            >
              <div className="flex items-center justify-between gap-2 border-b border-[var(--mpa-color-border-subtle)] px-4 py-3">
                <p className="text-sm font-semibold text-[var(--mpa-color-text-primary)]">
                  {section.label}
                </p>
                <span className="text-xs text-[var(--mpa-color-text-secondary)]">
                  {section.total}
                  {section.items.length < section.total
                    ? ` · showing ${section.items.length}`
                    : ""}
                </span>
              </div>
              <ul className="divide-y divide-[var(--mpa-color-border-subtle)]">
                {section.items.map((item) => (
                  <li key={`${section.category}-${item.id}`} className="px-4 py-3">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 space-y-1">
                        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
                          {item.referenceLabel}
                        </p>
                        <p className="text-sm font-semibold text-[var(--mpa-color-text-primary)]">
                          {item.title}
                        </p>
                        {item.locationLine ? (
                          <p className="text-sm text-[var(--mpa-color-text-secondary)]">
                            {item.locationLine}
                          </p>
                        ) : null}
                        <p className="text-xs text-[var(--mpa-color-text-secondary)]">{item.metaLine}</p>
                      </div>
                      <Link
                        href={item.href}
                        className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-md border border-[var(--mpa-color-brand-primary)] px-4 text-sm font-semibold text-[var(--mpa-color-brand-primary)]"
                      >
                        {facilityAttentionActionLabel(section.category)}
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
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
          {isTechnicianViewer
            ? "Open My Work for your assigned facility jobs."
            : snapshot?.attentionTotal
              ? "Clear Needs Attention first — each row opens the exact work order."
              : snapshot?.emergency
                ? "Triage emergency facility work in Operations."
                : snapshot?.overdue
                  ? "Clear overdue facility work first."
                  : snapshot?.open
                    ? "Work the open facility queue — assign, start, and complete."
                    : "Add a building in Assets, then create your first work order in Operations."}
        </p>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-[var(--mpa-color-text-secondary)]">
          {isTechnicianViewer ? (
            <li>
              <Link href="/facility/my-work" className="text-[var(--mpa-color-brand-primary)] underline">
                My Work
              </Link>{" "}
              — today, overdue, and upcoming assignments.
            </li>
          ) : (
            <li>
              <Link href="/facility/operations" className="text-[var(--mpa-color-brand-primary)] underline">
                Facility Operations
              </Link>{" "}
              — create → assign → start → progress → complete / cancel.
            </li>
          )}
          <li>
            <Link href="/facility/assets" className="text-[var(--mpa-color-brand-primary)] underline">
              Buildings &amp; Sites
            </Link>{" "}
            — add the place facility work will reference.
          </li>
          <li>
            <Link href="/settings/team" className="text-[var(--mpa-color-brand-primary)] underline">
              Team
            </Link>{" "}
            — invite Maintenance Technicians to execute work.
          </li>
          {canManageRequestForms ? (
            <li>
              <Link
                href="/facility/settings/request-forms"
                className="text-[var(--mpa-color-brand-primary)] underline"
              >
                Request Forms
              </Link>{" "}
              — publish a QR or share link so people can report work.
            </li>
          ) : null}
          {hasPmMaintenance ? (
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
            summary="This attention home — Needs Attention, then operational overview."
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
          {canManageRequestForms ? (
            <FoCapabilityCard
              title="Request Forms"
              href="/facility/settings/request-forms"
              status="aligned"
              summary="Custom request forms, share links, and QR codes for public intake."
            />
          ) : null}
        </ul>
      </section>

      <FoDocumentsStrip
        title="Facility document library"
        detail="Equipment manuals, maintenance records, inspection reports, vendor contracts, certificates, and photos."
      />
    </FoPageChrome>
  );
}
