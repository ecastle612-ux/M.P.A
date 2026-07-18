"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Button,
  Drawer,
  Input,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeaderCell,
  TableRow,
  Textarea,
  useToast
} from "@mpa/ui";
import {
  MAINTENANCE_PRIORITIES,
  MAINTENANCE_STATUSES,
  toMaintenanceCategoryLabel,
  toMaintenancePriorityLabel,
  toMaintenanceStatusLabel,
  type MaintenancePriority,
  type MaintenanceStatus,
  type WorkOrderRecord
} from "../../lib/maintenance/contracts";
import type { WorkOrderListItem } from "../../lib/maintenance/server";
import { DataTableLayout } from "../presentation/data-table-layout";
import { ListWorkspaceHeader } from "../presentation/list-workspace-header";
import { ExperienceEmptyState } from "../experience/experience-empty-state";
import { getFilteredEmptyMessage } from "../../lib/experience/empty-states";
import { isWorkOrderOverdue, PriorityBadge, StatusBadge } from "./maintenance-badges";
import { readApiError } from "../../lib/api/client-error";

const PAGE_SIZE = 10;

type VendorOption = { id: string; businessName: string };

export function WorkOrdersTable({
  initialItems,
  permissions,
  vendors = [],
  initialStatusFilter = "open",
  initialPriorityFilter = "all"
}: {
  initialItems: WorkOrderListItem[];
  permissions: {
    canCreate: boolean;
    canUpdate: boolean;
    canAssign: boolean;
    canArchive: boolean;
    canDelete: boolean;
    canAssignVendor?: boolean;
  };
  vendors?: VendorOption[];
  initialStatusFilter?: string;
  initialPriorityFilter?: string;
}) {
  const { notify } = useToast();
  const [items, setItems] = useState(initialItems);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>(initialStatusFilter);
  const [priorityFilter, setPriorityFilter] = useState<string>(initialPriorityFilter);
  const [sortBy, setSortBy] = useState<"updated" | "due" | "priority">("updated");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [inspectId, setInspectId] = useState<string | null>(null);
  const [inspectStatus, setInspectStatus] = useState<MaintenanceStatus>("submitted");
  const [inspectPriority, setInspectPriority] = useState<MaintenancePriority>("medium");
  const [inspectNotes, setInspectNotes] = useState("");
  const [inspectVendorId, setInspectVendorId] = useState("");
  const [inspectBusy, setInspectBusy] = useState(false);

  const visibleItems = useMemo(() => items.filter((item) => item.deletedAt === null), [items]);

  const filteredItems = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    return visibleItems
      .filter((item) => {
        if (statusFilter === "open") {
          if (item.status === "completed" || item.status === "cancelled") return false;
        } else if (statusFilter === "unassigned") {
          if (item.status === "completed" || item.status === "cancelled") return false;
          if (item.status !== "submitted" && item.status !== "triaged") return false;
        } else if (statusFilter === "waiting_vendor") {
          if (item.status !== "assigned") return false;
        } else if (statusFilter === "waiting_resident") {
          if (item.status !== "completed" || item.archivedAt) return false;
        } else if (statusFilter !== "all" && item.status !== statusFilter) {
          return false;
        }
        if (priorityFilter === "emergency_high") {
          if (item.priority !== "emergency" && item.priority !== "high") return false;
        } else if (priorityFilter !== "all" && item.priority !== priorityFilter) {
          return false;
        }
        if (!trimmed) return true;
        return (
          item.title.toLowerCase().includes(trimmed) ||
          item.workOrderNumber.toLowerCase().includes(trimmed) ||
          (item.propertyName ?? "").toLowerCase().includes(trimmed) ||
          (item.unitNumber ?? "").toLowerCase().includes(trimmed) ||
          (item.tenantName ?? "").toLowerCase().includes(trimmed)
        );
      })
      .sort((left, right) => {
        if (sortBy === "due") {
          return (left.dueDate ?? "9999-99-99").localeCompare(right.dueDate ?? "9999-99-99");
        }
        if (sortBy === "priority") {
          return priorityRank(right.priority) - priorityRank(left.priority);
        }
        return right.updatedAt.localeCompare(left.updatedAt);
      });
  }, [visibleItems, query, statusFilter, priorityFilter, sortBy]);

  const pageCount = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pagedItems = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredItems.slice(start, start + PAGE_SIZE);
  }, [currentPage, filteredItems]);

  const inspectItem = inspectId ? items.find((item) => item.id === inspectId) ?? null : null;

  function toggleSelected(id: string) {
    setSelected((current) => (current.includes(id) ? current.filter((value) => value !== id) : [...current, id]));
  }

  function openInspector(item: WorkOrderListItem) {
    setInspectId(item.id);
    setInspectStatus(item.status);
    setInspectPriority(item.priority);
    setInspectNotes(item.internalNotes ?? "");
    setInspectVendorId("");
  }

  async function runBulk(
    action: "set_status" | "set_priority" | "assign_vendor" | "archive",
    extra: Record<string, unknown> = {}
  ) {
    if (selected.length === 0) {
      notify({ title: "Select work orders", description: "Choose at least one row.", variant: "warning" });
      return;
    }
    setBulkBusy(true);
    try {
      const response = await fetch("/api/maintenance/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, workOrderIds: selected, ...extra })
      });
      const json = (await response.json()) as {
        result?: { processed: number; results: Array<{ ok: boolean }> };
        error?: string;
      };
      if (!response.ok) throw new Error(readApiError(json, "Bulk action failed"));
      const failed = (json.result?.results ?? []).filter((row) => !row.ok).length;
      notify({
        title: "Bulk update finished",
        description:
          failed > 0
            ? `${json.result?.processed ?? 0} updated, ${failed} need attention.`
            : `${json.result?.processed ?? 0} work orders updated.`,
        variant: failed > 0 ? "warning" : "success"
      });
      if (action === "archive") {
        setItems((current) =>
          current.map((item) =>
            selected.includes(item.id) ? { ...item, archivedAt: new Date().toISOString() } : item
          )
        );
      }
      const nextStatus = extra["status"];
      if (action === "set_status" && typeof nextStatus === "string") {
        setItems((current) =>
          current.map((item) =>
            selected.includes(item.id) ? { ...item, status: nextStatus as MaintenanceStatus } : item
          )
        );
      }
      const nextPriority = extra["priority"];
      if (action === "set_priority" && typeof nextPriority === "string") {
        setItems((current) =>
          current.map((item) =>
            selected.includes(item.id) ? { ...item, priority: nextPriority as MaintenancePriority } : item
          )
        );
      }
      setSelected([]);
    } catch (error) {
      notify({
        title: "Bulk update failed",
        description: error instanceof Error ? error.message : "Try again",
        variant: "danger"
      });
    } finally {
      setBulkBusy(false);
    }
  }

  async function saveInspector() {
    if (!inspectItem) return;
    setInspectBusy(true);
    try {
      const response = await fetch(`/api/maintenance/${inspectItem.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update",
          status: inspectStatus,
          priority: inspectPriority,
          internalNotes: inspectNotes || null
        })
      });
      const json = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(readApiError(json, "Could not update work order"));

      if (inspectVendorId && permissions.canAssignVendor) {
        const assignResponse = await fetch(`/api/maintenance/${inspectItem.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "assign_vendor", vendorId: inspectVendorId })
        });
        if (!assignResponse.ok) {
          const assignJson = await assignResponse.json().catch(() => ({}));
          throw new Error(readApiError(assignJson, "Vendor assign failed"));
        }
      }

      setItems((current) =>
        current.map((item) =>
          item.id === inspectItem.id
            ? {
                ...item,
                status: inspectStatus,
                priority: inspectPriority,
                internalNotes: inspectNotes || null
              }
            : item
        )
      );
      notify({ title: "Work order updated", description: "List stays in place — no Edit screen.", variant: "success" });
      setInspectId(null);
    } catch (error) {
      notify({
        title: "Update failed",
        description: error instanceof Error ? error.message : "Try again",
        variant: "danger"
      });
    } finally {
      setInspectBusy(false);
    }
  }

  if (visibleItems.length === 0) {
    return <ExperienceEmptyState module="maintenance" canCreate={permissions.canCreate} />;
  }

  const openCount = visibleItems.filter((item) => item.status !== "completed" && item.status !== "cancelled").length;
  const emergencyCount = visibleItems.filter(
    (item) => item.priority === "emergency" && item.status !== "completed" && item.status !== "cancelled"
  ).length;
  const overdueCount = visibleItems.filter(
    (item) => isWorkOrderOverdue(item.dueDate, item.status) && item.status !== "completed"
  ).length;

  return (
    <div className="space-y-5">
      <ListWorkspaceHeader
        metrics={[
          { label: "Open", value: openCount.toString(), hint: `${visibleItems.length} total` },
          { label: "Emergency", value: emergencyCount.toString() },
          { label: "Overdue", value: overdueCount.toString() }
        ]}
        recommendationsPlaceholder="Use Resolve / Inspect on a row to assign, change status, or complete without Edit."
      />
      <DataTableLayout
        overline="Operations"
        title="Maintenance"
        description="Guided work — assign, progress, and close without hunting Edit screens."
        actions={
          permissions.canCreate ? (
            <Link href="/maintenance/new">
              <Button>Create work order</Button>
            </Link>
          ) : null
        }
        filters={
          <>
            <Input
              aria-label="Search"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
              placeholder="Work order #, title, property…"
            />
            <Select
              aria-label="Status"
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value);
                setPage(1);
              }}
            >
              <option value="open">Open work orders</option>
              <option value="unassigned">Waiting to assign</option>
              <option value="waiting_vendor">Waiting for vendor</option>
              <option value="waiting_resident">Waiting for resident</option>
              <option value="all">All statuses</option>
              {MAINTENANCE_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {toMaintenanceStatusLabel(status)}
                </option>
              ))}
            </Select>
            <Select
              aria-label="Priority"
              value={priorityFilter}
              onChange={(event) => {
                setPriorityFilter(event.target.value);
                setPage(1);
              }}
            >
              <option value="all">All priorities</option>
              <option value="emergency_high">Emergency + high</option>
              {MAINTENANCE_PRIORITIES.map((priority) => (
                <option key={priority} value={priority}>
                  {toMaintenancePriorityLabel(priority)}
                </option>
              ))}
            </Select>
            <Select aria-label="Sort by" value={sortBy} onChange={(event) => setSortBy(event.target.value as typeof sortBy)}>
              <option value="updated">Recently updated</option>
              <option value="due">Due date</option>
              <option value="priority">Priority</option>
            </Select>
          </>
        }
        showEmptyFiltered={filteredItems.length === 0}
        emptyFilteredMessage={getFilteredEmptyMessage("maintenance")}
        page={currentPage}
        pageCount={pageCount}
        totalItems={filteredItems.length}
        pageSize={PAGE_SIZE}
        onPreviousPage={() => setPage((value) => Math.max(1, value - 1))}
        onNextPage={() => setPage((value) => Math.min(pageCount, value + 1))}
      >
        {selected.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2 border-b border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface-muted)] px-4 py-3">
            <span className="text-sm font-medium">{selected.length} selected</span>
            {permissions.canUpdate || permissions.canAssign ? (
              <>
                <Button size="sm" variant="secondary" disabled={bulkBusy} onClick={() => void runBulk("set_status", { status: "triaged" })}>
                  Status · Triaged
                </Button>
                <Button size="sm" variant="secondary" disabled={bulkBusy} onClick={() => void runBulk("set_status", { status: "in_progress" })}>
                  Status · In progress
                </Button>
                <Button size="sm" variant="secondary" disabled={bulkBusy} onClick={() => void runBulk("set_status", { status: "completed" })}>
                  Status · Complete
                </Button>
                <Button size="sm" variant="secondary" disabled={bulkBusy} onClick={() => void runBulk("set_priority", { priority: "high" })}>
                  Priority · High
                </Button>
              </>
            ) : null}
            {permissions.canAssignVendor && vendors.length > 0 ? (
              <Button
                size="sm"
                variant="secondary"
                disabled={bulkBusy}
                onClick={() => {
                  const firstVendor = vendors[0];
                  if (!firstVendor) return;
                  void runBulk("assign_vendor", { vendorId: firstVendor.id });
                }}
              >
                Assign · {vendors[0]?.businessName ?? "Vendor"}
              </Button>
            ) : null}
            {permissions.canArchive ? (
              <Button size="sm" variant="secondary" disabled={bulkBusy} onClick={() => void runBulk("archive")}>
                Archive
              </Button>
            ) : null}
            <Button size="sm" variant="ghost" disabled={bulkBusy} onClick={() => setSelected([])}>
              Clear
            </Button>
          </div>
        ) : null}

        <TableContainer className="rounded-none border-0 shadow-none">
          <div className="overflow-x-auto">
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell className="w-10">
                    <span className="sr-only">Select</span>
                  </TableHeaderCell>
                  <TableHeaderCell>Work Order</TableHeaderCell>
                  <TableHeaderCell>Property / Unit</TableHeaderCell>
                  <TableHeaderCell>Priority</TableHeaderCell>
                  <TableHeaderCell>Status</TableHeaderCell>
                  <TableHeaderCell>Due</TableHeaderCell>
                  <TableHeaderCell className="text-right">Actions</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pagedItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <input
                        type="checkbox"
                        aria-label={`Select ${item.workOrderNumber}`}
                        checked={selected.includes(item.id)}
                        onChange={() => toggleSelected(item.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <button
                        type="button"
                        onClick={() => openInspector(item)}
                        className="text-left font-medium text-[var(--mpa-color-brand-primary)] hover:underline"
                      >
                        {item.workOrderNumber}
                      </button>
                      <p className="text-sm text-[var(--mpa-color-text-primary)]">{item.title}</p>
                      <p className="text-xs text-[var(--mpa-color-text-secondary)]">
                        {toMaintenanceCategoryLabel(item.category)}
                      </p>
                    </TableCell>
                    <TableCell>
                      <p>{item.propertyName ?? "—"}</p>
                      <p className="text-xs text-[var(--mpa-color-text-secondary)]">
                        {item.unitNumber ? `Unit ${item.unitNumber}` : "No unit"}
                        {item.tenantName ? ` · ${item.tenantName}` : ""}
                      </p>
                    </TableCell>
                    <TableCell>
                      <PriorityBadge priority={item.priority} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={item.status} />
                    </TableCell>
                    <TableCell>
                      <span className={isWorkOrderOverdue(item.dueDate, item.status) ? "font-medium text-red-700" : ""}>
                        {item.dueDate ?? "—"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-wrap justify-end gap-2">
                        <Button size="sm" onClick={() => openInspector(item)}>
                          Resolve
                        </Button>
                        <Link href={`/maintenance/${item.id}`}>
                          <Button variant="secondary" size="sm">
                            Open
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TableContainer>
      </DataTableLayout>

      <Drawer
        open={Boolean(inspectItem)}
        onClose={() => setInspectId(null)}
        title={inspectItem ? `${inspectItem.workOrderNumber} · Quick inspector` : "Work order"}
        footer={
          <div className="flex flex-wrap gap-2">
            <Button disabled={inspectBusy || !(permissions.canUpdate || permissions.canAssign)} onClick={() => void saveInspector()}>
              {inspectBusy ? "Saving…" : "Save changes"}
            </Button>
            {inspectItem ? (
              <Link href={`/maintenance/${inspectItem.id}`}>
                <Button variant="secondary">Full workflow</Button>
              </Link>
            ) : null}
            <Button variant="ghost" onClick={() => setInspectId(null)}>
              Close
            </Button>
          </div>
        }
      >
        {inspectItem ? (
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-[var(--mpa-color-text-primary)]">{inspectItem.title}</p>
              <p className="text-xs text-[var(--mpa-color-text-secondary)]">
                {inspectItem.propertyName ?? "Property"}
                {inspectItem.unitNumber ? ` · Unit ${inspectItem.unitNumber}` : ""}
              </p>
            </div>
            <label className="block space-y-1 text-sm">
              <span className="font-medium">Status</span>
              <Select
                aria-label="Inspector status"
                value={inspectStatus}
                onChange={(event) => setInspectStatus(event.target.value as MaintenanceStatus)}
              >
                {MAINTENANCE_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {toMaintenanceStatusLabel(status)}
                  </option>
                ))}
              </Select>
            </label>
            <label className="block space-y-1 text-sm">
              <span className="font-medium">Priority</span>
              <Select
                aria-label="Inspector priority"
                value={inspectPriority}
                onChange={(event) => setInspectPriority(event.target.value as MaintenancePriority)}
              >
                {MAINTENANCE_PRIORITIES.map((priority) => (
                  <option key={priority} value={priority}>
                    {toMaintenancePriorityLabel(priority)}
                  </option>
                ))}
              </Select>
            </label>
            {permissions.canAssignVendor && vendors.length > 0 ? (
              <label className="block space-y-1 text-sm">
                <span className="font-medium">Assign vendor</span>
                <Select
                  aria-label="Inspector vendor"
                  value={inspectVendorId}
                  onChange={(event) => setInspectVendorId(event.target.value)}
                >
                  <option value="">Keep current / none</option>
                  {vendors.map((vendor) => (
                    <option key={vendor.id} value={vendor.id}>
                      {vendor.businessName}
                    </option>
                  ))}
                </Select>
              </label>
            ) : null}
            <label className="block space-y-1 text-sm">
              <span className="font-medium">Internal notes</span>
              <Textarea
                aria-label="Inspector notes"
                rows={4}
                value={inspectNotes}
                onChange={(event) => setInspectNotes(event.target.value)}
              />
            </label>
            <p className="text-xs text-[var(--mpa-color-text-secondary)]">
              Phone-friendly inspector — same actions as the detail workflow for common updates.
            </p>
          </div>
        ) : null}
      </Drawer>
    </div>
  );
}

function priorityRank(priority: WorkOrderRecord["priority"]): number {
  if (priority === "emergency") return 4;
  if (priority === "high") return 3;
  if (priority === "medium") return 2;
  return 1;
}
