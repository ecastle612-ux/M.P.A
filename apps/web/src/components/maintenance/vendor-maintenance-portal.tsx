"use client";

import { useCallback, useEffect, useState } from "react";
import {
  WORK_ORDER_PRIORITY_LABELS,
  WORK_ORDER_STATUS_LABELS,
  type WorkOrderPriority,
  type WorkOrderStatus
} from "@mpa/shared";
import { Alert, Badge, Button, EmptyState, Skeleton, Textarea } from "@mpa/ui";
import { ConfirmActionModal } from "../shell/confirm-action-modal";
import { workOrderCompleteConfirmation } from "../../lib/ui/destructive-confirm-copy";
import {
  fieldActionVariant,
  fieldPrimaryAction,
  fieldWorkOrderScanLines,
  resolveProgressNote,
  vendorPortalScopeCopy
} from "../../lib/facility/field-work-order-presentation";

type Entry = {
  workOrder: {
    id: string;
    title: string;
    description: string;
    status: WorkOrderStatus;
    priority: WorkOrderPriority;
    organization_id: string;
    submitted_at?: string;
    property_properties?: { name: string } | null;
    property_units?: { unit_label: string } | null;
  };
  updates: Array<{ id: string; body: string; actor_role: string; created_at?: string }>;
};

export function VendorMaintenancePortal() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [vendors, setVendors] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [completeConfirmId, setCompleteConfirmId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const response = await fetch("/api/portal/vendor/maintenance");
    const body = await response.json();
    if (!response.ok) {
      throw new Error(body.error ?? "Failed to load assignments");
    }
    setVendors(body.vendors ?? []);
    setEntries(body.workOrders ?? []);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        await refresh();
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  async function update(workOrderId: string, action: "start" | "progress" | "complete") {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/portal/vendor/maintenance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workOrderId,
          action,
          note: resolveProgressNote(notes[workOrderId] ?? "", action)
        })
      });
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.error ?? "Update failed");
      }
      setNotes((current) => ({ ...current, [workOrderId]: "" }));
      setCompleteConfirmId(null);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  const completing = entries.find((entry) => entry.workOrder.id === completeConfirmId)?.workOrder;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <header className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
          Vendor Portal
        </p>
        <h2 className="font-display text-xl font-semibold text-[var(--mpa-color-text-primary)]">
          Vendor work
        </h2>
        <p className="text-sm leading-6 text-[var(--mpa-color-text-secondary)]">
          {vendorPortalScopeCopy()}
        </p>
        {vendors.length > 0 ? (
          <p className="text-xs text-[var(--mpa-color-text-secondary)]">
            Vendor identity: {vendors.map((vendor) => vendor.name).join(", ")}
          </p>
        ) : null}
      </header>

      {error ? (
<Alert variant="danger">{error}</Alert>
      ) : null}

      {entries.length === 0 ? (
        <EmptyState
          title="No assigned work yet"
          description="When a property or facility manager assigns your vendor account, work orders appear here."
        />
      ) : (
        entries.map(({ workOrder, updates }) => {
          const primary = fieldPrimaryAction(workOrder.status);
          const scanLines = fieldWorkOrderScanLines({
            title: workOrder.title,
            description: workOrder.description,
            status: workOrder.status,
            priority: workOrder.priority,
            propertyName: workOrder.property_properties?.name,
            unitLabel: workOrder.property_units?.unit_label,
            assigneeType: "vendor",
            vendorName: vendors[0]?.name ?? "Your vendor account",
            submittedAt: workOrder.submitted_at
          });

          return (
            <article
              key={workOrder.id}
              className="space-y-3 rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4"
            >
              <div className="min-w-0 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
                  Work order
                </p>
                <h3 className="font-display text-lg font-semibold text-[var(--mpa-color-text-primary)]">
                  {workOrder.title}
                </h3>
                <p className="text-sm leading-6 text-[var(--mpa-color-text-secondary)]">
                  {workOrder.description}
                </p>
                <dl className="grid gap-2 sm:grid-cols-2">
                  {scanLines.map((line) => (
                    <div
                      key={line.id}
                      className="rounded-md border border-[var(--mpa-color-border-subtle)] px-3 py-2"
                    >
                      <dt className="text-[11px] font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
                        {line.label}
                      </dt>
                      <dd className="mt-0.5 break-words text-sm text-[var(--mpa-color-text-primary)]">
                        {line.value}
                      </dd>
                    </div>
                  ))}
                </dl>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="neutral">{WORK_ORDER_STATUS_LABELS[workOrder.status]}</Badge>
                  <Badge variant={workOrder.priority === "emergency" ? "danger" : "info"}>
                    {WORK_ORDER_PRIORITY_LABELS[workOrder.priority]}
                  </Badge>
                </div>
              </div>

              <section className="space-y-1">
                <h4 className="text-sm font-semibold">Recent notes</h4>
                {updates.length === 0 ? (
                  <p className="text-sm text-[var(--mpa-color-text-secondary)]">
                    No notes have been shared for this work order.
                  </p>
                ) : (
                  <ul className="space-y-1 text-sm text-[var(--mpa-color-text-secondary)]">
                    {updates.slice(-5).map((update) => (
                      <li key={update.id} className="break-words">
                        {update.actor_role}: {update.body}
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              {!["closed", "cancelled", "completed"].includes(workOrder.status) ? (
                <div className="space-y-2 rounded-md border border-[var(--mpa-color-brand-primary)]/25 bg-[var(--mpa-color-brand-primary-subtle,#E6F4EF)] p-3">
                  <label className="block space-y-1 text-sm">
                    <span className="text-xs text-[var(--mpa-color-text-secondary)]">
                      Progress note (optional)
                    </span>
                    <Textarea
                      value={notes[workOrder.id] ?? ""}
                      onChange={(event) =>
                        setNotes((current) => ({ ...current, [workOrder.id]: event.target.value }))
                      }
                      placeholder="What changed on site?"
                    />
                  </label>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    <Button
                      type="button"
                      variant={fieldActionVariant("start", primary)}
                      className="min-h-11"
                      disabled={busy}
                      onClick={() => void update(workOrder.id, "start")}
                    >
                      Start
                    </Button>
                    <Button
                      type="button"
                      variant={fieldActionVariant("progress", primary)}
                      className="min-h-11"
                      disabled={busy}
                      onClick={() => void update(workOrder.id, "progress")}
                    >
                      Progress
                    </Button>
                    <Button
                      type="button"
                      variant={fieldActionVariant("complete", primary)}
                      className="min-h-11"
                      disabled={busy}
                      onClick={() => setCompleteConfirmId(workOrder.id)}
                    >
                      Complete
                    </Button>
                  </div>
                </div>
              ) : null}
            </article>
          );
        })
      )}

      {completing ? (
        <ConfirmActionModal
          open
          onClose={() => setCompleteConfirmId(null)}
          busy={busy}
          danger={false}
          confirmLabel="Confirm completion"
          cancelLabel="Keep open"
          title={workOrderCompleteConfirmation({ title: completing.title }).title}
          onConfirm={() => {
            void update(completing.id, "complete");
          }}
        >
          {(() => {
            const copy = workOrderCompleteConfirmation({ title: completing.title });
            return (
              <div className="space-y-2 text-[var(--mpa-color-text-secondary)]">
                <p>{copy.what}</p>
                <p>{copy.when}</p>
                <p className="font-medium text-[var(--mpa-color-text-primary)]">{copy.irreversible}</p>
              </div>
            );
          })()}
        </ConfirmActionModal>
      ) : null}
    </div>
  );
}
