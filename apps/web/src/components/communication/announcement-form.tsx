"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Input, Select, Textarea } from "@mpa/ui";
import {
  ANNOUNCEMENT_CATEGORIES,
  ANNOUNCEMENT_PRIORITIES,
  ANNOUNCEMENT_TARGETING_SCOPES,
  announcementCategoryLabel,
  announcementPriorityLabel,
  type AnnouncementRecord,
  type AnnouncementTargetingScope
} from "../../lib/communication/contracts";

type AnnouncementFormValues = {
  title: string;
  message: string;
  priority: AnnouncementRecord["priority"];
  category: AnnouncementRecord["category"];
  targetingScope: AnnouncementTargetingScope;
  targetPropertyId: string;
  targetBuilding: string;
  targetFloorPlaceholder: string;
  targetUnitId: string;
  targetLeaseId: string;
  targetTenantId: string;
  attachmentPlaceholder: string;
  requiresAcknowledgment: boolean;
  scheduledAt: string;
  expiresAt: string;
};

const DEFAULT_VALUES: AnnouncementFormValues = {
  title: "",
  message: "",
  priority: "normal",
  category: "general",
  targetingScope: "organization",
  targetPropertyId: "",
  targetBuilding: "",
  targetFloorPlaceholder: "",
  targetUnitId: "",
  targetLeaseId: "",
  targetTenantId: "",
  attachmentPlaceholder: "",
  requiresAcknowledgment: false,
  scheduledAt: "",
  expiresAt: ""
};

function toFormValues(announcement: AnnouncementRecord): AnnouncementFormValues {
  return {
    title: announcement.title,
    message: announcement.message,
    priority: announcement.priority,
    category: announcement.category,
    targetingScope: announcement.targetingScope,
    targetPropertyId: announcement.targetPropertyId ?? "",
    targetBuilding: announcement.targetBuilding ?? "",
    targetFloorPlaceholder: announcement.targetFloorPlaceholder ?? "",
    targetUnitId: announcement.targetUnitId ?? "",
    targetLeaseId: announcement.targetLeaseId ?? "",
    targetTenantId: announcement.targetTenantId ?? "",
    attachmentPlaceholder: announcement.attachmentPlaceholder ?? "",
    requiresAcknowledgment: announcement.requiresAcknowledgment,
    scheduledAt: announcement.scheduledAt ? announcement.scheduledAt.slice(0, 16) : "",
    expiresAt: announcement.expiresAt ? announcement.expiresAt.slice(0, 16) : ""
  };
}

function targetingScopeLabel(scope: AnnouncementTargetingScope): string {
  const labels: Record<AnnouncementTargetingScope, string> = {
    organization: "Entire organization",
    property: "Property",
    building: "Building",
    floor: "Floor",
    unit: "Unit",
    lease: "Lease",
    tenant: "Tenant",
    selected_residents: "Selected residents"
  };
  return labels[scope];
}

export function AnnouncementForm({
  mode,
  announcement,
  properties,
  initialPropertyId
}: {
  mode: "create" | "edit";
  announcement?: AnnouncementRecord | null;
  properties: Array<{ id: string; name: string }>;
  initialPropertyId?: string | null;
}) {
  const router = useRouter();
  const [values, setValues] = useState<AnnouncementFormValues>(() =>
    announcement
      ? toFormValues(announcement)
      : {
          ...DEFAULT_VALUES,
          targetPropertyId:
            (initialPropertyId && properties.some((propertyOption) => propertyOption.id === initialPropertyId)
              ? initialPropertyId
              : null) ??
            properties[0]?.id ??
            ""
        }
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const showPropertyTarget = useMemo(
    () =>
      values.targetingScope === "property" ||
      values.targetingScope === "building" ||
      values.targetingScope === "floor" ||
      values.targetingScope === "unit",
    [values.targetingScope]
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!values.title.trim() || !values.message.trim()) {
      setError("Title and message are required.");
      return;
    }

    if (showPropertyTarget && !values.targetPropertyId) {
      setError("Select a target property for this announcement scope.");
      return;
    }

    const payload = {
      title: values.title.trim(),
      message: values.message.trim(),
      priority: values.priority,
      category: values.category,
      targetingScope: values.targetingScope,
      targetPropertyId: values.targetPropertyId || null,
      targetBuilding: values.targetBuilding || null,
      targetFloorPlaceholder: values.targetFloorPlaceholder || null,
      targetUnitId: values.targetUnitId || null,
      targetLeaseId: values.targetLeaseId || null,
      targetTenantId: values.targetTenantId || null,
      attachmentPlaceholder: values.attachmentPlaceholder || null,
      requiresAcknowledgment: values.requiresAcknowledgment,
      scheduledAt: values.scheduledAt ? new Date(values.scheduledAt).toISOString() : null,
      expiresAt: values.expiresAt ? new Date(values.expiresAt).toISOString() : null
    };

    setSubmitting(true);
    const response = await fetch(
      mode === "create" ? "/api/announcements" : `/api/announcements/${announcement?.id ?? ""}`,
      {
        method: mode === "create" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mode === "create" ? payload : { action: "update", updates: payload })
      }
    );
    setSubmitting(false);

    if (!response.ok) {
      const failure = (await response.json()) as { error?: string };
      setError(failure.error ?? "Unable to save announcement.");
      return;
    }

    const success = (await response.json()) as { announcement?: AnnouncementRecord };
    const savedId = success.announcement?.id ?? announcement?.id;
    if (savedId) {
      router.push(`/communications/${savedId}?from=announcement-created`);
      router.refresh();
      return;
    }
    router.push("/communications");
    router.refresh();
  }

  return (
    <Card>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <h1 className="font-display text-2xl font-semibold text-[var(--mpa-color-text-primary)]">
            {mode === "create" ? "Create Announcement" : "Edit Announcement"}
          </h1>
          <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
            Draft resident-facing announcements, set targeting, and prepare for publish or schedule.
          </p>
        </div>

        {mode === "create" ? (
          <p className="rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface-muted)] px-3 py-2 text-xs text-[var(--mpa-color-text-secondary)]">
            New announcements start in draft status. Use lifecycle actions on the detail page to publish or schedule.
          </p>
        ) : null}

        <Input
          aria-label="Announcement title"
          placeholder="Announcement title"
          value={values.title}
          onChange={(event) => setValues((current) => ({ ...current, title: event.target.value }))}
          required
        />

        <Textarea
          aria-label="Announcement message"
          placeholder="Message body"
          rows={6}
          value={values.message}
          onChange={(event) => setValues((current) => ({ ...current, message: event.target.value }))}
          required
        />

        <div className="grid gap-3 md:grid-cols-2">
          <Select
            aria-label="Priority"
            value={values.priority}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                priority: event.target.value as AnnouncementRecord["priority"]
              }))
            }
          >
            {ANNOUNCEMENT_PRIORITIES.map((priority) => (
              <option key={priority} value={priority}>
                {announcementPriorityLabel(priority)}
              </option>
            ))}
          </Select>
          <Select
            aria-label="Category"
            value={values.category}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                category: event.target.value as AnnouncementRecord["category"]
              }))
            }
          >
            {ANNOUNCEMENT_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {announcementCategoryLabel(category)}
              </option>
            ))}
          </Select>
        </div>

        <Select
          aria-label="Targeting scope"
          value={values.targetingScope}
          onChange={(event) =>
            setValues((current) => ({
              ...current,
              targetingScope: event.target.value as AnnouncementTargetingScope
            }))
          }
        >
          {ANNOUNCEMENT_TARGETING_SCOPES.map((scope) => (
            <option key={scope} value={scope}>
              {targetingScopeLabel(scope)}
            </option>
          ))}
        </Select>

        {showPropertyTarget ? (
          <Select
            aria-label="Target property"
            value={values.targetPropertyId}
            onChange={(event) => setValues((current) => ({ ...current, targetPropertyId: event.target.value }))}
            required
          >
            <option value="">Select property</option>
            {properties.map((propertyOption) => (
              <option key={propertyOption.id} value={propertyOption.id}>
                {propertyOption.name}
              </option>
            ))}
          </Select>
        ) : null}

        {values.targetingScope === "building" ? (
          <Input
            aria-label="Target building"
            placeholder="Building name"
            value={values.targetBuilding}
            onChange={(event) => setValues((current) => ({ ...current, targetBuilding: event.target.value }))}
          />
        ) : null}

        {values.targetingScope === "floor" ? (
          <Input
            aria-label="Target floor placeholder"
            placeholder="Floor placeholder"
            value={values.targetFloorPlaceholder}
            onChange={(event) =>
              setValues((current) => ({ ...current, targetFloorPlaceholder: event.target.value }))
            }
          />
        ) : null}

        {values.targetingScope === "unit" ? (
          <Input
            aria-label="Target unit id"
            placeholder="Target unit ID"
            value={values.targetUnitId}
            onChange={(event) => setValues((current) => ({ ...current, targetUnitId: event.target.value }))}
          />
        ) : null}

        {values.targetingScope === "lease" ? (
          <Input
            aria-label="Target lease id"
            placeholder="Target lease ID"
            value={values.targetLeaseId}
            onChange={(event) => setValues((current) => ({ ...current, targetLeaseId: event.target.value }))}
          />
        ) : null}

        {values.targetingScope === "tenant" ? (
          <Input
            aria-label="Target tenant id"
            placeholder="Target tenant ID"
            value={values.targetTenantId}
            onChange={(event) => setValues((current) => ({ ...current, targetTenantId: event.target.value }))}
          />
        ) : null}

        <Input
          aria-label="Attachment placeholder"
          placeholder="Attachment placeholder"
          value={values.attachmentPlaceholder}
          onChange={(event) => setValues((current) => ({ ...current, attachmentPlaceholder: event.target.value }))}
        />

        <div className="grid gap-3 md:grid-cols-2">
          <Input
            aria-label="Scheduled at"
            type="datetime-local"
            value={values.scheduledAt}
            onChange={(event) => setValues((current) => ({ ...current, scheduledAt: event.target.value }))}
          />
          <Input
            aria-label="Expires at"
            type="datetime-local"
            value={values.expiresAt}
            onChange={(event) => setValues((current) => ({ ...current, expiresAt: event.target.value }))}
          />
        </div>

        <label className="flex items-center gap-2 text-sm text-[var(--mpa-color-text-secondary)]">
          <input
            type="checkbox"
            aria-label="Requires acknowledgment"
            checked={values.requiresAcknowledgment}
            onChange={(event) =>
              setValues((current) => ({ ...current, requiresAcknowledgment: event.target.checked }))
            }
          />
          Requires resident acknowledgment
        </label>

        {error ? (
          <p className="text-sm text-[var(--mpa-color-feedback-error)]" role="alert" aria-live="assertive">
            {error}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={submitting}>
            {submitting ? "Saving..." : mode === "create" ? "Create Announcement" : "Save Announcement"}
          </Button>
          <Button type="button" variant="secondary" onClick={() => router.push("/communications")}>
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}
