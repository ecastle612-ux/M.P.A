"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Badge,
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
import { toUnitOccupancyLabel, toUnitStatusLabel, type UnitRecord } from "../../lib/unit/contracts";
import { DataTableLayout } from "../presentation/data-table-layout";
import { ExperienceEmptyState } from "../experience/experience-empty-state";
import { getFilteredEmptyMessage } from "../../lib/experience/empty-states";

type UnitListItem = UnitRecord & { propertyName: string | null; assignedTenantName: string | null };
const PAGE_SIZE = 10;

export function UnitsTable({
  initialItems,
  permissions
}: {
  initialItems: UnitListItem[];
  permissions: {
    canCreate: boolean;
    canUpdate: boolean;
    canArchive: boolean;
    canDelete: boolean;
  };
}) {
  const [items, setItems] = useState(initialItems);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | UnitRecord["status"]>("all");
  const [occupancyFilter, setOccupancyFilter] = useState<"all" | UnitRecord["occupancyStatus"]>("all");
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [submittingAction, setSubmittingAction] = useState<string | null>(null);

  const visibleItems = useMemo(() => items.filter((item) => item.deletedAt === null), [items]);
  const filteredItems = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    return visibleItems.filter((item) => {
      if (statusFilter !== "all" && item.status !== statusFilter) return false;
      if (occupancyFilter !== "all" && item.occupancyStatus !== occupancyFilter) return false;
      if (!trimmed) return true;
      return (
        item.unitNumber.toLowerCase().includes(trimmed) ||
        (item.propertyName ?? "").toLowerCase().includes(trimmed) ||
        (item.assignedTenantName ?? "").toLowerCase().includes(trimmed)
      );
    });
  }, [visibleItems, query, statusFilter, occupancyFilter]);
  const pageCount = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pagedItems = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredItems.slice(start, start + PAGE_SIZE);
  }, [filteredItems, currentPage]);

  async function runAction(unitId: string, action: "archive" | "restore" | "soft_delete") {
    setError(null);
    setSubmittingAction(`${unitId}:${action}`);
    const response = await fetch(`/api/units/${unitId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action })
    });
    setSubmittingAction(null);
    if (!response.ok) {
      const payload = (await response.json()) as { error?: string };
      setError(payload.error ?? "Unit action failed.");
      return;
    }
    const payload = (await response.json()) as { unit?: UnitListItem };
    if (!payload.unit) return;
    if (action === "soft_delete") {
      setItems((current) => current.filter((item) => item.id !== unitId));
      return;
    }
    setItems((current) => current.map((item) => (item.id === unitId ? { ...item, ...payload.unit } : item)));
  }

  if (visibleItems.length === 0) {
    return <ExperienceEmptyState module="units" canCreate={permissions.canCreate} />;
  }

  return (
    <DataTableLayout
      overline="Portfolio"
      title="Units"
      description="Track occupancy, vacancy, and unit readiness across properties."
      actions={
        permissions.canCreate ? (
          <Link href="/units/new">
            <Button>Create unit</Button>
          </Link>
        ) : null
      }
      filters={
        <>
          <Input
            aria-label="Search units"
            placeholder="Search by unit, property, tenant"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(1);
            }}
          />
          <Select
            aria-label="Filter unit status"
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value as "all" | UnitRecord["status"]);
              setPage(1);
            }}
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="archived">Archived</option>
          </Select>
          <Select
            aria-label="Filter occupancy"
            value={occupancyFilter}
            onChange={(event) => {
              setOccupancyFilter(event.target.value as "all" | UnitRecord["occupancyStatus"]);
              setPage(1);
            }}
          >
            <option value="all">All occupancy</option>
            <option value="occupied">Occupied</option>
            <option value="vacant_ready">Vacant ready</option>
            <option value="vacant_not_ready">Vacant not ready</option>
            <option value="notice">Notice</option>
            <option value="offline">Offline</option>
          </Select>
        </>
      }
      error={error}
      showEmptyFiltered={filteredItems.length === 0}
      emptyFilteredMessage={getFilteredEmptyMessage("units")}
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
              <tr>
                <TableHeaderCell>Unit</TableHeaderCell>
                <TableHeaderCell>Property</TableHeaderCell>
                <TableHeaderCell>Assigned Tenant</TableHeaderCell>
                <TableHeaderCell>Occupancy</TableHeaderCell>
                <TableHeaderCell>Availability</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell>Rent</TableHeaderCell>
                <TableHeaderCell className="text-right">Actions</TableHeaderCell>
              </tr>
            </TableHead>
            <TableBody>
              {pagedItems.map((item) => {
                const isArchived = item.status === "archived";
                const busyArchive =
                  submittingAction === `${item.id}:archive` || submittingAction === `${item.id}:restore`;
                const busyDelete = submittingAction === `${item.id}:soft_delete`;
                const availability =
                  item.status !== "active"
                    ? "Unavailable"
                    : item.occupancyStatus === "occupied"
                      ? "Occupied"
                      : item.occupancyStatus === "vacant_ready"
                        ? "Ready"
                        : item.occupancyStatus === "vacant_not_ready"
                          ? "Turnover"
                          : item.occupancyStatus === "notice"
                            ? "Notice"
                            : "Offline";
                return (
                  <TableRow key={item.id}>
                    <TableCell>
                      <p className="font-medium text-[var(--mpa-color-text-primary)]">{item.unitNumber}</p>
                      <p className="text-xs text-[var(--mpa-color-text-secondary)]">
                        {item.bedrooms ?? "-"} bd / {item.bathrooms ?? "-"} ba / {item.squareFeet ?? "-"} sf
                      </p>
                    </TableCell>
                    <TableCell>{item.propertyName ?? "Unknown property"}</TableCell>
                    <TableCell>{item.assignedTenantName ?? "Unassigned"}</TableCell>
                    <TableCell>
                      <Badge showDot variant={item.occupancyStatus === "occupied" ? "success" : "warning"}>
                        {toUnitOccupancyLabel(item.occupancyStatus)}
                      </Badge>
                    </TableCell>
                    <TableCell>{availability}</TableCell>
                    <TableCell>
                      <Badge
                        showDot
                        variant={item.status === "active" ? "success" : item.status === "archived" ? "warning" : "info"}
                      >
                        {toUnitStatusLabel(item.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {item.rentAmount !== null ? formatCurrency(item.rentAmount, item.currencyCode) : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-wrap justify-end gap-2">
                        <Link href={`/units/${item.id}`}>
                          <Button variant="secondary" size="sm">
                            View
                          </Button>
                        </Link>
                        {permissions.canUpdate ? (
                          <Link href={`/units/${item.id}/edit`}>
                            <Button variant="secondary" size="sm">
                              Edit
                            </Button>
                          </Link>
                        ) : null}
                        {permissions.canArchive ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={busyArchive}
                            onClick={() => runAction(item.id, isArchived ? "restore" : "archive")}
                          >
                            {busyArchive ? "Saving..." : isArchived ? "Restore" : "Archive"}
                          </Button>
                        ) : null}
                        {permissions.canDelete ? (
                          <Button
                            variant="danger"
                            size="sm"
                            disabled={busyDelete}
                            onClick={() => runAction(item.id, "soft_delete")}
                          >
                            {busyDelete ? "Deleting..." : "Delete"}
                          </Button>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </TableContainer>
    </DataTableLayout>
  );
}

function formatCurrency(value: number, currencyCode: string): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: currencyCode }).format(value);
}
