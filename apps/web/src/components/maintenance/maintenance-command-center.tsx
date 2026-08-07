"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  WORK_ORDER_PRIORITY_LABELS,
  WORK_ORDER_STATUS_LABELS,
  type WorkOrderPriority,
  type WorkOrderStatus
} from "@mpa/shared";
import { Badge, Button, EmptyState, Input, Select, Skeleton, Textarea } from "@mpa/ui";
import { Breadcrumbs } from "../shell/breadcrumbs";

type WorkOrder = {
  id: string;
  title: string;
  description: string;
  status: WorkOrderStatus;
  priority: WorkOrderPriority;
  category: string;
  assignee_type: string;
  technician_user_id: string | null;
  vendor_id: string | null;
  submitted_at: string;
  product_context?: "property_manager" | "facility";
  property_properties?: { name: string } | null;
  property_units?: { unit_label: string } | null;
  pm_residents?: { display_name: string; email: string } | null;
  vendor_vendors?: { name: string } | null;
  facility_sites?: { id: string; name: string } | null;
  facility_assets?: { id: string; name: string; criticality: string } | null;
  facility_systems?: { id: string; name: string; criticality: string } | null;
};

function workOrderContextLine(row: WorkOrder, viewingFacility: boolean) {
  if (viewingFacility || row.product_context === "facility") {
    const parts = [
      row.facility_sites?.name ? `Site ${row.facility_sites.name}` : "Facility site",
      row.facility_assets?.name ? `Asset ${row.facility_assets.name}` : null,
      row.facility_systems?.name ? `System ${row.facility_systems.name}` : null
    ].filter(Boolean);
    return parts.join(" · ");
  }
  return [
    row.pm_residents?.display_name ?? "Resident",
    row.property_properties?.name ?? "Property",
    row.property_units?.unit_label ? `Unit ${row.property_units.unit_label}` : null
  ]
    .filter(Boolean)
    .join(" · ");
}

type Technician = { userId: string; displayName: string; email: string | null };
type Vendor = { id: string; name: string; email: string | null; user_id?: string | null };

export function MaintenanceCommandCenter() {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [assistantRecommendation, setAssistantRecommendation] = useState("");
  const [maintenanceReady, setMaintenanceReady] = useState(false);
  const [productContext, setProductContext] = useState<"property_manager" | "facility">(
    "property_manager"
  );
  const [selectedId, setSelectedId] = useState<string>("");
  const [updates, setUpdates] = useState<Array<{ id: string; body: string; created_at: string; actor_role: string }>>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [priority, setPriority] = useState<WorkOrderPriority>("normal");
  const [assigneeType, setAssigneeType] = useState<"technician" | "vendor">("technician");
  const [technicianUserId, setTechnicianUserId] = useState("");
  const [vendorId, setVendorId] = useState("");
  const [progressNote, setProgressNote] = useState("");
  const [vendorName, setVendorName] = useState("");
  const [vendorEmail, setVendorEmail] = useState("");

  const selected = useMemo(
    () => workOrders.find((row) => row.id === selectedId) ?? null,
    [workOrders, selectedId]
  );

  const loadDetail = useCallback(async (workOrderId: string) => {
    if (!workOrderId) {
      setUpdates([]);
      return;
    }
    const response = await fetch(`/api/pm/maintenance/${workOrderId}`);
    const body = await response.json();
    if (!response.ok) {
      throw new Error(body.error ?? "Failed to load work order");
    }
    setUpdates(body.updates ?? []);
    if (body.workOrder?.priority) {
      setPriority(body.workOrder.priority as WorkOrderPriority);
    }
  }, []);

  const refresh = useCallback(async (preferredId?: string, context = productContext) => {
    const response = await fetch(
      `/api/pm/maintenance?productContext=${encodeURIComponent(context)}`
    );
    const body = await response.json();
    if (!response.ok) {
      throw new Error(body.error ?? "Failed to load maintenance");
    }
    const rows = (body.workOrders ?? []) as WorkOrder[];
    setWorkOrders(rows);
    setTechnicians(body.technicians ?? []);
    setVendors(body.vendors ?? []);
    setAssistantRecommendation(body.assistantRecommendation ?? "");
    setMaintenanceReady(Boolean(body.readiness?.maintenanceReady));
    setProductContext(
      body.productContext === "facility" ? "facility" : "property_manager"
    );
    const nextId = preferredId || selectedId || rows[0]?.id || "";
    setSelectedId(nextId);
    if (nextId) {
      await loadDetail(nextId);
    } else {
      setUpdates([]);
    }
  }, [loadDetail, productContext, selectedId]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch(
          `/api/pm/maintenance?productContext=${encodeURIComponent(productContext)}`
        );
        const body = await response.json();
        if (!response.ok) {
          throw new Error(body.error ?? "Failed to load maintenance");
        }
        if (cancelled) {
          return;
        }
        const rows = (body.workOrders ?? []) as WorkOrder[];
        setWorkOrders(rows);
        setTechnicians(body.technicians ?? []);
        setVendors(body.vendors ?? []);
        setAssistantRecommendation(body.assistantRecommendation ?? "");
        setMaintenanceReady(Boolean(body.readiness?.maintenanceReady));
        const firstId = rows[0]?.id ?? "";
        setSelectedId(firstId);
        if (firstId) {
          const detailResponse = await fetch(`/api/pm/maintenance/${firstId}`);
          const detailBody = await detailResponse.json();
          if (detailResponse.ok && !cancelled) {
            setUpdates(detailBody.updates ?? []);
            if (detailBody.workOrder?.priority) {
              setPriority(detailBody.workOrder.priority as WorkOrderPriority);
            }
          }
        }
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
  }, [productContext]);

  async function selectWorkOrder(workOrderId: string) {
    setSelectedId(workOrderId);
    setError(null);
    try {
      await loadDetail(workOrderId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load detail");
    }
  }

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await action();
      await refresh(selectedId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <main className="flex-1 space-y-4 bg-[var(--mpa-color-bg-app)] p-4 md:p-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
      </main>
    );
  }

  const openCount = workOrders.filter((row) => !["closed", "cancelled"].includes(row.status)).length;
  const emergencyCount = workOrders.filter(
    (row) => row.priority === "emergency" && !["closed", "cancelled"].includes(row.status)
  ).length;

  return (
    <main className="flex-1 space-y-4 bg-[var(--mpa-color-bg-app)] p-4 md:p-6">
      <Breadcrumbs
        items={[
          { href: "/pm/mission-control", label: "Mission Control" },
          { label: "Maintenance" }
        ]}
      />

      <header className="max-w-3xl space-y-2">
        <h1 className="font-display text-2xl font-semibold text-[var(--mpa-color-text-primary)]">
          Maintenance Command Center
        </h1>
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">
          One work-order workflow: review resident requests, prioritize, assign a technician or
          vendor, monitor progress, and close after resident confirmation.
        </p>
        <div className="flex flex-wrap gap-2">
          <Badge variant="info">{openCount} open</Badge>
          <Badge variant={emergencyCount > 0 ? "danger" : "neutral"}>
            {emergencyCount} emergency
          </Badge>
          <Badge variant={maintenanceReady ? "success" : "neutral"}>
            {maintenanceReady ? "First lifecycle complete" : "Awaiting first closed request"}
          </Badge>
        </div>
      </header>

      <section
        aria-label="Assistant recommendation"
        className="max-w-3xl rounded-md border border-[var(--mpa-color-border-default)] bg-white px-4 py-3"
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
          Assistant recommendation
        </p>
        <p className="mt-1 text-sm text-[var(--mpa-color-text-primary)]">
          {maintenanceReady
            ? "My maintenance operation is working. Review your daily operations."
            : assistantRecommendation ||
              "Review the queue — residents submit from their portal; you triage, assign, and close here."}
        </p>
        {maintenanceReady ? (
          <Link
            href="/pm/mission-control"
            className="mt-2 inline-block text-sm font-medium text-[var(--mpa-color-brand-primary)] underline"
          >
            Review today&apos;s operations.
          </Link>
        ) : (
          <p className="mt-2 text-xs text-[var(--mpa-color-text-secondary)]">
            Residents submit at{" "}
            <Link href="/portal/tenant/maintenance" className="underline">
              Resident Portal → Maintenance
            </Link>
            .
          </p>
        )}
      </section>

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
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 className="text-sm font-semibold">Request queue</h2>
            <label className="space-y-1 text-xs">
              <span className="text-[var(--mpa-color-text-secondary)]">Product context</span>
              <Select
                value={productContext}
                onChange={(event) => {
                  setLoading(true);
                  setSelectedId("");
                  setProductContext(
                    event.target.value === "facility" ? "facility" : "property_manager"
                  );
                }}
              >
                <option value="property_manager">Property Manager</option>
                <option value="facility">Facility Operations</option>
              </Select>
            </label>
          </div>
          <p className="text-xs text-[var(--mpa-color-text-secondary)]">
            Queues never silently mix contexts. Facility work is labeled and filtered explicitly.
          </p>
          {workOrders.length === 0 ? (
            <EmptyState
              title={
                productContext === "facility"
                  ? "No facility work orders in this filter"
                  : "No maintenance requests yet"
              }
              description={
                productContext === "facility"
                  ? "Create facility corrective work from Facility Operations, then execute here."
                  : "When a resident submits a request, it appears here automatically."
              }
            />
          ) : (
            <ul className="space-y-2">
              {workOrders.map((row) => (
                <li key={row.id}>
                  <button
                    type="button"
                    onClick={() => void selectWorkOrder(row.id)}
                    className={`w-full rounded-md border px-3 py-2 text-left text-sm ${
                      selectedId === row.id
                        ? "border-[var(--mpa-color-brand-primary)] bg-[var(--mpa-color-bg-subtle,#f7faf9)]"
                        : "border-[var(--mpa-color-border-default)] bg-white"
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-medium">{row.title}</span>
                      <Badge
                        variant={
                          row.priority === "emergency"
                            ? "danger"
                            : row.status === "closed"
                              ? "success"
                              : "neutral"
                        }
                      >
                        {WORK_ORDER_STATUS_LABELS[row.status]}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-[var(--mpa-color-text-secondary)]">
                      {workOrderContextLine(row, productContext === "facility")} ·{" "}
                      {WORK_ORDER_PRIORITY_LABELS[row.priority]}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="space-y-4 rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4">
          {!selected ? (
            <EmptyState title="Select a request" description="Review, prioritize, assign, and complete." />
          ) : (
            <>
              <div>
                <h2 className="font-display text-xl font-semibold">{selected.title}</h2>
                <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
                  {selected.description}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge variant="neutral">{WORK_ORDER_STATUS_LABELS[selected.status]}</Badge>
                  <Badge variant={selected.priority === "emergency" ? "danger" : "info"}>
                    {WORK_ORDER_PRIORITY_LABELS[selected.priority]}
                  </Badge>
                  <Badge variant="neutral">{selected.category}</Badge>
                  {productContext === "facility" || selected.product_context === "facility" ? (
                    <Badge variant="info">Facility context</Badge>
                  ) : null}
                </div>
                {productContext === "facility" || selected.product_context === "facility" ? (
                  <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="text-xs text-[var(--mpa-color-text-secondary)]">
                        Facility site
                      </dt>
                      <dd>{selected.facility_sites?.name ?? "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-[var(--mpa-color-text-secondary)]">Asset</dt>
                      <dd>{selected.facility_assets?.name ?? "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-[var(--mpa-color-text-secondary)]">
                        Building system
                      </dt>
                      <dd>{selected.facility_systems?.name ?? "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-[var(--mpa-color-text-secondary)]">
                        Facility context
                      </dt>
                      <dd>Facility Operations</dd>
                    </div>
                  </dl>
                ) : (
                  <p className="mt-2 text-sm text-[var(--mpa-color-text-secondary)]">
                    Resident: {selected.pm_residents?.display_name ?? "—"} · Property:{" "}
                    {selected.property_properties?.name ?? "—"}
                  </p>
                )}
                <p className="mt-2 text-sm text-[var(--mpa-color-text-secondary)]">
                  {selected.assignee_type === "vendor" && selected.vendor_vendors?.name
                    ? `Vendor: ${selected.vendor_vendors.name}`
                    : null}
                  {selected.assignee_type === "technician" && selected.technician_user_id
                    ? `Technician assigned`
                    : null}
                </p>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <form
                  className="space-y-2 rounded-md border border-[var(--mpa-color-border-subtle)] p-3"
                  onSubmit={(event) => {
                    event.preventDefault();
                    void run(async () => {
                      const response = await fetch("/api/pm/maintenance/triage", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ workOrderId: selected.id, priority })
                      });
                      const body = await response.json();
                      if (!response.ok) {
                        throw new Error(body.error ?? "Triage failed");
                      }
                      setNotice("Request prioritized.");
                    });
                  }}
                >
                  <h3 className="text-sm font-semibold">Prioritize</h3>
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
                  <Button type="submit" disabled={busy}>
                    Save priority
                  </Button>
                </form>

                <form
                  className="space-y-2 rounded-md border border-[var(--mpa-color-border-subtle)] p-3"
                  onSubmit={(event) => {
                    event.preventDefault();
                    void run(async () => {
                      const response = await fetch("/api/pm/maintenance/assign", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          workOrderId: selected.id,
                          assigneeType,
                          technicianUserId:
                            assigneeType === "technician" ? technicianUserId || undefined : undefined,
                          vendorId: assigneeType === "vendor" ? vendorId || undefined : undefined
                        })
                      });
                      const body = await response.json();
                      if (!response.ok) {
                        throw new Error(body.error ?? "Assign failed");
                      }
                      const handoff = body.vendorPortalHandoff as
                        | {
                            firstLoginMessage?: string;
                            magicLink?: string | null;
                            loginHref?: string;
                          }
                        | null
                        | undefined;
                      if (handoff?.firstLoginMessage) {
                        setNotice(
                          [
                            "Assignment sent.",
                            handoff.firstLoginMessage,
                            handoff.magicLink ? `Magic link: ${handoff.magicLink}` : null,
                            handoff.loginHref ? `Login: ${handoff.loginHref}` : null
                          ]
                            .filter(Boolean)
                            .join(" ")
                        );
                      } else {
                        setNotice("Assignment sent.");
                      }
                    });
                  }}
                >
                  <h3 className="text-sm font-semibold">Assign technician or vendor</h3>
                  <Select
                    value={assigneeType}
                    onChange={(event) =>
                      setAssigneeType(event.target.value as "technician" | "vendor")
                    }
                  >
                    <option value="technician">Technician</option>
                    <option value="vendor">Vendor</option>
                  </Select>
                  {assigneeType === "technician" ? (
                    <Select
                      value={technicianUserId}
                      onChange={(event) => setTechnicianUserId(event.target.value)}
                      required
                    >
                      <option value="">Select technician</option>
                      {technicians.map((tech) => (
                        <option key={tech.userId} value={tech.userId}>
                          {tech.displayName}
                        </option>
                      ))}
                    </Select>
                  ) : (
                    <Select value={vendorId} onChange={(event) => setVendorId(event.target.value)} required>
                      <option value="">Select vendor</option>
                      {vendors.map((vendor) => (
                        <option key={vendor.id} value={vendor.id}>
                          {vendor.name}
                        </option>
                      ))}
                    </Select>
                  )}
                  <Button type="submit" disabled={busy}>
                    Assign
                  </Button>
                </form>
              </div>

              <form
                className="space-y-2 rounded-md border border-[var(--mpa-color-border-subtle)] p-3"
                onSubmit={(event) => {
                  event.preventDefault();
                  void run(async () => {
                    const response = await fetch("/api/pm/maintenance/vendors", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        name: vendorName,
                        email: vendorEmail || undefined
                      })
                    });
                    const body = await response.json();
                    if (!response.ok) {
                      throw new Error(body.error ?? "Vendor create failed");
                    }
                    setVendorName("");
                    setVendorEmail("");
                    setVendorId(body.vendor?.id ?? "");
                    setAssigneeType("vendor");
                    setNotice("Vendor added to directory (same shared vendor identity).");
                  });
                }}
              >
                <h3 className="text-sm font-semibold">Add vendor (Vendor Operations)</h3>
                <Input
                  value={vendorName}
                  onChange={(event) => setVendorName(event.target.value)}
                  placeholder="Vendor name"
                  required
                />
                <Input
                  value={vendorEmail}
                  onChange={(event) => setVendorEmail(event.target.value)}
                  placeholder="Email (optional, for portal link)"
                  type="email"
                />
                <Button type="submit" variant="secondary" disabled={busy}>
                  Add vendor
                </Button>
              </form>

              <form
                className="space-y-2 rounded-md border border-[var(--mpa-color-border-subtle)] p-3"
                onSubmit={(event) => {
                  event.preventDefault();
                  void run(async () => {
                    const response = await fetch("/api/pm/maintenance/progress", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        workOrderId: selected.id,
                        action: "progress",
                        note: progressNote
                      })
                    });
                    const body = await response.json();
                    if (!response.ok) {
                      throw new Error(body.error ?? "Progress update failed");
                    }
                    setProgressNote("");
                    setNotice("Progress recorded.");
                  });
                }}
              >
                <h3 className="text-sm font-semibold">Progress / complete</h3>
                <Textarea
                  value={progressNote}
                  onChange={(event) => setProgressNote(event.target.value)}
                  placeholder="Notes for the resident and timeline"
                  required
                />
                <div className="flex flex-wrap gap-2">
                  <Button type="submit" disabled={busy}>
                    Add progress note
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={busy}
                    onClick={() => {
                      void run(async () => {
                        const response = await fetch("/api/pm/maintenance/progress", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            workOrderId: selected.id,
                            action: "start",
                            note: progressNote || "Work started."
                          })
                        });
                        const body = await response.json();
                        if (!response.ok) {
                          throw new Error(body.error ?? "Start failed");
                        }
                        setProgressNote("");
                        setNotice("Work started.");
                      });
                    }}
                  >
                    Start work
                  </Button>
                  <Button
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      void run(async () => {
                        const response = await fetch("/api/pm/maintenance/progress", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            workOrderId: selected.id,
                            action: "complete",
                            note: progressNote || "Work completed. Awaiting resident confirmation."
                          })
                        });
                        const body = await response.json();
                        if (!response.ok) {
                          throw new Error(body.error ?? "Complete failed");
                        }
                        setProgressNote("");
                        setNotice("Marked complete — resident can confirm.");
                      });
                    }}
                  >
                    Mark complete
                  </Button>
                </div>
              </form>

              <div>
                <h3 className="text-sm font-semibold">History</h3>
                {updates.length === 0 ? (
                  <p className="mt-2 text-sm text-[var(--mpa-color-text-secondary)]">No updates yet.</p>
                ) : (
                  <ul className="mt-2 space-y-2 text-sm">
                    {updates.map((update) => (
                      <li
                        key={update.id}
                        className="border-b border-[var(--mpa-color-border-subtle)] py-2"
                      >
                        <span className="text-xs uppercase text-[var(--mpa-color-text-secondary)]">
                          {update.actor_role}
                        </span>
                        <p>{update.body}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
