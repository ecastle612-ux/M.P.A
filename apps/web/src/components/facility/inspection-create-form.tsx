"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Input } from "@mpa/ui";
import type { FacilityInspectionTemplate } from "../../lib/facility/inspection-contracts";

type PropertyOption = { id: string; name: string };

export function InspectionCreateForm({
  properties,
  templates,
  defaultPropertyId
}: {
  properties: PropertyOption[];
  templates: FacilityInspectionTemplate[];
  defaultPropertyId?: string;
}) {
  const router = useRouter();
  const [title, setTitle] = useState("Building inspection");
  const [propertyId, setPropertyId] = useState(defaultPropertyId ?? properties[0]?.id ?? "");
  const [templateId, setTemplateId] = useState("");
  const [dueOn, setDueOn] = useState("");
  const [notes, setNotes] = useState("");
  const [extraLabels, setExtraLabels] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function onSave() {
    setError(null);
    if (!title.trim() || !propertyId) {
      setError("Title and building/site are required.");
      return;
    }
    setSaving(true);
    try {
      const itemLabels = extraLabels
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);
      const response = await fetch("/api/facility/inspections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          propertyId,
          ...(templateId ? { templateId } : {}),
          ...(dueOn ? { dueOn } : {}),
          ...(notes.trim() ? { notes: notes.trim() } : {}),
          ...(itemLabels.length > 0 ? { itemLabels } : {})
        })
      });
      const payload = (await response.json().catch(() => null)) as
        | { run?: { id: string }; error?: string }
        | null;
      if (!response.ok || !payload?.run?.id) {
        throw new Error(payload?.error ?? "Could not create inspection");
      }
      router.push(`/facility/inspections/${payload.run.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create inspection");
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--mpa-color-text-primary)]">
          Start inspection
        </h1>
        <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
          Ad hoc walks are fine — templates are optional.
        </p>
      </div>

      <label className="block space-y-1">
        <span className="text-sm font-medium text-[var(--mpa-color-text-primary)]">Title</span>
        <Input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Quarterly building walk"
          aria-label="Inspection title"
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
        <span className="text-sm font-medium text-[var(--mpa-color-text-primary)]">
          Template (optional)
        </span>
        <select
          value={templateId}
          onChange={(event) => setTemplateId(event.target.value)}
          className="w-full rounded-md border border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-surface)] px-3 py-2 text-sm"
          aria-label="Inspection template"
        >
          <option value="">Ad hoc (no template)</option>
          {templates.map((template) => (
            <option key={template.id} value={template.id}>
              {template.name}
            </option>
          ))}
        </select>
      </label>

      <label className="block space-y-1">
        <span className="text-sm font-medium text-[var(--mpa-color-text-primary)]">Due (optional)</span>
        <Input
          type="date"
          value={dueOn}
          onChange={(event) => setDueOn(event.target.value)}
          aria-label="Due date"
        />
      </label>

      <label className="block space-y-1">
        <span className="text-sm font-medium text-[var(--mpa-color-text-primary)]">
          Extra checklist lines (optional)
        </span>
        <textarea
          value={extraLabels}
          onChange={(event) => setExtraLabels(event.target.value)}
          rows={4}
          placeholder={"Roof drains clear\nExit lights working"}
          className="w-full rounded-md border border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-surface)] px-3 py-2 text-sm"
          aria-label="Extra checklist lines"
        />
      </label>

      <label className="block space-y-1">
        <span className="text-sm font-medium text-[var(--mpa-color-text-primary)]">Notes</span>
        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          rows={3}
          className="w-full rounded-md border border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-surface)] px-3 py-2 text-sm"
          aria-label="Notes"
        />
      </label>

      {error ? <p className="text-sm text-[var(--mpa-color-status-danger)]">{error}</p> : null}
      <Button type="button" onClick={() => void onSave()} disabled={saving || !propertyId}>
        {saving ? "Creating…" : "Create inspection"}
      </Button>
    </div>
  );
}
