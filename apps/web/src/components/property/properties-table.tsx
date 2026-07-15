"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Badge,
  Button,
  Card,
  Input,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow
} from "@mpa/ui";
import { toPropertyStatusLabel, toPropertyTypeLabel, type PropertyRecord } from "../../lib/property/contracts";
import { MpaLogo } from "../branding/mpa-logo";

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
    return (
      <Card>
        <MpaLogo className="mb-2 h-12 w-auto" alt="M.P.A. logo" />
        <h2 className="text-lg font-semibold text-[var(--mpa-color-text-primary)]">No properties yet</h2>
        <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
          Create your first property to start organizing your portfolio.
        </p>
        {permissions.canCreate ? (
          <Link href="/properties/new" className="mt-3 inline-block">
            <Button>Create Property</Button>
          </Link>
        ) : null}
      </Card>
    );
  }

  return (
    <Card className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-[var(--mpa-color-text-primary)]">Property Portfolio</h2>
        {permissions.canCreate ? (
          <Link href="/properties/new">
            <Button>Create Property</Button>
          </Link>
        ) : null}
      </div>
      <div className="grid gap-2 lg:grid-cols-[2fr_1fr_1fr]">
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
      </div>
      {error ? <p className="text-sm text-[var(--mpa-color-feedback-error)]">{error}</p> : null}
      {filteredItems.length === 0 ? (
        <p className="rounded-md border border-dashed border-[var(--mpa-color-border-default)] p-3 text-sm text-[var(--mpa-color-text-secondary)]">
          No properties match your filters. Adjust search or filters to continue.
        </p>
      ) : null}
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
                    <Badge variant={item.status === "active" ? "success" : item.status === "archived" ? "warning" : "info"}>
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
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-[var(--mpa-color-text-secondary)]">
          {filteredItems.length === 0
            ? "Showing 0 of 0"
            : `Showing ${(currentPage - 1) * PAGE_SIZE + 1}-${Math.min(currentPage * PAGE_SIZE, filteredItems.length)} of ${filteredItems.length}`}
        </p>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={currentPage <= 1}
            onClick={() => setPage((value) => Math.max(1, value - 1))}
          >
            Previous
          </Button>
          <span className="text-xs text-[var(--mpa-color-text-secondary)]">
            Page {currentPage} of {pageCount}
          </span>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={currentPage >= pageCount}
            onClick={() => setPage((value) => Math.min(pageCount, value + 1))}
          >
            Next
          </Button>
        </div>
      </div>
    </Card>
  );
}
