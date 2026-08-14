"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  WORK_ORDER_PRIORITY_LABELS,
  WORK_ORDER_STATUS_LABELS,
  ownerEmptyStateCopy,
  type WorkOrderPriority,
  type WorkOrderStatus
} from "@mpa/shared";
import { resolveStatusBadgeVariant, Alert, Badge, Button, EmptyState, Input, Select, Skeleton, Textarea } from "@mpa/ui";
import { Breadcrumbs } from "../shell/breadcrumbs";
import { ConfirmActionModal } from "../shell/confirm-action-modal";
import { ErrorRetry } from "../shell/error-retry";
import { PmDocumentsStrip, PmQuickActions, documentsHref } from "../shell/pm-workspace";
import { workOrderCancelConfirmation } from "../../lib/ui/destructive-confirm-copy";
import {
  fieldActionVariant,
  fieldPrimaryAction,
  fieldWorkOrderScanLines,
  resolveCancelNote,
  resolveProgressNote
} from "../../lib/facility/field-work-order-presentation";

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
  property_properties?: { name: string } | null;
  property_units?: { unit_label: string } | null;
  pm_residents?: { display_name: string; email: string } | null;
  vendor_vendors?: { name: string } | null;
};

type Technician = { userId: string; displayName: string; email: string | null };
type Vendor = { id: string; name: string; email: string | null; user_id?: string | null };

export function MaintenanceCommandCenter() {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [assistantRecommendation, setAssistantRecommendation] = useState("");
  const [maintenanceReady, setMaintenanceReady] = useState(false);
  const [selectedId, setSelectedId] = useState<string>("");
  const [updates, setUpdates] = useState<Array<{ id: string; body: string; created_at: string; actor_role: string }>>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
  const [priority, setPriority] = useState<WorkOrderPriority>("normal");
  const [assigneeType, setAssigneeType] = useState<"technician" | "vendor">("technician");
  const [technicianUserId, setTechnicianUserId] = useState("");
  const [vendorId, setVendorId] = useState("");
  const [progressNote, setProgressNote] = useState("");
  const [cancelNote, setCancelNote] = useState("");
  const [vendorName, setVendorName] = useState("");
  const [vendorEmail, setVendorEmail] = useState("");
  const [queueQuery, setQueueQuery] = useState("");

  const selected = useMemo(
    () => workOrders.find((row) => row.id === selectedId) ?? null,
    [workOrders, selectedId]
  );
  const primaryAction = selected ? fieldPrimaryAction(selected.status) : null;
  const selectedTechnicianLabel =
    selected?.technician_user_id != null
      ? (technicians.find((tech) => tech.userId === selected.technician_user_id)?.displayName ??
        null)
      : null;
  const detailScanLines = selected
    ? fieldWorkOrderScanLines({
        title: selected.title,
        description: selected.description,
        status: selected.status,
        priority: selected.priority,
        category: selected.category,
        propertyName: selected.property_properties?.name,
        unitLabel: selected.property_units?.unit_label,
        assigneeType: selected.assignee_type,
        technicianLabel: selectedTechnicianLabel,
        vendorName: selected.vendor_vendors?.name,
        submittedAt: selected.submitted_at
      })
    : [];
  const mobileDetailOpen = Boolean(selected);

  const filteredQueue = useMemo(() => {
    const q = queueQuery.trim().toLowerCase();
    if (!q) return workOrders;
    return workOrders.filter((row) =>
      `${row.title} ${row.status} ${row.priority} ${row.property_properties?.name ?? ""} ${row.property_units?.unit_label ?? ""} ${row.pm_residents?.display_name ?? ""} ${row.vendor_vendors?.name ?? ""}`
        .toLowerCase()
        .includes(q)
    );
  }, [workOrders, queueQuery]);

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

  const refresh = useCallback(async (preferredId?: string) => {
    const response = await fetch("/api/pm/maintenance");
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
    const nextId = preferredId || selectedId || rows[0]?.id || "";
    setSelectedId(nextId);
    if (nextId) {
      await loadDetail(nextId);
    } else {
      setUpdates([]);
    }
  }, [loadDetail, selectedId]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch("/api/pm/maintenance");
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
  }, []);

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
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
          Property Manager · Maintenance
        </p>
        <h1 className="font-display text-2xl font-semibold text-[var(--mpa-color-text-primary)]">
          Maintenance Command Center
        </h1>
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">
          One work-order workflow: review requests, prioritize, assign, monitor progress, and close.
        </p>
        <div className="flex flex-wrap gap-2">
          <Badge variant="info">{openCount} open</Badge>
          <Badge variant={emergencyCount > 0 ? "danger" : "neutral"}>
            {emergencyCount} emergency
          </Badge>
          <Badge variant={maintenanceReady ? "success" : "neutral"}>
            {maintenanceReady ? "Lifecycle ready" : "Awaiting first close"}
          </Badge>
        </div>
        <PmQuickActions
          actions={[
            { href: "/pm/mission-control", label: "Mission Control" },
            { href: "/pm/vendors", label: "Vendors" },
            { href: documentsHref("maintenance"), label: "Attachments" }
          ]}
        />
      </header>

      <PmDocumentsStrip
        entityType="maintenance"
        title="Work order attachments"
        detail="Photos, permits, and vendor evidence attach in Documents — ready for Document Intelligence."
      />

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
        <ErrorRetry
          title="Maintenance error"
          description={error}
          onRetry={() => {
            void (async () => {
              setError(null);
              try {
                await refresh(selectedId || undefined);
              } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load");
              }
            })();
          }}
        />
      ) : null}
      {notice ? <Alert variant="success">{notice}</Alert> : null}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <section
          className={`space-y-3 rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4 ${
            mobileDetailOpen ? "hidden xl:block" : ""
          }`}
        >
          <div className="flex flex-wrap items-end justify-between gap-2">
            <h2 className="text-sm font-semibold">Request queue</h2>
            <label className="min-w-[12rem] flex-1 text-xs">
              <span className="sr-only">Search work orders</span>
              <Input
                value={queueQuery}
                onChange={(e) => setQueueQuery(e.target.value)}
                placeholder="Search queue…"
                aria-label="Search work orders"
              />
            </label>
          </div>
          {workOrders.length === 0 ? (
            <EmptyState
              title={ownerEmptyStateCopy("maintenance").title}
              description={ownerEmptyStateCopy("maintenance").description}
            />
          ) : filteredQueue.length === 0 ? (
            <EmptyState title="No matching requests" description="Try a different search." />
          ) : (
            <ul className="space-y-2">
              {filteredQueue.map((row) => (
                <li key={row.id}>
                  <button
                    type="button"
                    onClick={() => void selectWorkOrder(row.id)}
                    className={`min-h-14 w-full rounded-md border border-l-[3px] px-3 py-3 text-left text-sm ${
                      row.priority === "emergency"
                        ? "border-l-[#C0392B]"
                        : row.priority === "high"
                          ? "border-l-[#B45309]"
                          : "border-l-[var(--mpa-color-border-default)]"
                    } ${
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
                            : resolveStatusBadgeVariant(row.status)
                        }
                      >
                        {WORK_ORDER_STATUS_LABELS[row.status]}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-[var(--mpa-color-text-secondary)]">
                      {row.pm_residents?.display_name ?? "Resident"} ·{" "}
                      {row.property_properties?.name ?? "Property"}
                      {row.property_units?.unit_label
                        ? ` · Unit ${row.property_units.unit_label}`
                        : ""}{" "}
                      · {WORK_ORDER_PRIORITY_LABELS[row.priority]}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section
          className={`space-y-4 rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4 ${
            !selected ? "hidden xl:block" : ""
          }`}
        >
          {!selected ? (
            <EmptyState title="Select a request" description="Review, prioritize, assign, and complete." />
          ) : (
            <>
              <div className="space-y-3">
                <div className="xl:hidden">
                  <Button
                    type="button"
                    variant="secondary"
                    className="min-h-11"
                    onClick={() => {
                      setSelectedId("");
                      setUpdates([]);
                      setCancelNote("");
                      setProgressNote("");
                    }}
                  >
                    Back to queue
                  </Button>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
                    Work order
                  </p>
                  <h2 className="font-display text-xl font-semibold md:text-2xl">{selected.title}</h2>
                  <p className="mt-1 text-sm leading-6 text-[var(--mpa-color-text-secondary)]">
                    {selected.description}
                  </p>
                  {selected.pm_residents?.display_name ? (
                    <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
                      Resident: {selected.pm_residents.display_name}
                    </p>
                  ) : null}
                  {selected.pm_residents ? (
                    <p className="mt-2">
                      <Link
                        href={`/shared/communications/conversations/new?workOrderId=${selected.id}`}
                        className="text-sm font-medium text-[var(--mpa-color-brand-primary)] underline"
                      >
                        Message tenant
                      </Link>
                    </p>
                  ) : null}
                </div>
                <dl className="grid gap-2 sm:grid-cols-2">
                  {detailScanLines.map((line) => (
                    <div
                      key={line.id}
                      className="rounded-md border border-[var(--mpa-color-border-subtle)] px-3 py-2"
                    >
                      <dt className="text-[11px] font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
                        {line.label}
                      </dt>
                      <dd className="mt-0.5 text-sm text-[var(--mpa-color-text-primary)]">
                        {line.value}
                      </dd>
                    </div>
                  ))}
                </dl>
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
                    setNotice("Vendor added to directory (same FO vendor identity).");
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

              {!["closed", "cancelled", "completed"].includes(selected.status) ? (
                <div className="space-y-3 rounded-md border border-[var(--mpa-color-brand-primary)]/25 bg-[var(--mpa-color-brand-primary-subtle,#E6F4EF)] p-3">
                  <div>
                    <h3 className="text-sm font-semibold">What to do next</h3>
                    <p className="mt-1 text-xs text-[var(--mpa-color-text-secondary)]">
                      Progress notes are shared with the resident timeline. Cancellation uses a
                      separate reason.
                    </p>
                  </div>
                  <Textarea
                    value={progressNote}
                    onChange={(event) => setProgressNote(event.target.value)}
                    placeholder="Optional progress note for the resident"
                    aria-label="Progress note"
                    rows={3}
                  />
                  <div className="grid gap-2 sm:grid-cols-3">
                    <Button
                      type="button"
                      className="min-h-11"
                      variant={fieldActionVariant("start", primaryAction)}
                      disabled={busy}
                      onClick={() => {
                        void run(async () => {
                          const response = await fetch("/api/pm/maintenance/progress", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              workOrderId: selected.id,
                              action: "start",
                              note: resolveProgressNote(progressNote, "start")
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
                      Start
                    </Button>
                    <Button
                      type="button"
                      className="min-h-11"
                      variant={fieldActionVariant("progress", primaryAction)}
                      disabled={busy}
                      onClick={() => {
                        void run(async () => {
                          const response = await fetch("/api/pm/maintenance/progress", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              workOrderId: selected.id,
                              action: "progress",
                              note: resolveProgressNote(progressNote, "progress")
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
                      Progress
                    </Button>
                    <Button
                      type="button"
                      className="min-h-11"
                      variant={fieldActionVariant("complete", primaryAction)}
                      disabled={busy}
                      onClick={() => {
                        void run(async () => {
                          const response = await fetch("/api/pm/maintenance/progress", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              workOrderId: selected.id,
                              action: "complete",
                              note:
                                progressNote.trim() ||
                                "Work completed. Awaiting resident confirmation."
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
                      Complete
                    </Button>
                  </div>
                </div>
              ) : null}

              {!["closed", "cancelled", "completed"].includes(selected.status) ? (
                <div className="space-y-2 rounded-md border border-[var(--mpa-color-border-subtle)] p-3">
                  <h3 className="text-sm font-semibold">Cancel work order</h3>
                  <p className="text-xs text-[var(--mpa-color-text-secondary)]">
                    Cancels open work that should not continue. Assignees and residents are notified.
                  </p>
                  <Button
                    type="button"
                    variant="secondary"
                    className="min-h-11"
                    disabled={busy}
                    onClick={() => setCancelConfirmOpen(true)}
                  >
                    Cancel work order
                  </Button>
                </div>
              ) : null}

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

      {selected ? (
        <ConfirmActionModal
          open={cancelConfirmOpen}
          onClose={() => setCancelConfirmOpen(false)}
          busy={busy}
          confirmLabel="Confirm cancellation"
          cancelLabel="Keep work order"
          title={workOrderCancelConfirmation({ title: selected.title }).title}
          onConfirm={() => {
            void run(async () => {
              const response = await fetch("/api/pm/maintenance/cancel", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  workOrderId: selected.id,
                  note: resolveCancelNote(cancelNote, "Work order cancelled.")
                })
              });
              const body = await response.json();
              if (!response.ok) {
                throw new Error(body.error ?? "Cancel failed");
              }
              setCancelNote("");
              setNotice("Work order cancelled.");
              setCancelConfirmOpen(false);
            });
          }}
        >
          {(() => {
            const copy = workOrderCancelConfirmation({
              title: selected.title,
              statusLabel: WORK_ORDER_STATUS_LABELS[selected.status]
            });
            return (
              <div className="space-y-3 text-[var(--mpa-color-text-secondary)]">
                <p>{copy.what}</p>
                <p>{copy.when}</p>
                <p className="font-medium text-[var(--mpa-color-text-primary)]">{copy.irreversible}</p>
                <label className="block space-y-1 text-sm">
                  <span className="text-xs font-medium text-[var(--mpa-color-text-primary)]">
                    Cancellation reason (optional)
                  </span>
                  <Textarea
                    value={cancelNote}
                    onChange={(event) => setCancelNote(event.target.value)}
                    rows={3}
                    placeholder="Why is this work being cancelled?"
                  />
                </label>
              </div>
            );
          })()}
        </ConfirmActionModal>
      ) : null}
    </main>
  );
}
