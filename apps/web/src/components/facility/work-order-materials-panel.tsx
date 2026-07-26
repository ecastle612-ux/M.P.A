"use client";

import { useEffect, useState } from "react";
import { Button, Card, Input } from "@mpa/ui";
import type { WorkOrderMaterial } from "../../lib/facility/materials-contracts";

export function WorkOrderMaterialsPanel({
  workOrderId,
  canWrite
}: {
  workOrderId: string;
  canWrite: boolean;
}) {
  const [materials, setMaterials] = useState<WorkOrderMaterial[]>([]);
  const [recommendations, setRecommendations] = useState("");
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);

  async function reload() {
    const response = await fetch(`/api/facility/work-orders/${workOrderId}/materials`);
    const payload = (await response.json().catch(() => null)) as {
      materials?: WorkOrderMaterial[];
      recommendationsNotes?: string | null;
      error?: string;
    } | null;
    if (!response.ok) throw new Error(payload?.error ?? "Could not load materials");
    setMaterials(payload?.materials ?? []);
    setRecommendations(payload?.recommendationsNotes ?? "");
    setLoaded(true);
  }

  useEffect(() => {
    void reload().catch((err: unknown) => {
      setError(err instanceof Error ? err.message : "Could not load materials");
      setLoaded(true);
    });
  }, [workOrderId]);

  async function addMaterial() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/facility/work-orders/${workOrderId}/materials`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          quantity: Number.parseFloat(quantity) || 1
        })
      });
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) throw new Error(payload?.error ?? "Could not add material");
      setName("");
      setQuantity("1");
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add material");
    } finally {
      setBusy(false);
    }
  }

  async function removeMaterial(materialId: string) {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/facility/work-orders/${workOrderId}/materials`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete_material", materialId })
      });
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) throw new Error(payload?.error ?? "Could not remove material");
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove material");
    } finally {
      setBusy(false);
    }
  }

  async function saveRecommendations() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/facility/work-orders/${workOrderId}/materials`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "recommendations",
          recommendationsNotes: recommendations.trim() || null
        })
      });
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) throw new Error(payload?.error ?? "Could not save recommendations");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save recommendations");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="space-y-4">
      <div>
        <h2 className="text-base font-semibold text-[var(--mpa-color-text-primary)]">Materials used</h2>
        <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
          Optional lines — name and quantity. Inventory links can be added later.
        </p>
      </div>

      {!loaded ? (
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">Loading…</p>
      ) : materials.length === 0 ? (
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">No materials recorded yet.</p>
      ) : (
        <ul className="space-y-2 text-sm">
          {materials.map((material) => (
            <li
              key={material.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-[var(--mpa-color-border-default)] px-3 py-2"
            >
              <span>
                {material.name}{" "}
                <span className="text-[var(--mpa-color-text-secondary)]">× {material.quantity}</span>
              </span>
              {canWrite ? (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  disabled={busy}
                  onClick={() => void removeMaterial(material.id)}
                >
                  Remove
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      {canWrite ? (
        <div className="flex flex-wrap items-end gap-2">
          <label className="min-w-[10rem] flex-1 space-y-1">
            <span className="text-xs text-[var(--mpa-color-text-tertiary)]">Material</span>
            <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Filter" />
          </label>
          <label className="w-24 space-y-1">
            <span className="text-xs text-[var(--mpa-color-text-tertiary)]">Qty</span>
            <Input
              type="number"
              min={0.01}
              step="any"
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
            />
          </label>
          <Button type="button" variant="secondary" disabled={busy || !name.trim()} onClick={() => void addMaterial()}>
            Add
          </Button>
        </div>
      ) : null}

      <label className="block space-y-1">
        <span className="text-sm font-medium">Recommendations</span>
        <textarea
          value={recommendations}
          onChange={(event) => setRecommendations(event.target.value)}
          disabled={!canWrite || busy}
          rows={3}
          placeholder="Optional follow-up notes (create follow-up WO manually — never silent)"
          className="w-full rounded-md border border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-surface)] px-3 py-2 text-sm"
        />
      </label>
      {canWrite ? (
        <Button type="button" variant="secondary" disabled={busy} onClick={() => void saveRecommendations()}>
          Save recommendations
        </Button>
      ) : null}

      {error ? <p className="text-sm text-[var(--mpa-color-status-danger)]">{error}</p> : null}
    </Card>
  );
}
