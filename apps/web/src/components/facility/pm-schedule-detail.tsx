"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge, Button } from "@mpa/ui";
import {
  formatPmCadenceLabel,
  type FacilityPmScheduleListItem
} from "../../lib/facility/pm-contracts";

export function PmScheduleDetail({
  schedule,
  canWrite
}: {
  schedule: FacilityPmScheduleListItem;
  canWrite: boolean;
}) {
  const router = useRouter();
  const [active, setActive] = useState(schedule.active);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggleActive() {
    if (!canWrite) return;
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/facility/pm/schedules/${schedule.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !active })
      });
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) throw new Error(payload?.error ?? "Update failed");
      setActive(!active);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--mpa-color-text-primary)]">
            {schedule.title}
          </h1>
          <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
            {schedule.propertyName ?? "Building/site"}
            {schedule.assetName ? ` · ${schedule.assetName}` : ""}
          </p>
        </div>
        <div className="flex gap-2">
          {!active ? <Badge>Paused</Badge> : null}
          {schedule.overdue ? <Badge>Overdue</Badge> : <Badge>On track</Badge>}
        </div>
      </div>

      <dl className="grid gap-3 sm:grid-cols-2">
        <div>
          <dt className="text-xs text-[var(--mpa-color-text-secondary)]">Cadence</dt>
          <dd className="text-sm text-[var(--mpa-color-text-primary)]">
            {formatPmCadenceLabel(schedule.cadence)}
            {schedule.cadence === "custom" && schedule.customIntervalDays
              ? ` · every ${schedule.customIntervalDays} days`
              : ""}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-[var(--mpa-color-text-secondary)]">Next due</dt>
          <dd className="text-sm text-[var(--mpa-color-text-primary)]">{schedule.nextDue}</dd>
        </div>
      </dl>

      {error ? <p className="text-sm text-[var(--mpa-color-status-danger)]">{error}</p> : null}
      {canWrite ? (
        <Button type="button" variant="secondary" disabled={saving} onClick={() => void toggleActive()}>
          {active ? "Pause schedule" : "Resume schedule"}
        </Button>
      ) : null}
    </div>
  );
}
