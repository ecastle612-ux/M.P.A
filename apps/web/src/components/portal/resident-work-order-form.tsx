"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Input, Select, Textarea } from "@mpa/ui";
import {
  MAINTENANCE_CATEGORIES,
  MAINTENANCE_PRIORITIES,
  toMaintenanceCategoryLabel,
  toMaintenancePriorityLabel
} from "../../lib/maintenance/contracts";
import { IMAGE_MIME_TYPES, MAX_IMAGE_BYTES } from "../../lib/media/constants";
import { MediaUpload } from "../media/media-upload";

export function ResidentWorkOrderForm({
  organizationId,
  propertyId,
  unitId,
  tenantId
}: {
  organizationId: string;
  propertyId: string;
  unitId: string | null;
  tenantId: string;
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<(typeof MAINTENANCE_CATEGORIES)[number]>("general");
  const [priority, setPriority] = useState<(typeof MAINTENANCE_PRIORITIES)[number]>("medium");
  const [photoAssetId, setPhotoAssetId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (title.trim().length < 3) {
      setError("Please enter a short title for the request.");
      return;
    }
    setSubmitting(true);
    const response = await fetch("/api/maintenance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        propertyId,
        unitId,
        tenantId,
        title: title.trim(),
        description: description.trim() || null,
        category,
        priority,
        status: "submitted",
        photoPlaceholder: photoAssetId ? `media:${photoAssetId}` : null,
        metadata: photoAssetId ? { photoMediaAssetIds: [photoAssetId] } : {}
      })
    });
    setSubmitting(false);
    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { message?: string; error?: string } | null;
      setError(payload?.error ?? payload?.message ?? "Could not submit maintenance request.");
      return;
    }
    const payload = (await response.json()) as { workOrder?: { id: string } };
    router.push(`/portal/tenant/maintenance/${payload.workOrder?.id ?? ""}`);
    router.refresh();
  }

  return (
    <Card>
      <form className="space-y-4" onSubmit={(event) => void onSubmit(event)}>
        <div>
          <h2 className="text-lg font-semibold text-[var(--mpa-color-text-primary)]">Request maintenance</h2>
          <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
            Describe the issue and optionally attach a photo. Your property manager will be notified.
          </p>
        </div>

        <Input
          aria-label="Title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="e.g. Kitchen sink leaking"
          required
        />
        <Textarea
          aria-label="Description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={4}
          placeholder="What is happening, and when did it start?"
        />
        <div className="grid gap-3 md:grid-cols-2">
          <Select
            aria-label="Category"
            value={category}
            onChange={(event) => setCategory(event.target.value as (typeof MAINTENANCE_CATEGORIES)[number])}
          >
            {MAINTENANCE_CATEGORIES.map((value) => (
              <option key={value} value={value}>
                {toMaintenanceCategoryLabel(value)}
              </option>
            ))}
          </Select>
          <Select
            aria-label="Priority"
            value={priority}
            onChange={(event) => setPriority(event.target.value as (typeof MAINTENANCE_PRIORITIES)[number])}
          >
            {MAINTENANCE_PRIORITIES.map((value) => (
              <option key={value} value={value}>
                {toMaintenancePriorityLabel(value)}
              </option>
            ))}
          </Select>
        </div>

        <MediaUpload
          label="Attach photo"
          value={photoAssetId}
          onChange={setPhotoAssetId}
          intent={{
            kind: "maintenance_photo",
            organizationId,
            entityType: "tenant",
            entityId: tenantId,
            imageEditor: "optional",
            capture: true,
            accept: [...IMAGE_MIME_TYPES],
            maxBytes: MAX_IMAGE_BYTES
          }}
        />

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={submitting}>
            {submitting ? "Submitting…" : "Submit request"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            disabled={submitting}
            onClick={() => router.push("/portal/tenant/maintenance")}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}
