import type { SchedulerTelemetry } from "../../lib/ops/scheduler";

/**
 * OPS-001 Slice B — compact scheduler / reminder telemetry.
 * UX-012 Slice A tokens only (no Slice B chrome).
 */
export function SchedulerStatusPanel({ telemetry }: { telemetry: SchedulerTelemetry | null }) {
  if (!telemetry) {
    return (
      <p className="mpa-text-caption text-[var(--mpa-color-text-muted)]">
        Scheduler telemetry unavailable.
      </p>
    );
  }

  const rows = [
    {
      label: "Leader",
      value: telemetry.leader.holderId
        ? `${telemetry.leader.holderId.slice(0, 18)}…`
        : "none"
    },
    {
      label: "Schedules due",
      value: String(telemetry.schedules.due)
    },
    {
      label: "Reminders due",
      value: String(telemetry.reminders.scheduledDue)
    },
    {
      label: "Runs (24h)",
      value: `${telemetry.runs24h.completed} ok / ${telemetry.runs24h.failed} fail`
    },
    {
      label: "Outbox pending",
      value: String(telemetry.outbox.pendingCount)
    }
  ];

  return (
    <div className="rounded-[var(--mpa-radius-md)] border border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-surface)] px-[var(--mpa-space-4)] py-[var(--mpa-space-3)]">
      <p className="mpa-text-caption font-[var(--mpa-font-weight-medium)] text-[var(--mpa-color-text-secondary)]">
        OPS scheduler · Notification Center online
      </p>
      <dl className="mt-[var(--mpa-space-2)] grid gap-[var(--mpa-space-2)] sm:grid-cols-2">
        {rows.map((row) => (
          <div key={row.label} className="flex flex-col gap-[var(--mpa-space-1)]">
            <dt className="mpa-text-caption text-[var(--mpa-color-text-muted)]">{row.label}</dt>
            <dd className="mpa-text-body text-[var(--mpa-color-text-primary)]">{row.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
