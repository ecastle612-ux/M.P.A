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
import { DataTableLayout } from "../presentation/data-table-layout";
import { ListWorkspaceHeader } from "../presentation/list-workspace-header";
import { ExperienceEmptyState } from "../experience/experience-empty-state";
import { getFilteredEmptyMessage } from "../../lib/experience/empty-states";
import { toPropertyStatusLabel, toPropertyTypeLabel, type PropertyRecord } from "../../lib/property/contracts";

type PropertyListItem = PropertyRecord & {
  unitCount: number;
  occupiedUnits: number;
  vacancyUnits: number;
  tenantCount: number;
};
const PAGE_SIZE = 10;

export function PropertiesTable({
  initialItems,
  permissions
}: {
  initialItems: PropertyListItem[];
  permissions: {
    canCreate: boolean;
    canUpdate: boolean;
    canArchive: boolean;
    canDelete: boolean;
  };
}) {
  const [items, setItems] = useState(initialItems);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | PropertyRecord["status"]>("all");
  const [typeFilter, setTypeFilter] = useState<"all" | PropertyRecord["propertyType"]>("all");
  const [page, setPage] = useState(1);
  const [submittingAction, setSubmittingAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const visibleItems = useMemo(() => items.filter((item) => item.deletedAt === null), [items]);
  const filteredItems = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    return visibleItems.filter((item) => {
      if (statusFilter !== "all" && item.status !== statusFilter) return false;
      if (typeFilter !== "all" && item.propertyType !== typeFilter) return false;
      if (!trimmed) return true;
      return (
        item.name.toLowerCase().includes(trimmed) ||
        item.city.toLowerCase().includes(trimmed) ||
        item.stateRegion.toLowerCase().includes(trimmed) ||
        (item.code ?? "").toLowerCase().includes(trimmed)
      );
    });
  }, [visibleItems, query, statusFilter, typeFilter]);
  const pageCount = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pagedItems = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredItems.slice(start, start + PAGE_SIZE);
  }, [filteredItems, currentPage]);

  async function runAction(propertyId: string, action: "archive" | "restore" | "soft_delete") {
    setError(null);
    setSubmittingAction(`${propertyId}:${action}`);
    const response = await fetch(`/api/properties/${propertyId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action })
    });
    setSubmittingAction(null);
    if (!response.ok) {
      const payload = (await response.json()) as { error?: string };
      setError(payload.error ?? "Property action failed.");
      return;
    }
    const payload = (await response.json()) as { property?: PropertyListItem };
    if (!payload.property) {
      return;
    }
    if (action === "soft_delete") {
      setItems((current) => current.filter((item) => item.id !== propertyId));
      return;
    }
    setItems((current) => current.map((item) => (item.id === propertyId ? { ...item, ...payload.property } : item)));
  }

  if (visibleItems.length === 0) {
    return <ExperienceEmptyState module="properties" canCreate={permissions.canCreate} />;
  }

  const totalUnits = visibleItems.reduce((sum, item) => sum + item.unitCount, 0);
  const totalOccupied = visibleItems.reduce((sum, item) => sum + item.occupiedUnits, 0);
  const totalVacancies = visibleItems.reduce((sum, item) => sum + item.vacancyUnits, 0);
  const activeProperties = visibleItems.filter((item) => item.status === "active").length;
  const occupancyRate = totalUnits === 0 ? 0 : Math.round((totalOccupied / totalUnits) * 100);

  return (
    <div className="space-y-4">
      <ListWorkspaceHeader
        metrics={[
          { label: "Properties", value: visibleItems.length.toString(), hint: `${activeProperties} active` },
          { label: "Total units", value: totalUnits.toString() },
          { label: "Occupancy", value: `${occupancyRate}%`, hint: `${totalOccupied}/${totalUnits || 0} occupied` },
          { label: "Vacancies", value: totalVacancies.toString() }
        ]}
        recommendationsPlaceholder="AI recommendations for portfolio optimization will appear here as your data grows."
      />
    <DataTableLayout
      overline="Portfolio"
      title="Properties"
      description="Manage buildings, occupancy, and operational context across your organization."
      actions={
        permissions.canCreate ? (
          <Link href="/properties/new">
            <Button>Create property</Button>
          </Link>
        ) : null
      }
      filters={
        <>
          <Input
            aria-label="Search properties"
            placeholder="Search by name, code, city, state"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(1);
            }}
          />
          <Select
            aria-label="Filter property status"
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value as "all" | PropertyRecord["status"]);
              setPage(1);
            }}
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="inactive">Inactive</option>
            <option value="archived">Archived</option>
          </Select>
          <Select
            aria-label="Filter property type"
            value={typeFilter}
            onChange={(event) => {
              setTypeFilter(event.target.value as "all" | PropertyRecord["propertyType"]);
              setPage(1);
            }}
          >
            <option value="all">All types</option>
            <option value="residential">Residential</option>
            <option value="commercial">Commercial</option>
            <option value="apartment">Apartment</option>
            <option value="condo">Condo</option>
            <option value="hoa">HOA</option>
            <option value="townhome">Townhome</option>
            <option value="multi_family">Multi-family</option>
          </Select>
        </>
      }
      error={error}
      showEmptyFiltered={filteredItems.length === 0}
      emptyFilteredMessage={getFilteredEmptyMessage("properties")}
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
                <TableHeaderCell>Property</TableHeaderCell>
                <TableHeaderCell>Type</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell>Units</TableHeaderCell>
                <TableHeaderCell>Occupancy</TableHeaderCell>
                <TableHeaderCell>Tenants</TableHeaderCell>
                <TableHeaderCell className="text-right">Actions</TableHeaderCell>
              </tr>
            </TableHead>
            <TableBody>
              {pagedItems.map((item) => {
                const busyArchive =
                  submittingAction === `${item.id}:archive` || submittingAction === `${item.id}:restore`;
                const busyDelete = submittingAction === `${item.id}:soft_delete`;
                const isArchived = item.status === "archived";
                return (
                  <TableRow key={item.id}>
                    <TableCell>
                      <p className="font-medium text-[var(--mpa-color-text-primary)]">{item.name}</p>
                      <p className="text-xs text-[var(--mpa-color-text-secondary)]">
                        {item.city}, {item.stateRegion}
                      </p>
                    </TableCell>
                    <TableCell>{toPropertyTypeLabel(item.propertyType)}</TableCell>
                    <TableCell>
                      <Badge showDot variant={item.status === "active" ? "success" : item.status === "archived" ? "warning" : "info"}>
                        {toPropertyStatusLabel(item.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>{item.unitCount}</TableCell>
                    <TableCell>
                      {item.occupiedUnits}/{item.unitCount || 0} occupied
                      <p className="text-xs text-[var(--mpa-color-text-secondary)]">{item.vacancyUnits} vacancies</p>
                    </TableCell>
                    <TableCell>{item.tenantCount}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-wrap justify-end gap-2">
                        <Link href={`/properties/${item.id}`}>
                          <Button variant="secondary" size="sm">
                            View
                          </Button>
                        </Link>
                        {permissions.canUpdate ? (
                          <Link href={`/properties/${item.id}/edit`}>
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
    </div>
  );
}
