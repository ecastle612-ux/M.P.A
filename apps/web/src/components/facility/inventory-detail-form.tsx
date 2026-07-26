"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Input, Textarea } from "@mpa/ui";
import { MediaUpload } from "../media/media-upload";
import { IMAGE_MIME_TYPES, MAX_IMAGE_BYTES } from "../../lib/media/constants";
import {
  FACILITY_INVENTORY_STATUSES,
  formatInventoryStatusLabel,
  type FacilityInventoryListItem,
  type FacilityInventoryStatus
} from "../../lib/facility/inventory-contracts";

type PropertyOption = { id: string; name: string };

export function InventoryDetailForm({
  item,
  properties,
  canWrite
}: {
  item: FacilityInventoryListItem;
  properties: PropertyOption[];
  canWrite: boolean;
}) {
  const router = useRouter();
  const [name, setName] = useState(item.name);
  const [status, setStatus] = useState<FacilityInventoryStatus>(item.status);
  const [category, setCategory] = useState(item.category ?? "");
  const [propertyId, setPropertyId] = useState(item.propertyId ?? "");
  const [serialNumber, setSerialNumber] = useState(item.serialNumber ?? "");
  const [purchaseDate, setPurchaseDate] = useState(item.purchaseDate ?? "");
  const [warrantyEndsOn, setWarrantyEndsOn] = useState(item.warrantyEndsOn ?? "");
  const [warrantyNotes, setWarrantyNotes] = useState(item.warrantyNotes ?? "");
  const [notes, setNotes] = useState(item.notes ?? "");
  const [photoAssetId, setPhotoAssetId] = useState<string | null>(item.primaryMediaAssetId);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function onSave() {
    if (!canWrite) return;
    setError(null);
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Name is required.");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/facility/inventory/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmed,
          status,
          category: category.trim() || null,
          propertyId: propertyId || null,
          serialNumber: serialNumber.trim() || null,
          purchaseDate: purchaseDate || null,
          warrantyEndsOn: warrantyEndsOn || null,
          warrantyNotes: warrantyNotes.trim() || null,
          notes: notes.trim() || null,
          primaryMediaAssetId: photoAssetId
        })
      });
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        throw new Error(payload?.error ?? "Could not update item.");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update item.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--mpa-color-text-primary)]">{item.name}</h1>
        <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
          {formatInventoryStatusLabel(item.status)}
          {item.propertyName ? ` · ${item.propertyName}` : ""}
        </p>
      </div>

      <MediaUpload
        label="Inventory photo"
        value={photoAssetId}
        onChange={setPhotoAssetId}
        disabled={!canWrite}
        intent={{
          kind: "general",
          organizationId: item.organizationId,
          entityType: "facility_inventory_item",
          entityId: item.id,
          imageEditor: "optional",
          capture: true,
          accept: [...IMAGE_MIME_TYPES],
          maxBytes: MAX_IMAGE_BYTES
        }}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1 md:col-span-2">
          <span className="text-sm font-medium text-[var(--mpa-color-text-primary)]">Name</span>
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            disabled={!canWrite}
            aria-label="Item name"
          />
        </label>
        <label className="space-y-1">
          <span className="text-sm font-medium text-[var(--mpa-color-text-primary)]">Status</span>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as FacilityInventoryStatus)}
            disabled={!canWrite}
            className="w-full rounded-md border border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-surface)] px-3 py-2 text-sm"
            aria-label="Status"
          >
            {FACILITY_INVENTORY_STATUSES.map((value) => (
              <option key={value} value={value}>
                {formatInventoryStatusLabel(value)}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1">
          <span className="text-sm font-medium text-[var(--mpa-color-text-primary)]">Category</span>
          <Input
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            disabled={!canWrite}
            aria-label="Category"
          />
        </label>
        <label className="space-y-1 md:col-span-2">
          <span className="text-sm font-medium text-[var(--mpa-color-text-primary)]">
            Building / site
          </span>
          <select
            value={propertyId}
            onChange={(event) => setPropertyId(event.target.value)}
            disabled={!canWrite}
            className="w-full rounded-md border border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-surface)] px-3 py-2 text-sm"
            aria-label="Building or site"
          >
            <option value="">Unassigned</option>
            {properties.map((property) => (
              <option key={property.id} value={property.id}>
                {property.name}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1">
          <span className="text-sm font-medium text-[var(--mpa-color-text-primary)]">Serial</span>
          <Input
            value={serialNumber}
            onChange={(event) => setSerialNumber(event.target.value)}
            disabled={!canWrite}
            aria-label="Serial number"
          />
        </label>
        <label className="space-y-1">
          <span className="text-sm font-medium text-[var(--mpa-color-text-primary)]">
            Purchase date
          </span>
          <Input
            type="date"
            value={purchaseDate}
            onChange={(event) => setPurchaseDate(event.target.value)}
            disabled={!canWrite}
            aria-label="Purchase date"
          />
        </label>
        <label className="space-y-1">
          <span className="text-sm font-medium text-[var(--mpa-color-text-primary)]">
            Warranty ends
          </span>
          <Input
            type="date"
            value={warrantyEndsOn}
            onChange={(event) => setWarrantyEndsOn(event.target.value)}
            disabled={!canWrite}
            aria-label="Warranty end date"
          />
        </label>
        <label className="space-y-1 md:col-span-2">
          <span className="text-sm font-medium text-[var(--mpa-color-text-primary)]">
            Warranty notes
          </span>
          <Input
            value={warrantyNotes}
            onChange={(event) => setWarrantyNotes(event.target.value)}
            disabled={!canWrite}
            aria-label="Warranty notes"
          />
        </label>
        <label className="space-y-1 md:col-span-2">
          <span className="text-sm font-medium text-[var(--mpa-color-text-primary)]">Notes</span>
          <Textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            disabled={!canWrite}
            rows={3}
            aria-label="Notes"
          />
        </label>
      </div>

      {error ? <p className="text-sm text-[var(--mpa-color-status-danger)]">{error}</p> : null}
      {canWrite ? (
        <Button type="button" onClick={() => void onSave()} disabled={saving}>
          {saving ? "Saving…" : "Save changes"}
        </Button>
      ) : null}
    </div>
  );
}
