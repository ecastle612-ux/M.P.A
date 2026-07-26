"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Input } from "@mpa/ui";
import { PM_CADENCES, formatPmCadenceLabel, type PmCadence } from "../../lib/facility/pm-contracts";

type PropertyOption = { id: string; name: string };

export function PmScheduleCreateForm({
  properties,
  defaultPropertyId,
  defaultAssetId
}: {
  properties: PropertyOption[];
  defaultPropertyId?: string;
  defaultAssetId?: string;
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [propertyId, setPropertyId] = useState(
    defaultPropertyId ?? properties[0]?.id ?? ""
  );
  const [assetId] = useState(defaultAssetId ?? "");
  const [cadence, setCadence] = useState<PmCadence>("monthly");
  const [nextDue, setNextDue] = useState(new Date().toISOString().slice(0, 10));
  const [customIntervalDays, setCustomIntervalDays] = useState("30");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function onSave() {
    setError(null);
    if (!title.trim() || !propertyId || !nextDue) {
      setError("Title, building/site, and next due are required.");
      return;
    }
    setSaving(true);
    try {
      const response = await fetch("/api/facility/pm/schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          propertyId,
          cadence,
          nextDue,
          ...(assetId ? { assetId } : {}),
          ...(cadence === "custom"
            ? { customIntervalDays: Number.parseInt(customIntervalDays, 10) }
            : {})
        })
      });
      const payload = (await response.json().catch(() => null)) as
        | { schedule?: { id: string }; error?: string }
        | null;
      if (!response.ok || !payload?.schedule?.id) {
        throw new Error(payload?.error ?? "Could not create schedule");
      }
      router.push(`/facility/pm/${payload.schedule.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create schedule");
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--mpa-color-text-primary)]">New PM schedule</h1>
        <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
          Few required fields. Cadence presets keep planning light.
          {assetId ? " Linked to the selected asset." : ""}
        </p>
      </div>

      <label className="block space-y-1">
        <span className="text-sm font-medium text-[var(--mpa-color-text-primary)]">Title</span>
        <Input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="HVAC filter check"
          aria-label="Schedule title"
        />
      </label>

      <label className="block space-y-1">
        <span className="text-sm font-medium text-[var(--mpa-color-text-primary)]">Building / site</span>
        <select
          value={propertyId}
          onChange={(event) => setPropertyId(event.target.value)}
          className="w-full rounded-md border border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-surface)] px-3 py-2 text-sm"
          aria-label="Building or site"
        >
          {properties.length === 0 ? <option value="">No properties available</option> : null}
          {properties.map((property) => (
            <option key={property.id} value={property.id}>
              {property.name}
            </option>
          ))}
        </select>
      </label>

      <label className="block space-y-1">
        <span className="text-sm font-medium text-[var(--mpa-color-text-primary)]">Cadence</span>
        <select
          value={cadence}
          onChange={(event) => setCadence(event.target.value as PmCadence)}
          className="w-full rounded-md border border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-surface)] px-3 py-2 text-sm"
          aria-label="Cadence"
        >
          {PM_CADENCES.map((value) => (
            <option key={value} value={value}>
              {formatPmCadenceLabel(value)}
            </option>
          ))}
        </select>
      </label>

      {cadence === "custom" ? (
        <label className="block space-y-1">
          <span className="text-sm font-medium text-[var(--mpa-color-text-primary)]">
            Interval (days)
          </span>
          <Input
            type="number"
            min={1}
            value={customIntervalDays}
            onChange={(event) => setCustomIntervalDays(event.target.value)}
            aria-label="Custom interval days"
          />
        </label>
      ) : null}

      <label className="block space-y-1">
        <span className="text-sm font-medium text-[var(--mpa-color-text-primary)]">Next due</span>
        <Input
          type="date"
          value={nextDue}
          onChange={(event) => setNextDue(event.target.value)}
          aria-label="Next due date"
        />
      </label>

      {error ? <p className="text-sm text-[var(--mpa-color-status-danger)]">{error}</p> : null}
      <Button type="button" onClick={() => void onSave()} disabled={saving || !propertyId}>
        {saving ? "Saving…" : "Save schedule"}
      </Button>
    </div>
  );
}
