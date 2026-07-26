"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge, Button, Card, Input } from "@mpa/ui";
import type {
  FacilityInspectionItem,
  FacilityInspectionRunDetail,
  InspectionItemResult
} from "../../lib/facility/inspection-contracts";
import {
  formatInspectionResultLabel,
  formatInspectionStatusLabel
} from "../../lib/facility/inspection-contracts";

export function InspectionRunPanel({
  initialRun,
  canWrite
}: {
  initialRun: FacilityInspectionRunDetail;
  canWrite: boolean;
}) {
  const router = useRouter();
  const [run, setRun] = useState(initialRun);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [createFollowUp, setCreateFollowUp] = useState(false);
  const closed = run.status === "completed" || run.status === "canceled";

  async function patch(body: Record<string, unknown>) {
    setError(null);
    setBusy(true);
    try {
      const response = await fetch(`/api/facility/inspections/${run.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const payload = (await response.json().catch(() => null)) as Record<string, unknown> | null;
      if (!response.ok) {
        throw new Error(
          typeof payload?.["error"] === "string" ? payload["error"] : "Update failed"
        );
      }
      if (payload?.["run"] && typeof payload["run"] === "object") {
        setRun(payload["run"] as FacilityInspectionRunDetail);
      } else if (payload?.["item"] && typeof payload["item"] === "object") {
        const item = payload["item"] as FacilityInspectionItem;
        setRun((current) => ({
          ...current,
          items: current.items.some((row) => row.id === item.id)
            ? current.items.map((row) => (row.id === item.id ? item : row))
            : [...current.items, item],
          itemCount: current.items.some((row) => row.id === item.id)
            ? current.itemCount
            : current.itemCount + 1,
          failCount:
            (current.items.some((row) => row.id === item.id)
              ? current.items.map((row) => (row.id === item.id ? item : row))
              : [...current.items, item]
            ).filter((row) => row.result === "fail").length
        }));
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setBusy(false);
    }
  }

  async function setResult(itemId: string, result: InspectionItemResult) {
    await patch({ action: "update_item", itemId, result });
  }

  async function saveNotes(itemId: string, notes: string) {
    await patch({ action: "update_item", itemId, notes });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--mpa-color-text-primary)]">{run.title}</h1>
          <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
            {run.propertyName ?? "Property"}
            {run.unitNumber ? ` · Unit ${run.unitNumber}` : ""}
          </p>
        </div>
        <Badge>{formatInspectionStatusLabel(run.status)}</Badge>
      </div>

      {canWrite && !closed ? (
        <div className="flex flex-wrap gap-2">
          {run.status === "draft" ? (
            <Button type="button" variant="secondary" disabled={busy} onClick={() => void patch({ action: "start" })}>
              Start
            </Button>
          ) : null}
          <Button
            type="button"
            disabled={busy}
            onClick={() =>
              void patch({
                action: "complete",
                createFollowUpWorkOrder: createFollowUp
              })
            }
          >
            Complete inspection
          </Button>
        </div>
      ) : null}

      {canWrite && !closed && run.failCount > 0 ? (
        <label className="flex items-start gap-2 text-sm text-[var(--mpa-color-text-secondary)]">
          <input
            type="checkbox"
            checked={createFollowUp}
            onChange={(event) => setCreateFollowUp(event.target.checked)}
            className="mt-1"
          />
          <span>
            Create follow-up work order from failed items (explicit confirm — never automatic).
          </span>
        </label>
      ) : null}

      {run.status === "completed" ? (
        <Card className="space-y-2">
          <p className="text-sm text-[var(--mpa-color-text-secondary)]">
            Inspection completed. A Facility Record was written for permanent memory.
          </p>
          <Link
            href="/facility"
            className="text-sm font-medium text-[var(--mpa-color-brand-primary)]"
          >
            Back to Facility hub
          </Link>
        </Card>
      ) : null}

      <div className="space-y-3">
        {run.items.map((item) => (
          <Card key={item.id} className="space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <p className="font-medium text-[var(--mpa-color-text-primary)]">{item.label}</p>
              {item.result ? <Badge>{formatInspectionResultLabel(item.result)}</Badge> : null}
            </div>
            {canWrite && !closed ? (
              <div className="flex flex-wrap gap-2">
                {(["pass", "fail", "na"] as const).map((result) => (
                  <Button
                    key={result}
                    type="button"
                    size="sm"
                    variant={item.result === result ? "primary" : "secondary"}
                    disabled={busy}
                    onClick={() => void setResult(item.id, result)}
                  >
                    {formatInspectionResultLabel(result)}
                  </Button>
                ))}
              </div>
            ) : null}
            <label className="block space-y-1">
              <span className="text-xs text-[var(--mpa-color-text-tertiary)]">Notes</span>
              <Input
                defaultValue={item.notes ?? ""}
                disabled={!canWrite || closed || busy}
                onBlur={(event) => {
                  const next = event.target.value.trim();
                  if (next !== (item.notes ?? "")) void saveNotes(item.id, next);
                }}
                aria-label={`Notes for ${item.label}`}
              />
            </label>
          </Card>
        ))}
      </div>

      {canWrite && !closed ? (
        <Card className="flex flex-wrap items-end gap-2">
          <label className="min-w-[12rem] flex-1 space-y-1">
            <span className="text-sm font-medium">Add checklist item</span>
            <Input
              value={newLabel}
              onChange={(event) => setNewLabel(event.target.value)}
              placeholder="New finding line"
              aria-label="New checklist item"
            />
          </label>
          <Button
            type="button"
            variant="secondary"
            disabled={busy || !newLabel.trim()}
            onClick={() => {
              const label = newLabel.trim();
              setNewLabel("");
              void patch({ action: "add_item", label });
            }}
          >
            Add
          </Button>
        </Card>
      ) : null}

      {error ? <p className="text-sm text-[var(--mpa-color-status-danger)]">{error}</p> : null}
    </div>
  );
}
