"use client";

import { useEffect, useMemo, useState } from "react";
import { WORK_ORDER_CATEGORIES, type FacilityRequestFieldDef, type FacilityRequestLockedContext } from "@mpa/shared";
import { Alert, Button, Input, Textarea } from "@mpa/ui";

type PublicLockedContext = Pick<
  FacilityRequestLockedContext,
  "propertyLabel" | "facilityAssetLabel" | "floorLabel" | "departmentLabel" | "roomLabel"
>;

type PortalPayload = {
  formName: string;
  organizationName: string;
  instructions: string | null;
  accessPolicy: "contact_required" | "authenticated_only";
  fields: FacilityRequestFieldDef[];
  lockedContext: PublicLockedContext;
  buildings: Array<{ id: string; name: string }>;
  requiresAuth: boolean;
  versionId: string;
};

type AttachmentDraft = {
  kind: "image" | "video";
  file: File;
};

export function PublicRequestPortal({
  token,
  via,
  signedIn
}: {
  token: string;
  via: string | null;
  signedIn: boolean;
}) {
  const [portal, setPortal] = useState<PortalPayload | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<{
    requestNumber: string;
    title: string;
    location: string | null;
    submittedAt: string;
    statusPath: string;
  } | null>(null);
  const [attachments, setAttachments] = useState<AttachmentDraft[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    void fetch(`/api/public/request/${token}`)
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error ?? "This request link is no longer available.");
        setPortal(body as PortalPayload);
        const locked = (body as PortalPayload).lockedContext;
        setValues((current) => ({
          ...current,
          ...(locked.floorLabel ? { floor: locked.floorLabel } : {}),
          ...(locked.departmentLabel ? { department: locked.departmentLabel } : {}),
          ...(locked.roomLabel ? { room: locked.roomLabel } : {}),
          ...(locked.propertyLabel ? { building: locked.propertyLabel } : {}),
          ...(locked.facilityAssetLabel ? { asset: locked.facilityAssetLabel } : {})
        }));
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Could not open this form."));
  }, [token]);

  const lockedKeys = useMemo(() => {
    const keys = new Set<string>();
    if (portal?.lockedContext.floorLabel) keys.add("floor");
    if (portal?.lockedContext.departmentLabel) keys.add("department");
    if (portal?.lockedContext.roomLabel) keys.add("room");
    if (portal?.lockedContext.propertyLabel) keys.add("building");
    if (portal?.lockedContext.facilityAssetLabel) keys.add("asset");
    return keys;
  }, [portal]);

  function setValue(key: string, value: string) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function uploadFile(file: File, kind: "image" | "video") {
    const prepared = await fetch(`/api/public/request/${token}/media`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mimeType: file.type || (kind === "video" ? "video/mp4" : "image/jpeg"),
        fileSize: file.size,
        originalFileName: file.name
      })
    });
    const mediaBody = (await prepared.json()) as { mediaId?: string; uploadUrl?: string; error?: string };
    if (!prepared.ok || !mediaBody.mediaId) {
      throw new Error(mediaBody.error ?? "Could not attach the file.");
    }
    if (mediaBody.uploadUrl && !mediaBody.uploadUrl.startsWith("signed://")) {
      await fetch(mediaBody.uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type || (kind === "video" ? "video/mp4" : "image/jpeg") }
      });
    }
    return {
      kind,
      mimeType: file.type || (kind === "video" ? "video/mp4" : "image/jpeg"),
      fileSize: file.size,
      mediaId: mediaBody.mediaId
    };
  }

  async function submit() {
    if (!portal) return;
    setSubmitting(true);
    setError(null);
    try {
      const uploaded = await Promise.all(attachments.map((item) => uploadFile(item.file, item.kind)));
      const response = await fetch(`/api/public/request/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          via,
          values,
          attachments: uploaded,
          idempotencyKey: crypto.randomUUID(),
          versionId: portal.versionId
        })
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Could not submit.");
      setConfirmation(body);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit.");
    } finally {
      setSubmitting(false);
    }
  }

  if (confirmation) {
    return (
      <div className="space-y-4">
        <h1 className="font-display text-2xl font-semibold">Request submitted</h1>
        <p className="text-lg font-semibold">{confirmation.requestNumber}</p>
        <p>{confirmation.title}</p>
        {confirmation.location ? <p>{confirmation.location}</p> : null}
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">
          {new Date(confirmation.submittedAt).toLocaleString()}
        </p>
        <a className="inline-flex min-h-12 items-center text-[var(--mpa-color-brand-primary)] underline" href={confirmation.statusPath}>
          View Request Status
        </a>
      </div>
    );
  }

  if (!portal) {
    return error ? <Alert variant="danger">{error}</Alert> : <p>Opening request form…</p>;
  }

  if (portal.requiresAuth && !signedIn) {
    return (
      <div className="space-y-3">
        <h1 className="font-display text-2xl font-semibold">{portal.formName}</h1>
        <p>Sign in to submit this request.</p>
        <a
          className="inline-flex min-h-12 items-center underline"
          href={`/login?next=/request/${token}${via ? `?via=${encodeURIComponent(via)}` : ""}`}
        >
          Sign in
        </a>
      </div>
    );
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-brand-primary)]">
        {portal.organizationName}
      </p>
      <h1 className="font-display text-2xl font-semibold">{portal.formName}</h1>
      {portal.instructions ? <p className="text-sm text-[var(--mpa-color-text-secondary)]">{portal.instructions}</p> : null}
      <LockedContextSummary locked={portal.lockedContext} />
      {error ? <Alert variant="danger">{error}</Alert> : null}
      {portal.fields.map((field) => (
        <FieldControl
          key={field.key}
          field={field}
          locked={lockedKeys.has(field.key)}
          value={values[field.key] ?? ""}
          buildings={portal.buildings}
          onChange={(value) => setValue(field.key, value)}
          onFile={(file, kind) =>
            setAttachments((current) => [...current.filter((item) => item.kind !== kind), { kind, file }])
          }
        />
      ))}
      <Button type="submit" className="min-h-12 w-full" disabled={submitting}>
        {submitting ? "Submitting…" : "Submit"}
      </Button>
    </form>
  );
}

function LockedContextSummary({ locked }: { locked: PublicLockedContext }) {
  const rows = [
    locked.facilityAssetLabel ? ["Asset", locked.facilityAssetLabel] : null,
    locked.propertyLabel ? ["Building", locked.propertyLabel] : null,
    locked.floorLabel ? ["Floor", locked.floorLabel] : null,
    locked.departmentLabel ? ["Department", locked.departmentLabel] : null,
    locked.roomLabel ? ["Room", locked.roomLabel] : null
  ].filter((row): row is [string, string] => Boolean(row));
  if (rows.length === 0) return null;
  return (
    <section
      aria-label="Locked request context"
      className="space-y-1 rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-subtle,#F7F7F5)] p-3"
    >
      {rows.map(([label, value]) => (
        <p key={label} className="text-sm">
          <span className="font-semibold">{label}:</span> {value}
        </p>
      ))}
    </section>
  );
}

function FieldControl({
  field,
  locked,
  value,
  buildings,
  onChange,
  onFile
}: {
  field: FacilityRequestFieldDef;
  locked: boolean;
  value: string;
  buildings: Array<{ id: string; name: string }>;
  onChange: (value: string) => void;
  onFile: (file: File, kind: "image" | "video") => void;
}) {
  const label = (
    <span>
      {field.label}
      {field.requirement === "required" ? " *" : ""}
    </span>
  );
  const helper = field.helperText ? (
    <p className="text-xs font-normal text-[var(--mpa-color-text-secondary)]">{field.helperText}</p>
  ) : null;

  if (field.standardKey === "image" || field.standardKey === "video") {
    const kind = field.standardKey === "image" ? "image" : "video";
    return (
      <label className="grid gap-2 text-sm font-medium">
        {label}
        {helper}
        <input
          type="file"
          accept={kind === "image" ? "image/*" : "video/*"}
          capture="environment"
          required={field.requirement === "required"}
          className="min-h-12"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) onFile(file, kind);
          }}
        />
      </label>
    );
  }

  if (field.standardKey === "building" && !locked && buildings.length > 0) {
    return (
      <label className="grid gap-1 text-sm font-medium">
        {label}
        {helper}
        <select
          required={field.requirement === "required"}
          className="min-h-11 rounded-md border border-[var(--mpa-color-border-default)] px-3"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        >
          <option value="">Choose a building</option>
          {buildings.map((building) => (
            <option key={building.id} value={building.name}>
              {building.name}
            </option>
          ))}
        </select>
      </label>
    );
  }

  if (field.standardKey === "category") {
    return (
      <label className="grid gap-1 text-sm font-medium">
        {label}
        {helper}
        <select
          required={field.requirement === "required"}
          className="min-h-11 rounded-md border border-[var(--mpa-color-border-default)] px-3"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        >
          <option value="">Choose a category</option>
          {WORK_ORDER_CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </label>
    );
  }

  if (field.customType === "select") {
    return (
      <label className="grid gap-1 text-sm font-medium">
        {label}
        {helper}
        <select
          required={field.requirement === "required"}
          className="min-h-11 rounded-md border border-[var(--mpa-color-border-default)] px-3"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        >
          <option value="">Choose one</option>
          {(field.options ?? []).map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>
    );
  }

  if (field.customType === "yes_no" || field.standardKey === "safety_concern") {
    return (
      <label className="grid gap-1 text-sm font-medium">
        {label}
        {helper}
        <select
          required={field.requirement === "required"}
          className="min-h-11 rounded-md border border-[var(--mpa-color-border-default)] px-3"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        >
          <option value="">Choose one</option>
          <option value="yes">Yes</option>
          <option value="no">No</option>
        </select>
      </label>
    );
  }

  if (field.standardKey === "issue_description" || field.customType === "long_text") {
    return (
      <label className="grid gap-1 text-sm font-medium">
        {label}
        {helper}
        <Textarea
          required={field.requirement === "required"}
          value={value}
          placeholder={field.placeholder ?? ""}
          onChange={(event) => onChange(event.target.value)}
        />
      </label>
    );
  }

  const inputType = field.customType === "number" ? "number" : field.customType === "date" ? "date" : "text";
  return (
    <label className="grid gap-1 text-sm font-medium">
      {label}
      {helper}
      <Input
        type={inputType}
        required={field.requirement === "required"}
        readOnly={locked}
        aria-readonly={locked}
        value={value}
        placeholder={field.placeholder ?? ""}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}
