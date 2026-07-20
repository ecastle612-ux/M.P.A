"use client";

import { useState } from "react";
import { Button, Card, useToast } from "@mpa/ui";
import type { MigrationReviewItemRecord } from "../../lib/migration/contracts";
import { readApiError } from "../../lib/api/client-error";

function humanItemType(itemType: string): string {
  const labels: Record<string, string> = {
    unknown_property: "Unknown property",
    duplicate_property: "Duplicate property",
    duplicate_unit: "Duplicate unit",
    duplicate_tenant: "Duplicate resident",
    duplicate_lease: "Duplicate lease",
    duplicate_vendor: "Duplicate vendor",
    unmapped_field: "Unmapped field",
    validation_error: "Needs a correction",
    ambiguous_match: "Needs a match"
  };
  return labels[itemType] ?? itemType.replaceAll("_", " ");
}

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
  const { notify } = useToast();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const pending = items.filter((item) => item.status === "pending");

  async function resolve(itemId: string, action: "merge" | "keep" | "replace" | "skip", targetId?: string) {
    setLoadingId(itemId);
    try {
      const response = await fetch(`/api/migration/jobs/${jobId}/review`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewItemId: itemId, action, targetId })
      });
      const json = await response.json();
      if (!response.ok) throw new Error(readApiError(json, "Could not update this exception"));
      notify({
        title: action === "skip" ? "Exception skipped" : "Exception resolved",
        description: "Your migration checklist will update automatically.",
        variant: "success"
      });
      onResolved();
    } catch (error) {
      notify({
        title: "Could not resolve exception",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "danger"
      });
    } finally {
      setLoadingId(null);
    }
  }

  async function bulkSkip() {
    setBulkLoading(true);
    try {
      const response = await fetch("/api/migration/switching", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "bulk_skip_review", jobId })
      });
      const json = await response.json();
      if (!response.ok) throw new Error(readApiError(json, "Could not skip exceptions"));
      notify({
        title: "Exceptions cleared",
        description: `Skipped ${json.result?.skipped ?? 0} items. You can re-import later if needed.`,
        variant: "success"
      });
      onResolved();
    } catch (error) {
      notify({
        title: "Bulk skip failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "danger"
      });
    } finally {
      setBulkLoading(false);
    }
  }

  return (
    <Card className="space-y-4 p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-[var(--mpa-color-text-primary)]">Review queue</h2>
          <p className="text-sm text-[var(--mpa-color-text-secondary)]">
            {pending.length} item{pending.length === 1 ? "" : "s"} need a decision. Skip means “leave this row out for
            now” — your other imported records stay safe.
          </p>
        </div>
        {canUpdate && pending.length > 1 ? (
          <Button size="sm" variant="secondary" disabled={bulkLoading} onClick={() => void bulkSkip()}>
            {bulkLoading ? "Skipping…" : "One-click skip all"}
          </Button>
        ) : null}
      </div>

      {pending.length === 0 ? (
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">
          No pending review items — you&apos;re all caught up.
        </p>
      ) : (
        <ul className="space-y-3">
          {pending.map((item) => (
            <li key={item.id} className="rounded-lg border border-[var(--mpa-color-border-subtle)] p-4">
              <p className="text-sm font-medium text-[var(--mpa-color-text-primary)]">{item.title}</p>
              <p className="text-xs text-[var(--mpa-color-text-secondary)]">
                {humanItemType(item.itemType)} · {item.description}
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
                    Skip for now
                  </Button>
                  {item.candidateRecords.length > 0 ? (
                    <>
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        disabled={loadingId === item.id}
                        onClick={() =>
                          void resolve(item.id, "keep", String(item.candidateRecords[0]?.["id"] ?? ""))
                        }
                      >
                        Keep existing
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        disabled={loadingId === item.id}
                        onClick={() =>
                          void resolve(item.id, "replace", String(item.candidateRecords[0]?.["id"] ?? ""))
                        }
                      >
                        Replace with import
                      </Button>
                    </>
                  ) : (
                    <p className="text-xs text-[var(--mpa-color-text-secondary)]">
                      Recovery tip: fix the source row and re-import, or skip and add manually later.
                    </p>
                  )}
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
