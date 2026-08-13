"use client";

import { useMemo, useState, type FormEvent } from "react";
import { Alert, Badge, Button, Input, Select } from "@mpa/ui";
import {
  AdditionalUnitCapacityGate,
  type CapacityGatePayload
} from "../commercial/additional-unit-capacity-gate";

export type PropertyUnitRow = {
  id: string;
  unit_label: string;
  status: string;
  assignedResident?: string | null;
};

type PropertyUnitsPanelProps = {
  propertyId: string;
  units: PropertyUnitRow[];
  onChanged: () => void;
};

function nextSuggestedLabel(units: PropertyUnitRow[]): string {
  const labels = units.map((unit) => unit.unit_label);
  const nums = labels.map((label) => Number(label)).filter((n) => Number.isInteger(n) && n > 0);
  if (nums.length > 0 && nums.length === labels.length) {
    return String(Math.max(...nums) + 1);
  }
  let candidate = labels.length + 1;
  const set = new Set(labels);
  while (set.has(String(candidate))) candidate += 1;
  return String(candidate);
}

export function PropertyUnitsPanel({ propertyId, units, onChanged }: PropertyUnitsPanelProps) {
  const suggestedLabel = useMemo(() => nextSuggestedLabel(units), [units]);
  const [labelOverride, setLabelOverride] = useState<string | null>(null);
  const newLabel = labelOverride ?? suggestedLabel;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editStatus, setEditStatus] = useState<"available" | "offline">("available");
  const [gateOpen, setGateOpen] = useState(false);
  const [gate, setGate] = useState<CapacityGatePayload | null>(null);
  const [intentId, setIntentId] = useState<string | null>(null);
  const [authorizeBusy, setAuthorizeBusy] = useState(false);
  const [authorizeError, setAuthorizeError] = useState<string | null>(null);

  async function createUnit(label: string) {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch(`/api/pm/properties/${propertyId}/units`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ unitLabel: label.trim() })
      });
      const payload = (await response.json()) as {
        unit?: PropertyUnitRow;
        error?: string;
        intentId?: string;
        gate?: CapacityGatePayload;
      };
      if (response.status === 409 && payload.error === "additional_unit_capacity_required") {
        setGate(payload.gate ?? null);
        setIntentId(payload.intentId ?? null);
        setGateOpen(true);
        return;
      }
      if (!response.ok || !payload.unit) {
        throw new Error(payload.error ?? "Unable to add unit.");
      }
      setMessage(`Unit ${payload.unit.unit_label} added.`);
      setLabelOverride(null);
      onChanged();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Unable to add unit.");
    } finally {
      setBusy(false);
    }
  }

  async function onAdd(event: FormEvent) {
    event.preventDefault();
    await createUnit((newLabel.trim() || suggestedLabel).trim());
  }

  async function onAuthorizeCapacity() {
    if (!intentId) {
      setAuthorizeError("Authorization session expired. Try adding the unit again.");
      return;
    }
    setAuthorizeBusy(true);
    setAuthorizeError(null);
    const res = await fetch("/api/commerce/capacity/authorize", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ intentId })
    });
    const payload = (await res.json().catch(() => ({}))) as { error?: string };
    setAuthorizeBusy(false);
    if (!res.ok) {
      setAuthorizeError(payload.error ?? "Authorization failed.");
      return;
    }
    setGateOpen(false);
    setGate(null);
    setIntentId(null);
    await createUnit(newLabel.trim() || suggestedLabel);
  }

  function startEdit(unit: PropertyUnitRow) {
    setEditingId(unit.id);
    setEditLabel(unit.unit_label);
    setEditStatus(unit.status === "offline" ? "offline" : "available");
    setError(null);
    setMessage(null);
  }

  async function onSaveEdit(event: FormEvent) {
    event.preventDefault();
    if (!editingId) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const unit = units.find((row) => row.id === editingId);
      const body: { unitLabel?: string; status?: "available" | "offline" } = {
        unitLabel: editLabel.trim()
      };
      if (unit && unit.status !== "occupied") {
        body.status = editStatus;
      }
      const response = await fetch(`/api/pm/properties/${propertyId}/units/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to update unit.");
      }
      setEditingId(null);
      setMessage("Unit updated.");
      onChanged();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to update unit.");
    } finally {
      setBusy(false);
    }
  }

  async function onArchive(unit: PropertyUnitRow) {
    if (unit.status === "occupied" || unit.assignedResident) {
      setError("Move or end the resident/lease on this unit before archiving it.");
      return;
    }
    const confirmed = window.confirm(
      `Archive Unit ${unit.unit_label}? It becomes offline (not available for residents or leasing). It still counts toward plan capacity.`
    );
    if (!confirmed) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch(`/api/pm/properties/${propertyId}/units/${unit.id}`, {
        method: "DELETE"
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to archive unit.");
      }
      setMessage(`Unit ${unit.unit_label} archived (offline).`);
      onChanged();
    } catch (archiveError) {
      setError(archiveError instanceof Error ? archiveError.message : "Unable to archive unit.");
    } finally {
      setBusy(false);
    }
  }

  const activeUnits = units.filter((unit) => unit.status !== "offline");
  const archivedUnits = units.filter((unit) => unit.status === "offline");

  return (
    <div className="space-y-4" data-testid="property-units-panel">
      <div>
        <h2 className="text-base font-semibold text-[var(--mpa-color-text-primary)]">Units</h2>
        <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
          Property → Units → Residents → Operations. Add or adjust units here before residents and
          leasing.
        </p>
        <p className="mt-1 text-xs text-[var(--mpa-color-text-secondary)]">
          Residents and leases attach to units. Residential maintenance can reference a unit.
          Archived (offline) units are not assignable and still count toward plan capacity.
        </p>
      </div>

      {error ? (
        <Alert variant="danger" title="Unit update failed">
          <p>{error}</p>
        </Alert>
      ) : null}
      {message ? (
        <Alert variant="success" title="Units updated">
          <p>{message}</p>
        </Alert>
      ) : null}

      <form className="flex flex-wrap items-end gap-2" onSubmit={onAdd}>
        <div className="min-w-[10rem] flex-1 space-y-1">
          <label
            htmlFor="new-unit-label"
            className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]"
          >
            Add unit
          </label>
          <Input
            id="new-unit-label"
            value={newLabel}
            onChange={(event) => setLabelOverride(event.target.value)}
            placeholder={suggestedLabel}
            data-testid="add-unit-label"
          />
        </div>
        <Button type="submit" disabled={busy} data-testid="add-unit-submit">
          Add unit
        </Button>
      </form>

      <ul className="space-y-2 text-sm">
        {activeUnits.length === 0 && archivedUnits.length === 0 ? (
          <li className="text-[var(--mpa-color-text-secondary)]">No units yet — add the first unit.</li>
        ) : null}
        {activeUnits.map((unit) => (
          <li
            key={unit.id}
            className="rounded-md border border-[var(--mpa-color-border-default)] px-3 py-2"
            data-testid={`unit-row-${unit.id}`}
          >
            {editingId === unit.id ? (
              <form className="space-y-2" onSubmit={onSaveEdit}>
                <div className="flex flex-wrap gap-2">
                  <Input
                    value={editLabel}
                    onChange={(event) => setEditLabel(event.target.value)}
                    aria-label="Unit label"
                  />
                  {unit.status !== "occupied" ? (
                    <Select
                      value={editStatus}
                      onChange={(event) =>
                        setEditStatus(event.target.value as "available" | "offline")
                      }
                      aria-label="Unit status"
                    >
                      <option value="available">available</option>
                      <option value="offline">offline (archived)</option>
                    </Select>
                  ) : (
                    <Badge variant="neutral">occupied</Badge>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button type="submit" disabled={busy}>
                    Save
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={busy}
                    onClick={() => setEditingId(null)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span>
                  Unit {unit.unit_label}
                  {unit.assignedResident ? (
                    <span className="mt-0.5 block text-xs text-[var(--mpa-color-text-secondary)]">
                      {unit.assignedResident}
                    </span>
                  ) : null}
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="neutral">{unit.status}</Badge>
                  <Button type="button" variant="secondary" disabled={busy} onClick={() => startEdit(unit)}>
                    Edit
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={busy || unit.status === "occupied" || Boolean(unit.assignedResident)}
                    onClick={() => onArchive(unit)}
                    data-testid={`archive-unit-${unit.id}`}
                  >
                    Archive
                  </Button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>

      {archivedUnits.length > 0 ? (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
            Archived (offline)
          </h3>
          <ul className="space-y-2 text-sm">
            {archivedUnits.map((unit) => (
              <li
                key={unit.id}
                className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--mpa-color-border-default)] py-2 last:border-0"
              >
                {editingId === unit.id ? (
                  <form className="w-full space-y-2" onSubmit={onSaveEdit}>
                    <div className="flex flex-wrap gap-2">
                      <Input
                        value={editLabel}
                        onChange={(event) => setEditLabel(event.target.value)}
                        aria-label="Unit label"
                      />
                      <Select
                        value={editStatus}
                        onChange={(event) =>
                          setEditStatus(event.target.value as "available" | "offline")
                        }
                        aria-label="Unit status"
                      >
                        <option value="available">available</option>
                        <option value="offline">offline (archived)</option>
                      </Select>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button type="submit" disabled={busy}>
                        Save
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        disabled={busy}
                        onClick={() => setEditingId(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                ) : (
                  <>
                    <span>Unit {unit.unit_label}</span>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="neutral">offline</Badge>
                      <Button
                        type="button"
                        variant="secondary"
                        disabled={busy}
                        onClick={() => startEdit(unit)}
                      >
                        Restore / edit
                      </Button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <AdditionalUnitCapacityGate
        open={gateOpen}
        gate={gate}
        busy={authorizeBusy}
        error={authorizeError}
        onClose={() => {
          setGateOpen(false);
          setAuthorizeError(null);
        }}
        onAuthorize={() => void onAuthorizeCapacity()}
      />
    </div>
  );
}
