"use client";

import { useState } from "react";
import { Badge, Button, Drawer, EmptyState } from "@mpa/ui";
import { deleteOutboxItem, retryOutboxItem } from "../../lib/pwa/outbox";
import { useOutbox } from "./outbox-provider";

function statusLabel(input: {
  pendingCount: number;
  failedCount: number;
  syncing: boolean;
  pausedForAuth: boolean;
}): string {
  if (input.pausedForAuth) return "Sign in to sync";
  if (input.syncing) return "Syncing…";
  if (input.failedCount > 0) return `Sync failed (${input.failedCount})`;
  if (input.pendingCount > 0) return `Waiting to sync (${input.pendingCount})`;
  return "Synced";
}

export function SyncStatusChip() {
  const outbox = useOutbox();
  const [open, setOpen] = useState(false);
  const visible = outbox.pendingCount > 0 || outbox.failedCount > 0 || outbox.syncing || outbox.pausedForAuth;

  if (!visible) return null;

  const variant =
    outbox.failedCount > 0 || outbox.pausedForAuth
      ? "danger"
      : outbox.syncing
        ? "info"
        : "warning";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mpa-touch-target inline-flex items-center"
        aria-label="Open offline sync status"
      >
        <Badge variant={variant}>
          {statusLabel({
            pendingCount: outbox.pendingCount,
            failedCount: outbox.failedCount,
            syncing: outbox.syncing,
            pausedForAuth: outbox.pausedForAuth
          })}
        </Badge>
      </button>

      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        title="Offline sync"
        footer={
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                void outbox.flush();
              }}
              disabled={outbox.syncing || (outbox.pendingCount === 0 && outbox.failedCount === 0)}
            >
              Retry all
            </Button>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Close
            </Button>
          </div>
        }
      >
        {outbox.items.length === 0 ? (
          <EmptyState
            title="Nothing waiting"
            description="Allowlisted changes made offline will appear here until they sync."
          />
        ) : (
          <ul className="mpa-list-stack space-y-3">
            {outbox.items.map((item) => (
              <li
                key={item.id}
                className="mpa-list-row rounded-[var(--mpa-radius-lg)] border border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-surface-muted)] p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-[var(--mpa-color-text-primary)]">
                      {item.label}
                    </p>
                    <p className="mt-1 text-xs text-[var(--mpa-color-text-muted)]">
                      {item.status}
                      {item.attempts > 0 ? ` · attempts ${item.attempts}` : ""}
                    </p>
                    {item.error ? (
                      <p className="mt-1 text-xs text-[var(--mpa-color-status-danger)]">{item.error}</p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 flex-col gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        void retryOutboxItem(item.id, outbox.organizationId).then(() => outbox.refresh());
                      }}
                    >
                      Retry
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        if (!window.confirm("Discard this queued change?")) return;
                        void deleteOutboxItem(item.id).then(() => outbox.refresh());
                      }}
                    >
                      Discard
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Drawer>
    </>
  );
}
