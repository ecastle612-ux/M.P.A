"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Badge, Button, Card, Input } from "@mpa/ui";
import {
  announcementStatusLabel,
  type AnnouncementRecord
} from "../../lib/communication/contracts";
import { readApiError } from "../../lib/api/client-error";
import { ConfirmActionDialog } from "../trust/confirm-action-dialog";
import { ApiErrorAlert } from "../trust/validation-alert";
import { OperationalStatus } from "../trust/operational-status";
import { ProviderStatusBanner } from "../trust/provider-status-chip";
import { useUndoableAction } from "../../hooks/use-undoable-action";

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
  const { runWithUndo } = useUndoableAction();
  const [error, setError] = useState<string | null>(null);
  const [submittingAction, setSubmittingAction] = useState<string | null>(null);
  const [scheduleValue, setScheduleValue] = useState(scheduledAt ? scheduledAt.slice(0, 16) : "");
  const [pushRecipientCount, setPushRecipientCount] = useState<number | null>(null);
  const [confirmZeroPush, setConfirmZeroPush] = useState(false);
  const [pendingAction, setPendingAction] = useState<LifecycleAction | null>(null);

  const refreshPushCount = useCallback(async () => {
    const response = await fetch(`/api/announcements/${announcementId}`, { cache: "no-store" });
    if (!response.ok) return;
    const payload = (await response.json()) as { pushRecipientCount?: number };
    setPushRecipientCount(typeof payload.pushRecipientCount === "number" ? payload.pushRecipientCount : 0);
  }, [announcementId]);

  useEffect(() => {
    if (status !== "draft" && status !== "scheduled") return;
    const timer = window.setTimeout(() => {
      void refreshPushCount();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [status, refreshPushCount]);

  const actions = availableActions(status).filter((action) => {
    if (action === "publish_now" || action === "schedule") return canPublish;
    if (action === "archive") return canArchive;
    return canPublish || canArchive;
  });

  async function executeLifecycleAction(action: LifecycleAction) {
    setError(null);

    if (action === "publish_now" && pushRecipientCount === 0 && !confirmZeroPush) {
      setError(
        "No users currently have push notifications enabled. Check the box to publish without push recipients, then try again."
      );
      return;
    }

    if (action === "archive") {
      setSubmittingAction(action);
      try {
        await runWithUndo({
          key: `announcement-lifecycle-archive:${announcementId}`,
          successTitle: "Announcement archived",
          successDescription: "Undo is available for a few seconds.",
          doAction: async () => {
            const response = await fetch(`/api/announcements/${announcementId}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ action: "archive" })
            });
            const payload = await response.json().catch(() => ({}));
            if (!response.ok) {
              throw new Error(readApiError(payload, "Could not archive announcement."));
            }
          },
          undoAction: async () => {
            const response = await fetch(`/api/announcements/${announcementId}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ action: "restore" })
            });
            const payload = await response.json().catch(() => ({}));
            if (!response.ok) {
              throw new Error(readApiError(payload, "Could not restore announcement."));
            }
            router.refresh();
          }
        });
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Lifecycle action failed.");
      } finally {
        setSubmittingAction(null);
      }
      return;
    }

    setSubmittingAction(action);

    const body: Record<string, unknown> = { action };
    if (action === "schedule") {
      if (!scheduleValue) {
        setSubmittingAction(null);
        setError("Select a schedule date and time before scheduling.");
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
      const payload = await response.json().catch(() => ({}));
      setError(readApiError(payload, "Lifecycle action failed. Retry in a moment."));
      return;
    }

    const payload = (await response.json()) as { announcement?: AnnouncementRecord };
    if (action === "publish_now") {
      router.push(`/communications/${announcementId}?from=announcement-published`);
    }
    if (action === "duplicate" && payload.announcement?.id) {
      router.push(`/communications/${payload.announcement.id}`);
    }
    router.refresh();
  }

  function requestLifecycleAction(action: LifecycleAction) {
    if (action === "publish_now" || action === "archive") {
      setPendingAction(action);
      return;
    }
    void executeLifecycleAction(action);
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
        <div className="space-y-2 rounded-[var(--mpa-radius-md)] border border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-muted)] p-3 text-sm">
          <p className="text-[var(--mpa-color-text-primary)]">
            Recipients eligible for push:{" "}
            <span className="font-semibold tabular-nums">
              {pushRecipientCount === null ? "…" : pushRecipientCount}
            </span>
          </p>
          {pushRecipientCount === 0 ? (
            <>
              <p className="text-[var(--mpa-color-feedback-error)]" role="alert">
                No users currently have push notifications enabled.
              </p>
              <label className="flex items-center gap-2 text-[var(--mpa-color-text-secondary)]">
                <input
                  type="checkbox"
                  checked={confirmZeroPush}
                  onChange={(event) => setConfirmZeroPush(event.target.checked)}
                  aria-label="Publish without push recipients"
                />
                Publish without push recipients
              </label>
            </>
          ) : null}
        </div>
      ) : null}

      {status === "draft" || status === "scheduled" ? (
        <Input
          aria-label="Schedule publish at"
          type="datetime-local"
          value={scheduleValue}
          onChange={(event) => setScheduleValue(event.target.value)}
        />
      ) : null}

      <ProviderStatusBanner providerIds={["onesignal", "resend"]} />
      {submittingAction ? (
        <OperationalStatus
          message={
            submittingAction === "publish_now"
              ? "Publishing announcement…"
              : submittingAction === "archive"
                ? "Archiving announcement…"
                : "Saving announcement…"
          }
        />
      ) : null}
      {error ? <ApiErrorAlert message={error} /> : null}

      {actions.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {actions.map((action) => (
            <Button
              key={action}
              variant={action === "archive" ? "danger" : action === "duplicate" ? "secondary" : "primary"}
              size="sm"
              disabled={submittingAction !== null}
              onClick={() => requestLifecycleAction(action)}
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

      <ConfirmActionDialog
        open={pendingAction !== null}
        title={
          pendingAction === "publish_now"
            ? "Publish this announcement?"
            : pendingAction === "archive"
              ? "Archive this announcement?"
              : "Confirm action"
        }
        consequence={
          pendingAction === "publish_now"
            ? "Residents in the selected audience will receive this announcement through existing delivery channels. Publishing cannot be silently undone."
            : "The announcement will leave the active list. You can undo from the toast for a few seconds, or restore later."
        }
        confirmLabel={pendingAction === "publish_now" ? "Publish now" : "Archive"}
        tone={pendingAction === "archive" ? "danger" : "default"}
        busy={submittingAction !== null}
        onCancel={() => setPendingAction(null)}
        onConfirm={async () => {
          const action = pendingAction;
          setPendingAction(null);
          if (action) await executeLifecycleAction(action);
        }}
      />
    </Card>
  );
}
