"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Input } from "@mpa/ui";
import type { FacilityAssetListItem } from "../../lib/facility/asset-contracts";

export function AssetV1Editor({ asset }: { asset: FacilityAssetListItem }) {
  const router = useRouter();
  const [warrantyStartsOn, setWarrantyStartsOn] = useState(asset.warrantyStartsOn ?? "");
  const [warrantyEndsOn, setWarrantyEndsOn] = useState(asset.warrantyEndsOn ?? "");
  const [warrantyNotes, setWarrantyNotes] = useState(
    asset.warrantyNotes ?? asset.warrantyPlaceholder ?? ""
  );
  const [installDate, setInstallDate] = useState(asset.installDate ?? "");
  const [expectedLifeYears, setExpectedLifeYears] = useState(
    asset.expectedLifeYears != null ? String(asset.expectedLifeYears) : ""
  );
  const [replacementPlanned, setReplacementPlanned] = useState(asset.replacementPlanned);
  const [replacementTargetYear, setReplacementTargetYear] = useState(
    asset.replacementTargetYear != null ? String(asset.replacementTargetYear) : ""
  );
  const [replacementNotes, setReplacementNotes] = useState(asset.replacementNotes ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function onSave() {
    setError(null);
    setSaving(true);
    try {
      const response = await fetch(`/api/facility/assets/${asset.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          warrantyStartsOn: warrantyStartsOn || null,
          warrantyEndsOn: warrantyEndsOn || null,
          warrantyNotes: warrantyNotes.trim() || null,
          installDate: installDate || null,
          expectedLifeYears: expectedLifeYears.trim()
            ? Number.parseInt(expectedLifeYears, 10)
            : null,
          replacementPlanned,
          replacementTargetYear: replacementTargetYear.trim()
            ? Number.parseInt(replacementTargetYear, 10)
            : null,
          replacementNotes: replacementNotes.trim() || null
        })
      });
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) throw new Error(payload?.error ?? "Could not update asset");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update asset");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      <h2 className="text-base font-semibold">Warranty & life planning</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block space-y-1">
          <span className="text-xs text-[var(--mpa-color-text-tertiary)]">Warranty start</span>
          <Input
            type="date"
            value={warrantyStartsOn}
            onChange={(event) => setWarrantyStartsOn(event.target.value)}
          />
        </label>
        <label className="block space-y-1">
          <span className="text-xs text-[var(--mpa-color-text-tertiary)]">Warranty end</span>
          <Input
            type="date"
            value={warrantyEndsOn}
            onChange={(event) => setWarrantyEndsOn(event.target.value)}
          />
        </label>
        <label className="block space-y-1 sm:col-span-2">
          <span className="text-xs text-[var(--mpa-color-text-tertiary)]">Warranty notes</span>
          <Input
            value={warrantyNotes}
            onChange={(event) => setWarrantyNotes(event.target.value)}
          />
        </label>
        <label className="block space-y-1">
          <span className="text-xs text-[var(--mpa-color-text-tertiary)]">Install date</span>
          <Input
            type="date"
            value={installDate}
            onChange={(event) => setInstallDate(event.target.value)}
          />
        </label>
        <label className="block space-y-1">
          <span className="text-xs text-[var(--mpa-color-text-tertiary)]">Expected life (years)</span>
          <Input
            type="number"
            min={0}
            value={expectedLifeYears}
            onChange={(event) => setExpectedLifeYears(event.target.value)}
          />
        </label>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={replacementPlanned}
          onChange={(event) => setReplacementPlanned(event.target.checked)}
        />
        Replacement planned
      </label>
      {replacementPlanned ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block space-y-1">
            <span className="text-xs text-[var(--mpa-color-text-tertiary)]">Target year</span>
            <Input
              type="number"
              min={2000}
              max={2100}
              value={replacementTargetYear}
              onChange={(event) => setReplacementTargetYear(event.target.value)}
            />
          </label>
          <label className="block space-y-1 sm:col-span-2">
            <span className="text-xs text-[var(--mpa-color-text-tertiary)]">Replacement notes</span>
            <Input
              value={replacementNotes}
              onChange={(event) => setReplacementNotes(event.target.value)}
            />
          </label>
        </div>
      ) : null}

      {error ? <p className="text-sm text-[var(--mpa-color-status-danger)]">{error}</p> : null}
      <Button type="button" onClick={() => void onSave()} disabled={saving}>
        {saving ? "Saving…" : "Save asset details"}
      </Button>
    </div>
  );
}
