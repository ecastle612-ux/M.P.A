"use client";

import { useState } from "react";
import { Button, Card } from "@mpa/ui";
import type { MigrationReviewItemRecord } from "../../lib/migration/contracts";

export function MigrationReviewQueue({
  jobId,
  items,
  canUpdate,
  onResolved
}: {
  jobId: string;
  items: MigrationReviewItemRecord[];
  canUpdate: boolean;
  onResolved: () => void;
}) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const pending = items.filter((item) => item.status === "pending");

  async function resolve(itemId: string, action: "merge" | "keep" | "replace" | "skip", targetId?: string) {
    setLoadingId(itemId);
    await fetch(`/api/migration/jobs/${jobId}/review`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reviewItemId: itemId, action, targetId })
    });
    setLoadingId(null);
    onResolved();
  }

  return (
    <Card className="space-y-4 p-5">
      <div>
        <h2 className="text-sm font-semibold text-[var(--mpa-color-text-primary)]">Review queue</h2>
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">
          {pending.length} item{pending.length === 1 ? "" : "s"} need your attention. Choose how to handle each exception.
        </p>
      </div>

      {pending.length === 0 ? (
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">No pending review items — you&apos;re all caught up.</p>
      ) : (
        <ul className="space-y-3">
          {pending.map((item) => (
            <li key={item.id} className="rounded-lg border border-[var(--mpa-color-border-subtle)] p-4">
              <p className="text-sm font-medium text-[var(--mpa-color-text-primary)]">{item.title}</p>
              <p className="text-xs text-[var(--mpa-color-text-secondary)]">
                {item.itemType.replaceAll("_", " ")} · {item.description}
              </p>
              {canUpdate ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    disabled={loadingId === item.id}
                    onClick={() => void resolve(item.id, "skip")}
                  >
                    Skip
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    disabled={loadingId === item.id}
                    onClick={() => void resolve(item.id, "keep")}
                  >
                    Keep existing
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    disabled={loadingId === item.id}
                    onClick={() => void resolve(item.id, "replace")}
                  >
                    Replace with import
                  </Button>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
