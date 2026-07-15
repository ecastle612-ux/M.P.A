"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Button, Card, Input, Select, Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@mpa/ui";
import {
  MAINTENANCE_PRIORITIES,
  MAINTENANCE_STATUSES,
  toMaintenanceCategoryLabel,
  toMaintenancePriorityLabel,
  toMaintenanceStatusLabel,
  type WorkOrderRecord
} from "../../lib/maintenance/contracts";
import type { WorkOrderListItem } from "../../lib/maintenance/server";
import { MpaLogo } from "../branding/mpa-logo";
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
    return (
      <Card>
        <MpaLogo className="mb-2 h-12 w-auto" alt="M.P.A. logo" />
        <h1 className="text-xl font-semibold text-[var(--mpa-color-text-primary)]">Maintenance</h1>
        <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
          Track work orders from request through completion — property, unit, and tenant context included.
        </p>
        <div className="mt-4 rounded-lg border border-dashed border-[var(--mpa-color-border-default)] p-6 text-center">
          <p className="text-sm font-medium text-[var(--mpa-color-text-primary)]">No work orders yet</p>
          <p className="mt-1 text-xs text-[var(--mpa-color-text-secondary)]">
            Create your first maintenance request to start operational tracking.
          </p>
          {permissions.canCreate ? (
            <Link href="/maintenance/new" className="mt-4 inline-block">
              <Button>Create Work Order</Button>
            </Link>
          ) : null}
        </div>
      </Card>
    );
  }

  return (
    <Card className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-[var(--mpa-color-text-primary)]">Maintenance</h1>
          <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
            {filteredItems.length} work order{filteredItems.length === 1 ? "" : "s"} · Operations foundation
          </p>
        </div>
        {permissions.canCreate ? (
          <Link href="/maintenance/new">
            <Button>Create Work Order</Button>
          </Link>
        ) : null}
      </div>

      <div className="grid gap-3 md:grid-cols-4">
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
        <Select
          aria-label="Sort by"
          value={sortBy}
          onChange={(event) => setSortBy(event.target.value as typeof sortBy)}
        >
          <option value="updated">Recently updated</option>
          <option value="due">Due date</option>
          <option value="priority">Priority</option>
        </Select>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Work Order</TableHeaderCell>
              <TableHeaderCell>Property / Unit</TableHeaderCell>
              <TableHeaderCell>Priority</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell>Due</TableHeaderCell>
              <TableHeaderCell>Actions</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {pagedItems.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <Link href={`/maintenance/${item.id}`} className="font-medium text-[var(--mpa-color-brand-primary)] hover:underline">
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
                <TableCell>
                  <Link href={`/maintenance/${item.id}`} className="text-sm font-medium text-[var(--mpa-color-brand-primary)]">
                    View
                  </Link>
                  {(permissions.canUpdate || permissions.canAssign) && (
                    <>
                      {" · "}
                      <Link href={`/maintenance/${item.id}/edit`} className="text-sm font-medium text-[var(--mpa-color-brand-primary)]">
                        Edit
                      </Link>
                    </>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {pageCount > 1 ? (
        <div className="flex items-center justify-between text-sm">
          <p className="text-[var(--mpa-color-text-secondary)]">
            Page {currentPage} of {pageCount}
          </p>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" disabled={currentPage <= 1} onClick={() => setPage((value) => value - 1)}>
              Previous
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={currentPage >= pageCount}
              onClick={() => setPage((value) => value + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      ) : null}
    </Card>
  );
}

function priorityRank(priority: WorkOrderRecord["priority"]): number {
  if (priority === "emergency") return 4;
  if (priority === "high") return 3;
  if (priority === "medium") return 2;
  return 1;
}
