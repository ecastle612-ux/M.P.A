"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Input } from "@mpa/ui";
import { MediaUpload } from "../media/media-upload";
import { IMAGE_MIME_TYPES, MAX_IMAGE_BYTES } from "../../lib/media/constants";

export function InventoryCreateForm({ organizationId }: { organizationId: string }) {
  const router = useRouter();
  const [photoAssetId, setPhotoAssetId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function onSave() {
    setError(null);
    if (!photoAssetId) {
      setError("Add a photo first.");
      return;
    }
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Name the item before saving.");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/facility/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmed,
          primaryMediaAssetId: photoAssetId
        })
      });
      const payload = (await response.json().catch(() => null)) as
        | { item?: { id: string }; error?: string }
        | null;
      if (!response.ok || !payload?.item?.id) {
        throw new Error(payload?.error ?? "Could not save inventory item.");
      }
      router.push(`/facility/inventory/${payload.item.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save inventory item.");
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--mpa-color-text-primary)]">Add inventory</h1>
        <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
          Take a photo, name the item, save. Everything else can wait.
        </p>
      </div>

      <ol className="space-y-5">
        <li className="space-y-2">
          <p className="text-sm font-medium text-[var(--mpa-color-text-primary)]">1. Photo</p>
          <MediaUpload
            label="Inventory photo"
            value={photoAssetId}
            onChange={setPhotoAssetId}
            intent={{
              kind: "general",
              organizationId,
              entityType: "facility_inventory_item",
              imageEditor: "optional",
              capture: true,
              accept: [...IMAGE_MIME_TYPES],
              maxBytes: MAX_IMAGE_BYTES
            }}
          />
        </li>
        <li className="space-y-2">
          <p className="text-sm font-medium text-[var(--mpa-color-text-primary)]">2. Name</p>
          <Input
            aria-label="Item name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g. Shop vacuum"
            autoComplete="off"
          />
        </li>
        <li className="space-y-2">
          <p className="text-sm font-medium text-[var(--mpa-color-text-primary)]">3. Save</p>
          {error ? <p className="text-sm text-[var(--mpa-color-status-danger)]">{error}</p> : null}
          <Button type="button" onClick={() => void onSave()} disabled={saving}>
            {saving ? "Saving…" : "Save item"}
          </Button>
        </li>
      </ol>
    </div>
  );
}
