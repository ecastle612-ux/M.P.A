"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  WORK_ORDER_PRIORITY_LABELS,
  WORK_ORDER_STATUS_LABELS,
  type WorkOrderPriority,
  type WorkOrderStatus
} from "@mpa/shared";
import { Badge, Button, EmptyState, Input, Select, Skeleton, Textarea } from "@mpa/ui";
import { Breadcrumbs } from "../shell/breadcrumbs";
import { FacilityWorkCreateWizard } from "./facility-work-create-wizard";

type WorkOrder = {
  id: string;
  title: string;
  description: string;
  status: WorkOrderStatus;
  priority: WorkOrderPriority;
  category: string;
  product_context: string;
  work_kind: string;
  source: string;
  site_id: string | null;
  asset_id: string | null;
  system_id: string | null;
  assignee_type: string;
  technician_user_id: string | null;
  vendor_id: string | null;
  submitted_at: string;
  facility_sites?: { id: string; name: string } | null;
  facility_assets?: { id: string; name: string; criticality: string } | null;
  facility_systems?: { id: string; name: string; criticality: string } | null;
  vendor_vendors?: { id: string; name: string } | null;
};

type Technician = { userId: string; displayName: string; email: string | null };
type Vendor = { id: string; name: string; email: string | null };

export function OperationsQueue() {
  const searchParams = useSearchParams();
  const startWithWizard = searchParams.get("new") === "1";
  const preferredId = searchParams.get("workOrderId") ?? "";

  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [assistantRecommendation, setAssistantRecommendation] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [updates, setUpdates] = useState<
    Array<{ id: string; body: string; created_at: string; actor_role: string }>
  >([]);
  const [timeline, setTimeline] = useState<
    Array<{ id: string; event_type: string; created_at: string }>
  >([]);
  const [statusFilter, setStatusFilter] = useState<string>("open");
  const [wizardDismissed, setWizardDismissed] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [priority, setPriority] = useState<WorkOrderPriority>("normal");
  const [assigneeType, setAssigneeType] = useState<"technician" | "vendor">("technician");
  const [technicianUserId, setTechnicianUserId] = useState("");
  const [vendorId, setVendorId] = useState("");
  const [progressNote, setProgressNote] = useState("");
  const [closeNote, setCloseNote] = useState("");

  const selected = useMemo(
    () => workOrders.find((row) => row.id === selectedId) ?? null,
    [workOrders, selectedId]
  );

  const filtered = useMemo(() => {
    if (statusFilter === "all") {
      return workOrders;
    }
    if (statusFilter === "open") {
      return workOrders.filter((wo) => !["closed", "cancelled"].includes(wo.status));
    }
    return workOrders.filter((wo) => wo.status === statusFilter);
  }, [statusFilter, workOrders]);

  const loadDetail = useCallback(async (workOrderId: string) => {
    if (!workOrderId) {
      setUpdates([]);
      setTimeline([]);
      return;
    }
    const response = await fetch(`/api/facility/operations/${workOrderId}`);
    const body = await response.json();
    if (!response.ok) {
      throw new Error(body.error ?? "Failed to load work order");
    }
    setUpdates(body.updates ?? []);
    setTimeline(body.timeline ?? []);
    if (body.workOrder?.priority) {
      setPriority(body.workOrder.priority as WorkOrderPriority);
    }
  }, []);

  const refresh = useCallback(
    async (preferred?: string) => {
      const response = await fetch("/api/facility/operations");
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.error ?? "Failed to load facility operations");
      }
      const rows = (body.workOrders ?? []) as WorkOrder[];
      setWorkOrders(rows);
      setTechnicians(body.technicians ?? []);
      setVendors(body.vendors ?? []);
      setAssistantRecommendation(body.assistantRecommendation ?? "");
      const nextId = preferred || preferredId || selectedId || rows[0]?.id || "";
      setSelectedId(nextId);
      if (nextId) {
        await loadDetail(nextId);
      } else {
        setUpdates([]);
        setTimeline([]);
      }
    },
    [loadDetail, preferredId, selectedId]
  );

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        await refresh(preferredId || undefined);
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
    // Initial load only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await action();
      await refresh(selectedId);
      setNotice("Updated.");
      setProgressNote("");
      setCloseNote("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setBusy(false);
    }
  }

  const creating =
    manualOpen || ((startWithWizard || (!loading && workOrders.length === 0)) && !wizardDismissed);

  if (loading) {
    return (
      <main className="flex-1 space-y-4 p-4 md:p-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-40 w-full max-w-3xl" />
      </main>
    );
  }

  return (
    <main className="flex-1 space-y-4 bg-[var(--mpa-color-bg-app)] p-4 md:p-6">
      <Breadcrumbs
        items={[
          { href: "/facility/mission-control", label: "Facility Mission Control" },
          { label: "Facility Operations" }
        ]}
      />

      <header className="flex max-w-5xl flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h1 className="font-display text-3xl font-semibold text-[var(--mpa-color-text-primary)]">
            Facility Operations
          </h1>
          <p className="text-sm text-[var(--mpa-color-text-secondary)]">
            Corrective facility work queue — operational context here, execution via shared
            Maintenance.
          </p>
        </div>
        {!creating ? (
          <Button
            type="button"
            onClick={() => {
              setWizardDismissed(false);
              setManualOpen(true);
            }}
          >
            Create facility work
          </Button>
        ) : null}
      </header>

      <section
        aria-label="Assistant recommendation"
        className="max-w-3xl rounded-md border border-[var(--mpa-color-border-default)] bg-white px-4 py-3"
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
          Assistant recommendation
        </p>
        <p className="mt-1 text-sm">{assistantRecommendation}</p>
      </section>

      {creating ? (
        <FacilityWorkCreateWizard
          onCancel={() => {
            setManualOpen(false);
            setWizardDismissed(true);
          }}
        />
      ) : null}

      {error ? (
        <p className="rounded-md border border-[#C0392B] bg-[#FCE8E6] px-3 py-2 text-sm text-[#C0392B]">
          {error}
        </p>
      ) : null}
      {notice ? (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          {notice}
        </p>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <section className="space-y-3 rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <h2 className="text-sm font-semibold">Corrective work queue</h2>
            <label className="space-y-1 text-xs">
              <span className="text-[var(--mpa-color-text-secondary)]">Filter</span>
              <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                <option value="open">Open</option>
                <option value="all">All</option>
                <option value="submitted">Submitted</option>
                <option value="assigned">Assigned</option>
                <option value="in_progress">In progress</option>
                <option value="completed">Completed</option>
                <option value="closed">Closed</option>
              </Select>
            </label>
          </div>
          <p className="text-xs text-[var(--mpa-color-text-secondary)]">
            product_context=facility · Shared work-order domain
          </p>
          {filtered.length === 0 ? (
            <EmptyState
              title="No facility work in this filter"
              description="Create corrective work to establish operational context for Maintenance execution."
            />
          ) : (
            <ul className="divide-y divide-[var(--mpa-color-border-default)]">
              {filtered.map((wo) => (
                <li key={wo.id}>
                  <button
                    type="button"
                    className={`w-full px-1 py-3 text-left ${
                      selectedId === wo.id ? "bg-[var(--mpa-color-bg-subtle)]" : ""
                    }`}
                    onClick={() => {
                      setSelectedId(wo.id);
                      void loadDetail(wo.id).catch((err: unknown) =>
                        setError(err instanceof Error ? err.message : "Failed to load detail")
                      );
                    }}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{wo.title}</span>
                      <Badge variant={wo.priority === "emergency" ? "danger" : "neutral"}>
                        {WORK_ORDER_PRIORITY_LABELS[wo.priority]}
                      </Badge>
                      <Badge variant="neutral">{WORK_ORDER_STATUS_LABELS[wo.status]}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-[var(--mpa-color-text-secondary)]">
                      {wo.facility_sites?.name ?? "Site"}
                      {wo.facility_assets?.name ? ` · ${wo.facility_assets.name}` : ""}
                      {wo.facility_systems?.name ? ` · ${wo.facility_systems.name}` : ""}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="space-y-4 rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4">
          {!selected ? (
            <EmptyState
              title="Select a work order"
              description="Review operational context, then triage, assign, and progress through reused Maintenance paths."
            />
          ) : (
            <>
              <div className="space-y-2">
                <h2 className="text-lg font-semibold">{selected.title}</h2>
                <p className="text-sm text-[var(--mpa-color-text-secondary)]">
                  {selected.description}
                </p>
                <div className="flex flex-wrap gap-2 text-xs">
                  <Badge variant="neutral">{WORK_ORDER_STATUS_LABELS[selected.status]}</Badge>
                  <Badge variant="neutral">{WORK_ORDER_PRIORITY_LABELS[selected.priority]}</Badge>
                  <Badge variant="neutral">{selected.work_kind}</Badge>
                  <Badge variant="neutral">{selected.source}</Badge>
                </div>
                <dl className="grid gap-2 text-sm md:grid-cols-2">
                  <div>
                    <dt className="text-[var(--mpa-color-text-secondary)]">Site</dt>
                    <dd>{selected.facility_sites?.name ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-[var(--mpa-color-text-secondary)]">Asset</dt>
                    <dd>{selected.facility_assets?.name ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-[var(--mpa-color-text-secondary)]">Building system</dt>
                    <dd>{selected.facility_systems?.name ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-[var(--mpa-color-text-secondary)]">Assignee</dt>
                    <dd>
                      {selected.assignee_type === "technician"
                        ? "Technician"
                        : selected.assignee_type === "vendor"
                          ? (selected.vendor_vendors?.name ?? "Vendor")
                          : "Unassigned"}
                    </dd>
                  </div>
                </dl>
                <p className="text-xs text-[var(--mpa-color-text-secondary)]">
                  Execution handoff: same shared Maintenance engine. Complete Platform orgs may also
                  filter{" "}
                  <Link href="/pm/maintenance" className="underline">
                    Maintenance → Facility Operations
                  </Link>
                  .
                </p>
              </div>

              <div className="space-y-2 border-t border-[var(--mpa-color-border-default)] pt-3">
                <h3 className="text-sm font-semibold">Prioritize</h3>
                <div className="flex flex-wrap items-end gap-2">
                  <label className="space-y-1 text-xs">
                    <span>Priority</span>
                    <Select
                      value={priority}
                      onChange={(event) => setPriority(event.target.value as WorkOrderPriority)}
                    >
                      {Object.entries(WORK_ORDER_PRIORITY_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </Select>
                  </label>
                  <Button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      void run(async () => {
                        const response = await fetch("/api/facility/operations/triage", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ workOrderId: selected.id, priority })
                        });
                        const body = await response.json();
                        if (!response.ok) {
                          throw new Error(body.error ?? "Triage failed");
                        }
                      })
                    }
                  >
                    Save priority
                  </Button>
                </div>
              </div>

              <div className="space-y-2 border-t border-[var(--mpa-color-border-default)] pt-3">
                <h3 className="text-sm font-semibold">Assign (Maintenance execution)</h3>
                <div className="grid gap-2 md:grid-cols-2">
                  <label className="space-y-1 text-xs">
                    <span>Assignee type</span>
                    <Select
                      value={assigneeType}
                      onChange={(event) =>
                        setAssigneeType(event.target.value as "technician" | "vendor")
                      }
                    >
                      <option value="technician">Technician</option>
                      <option value="vendor">Vendor</option>
                    </Select>
                  </label>
                  {assigneeType === "technician" ? (
                    <label className="space-y-1 text-xs">
                      <span>Technician</span>
                      <Select
                        value={technicianUserId}
                        onChange={(event) => setTechnicianUserId(event.target.value)}
                      >
                        <option value="">Select</option>
                        {technicians.map((tech) => (
                          <option key={tech.userId} value={tech.userId}>
                            {tech.displayName}
                          </option>
                        ))}
                      </Select>
                    </label>
                  ) : (
                    <label className="space-y-1 text-xs">
                      <span>Vendor</span>
                      <Select value={vendorId} onChange={(event) => setVendorId(event.target.value)}>
                        <option value="">Select</option>
                        {vendors.map((vendor) => (
                          <option key={vendor.id} value={vendor.id}>
                            {vendor.name}
                          </option>
                        ))}
                      </Select>
                    </label>
                  )}
                </div>
                <Button
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    void run(async () => {
                      const response = await fetch("/api/facility/operations/assign", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          workOrderId: selected.id,
                          assigneeType,
                          technicianUserId: assigneeType === "technician" ? technicianUserId : undefined,
                          vendorId: assigneeType === "vendor" ? vendorId : undefined
                        })
                      });
                      const body = await response.json();
                      if (!response.ok) {
                        throw new Error(body.error ?? "Assign failed");
                      }
                    })
                  }
                >
                  Assign
                </Button>
              </div>

              <div className="space-y-2 border-t border-[var(--mpa-color-border-default)] pt-3">
                <h3 className="text-sm font-semibold">Progress</h3>
                <Textarea
                  value={progressNote}
                  onChange={(event) => setProgressNote(event.target.value)}
                  placeholder="Progress note"
                  rows={3}
                />
                <div className="flex flex-wrap gap-2">
                  {(["start", "progress", "complete"] as const).map((action) => (
                    <Button
                      key={action}
                      type="button"
                      variant="secondary"
                      disabled={busy || progressNote.trim().length < 1}
                      onClick={() =>
                        void run(async () => {
                          const response = await fetch("/api/facility/operations/progress", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              workOrderId: selected.id,
                              action,
                              note: progressNote.trim()
                            })
                          });
                          const body = await response.json();
                          if (!response.ok) {
                            throw new Error(body.error ?? "Progress failed");
                          }
                        })
                      }
                    >
                      {action}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2 border-t border-[var(--mpa-color-border-default)] pt-3">
                <h3 className="text-sm font-semibold">Close with resolution</h3>
                <Input
                  value={closeNote}
                  onChange={(event) => setCloseNote(event.target.value)}
                  placeholder="Optional resolution note"
                />
                <Button
                  type="button"
                  disabled={busy || ["closed", "cancelled", "submitted", "triaged"].includes(selected.status)}
                  onClick={() =>
                    void run(async () => {
                      const response = await fetch("/api/facility/operations/close", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          workOrderId: selected.id,
                          note: closeNote.trim() || undefined
                        })
                      });
                      const body = await response.json();
                      if (!response.ok) {
                        throw new Error(body.error ?? "Close failed");
                      }
                    })
                  }
                >
                  Close work order
                </Button>
              </div>

              <div className="space-y-2 border-t border-[var(--mpa-color-border-default)] pt-3">
                <h3 className="text-sm font-semibold">Updates</h3>
                <ul className="space-y-2 text-sm">
                  {updates.map((update) => (
                    <li key={update.id}>
                      <p>{update.body}</p>
                      <p className="text-xs text-[var(--mpa-color-text-secondary)]">
                        {update.actor_role} · {new Date(update.created_at).toLocaleString()}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-2 border-t border-[var(--mpa-color-border-default)] pt-3">
                <h3 className="text-sm font-semibold">Timeline</h3>
                <ul className="space-y-2 text-sm">
                  {timeline.map((event) => (
                    <li key={event.id}>
                      <p>{event.event_type}</p>
                      <p className="text-xs text-[var(--mpa-color-text-secondary)]">
                        {new Date(event.created_at).toLocaleString()}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
