"use client";

import { useCallback, useEffect, useState } from "react";
import {
  WORK_ORDER_PRIORITY_LABELS,
  WORK_ORDER_STATUS_LABELS,
  type WorkOrderPriority,
  type WorkOrderStatus
} from "@mpa/shared";
import { Badge, Button, EmptyState, Skeleton, Textarea } from "@mpa/ui";

type Entry = {
  workOrder: {
    id: string;
    title: string;
    description: string;
    status: WorkOrderStatus;
    priority: WorkOrderPriority;
    organization_id: string;
    product_context?: "property_manager" | "facility";
    property_properties?: { name: string } | null;
    property_units?: { unit_label: string } | null;
    facility_sites?: { id: string; name: string } | null;
    facility_assets?: { id: string; name: string; criticality: string } | null;
    facility_systems?: { id: string; name: string; criticality: string } | null;
  };
  updates: Array<{ id: string; body: string; actor_role: string }>;
};

export function VendorMaintenancePortal() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [vendors, setVendors] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

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
          note: notes[workOrderId] || (action === "complete" ? "Work completed." : "Progress update.")
        })
      });
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.error ?? "Update failed");
      }
      setNotes((current) => ({ ...current, [workOrderId]: "" }));
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

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <header>
        <h2 className="font-display text-xl font-semibold text-[var(--mpa-color-text-primary)]">
          Vendor work orders
        </h2>
        <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
          Assignments from Property Manager and Facility Operations. Update progress and complete
          work here.
        </p>
        {vendors.length > 0 ? (
          <p className="mt-2 text-xs text-[var(--mpa-color-text-secondary)]">
            Linked as: {vendors.map((vendor) => vendor.name).join(", ")}
          </p>
        ) : null}
      </header>

      {error ? (
        <p className="rounded-md border border-[#C0392B] bg-[#FCE8E6] px-3 py-2 text-sm text-[#C0392B]">
          {error}
        </p>
      ) : null}

      {entries.length === 0 ? (
        <EmptyState
          title="No assigned work yet"
          description="When a property manager or facility manager assigns your vendor account, work orders appear here."
        />
      ) : (
        entries.map(({ workOrder, updates }) => (
          <article
            key={workOrder.id}
            className="space-y-3 rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h3 className="font-medium">{workOrder.title}</h3>
                <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
                  {workOrder.description}
                </p>
                {workOrder.product_context === "facility" ? (
                  <dl className="mt-2 grid gap-1 text-xs text-[var(--mpa-color-text-secondary)] sm:grid-cols-2">
                    <div>
                      <dt className="font-medium text-[var(--mpa-color-text-primary)]">
                        Facility site
                      </dt>
                      <dd>{workOrder.facility_sites?.name ?? "—"}</dd>
                    </div>
                    <div>
                      <dt className="font-medium text-[var(--mpa-color-text-primary)]">Asset</dt>
                      <dd>{workOrder.facility_assets?.name ?? "—"}</dd>
                    </div>
                    <div>
                      <dt className="font-medium text-[var(--mpa-color-text-primary)]">
                        Building system
                      </dt>
                      <dd>{workOrder.facility_systems?.name ?? "—"}</dd>
                    </div>
                    <div>
                      <dt className="font-medium text-[var(--mpa-color-text-primary)]">
                        Facility context
                      </dt>
                      <dd>Facility Operations</dd>
                    </div>
                  </dl>
                ) : (
                  <p className="mt-1 text-xs text-[var(--mpa-color-text-secondary)]">
                    {workOrder.property_properties?.name ?? "Property"}
                    {workOrder.property_units?.unit_label
                      ? ` · Unit ${workOrder.property_units.unit_label}`
                      : ""}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="neutral">{WORK_ORDER_STATUS_LABELS[workOrder.status]}</Badge>
                <Badge variant={workOrder.priority === "emergency" ? "danger" : "info"}>
                  {WORK_ORDER_PRIORITY_LABELS[workOrder.priority]}
                </Badge>
                {workOrder.product_context === "facility" ? (
                  <Badge variant="info">Facility</Badge>
                ) : null}
              </div>
            </div>
            <ul className="space-y-1 text-sm text-[var(--mpa-color-text-secondary)]">
              {updates.slice(-5).map((update) => (
                <li key={update.id}>
                  {update.actor_role}: {update.body}
                </li>
              ))}
            </ul>
            {!["closed", "cancelled", "completed"].includes(workOrder.status) ? (
              <div className="space-y-2">
                <Textarea
                  value={notes[workOrder.id] ?? ""}
                  onChange={(event) =>
                    setNotes((current) => ({ ...current, [workOrder.id]: event.target.value }))
                  }
                  placeholder="Progress note"
                />
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={busy}
                    onClick={() => void update(workOrder.id, "start")}
                  >
                    Start
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={busy}
                    onClick={() => void update(workOrder.id, "progress")}
                  >
                    Update progress
                  </Button>
                  <Button type="button" disabled={busy} onClick={() => void update(workOrder.id, "complete")}>
                    Complete
                  </Button>
                </div>
              </div>
            ) : null}
          </article>
        ))
      )}
    </div>
  );
}
