"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge, Button, Card, Input } from "@mpa/ui";
import {
  announcementStatusLabel,
  type AnnouncementRecord
} from "../../lib/communication/contracts";

type LifecycleAction = "publish_now" | "schedule" | "duplicate" | "archive";

function availableActions(status: AnnouncementRecord["status"]): LifecycleAction[] {
  const actions: LifecycleAction[] = [];
  if (status === "draft") {
    actions.push("publish_now", "schedule", "duplicate", "archive");
  }
  if (status === "scheduled") {
    actions.push("publish_now", "duplicate", "archive");
  }
  if (status === "published") {
    actions.push("duplicate", "archive");
  }
  if (status === "archived") {
    actions.push("duplicate");
  }
  return actions;
}

function getActionLabel(action: LifecycleAction): string {
  const labels: Record<LifecycleAction, string> = {
    publish_now: "Publish Now",
    schedule: "Schedule",
    duplicate: "Duplicate",
    archive: "Archive"
  };
  return labels[action];
}

export function AnnouncementLifecyclePanel({
  announcementId,
  status,
  scheduledAt,
  canPublish,
  canArchive
}: {
  announcementId: string;
  status: AnnouncementRecord["status"];
  scheduledAt: string | null;
  canPublish: boolean;
  canArchive: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submittingAction, setSubmittingAction] = useState<string | null>(null);
  const [scheduleValue, setScheduleValue] = useState(scheduledAt ? scheduledAt.slice(0, 16) : "");

  const actions = availableActions(status).filter((action) => {
    if (action === "publish_now" || action === "schedule") return canPublish;
    if (action === "archive") return canArchive;
    return canPublish || canArchive;
  });

  async function runLifecycleAction(action: LifecycleAction) {
    setError(null);
    setSubmittingAction(action);

    const body: Record<string, unknown> = { action };
    if (action === "schedule") {
      if (!scheduleValue) {
        setSubmittingAction(null);
        setError("Select a schedule date and time.");
        return;
      }
      body["scheduledAt"] = new Date(scheduleValue).toISOString();
    }

    const response = await fetch(`/api/announcements/${announcementId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    setSubmittingAction(null);

    if (!response.ok) {
      const payload = (await response.json()) as { error?: string };
      setError(payload.error ?? "Lifecycle action failed.");
      return;
    }

    const payload = (await response.json()) as { announcement?: AnnouncementRecord };
    if (action === "duplicate" && payload.announcement?.id) {
      router.push(`/communications/${payload.announcement.id}`);
    }
    router.refresh();
  }

  return (
    <Card className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-[var(--mpa-color-text-primary)]">Lifecycle</h2>
          <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
            Publish, schedule, duplicate, or archive this announcement.
          </p>
        </div>
        <Badge
          variant={
            status === "published" ? "success" : status === "archived" ? "warning" : status === "scheduled" ? "info" : "info"
          }
        >
          {announcementStatusLabel(status)}
        </Badge>
      </div>

      {status === "draft" || status === "scheduled" ? (
        <Input
          aria-label="Schedule publish at"
          type="datetime-local"
          value={scheduleValue}
          onChange={(event) => setScheduleValue(event.target.value)}
        />
      ) : null}

      {actions.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {actions.map((action) => (
            <Button
              key={action}
              variant={action === "archive" ? "danger" : action === "duplicate" ? "secondary" : "primary"}
              size="sm"
              disabled={submittingAction !== null}
              onClick={() => runLifecycleAction(action)}
            >
              {submittingAction === action ? "Saving..." : getActionLabel(action)}
            </Button>
          ))}
        </div>
      ) : (
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">No lifecycle actions available for this status.</p>
      )}

      {!canPublish && !canArchive ? (
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">
          You do not have permission to run lifecycle actions.
        </p>
      ) : null}

      {error ? <p className="text-sm text-[var(--mpa-color-feedback-error)]">{error}</p> : null}
    </Card>
  );
}
