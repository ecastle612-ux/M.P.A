"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Button,
  Input,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeaderCell,
  TableRow
} from "@mpa/ui";
import {
  MAINTENANCE_PRIORITIES,
  MAINTENANCE_STATUSES,
  toMaintenanceCategoryLabel,
  toMaintenancePriorityLabel,
  toMaintenanceStatusLabel,
  type WorkOrderRecord
} from "../../lib/maintenance/contracts";
import type { WorkOrderListItem } from "../../lib/maintenance/server";
import { DataTableLayout } from "../presentation/data-table-layout";
import { ListWorkspaceHeader } from "../presentation/list-workspace-header";
import { ExperienceEmptyState } from "../experience/experience-empty-state";
import { getFilteredEmptyMessage } from "../../lib/experience/empty-states";
import { isWorkOrderOverdue, PriorityBadge, StatusBadge } from "./maintenance-badges";

const PAGE_SIZE = 10;

export function WorkOrdersTable({
  initialItems,
  permissions
}: {
  initialItems: WorkOrderListItem[];
  permissions: {
    canCreate: boolean;
    canUpdate: boolean;
    canAssign: boolean;
    canArchive: boolean;
    canDelete: boolean;
  };
}) {
  const [items] = useState(initialItems);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("open");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"updated" | "due" | "priority">("updated");
  const [page, setPage] = useState(1);

  const visibleItems = useMemo(() => items.filter((item) => item.deletedAt === null), [items]);

  const filteredItems = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    return visibleItems
      .filter((item) => {
        if (statusFilter === "open") {
          if (item.status === "completed" || item.status === "cancelled") return false;
        } else if (statusFilter !== "all" && item.status !== statusFilter) {
          return false;
        }
        if (priorityFilter !== "all" && item.priority !== priorityFilter) return false;
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
        recommendationsPlaceholder="Assign vendors to open requests to improve response visibility across your portfolio."
      />
    <DataTableLayout
      overline="Operations"
      title="Maintenance"
      description="Track work orders from request through completion — property, unit, and tenant context included."
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
      <TableContainer className="rounded-none border-0 shadow-none">
        <div className="overflow-x-auto">
          <Table>
            <TableHead>
              <TableRow>
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
                    <Link
                      href={`/maintenance/${item.id}`}
                      className="font-medium text-[var(--mpa-color-brand-primary)] hover:underline"
                    >
                      {item.workOrderNumber}
                    </Link>
                    <p className="text-sm text-[var(--mpa-color-text-primary)]">{item.title}</p>
                    <p className="text-xs text-[var(--mpa-color-text-secondary)]">{toMaintenanceCategoryLabel(item.category)}</p>
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
                      <Link href={`/maintenance/${item.id}`}>
                        <Button variant="secondary" size="sm">
                          View
                        </Button>
                      </Link>
                      {permissions.canUpdate || permissions.canAssign ? (
                        <Link href={`/maintenance/${item.id}/edit`}>
                          <Button variant="secondary" size="sm">
                            Edit
                          </Button>
                        </Link>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </TableContainer>
    </DataTableLayout>
    </div>
  );
}

function priorityRank(priority: WorkOrderRecord["priority"]): number {
  if (priority === "emergency") return 4;
  if (priority === "high") return 3;
  if (priority === "medium") return 2;
  return 1;
}
