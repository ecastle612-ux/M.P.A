"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  WORK_ORDER_CATEGORIES,
  WORK_ORDER_CATEGORY_LABELS,
  WORK_ORDER_PRIORITY_LABELS,
  WORK_ORDER_STATUS_LABELS,
  ownerEmptyStateCopy,
  type WorkOrderCategory,
  type WorkOrderPriority,
  type WorkOrderStatus
} from "@mpa/shared";
import { resolveStatusBadgeVariant, Alert, Badge, Button, EmptyState, Input, Select, Skeleton, Textarea } from "@mpa/ui";
import { ConfirmActionModal } from "../shell/confirm-action-modal";
import { ErrorRetry } from "../shell/error-retry";
import {
  FoDocumentsStrip,
  FoPageChrome,
  FoPriorityLegend,
  FoQuickActions,
  documentsHref
} from "../shell/fo-workspace";
import {
  workOrderCancelConfirmation,
  workOrderCompleteConfirmation
} from "../../lib/ui/destructive-confirm-copy";
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
  facility_asset_label: string | null;
  due_at: string | null;
  assignee_type: string;
  technician_user_id: string | null;
  vendor_id: string | null;
  submitted_at: string;
  property_properties?: { id?: string; name: string } | null;
  property_units?: { id?: string; unit_label: string } | null;
  vendor_vendors?: { name: string } | null;
};

type Technician = { userId: string; displayName: string; email: string | null };
type Vendor = { id: string; name: string; email: string | null };
type Property = {
  id: string;
  name: string;
  property_units?: Array<{ id: string; unit_label: string }>;
};

export type FacilityWorkspaceDomain =
  | "operations"
  | "preventive"
  | "inspections"
  | "safety"
  | "compliance"
  | "inventory"
  | "parts"
  | "building_systems";

const DOMAIN_META: Record<
  FacilityWorkspaceDomain,
  {
    title: string;
    description: string;
    category: WorkOrderCategory | "all";
    createDefaultCategory: WorkOrderCategory;
  }
> = {
  operations: {
    title: "Facility Operations",
    description:
      "Create, assign, and complete facility work — emergency, priority, and scheduled corrective jobs.",
    category: "all",
    createDefaultCategory: "general"
  },
  preventive: {
    title: "Preventive Work",
    description: "Facility work orders categorized for preventive maintenance tasks.",
    category: "preventive",
    createDefaultCategory: "preventive"
  },
  inspections: {
    title: "Inspection Work",
    description: "Facility work orders categorized for inspection tasks.",
    category: "inspection",
    createDefaultCategory: "inspection"
  },
  safety: {
    title: "Safety Work",
    description: "Facility work orders categorized for safety tasks.",
    category: "safety",
    createDefaultCategory: "safety"
  },
  compliance: {
    title: "Compliance Work",
    description: "Facility work orders categorized for compliance tasks.",
    category: "compliance",
    createDefaultCategory: "compliance"
  },
  inventory: {
    title: "Inventory Work",
    description: "Facility work orders categorized for inventory and materials tasks.",
    category: "inventory",
    createDefaultCategory: "inventory"
  },
  parts: {
    title: "Parts Work",
    description: "Facility work orders categorized for parts-related tasks.",
    category: "parts",
    createDefaultCategory: "parts"
  },
  building_systems: {
    title: "Building Systems Work",
    description: "Facility work orders categorized for building-systems tasks.",
    category: "building_system",
    createDefaultCategory: "building_system"
  }
};

function isOpen(status: WorkOrderStatus) {
  return !["closed", "cancelled"].includes(status);
}

export function FacilityOperationsWorkspace({ domain }: { domain: FacilityWorkspaceDomain }) {
  const meta = DOMAIN_META[domain];
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [updates, setUpdates] = useState<
    Array<{ id: string; body: string; created_at: string; actor_role: string }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
  const [completeConfirmOpen, setCompleteConfirmOpen] = useState(false);
  const [priority, setPriority] = useState<WorkOrderPriority>("normal");
  const [assigneeType, setAssigneeType] = useState<"technician" | "vendor">("technician");
  const [technicianUserId, setTechnicianUserId] = useState("");
  const [vendorId, setVendorId] = useState("");
  const [progressNote, setProgressNote] = useState("");
  const [cancelNote, setCancelNote] = useState("");
  const [queueQuery, setQueueQuery] = useState("");
  const [createTitle, setCreateTitle] = useState("");
  const [createDescription, setCreateDescription] = useState("");
  const [createCategory, setCreateCategory] = useState<WorkOrderCategory>(meta.createDefaultCategory);
  const [createPriority, setCreatePriority] = useState<WorkOrderPriority>("normal");
  const [createPropertyId, setCreatePropertyId] = useState("");
  const [createUnitId, setCreateUnitId] = useState("");
  const [createAssetLabel, setCreateAssetLabel] = useState("");
  const [createDueAt, setCreateDueAt] = useState("");

  const selected = useMemo(
    () => workOrders.find((row) => row.id === selectedId) ?? null,
    [workOrders, selectedId]
  );

  const createUnits = useMemo(() => {
    const property = properties.find((row) => row.id === createPropertyId);
    return property?.property_units ?? [];
  }, [properties, createPropertyId]);

  const filteredQueue = useMemo(() => {
    const q = queueQuery.trim().toLowerCase();
    if (!q) return workOrders;
    return workOrders.filter((row) =>
      `${row.title} ${row.status} ${row.priority} ${row.category} ${row.facility_asset_label ?? ""} ${row.property_properties?.name ?? ""} ${row.vendor_vendors?.name ?? ""}`
        .toLowerCase()
        .includes(q)
    );
  }, [workOrders, queueQuery]);

  const loadDetail = useCallback(async (workOrderId: string) => {
    if (!workOrderId) {
      setUpdates([]);
      return;
    }
    const response = await fetch(`/api/facility/operations/${workOrderId}`);
    const body = await response.json();
    if (!response.ok) {
      throw new Error(body.error ?? "Failed to load work order");
    }
    setUpdates(body.updates ?? []);
    if (body.workOrder?.priority) {
      setPriority(body.workOrder.priority as WorkOrderPriority);
    }
  }, []);

  const refresh = useCallback(
    async (preferredId?: string) => {
      const categoryParam =
        meta.category === "all" ? "" : `?category=${encodeURIComponent(meta.category)}`;
      const response = await fetch(`/api/facility/operations${categoryParam}`);
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.error ?? "Failed to load facility operations");
      }
      const rows = (body.workOrders ?? []) as WorkOrder[];
      setWorkOrders(rows);
      setTechnicians(body.technicians ?? []);
      setVendors(body.vendors ?? []);
      setProperties(body.properties ?? []);
      if (!createPropertyId && body.properties?.[0]?.id) {
        setCreatePropertyId(body.properties[0].id as string);
      }
      const nextId = preferredId || selectedId || rows[0]?.id || "";
      setSelectedId(nextId);
      if (nextId) {
        await loadDetail(nextId);
      } else {
        setUpdates([]);
      }
    },
    [createPropertyId, loadDetail, meta.category, selectedId]
  );

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
    // Initial load only
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const openCount = workOrders.filter((row) => isOpen(row.status)).length;
  const emergencyCount = workOrders.filter(
    (row) => row.priority === "emergency" && isOpen(row.status)
  ).length;
  const canMutate = selected && isOpen(selected.status) && selected.status !== "completed";
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
        assetLabel: selected.facility_asset_label,
        assigneeType: selected.assignee_type,
        technicianLabel: selectedTechnicianLabel,
        vendorName: selected.vendor_vendors?.name,
        submittedAt: selected.submitted_at,
        dueAt: selected.due_at
      })
    : [];
  const mobileDetailOpen = Boolean(selected);

  return (
    <FoPageChrome
      crumbs={[
        { href: "/facility/mission-control", label: "Facility Mission Control" },
        { label: meta.title }
      ]}
      eyebrow="Facility Operations"
      title={meta.title}
      description={meta.description}
      actions={
        <div className="flex flex-wrap gap-2">
          <Badge variant="info">{openCount} open</Badge>
          <Badge variant={emergencyCount > 0 ? "danger" : "neutral"}>
            {emergencyCount} emergency
          </Badge>
        </div>
      }
    >
      <FoQuickActions
        actions={[
          { href: "/facility/mission-control", label: "Mission Control", primary: true },
          { href: "/facility/operations", label: "All operations" },
          { href: "/facility/assets", label: "Buildings" },
          { href: documentsHref("maintenance"), label: "Documents" }
        ]}
      />

      <FoDocumentsStrip entityType="maintenance" />

      {error ? (
        <ErrorRetry
          title="Facility operations error"
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

      <form
        className="grid gap-3 rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4 md:grid-cols-2"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          void run(async () => {
            const title = createTitle.trim();
            const description = createDescription.trim();
            const propertyId = createPropertyId.trim();
            if (title.length < 3) {
              throw new Error("Enter a title (at least 3 characters).");
            }
            if (description.length < 3) {
              throw new Error("Enter a description (at least 3 characters).");
            }
            if (!propertyId) {
              throw new Error("Select a building before creating work.");
            }
            if (!properties.some((property) => property.id === propertyId)) {
              throw new Error("Selected building is no longer available. Refresh and try again.");
            }
            const response = await fetch("/api/facility/operations", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                title,
                description,
                category: createCategory,
                priority: createPriority,
                propertyId,
                unitId: createUnitId || undefined,
                facilityAssetLabel: createAssetLabel || undefined,
                dueAt: createDueAt ? new Date(createDueAt).toISOString() : undefined
              })
            });
            const body = await response.json();
            if (!response.ok) {
              throw new Error(body.error ?? "Failed to create work");
            }
            setCreateTitle("");
            setCreateDescription("");
            setCreateAssetLabel("");
            setCreateDueAt("");
            setSelectedId(body.workOrder.id as string);
            setNotice("Facility work created.");
            await refresh(body.workOrder.id as string);
          });
        }}
      >
        <div className="md:col-span-2">
          <h2 className="text-sm font-semibold text-[var(--mpa-color-text-primary)]">
            Create facility work
          </h2>
          <p className="mt-1 text-xs text-[var(--mpa-color-text-secondary)]">
            Building required. Asset label and due date are optional.
          </p>
        </div>
        <label className="space-y-1 text-xs md:col-span-2">
          <span className="font-medium">Title</span>
          <Input
            value={createTitle}
            onChange={(e) => setCreateTitle(e.target.value)}
            required
            minLength={3}
            placeholder="Roof leak at mechanical penthouse"
          />
        </label>
        <label className="space-y-1 text-xs md:col-span-2">
          <span className="font-medium">Description</span>
          <Textarea
            value={createDescription}
            onChange={(e) => setCreateDescription(e.target.value)}
            required
            minLength={3}
            rows={3}
          />
        </label>
        <label className="space-y-1 text-xs">
          <span className="font-medium">Building</span>
          <Select
            value={createPropertyId}
            onChange={(e) => {
              setCreatePropertyId(e.target.value);
              setCreateUnitId("");
            }}
            aria-required="true"
          >
            <option value="">Select building</option>
            {properties.map((property) => (
              <option key={property.id} value={property.id}>
                {property.name}
              </option>
            ))}
          </Select>
        </label>
        <label className="space-y-1 text-xs">
          <span className="font-medium">Location / unit (optional)</span>
          <Select value={createUnitId} onChange={(e) => setCreateUnitId(e.target.value)}>
            <option value="">None</option>
            {createUnits.map((unit) => (
              <option key={unit.id} value={unit.id}>
                {unit.unit_label}
              </option>
            ))}
          </Select>
        </label>
        <label className="space-y-1 text-xs">
          <span className="font-medium">Category</span>
          <Select
            value={createCategory}
            onChange={(e) => setCreateCategory(e.target.value as WorkOrderCategory)}
          >
            {WORK_ORDER_CATEGORIES.map((value) => (
              <option key={value} value={value}>
                {WORK_ORDER_CATEGORY_LABELS[value]}
              </option>
            ))}
          </Select>
        </label>
        <label className="space-y-1 text-xs">
          <span className="font-medium">Priority</span>
          <Select
            value={createPriority}
            onChange={(e) => setCreatePriority(e.target.value as WorkOrderPriority)}
          >
            {Object.entries(WORK_ORDER_PRIORITY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </label>
        <label className="space-y-1 text-xs">
          <span className="font-medium">Asset / system label</span>
          <Input
            value={createAssetLabel}
            onChange={(e) => setCreateAssetLabel(e.target.value)}
            placeholder="AHU-2 · Boiler · Elevator"
          />
        </label>
        <label className="space-y-1 text-xs">
          <span className="font-medium">Due</span>
          <Input
            type="datetime-local"
            value={createDueAt}
            onChange={(e) => setCreateDueAt(e.target.value)}
          />
        </label>
        <div className="md:col-span-2">
          {properties.length === 0 ? (
            <p className="text-sm text-[var(--mpa-color-text-secondary)]">
              Add a building in{" "}
              <Link href="/facility/assets" className="text-[var(--mpa-color-brand-primary)] underline">
                Assets
              </Link>{" "}
              before creating work.
            </p>
          ) : (
            <Button type="submit" disabled={busy}>
              Create work
            </Button>
          )}
        </div>
      </form>

      <FoPriorityLegend />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <section
          className={`space-y-3 rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4 ${
            mobileDetailOpen ? "hidden xl:block" : ""
          }`}
        >
          <div className="flex flex-wrap items-end justify-between gap-2">
            <h2 className="text-sm font-semibold">Work queue</h2>
            <label className="min-w-[12rem] flex-1 text-xs">
              <span className="sr-only">Search work orders</span>
              <Input
                value={queueQuery}
                onChange={(e) => setQueueQuery(e.target.value)}
                placeholder="Search queue…"
                aria-label="Search facility work"
              />
            </label>
          </div>
          {workOrders.length === 0 ? (
            <EmptyState
              title={ownerEmptyStateCopy("fo_operations").title}
              description={ownerEmptyStateCopy("fo_operations").description}
            />
          ) : filteredQueue.length === 0 ? (
            <EmptyState title="No matching work" description="Try a different search." />
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
                      {row.property_properties?.name ?? "Building"}
                      {row.facility_asset_label ? ` · ${row.facility_asset_label}` : ""} ·{" "}
                      {WORK_ORDER_PRIORITY_LABELS[row.priority]} ·{" "}
                      {WORK_ORDER_CATEGORY_LABELS[row.category as WorkOrderCategory] ?? row.category}
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
            <EmptyState
              title="Select facility work"
              description="Prioritize, assign, start, progress, complete, or cancel."
            />
          ) : (
            <>
              <div className="space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-2 xl:hidden">
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

              {canMutate ? (
                <>
                  <div className="space-y-3 rounded-md border border-[var(--mpa-color-brand-primary)]/25 bg-[var(--mpa-color-brand-primary-subtle,#E6F4EF)] p-3">
                    <div>
                      <h3 className="text-sm font-semibold">What to do next</h3>
                      <p className="mt-1 text-xs text-[var(--mpa-color-text-secondary)]">
                        {primaryAction === "start"
                          ? "Start this work when you begin on site."
                          : primaryAction === "complete"
                            ? "Record progress as needed, then complete when finished."
                            : "Update progress or complete when the job is done."}
                      </p>
                    </div>
                    <Textarea
                      value={progressNote}
                      onChange={(e) => setProgressNote(e.target.value)}
                      rows={3}
                      placeholder="Optional progress note"
                      aria-label="Progress note"
                    />
                    <div className="grid gap-2 sm:grid-cols-3">
                      <Button
                        type="button"
                        className="min-h-11"
                        variant={fieldActionVariant("start", primaryAction)}
                        disabled={busy}
                        onClick={() =>
                          void run(async () => {
                            const note = resolveProgressNote(progressNote, "start");
                            const response = await fetch("/api/facility/operations/progress", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                workOrderId: selected.id,
                                action: "start",
                                note
                              })
                            });
                            const body = await response.json();
                            if (!response.ok) {
                              throw new Error(body.error ?? "Progress failed");
                            }
                            setProgressNote("");
                            setNotice("Work started.");
                          })
                        }
                      >
                        Start
                      </Button>
                      <Button
                        type="button"
                        className="min-h-11"
                        variant={fieldActionVariant("progress", primaryAction)}
                        disabled={busy}
                        onClick={() =>
                          void run(async () => {
                            const note = resolveProgressNote(progressNote, "progress");
                            const response = await fetch("/api/facility/operations/progress", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                workOrderId: selected.id,
                                action: "progress",
                                note
                              })
                            });
                            const body = await response.json();
                            if (!response.ok) {
                              throw new Error(body.error ?? "Progress failed");
                            }
                            setProgressNote("");
                            setNotice("Progress saved.");
                          })
                        }
                      >
                        Progress
                      </Button>
                      <Button
                        type="button"
                        className="min-h-11"
                        variant={fieldActionVariant("complete", primaryAction)}
                        disabled={busy}
                        onClick={() => setCompleteConfirmOpen(true)}
                      >
                        Complete
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-[var(--mpa-color-text-secondary)]">
                      Dispatch controls
                    </h3>
                    <div className="grid gap-3 md:grid-cols-2">
                      <form
                        className="space-y-2 rounded-md border border-[var(--mpa-color-border-subtle)] p-3"
                        onSubmit={(event) => {
                          event.preventDefault();
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
                            setNotice("Priority updated.");
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
                        <Button type="submit" className="min-h-11" disabled={busy}>
                          Save priority
                        </Button>
                      </form>

                      <form
                        className="space-y-2 rounded-md border border-[var(--mpa-color-border-subtle)] p-3"
                        onSubmit={(event) => {
                          event.preventDefault();
                          void run(async () => {
                            const response = await fetch("/api/facility/operations/assign", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                workOrderId: selected.id,
                                assigneeType,
                                technicianUserId:
                                  assigneeType === "technician"
                                    ? technicianUserId || undefined
                                    : undefined,
                                vendorId:
                                  assigneeType === "vendor" ? vendorId || undefined : undefined
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
                          <>
                            <Select
                              value={vendorId}
                              onChange={(event) => setVendorId(event.target.value)}
                              required
                            >
                              <option value="">Select vendor</option>
                              {vendors.map((vendor) => (
                                <option key={vendor.id} value={vendor.id}>
                                  {vendor.name}
                                </option>
                              ))}
                            </Select>
                            {vendors.length === 0 ? (
                              <p
                                className="text-xs text-[var(--mpa-color-text-secondary)]"
                                data-testid="fo-assign-empty-vendors"
                              >
                                No facility vendors yet.{" "}
                                <Link
                                  href="/facility/vendors"
                                  className="font-medium text-[var(--mpa-color-brand-primary)] underline"
                                >
                                  Add a vendor
                                </Link>{" "}
                                first, then assign this work order.
                              </p>
                            ) : null}
                          </>
                        )}
                        <Button
                          type="submit"
                          className="min-h-11"
                          disabled={busy || (assigneeType === "vendor" && vendors.length === 0)}
                        >
                          Assign
                        </Button>
                      </form>
                    </div>
                  </div>

                  <div className="space-y-2 rounded-md border border-[var(--mpa-color-border-subtle)] p-3">
                    <h3 className="text-sm font-semibold">Cancel</h3>
                    <p className="text-xs text-[var(--mpa-color-text-secondary)]">
                      Cancellation uses its own reason — not the progress note above.
                    </p>
                    <Button
                      type="button"
                      disabled={busy}
                      variant="secondary"
                      className="min-h-11"
                      onClick={() => setCancelConfirmOpen(true)}
                    >
                      Cancel work order
                    </Button>
                  </div>
                </>
              ) : (
                <p className="text-sm text-[var(--mpa-color-text-secondary)]">
                  This work order is {WORK_ORDER_STATUS_LABELS[selected.status].toLowerCase()}. No
                  further lifecycle actions are available.
                </p>
              )}

              <section className="space-y-2">
                <h3 className="text-sm font-semibold">History</h3>
                {updates.length === 0 ? (
                  <p className="text-sm text-[var(--mpa-color-text-secondary)]">No updates yet.</p>
                ) : (
                  <ul className="space-y-2">
                    {updates.map((update) => (
                      <li
                        key={update.id}
                        className="rounded-md border border-[var(--mpa-color-border-subtle)] px-3 py-2 text-sm"
                      >
                        <p className="break-words">{update.body}</p>
                        <p className="mt-1 text-xs text-[var(--mpa-color-text-secondary)]">
                          {update.actor_role} · {new Date(update.created_at).toLocaleString()}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </>
          )}
        </section>
      </div>

      {selected ? (
        <>
          <ConfirmActionModal
            open={cancelConfirmOpen}
            onClose={() => setCancelConfirmOpen(false)}
            busy={busy}
            confirmLabel="Confirm cancellation"
            cancelLabel="Keep work order"
            title={workOrderCancelConfirmation({ title: selected.title }).title}
            onConfirm={() => {
              void run(async () => {
                const response = await fetch("/api/facility/operations/cancel", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    workOrderId: selected.id,
                    note: resolveCancelNote(cancelNote)
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

          <ConfirmActionModal
            open={completeConfirmOpen}
            onClose={() => setCompleteConfirmOpen(false)}
            busy={busy}
            confirmLabel="Confirm completion"
            cancelLabel="Keep open"
            danger={false}
            title={workOrderCompleteConfirmation({ title: selected.title }).title}
            onConfirm={() => {
              void run(async () => {
                const note = resolveProgressNote(progressNote, "complete");
                const response = await fetch("/api/facility/operations/progress", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    workOrderId: selected.id,
                    action: "complete",
                    note
                  })
                });
                const body = await response.json();
                if (!response.ok) {
                  throw new Error(body.error ?? "Progress failed");
                }
                setProgressNote("");
                setNotice("Work completed and closed.");
                setCompleteConfirmOpen(false);
              });
            }}
          >
            {(() => {
              const copy = workOrderCompleteConfirmation({ title: selected.title });
              return (
                <div className="space-y-2 text-[var(--mpa-color-text-secondary)]">
                  <p>{copy.what}</p>
                  <p>{copy.when}</p>
                  <p className="font-medium text-[var(--mpa-color-text-primary)]">{copy.irreversible}</p>
                  {progressNote.trim() ? (
                    <p className="text-sm">
                      Completion note: <span className="text-[var(--mpa-color-text-primary)]">{progressNote.trim()}</span>
                    </p>
                  ) : null}
                </div>
              );
            })()}
          </ConfirmActionModal>
        </>
      ) : null}
    </FoPageChrome>
  );
}
