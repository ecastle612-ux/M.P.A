"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PM_SCHEDULE_STATUS_LABELS, type PmScheduleStatus } from "@mpa/shared";
import { Badge, Button, EmptyState, Skeleton } from "@mpa/ui";
import { Breadcrumbs } from "../shell/breadcrumbs";
import { PmCreateWizard } from "./pm-create-wizard";

type Schedule = {
  id: string;
  name: string;
  status: PmScheduleStatus;
  next_due_on: string | null;
  last_completed_on: string | null;
  cadence_unit: string;
  cadence_interval: number;
  criticality: string;
  title_template: string;
  is_one_shot: boolean;
  facility_sites?: { id: string; name: string } | null;
  facility_assets?: { id: string; name: string } | null;
  facility_systems?: { id: string; name: string } | null;
};

type Run = {
  id: string;
  schedule_id: string;
  due_on: string;
  work_order_id: string | null;
  status: string;
  created_at: string;
};

type Summary = {
  activeCount: number;
  dueCount: number;
  overdueCount: number;
};

export function PmProgramsDirectory() {
  const searchParams = useSearchParams();
  const startWithWizard = searchParams.get("new") === "1";
  const preferredId = searchParams.get("scheduleId") ?? "";

  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [runs, setRuns] = useState<Run[]>([]);
  const [summary, setSummary] = useState<Summary>({ activeCount: 0, dueCount: 0, overdueCount: 0 });
  const [assistantRecommendation, setAssistantRecommendation] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [timeline, setTimeline] = useState<
    Array<{ id: string; event_type: string; created_at: string }>
  >([]);
  const [selectedRuns, setSelectedRuns] = useState<Run[]>([]);
  const [filter, setFilter] = useState<"all" | "due" | "overdue" | "upcoming">("all");
  const [wizardDismissed, setWizardDismissed] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const selected = useMemo(
    () => schedules.find((row) => row.id === selectedId) ?? null,
    [schedules, selectedId]
  );

  const filtered = useMemo(() => {
    if (filter === "due") {
      return schedules.filter((s) => s.status === "active" && s.next_due_on === today);
    }
    if (filter === "overdue") {
      return schedules.filter(
        (s) => s.status === "active" && s.next_due_on != null && s.next_due_on < today
      );
    }
    if (filter === "upcoming") {
      return schedules.filter(
        (s) => s.status === "active" && s.next_due_on != null && s.next_due_on > today
      );
    }
    return schedules;
  }, [filter, schedules, today]);

  const loadDetail = useCallback(async (scheduleId: string) => {
    if (!scheduleId) {
      setSelectedRuns([]);
      setTimeline([]);
      return;
    }
    const response = await fetch(`/api/facility/preventive/${scheduleId}`);
    const body = await response.json();
    if (!response.ok) {
      throw new Error(body.error ?? "Failed to load schedule");
    }
    setSelectedRuns(body.runs ?? []);
    setTimeline(body.timeline ?? []);
  }, []);

  const refresh = useCallback(
    async (preferred?: string) => {
      const response = await fetch("/api/facility/preventive");
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.error ?? "Failed to load preventive maintenance");
      }
      const rows = (body.schedules ?? []) as Schedule[];
      setSchedules(rows);
      setRuns(body.runs ?? []);
      setSummary(body.summary ?? { activeCount: 0, dueCount: 0, overdueCount: 0 });
      setAssistantRecommendation(body.assistantRecommendation ?? "");
      const nextId = preferred || preferredId || selectedId || rows[0]?.id || "";
      setSelectedId(nextId);
      if (nextId) {
        await loadDetail(nextId);
      }
    },
    [loadDetail, preferredId, selectedId]
  );

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        await refresh(preferredId || undefined);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await action();
      await refresh(selectedId);
      setNotice("Updated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setBusy(false);
    }
  }

  const creating =
    manualOpen || ((startWithWizard || (!loading && schedules.length === 0)) && !wizardDismissed);

  if (loading) {
    return (
      <main className="flex-1 space-y-4 p-4 md:p-6">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-40 w-full max-w-3xl" />
      </main>
    );
  }

  return (
    <main className="flex-1 space-y-4 bg-[var(--mpa-color-bg-app)] p-4 md:p-6">
      <Breadcrumbs
        items={[
          { href: "/facility/mission-control", label: "Facility Mission Control" },
          { label: "Preventive Maintenance" }
        ]}
      />

      <header className="flex max-w-5xl flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h1 className="font-display text-3xl font-semibold text-[var(--mpa-color-text-primary)]">
            Preventive Maintenance
          </h1>
          <p className="text-sm text-[var(--mpa-color-text-secondary)]">
            Programs and schedules owned by Facility Operations. Generated work executes in
            Maintenance.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            disabled={busy}
            onClick={() =>
              void run(async () => {
                const response = await fetch("/api/facility/preventive/generate", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({})
                });
                const body = await response.json();
                if (!response.ok) {
                  throw new Error(body.error ?? "Generate failed");
                }
                const created = (body.generated ?? []).filter(
                  (row: { created: boolean }) => row.created
                ).length;
                setNotice(
                  created > 0
                    ? `Generated ${created} work order${created === 1 ? "" : "s"}.`
                    : "No new due work to generate (idempotent)."
                );
              })
            }
          >
            Generate due work
          </Button>
          {!creating ? (
            <Button
              type="button"
              onClick={() => {
                setWizardDismissed(false);
                setManualOpen(true);
              }}
            >
              Create program
            </Button>
          ) : null}
        </div>
      </header>

      <section className="flex max-w-3xl flex-wrap gap-2">
        <Badge variant={summary.overdueCount > 0 ? "danger" : "neutral"}>
          {summary.overdueCount} overdue
        </Badge>
        <Badge variant={summary.dueCount > 0 ? "warning" : "neutral"}>
          {summary.dueCount} due today
        </Badge>
        <Badge variant="neutral">{summary.activeCount} active</Badge>
      </section>

      <section
        aria-label="Assistant recommendation"
        className="max-w-3xl rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] px-4 py-3"
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
          Assistant recommendation
        </p>
        <p className="mt-1 text-sm">{assistantRecommendation}</p>
      </section>

      {creating ? (
        <PmCreateWizard
          onCancel={() => {
            setManualOpen(false);
            setWizardDismissed(true);
          }}
        />
      ) : null}

      {error ? (
        <p className="rounded-md border border-[var(--mpa-color-status-danger)]/30 bg-[var(--mpa-color-status-danger-subtle)] px-3 py-2 text-sm text-[var(--mpa-color-status-danger)]">
          {error}
        </p>
      ) : null}
      {notice ? (
        <p className="rounded-md border border-[var(--mpa-color-status-success)]/30 bg-[var(--mpa-color-status-success-subtle)] px-3 py-2 text-sm text-[var(--mpa-color-status-success)]">
          {notice}
        </p>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <section className="space-y-3 rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] p-4">
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["all", "All"],
                ["overdue", "Overdue"],
                ["due", "Due today"],
                ["upcoming", "Upcoming"]
              ] as const
            ).map(([value, label]) => (
              <Button
                key={value}
                type="button"
                size="sm"
                variant={filter === value ? "primary" : "secondary"}
                onClick={() => setFilter(value)}
              >
                {label}
              </Button>
            ))}
          </div>
          {filtered.length === 0 ? (
            <EmptyState
              title="No programs in this view"
              description="Create a preventive schedule on an asset or building system."
            />
          ) : (
            <ul className="divide-y divide-[var(--mpa-color-border-default)]">
              {filtered.map((schedule) => {
                const overdue =
                  schedule.status === "active" &&
                  schedule.next_due_on != null &&
                  schedule.next_due_on < today;
                const due =
                  schedule.status === "active" && schedule.next_due_on === today;
                return (
                  <li key={schedule.id}>
                    <button
                      type="button"
                      className={`w-full px-1 py-3 text-left ${
                        selectedId === schedule.id ? "bg-[var(--mpa-color-bg-subtle)]" : ""
                      }`}
                      onClick={() => {
                        setSelectedId(schedule.id);
                        void loadDetail(schedule.id).catch((err: unknown) =>
                          setError(err instanceof Error ? err.message : "Failed to load detail")
                        );
                      }}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">{schedule.name}</span>
                        <Badge variant="neutral">
                          {PM_SCHEDULE_STATUS_LABELS[schedule.status]}
                        </Badge>
                        {overdue ? <Badge variant="danger">Overdue</Badge> : null}
                        {due ? <Badge variant="warning">Due</Badge> : null}
                      </div>
                      <p className="mt-1 text-xs text-[var(--mpa-color-text-secondary)]">
                        {schedule.facility_sites?.name ?? "Site"}
                        {schedule.facility_assets?.name
                          ? ` · ${schedule.facility_assets.name}`
                          : ""}
                        {schedule.facility_systems?.name
                          ? ` · ${schedule.facility_systems.name}`
                          : ""}
                        {schedule.next_due_on ? ` · next ${schedule.next_due_on}` : ""}
                      </p>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="space-y-4 rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] p-4">
          {!selected ? (
            <EmptyState
              title="Select a program"
              description="Review schedule health, generate work, and track program history."
            />
          ) : (
            <>
              <div className="space-y-2">
                <h2 className="text-lg font-semibold">{selected.name}</h2>
                <p className="text-sm text-[var(--mpa-color-text-secondary)]">
                  Template: {selected.title_template}
                </p>
                <div className="flex flex-wrap gap-2 text-xs">
                  <Badge variant="neutral">{PM_SCHEDULE_STATUS_LABELS[selected.status]}</Badge>
                  <Badge variant="neutral">
                    Every {selected.cadence_interval} {selected.cadence_unit}
                    {selected.cadence_interval === 1 ? "" : "s"}
                  </Badge>
                  <Badge variant="neutral">{selected.criticality}</Badge>
                  {selected.is_one_shot ? <Badge variant="neutral">One-shot</Badge> : null}
                </div>
                <dl className="grid gap-2 text-sm md:grid-cols-2">
                  <div>
                    <dt className="text-[var(--mpa-color-text-secondary)]">Site</dt>
                    <dd>{selected.facility_sites?.name ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-[var(--mpa-color-text-secondary)]">Asset</dt>
                    <dd>{selected.facility_assets?.name ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-[var(--mpa-color-text-secondary)]">Building system</dt>
                    <dd>{selected.facility_systems?.name ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-[var(--mpa-color-text-secondary)]">Next due</dt>
                    <dd>{selected.next_due_on ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-[var(--mpa-color-text-secondary)]">Last completed</dt>
                    <dd>{selected.last_completed_on ?? "—"}</dd>
                  </div>
                </dl>
              </div>

              <div className="flex flex-wrap gap-2 border-t border-[var(--mpa-color-border-default)] pt-3">
                {selected.status === "draft" || selected.status === "paused" ? (
                  <Button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      void run(async () => {
                        const response = await fetch("/api/facility/preventive/transition", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            scheduleId: selected.id,
                            action: selected.status === "paused" ? "resume" : "activate"
                          })
                        });
                        const body = await response.json();
                        if (!response.ok) {
                          throw new Error(body.error ?? "Transition failed");
                        }
                      })
                    }
                  >
                    {selected.status === "paused" ? "Resume" : "Activate"}
                  </Button>
                ) : null}
                {selected.status === "active" ? (
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={busy}
                    onClick={() =>
                      void run(async () => {
                        const response = await fetch("/api/facility/preventive/transition", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ scheduleId: selected.id, action: "pause" })
                        });
                        const body = await response.json();
                        if (!response.ok) {
                          throw new Error(body.error ?? "Pause failed");
                        }
                      })
                    }
                  >
                    Pause
                  </Button>
                ) : null}
                {selected.status !== "retired" ? (
                  <Button
                    type="button"
                    variant="danger"
                    disabled={busy}
                    onClick={() =>
                      void run(async () => {
                        const response = await fetch("/api/facility/preventive/transition", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ scheduleId: selected.id, action: "retire" })
                        });
                        const body = await response.json();
                        if (!response.ok) {
                          throw new Error(body.error ?? "Retire failed");
                        }
                      })
                    }
                  >
                    Retire
                  </Button>
                ) : null}
              </div>

              <div className="space-y-2 border-t border-[var(--mpa-color-border-default)] pt-3">
                <h3 className="text-sm font-semibold">Program history</h3>
                {selectedRuns.length === 0 ? (
                  <p className="text-sm text-[var(--mpa-color-text-secondary)]">
                    No generation runs yet. Use Generate due work when the schedule is due.
                  </p>
                ) : (
                  <ul className="space-y-2 text-sm">
                    {selectedRuns.map((runRow) => (
                      <li key={runRow.id} className="flex flex-wrap items-center justify-between gap-2">
                        <span>
                          {runRow.due_on} · {runRow.status}
                        </span>
                        {runRow.work_order_id ? (
                          <Link
                            href={`/facility/operations?workOrderId=${runRow.work_order_id}`}
                            className="underline"
                          >
                            Open work order
                          </Link>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="space-y-2 border-t border-[var(--mpa-color-border-default)] pt-3">
                <h3 className="text-sm font-semibold">Timeline</h3>
                <ul className="space-y-2 text-sm">
                  {timeline.map((event) => (
                    <li key={event.id}>
                      <p>{event.event_type}</p>
                      <p className="text-xs text-[var(--mpa-color-text-secondary)]">
                        {new Date(event.created_at).toLocaleString()}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>

              <p className="text-xs text-[var(--mpa-color-text-secondary)]">
                Recent org runs: {runs.length}. Closing a preventive work order acknowledges the run
                and advances the schedule.
              </p>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
