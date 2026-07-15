"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
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
import {
  LEASE_RENEWAL_STATUSES,
  LEASE_STATUSES,
  toLeaseRenewalStatusLabel,
  toLeaseStatusLabel,
  type LeaseRecord
} from "../../lib/lease/contracts";
import type { LeaseListItem } from "../../lib/lease/server";
import { MpaLogo } from "../branding/mpa-logo";

const PAGE_SIZE = 10;

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

export function LeasesTable({
  initialItems,
  permissions
}: {
  initialItems: LeaseListItem[];
  permissions: {
    canCreate: boolean;
    canUpdate: boolean;
    canArchive: boolean;
    canDelete: boolean;
  };
}) {
  const [items, setItems] = useState(initialItems);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [renewalFilter, setRenewalFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [submittingAction, setSubmittingAction] = useState<string | null>(null);

  const visibleItems = useMemo(() => items.filter((item) => item.deletedAt === null), [items]);

  const filteredItems = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    return visibleItems
      .filter((item) => {
        if (statusFilter !== "all" && item.status !== statusFilter) return false;
        if (renewalFilter !== "all" && item.renewalStatus !== renewalFilter) return false;
        if (!trimmed) return true;
        return (
          item.leaseNumber.toLowerCase().includes(trimmed) ||
          (item.propertyName ?? "").toLowerCase().includes(trimmed) ||
          (item.unitNumber ?? "").toLowerCase().includes(trimmed) ||
          (item.tenantName ?? "").toLowerCase().includes(trimmed) ||
          (item.internalNotes ?? "").toLowerCase().includes(trimmed)
        );
      })
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
  }, [visibleItems, query, statusFilter, renewalFilter]);

  const pageCount = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pagedItems = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredItems.slice(start, start + PAGE_SIZE);
  }, [currentPage, filteredItems]);

  function statusBadgeVariant(status: LeaseRecord["status"]): "success" | "warning" | "info" {
    if (status === "active") return "success";
    if (status === "expired" || status === "terminated") return "warning";
    return "info";
  }

  function renewalBadgeVariant(status: LeaseRecord["renewalStatus"]): "success" | "warning" | "info" {
    if (status === "renewed") return "success";
    if (status === "offered" || status === "pending" || status === "notice_given") return "warning";
    if (status === "declined") return "warning";
    return "info";
  }

  async function runAction(leaseId: string, action: "archive" | "restore" | "soft_delete") {
    setError(null);
    setSubmittingAction(`${leaseId}:${action}`);
    const response = await fetch(`/api/leases/${leaseId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action })
    });
    setSubmittingAction(null);

    if (!response.ok) {
      const payload = (await response.json()) as { error?: string };
      setError(payload.error ?? "Lease action failed.");
      return;
    }

    const payload = (await response.json()) as { lease?: LeaseRecord };
    if (!payload.lease) return;

    if (action === "soft_delete") {
      setItems((current) => current.filter((item) => item.id !== leaseId));
      return;
    }

    setItems((current) =>
      current.map((item) =>
        item.id === leaseId
          ? {
              ...item,
              ...payload.lease,
              propertyName: item.propertyName,
              unitNumber: item.unitNumber,
              tenantName: item.tenantName
            }
          : item
      )
    );
  }

  if (visibleItems.length === 0) {
    return (
      <Card>
        <MpaLogo className="mb-2 h-12 w-auto" alt="M.P.A. logo" />
        <h1 className="text-xl font-semibold text-[var(--mpa-color-text-primary)]">Leases</h1>
        <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
          Track lease terms, renewals, and lifecycle events across your portfolio.
        </p>
        <div className="mt-4 rounded-lg border border-dashed border-[var(--mpa-color-border-default)] p-6 text-center">
          <p className="text-sm font-medium text-[var(--mpa-color-text-primary)]">No leases yet</p>
          {permissions.canCreate ? (
            <Link href="/leases/new" className="mt-4 inline-block">
              <Button>Create Lease</Button>
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
          <h1 className="font-display text-2xl font-semibold text-[var(--mpa-color-text-primary)]">Leases</h1>
          <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
            {filteredItems.length} lease{filteredItems.length === 1 ? "" : "s"} · Portfolio lease registry
          </p>
        </div>
        {permissions.canCreate ? (
          <Link href="/leases/new">
            <Button>Create Lease</Button>
          </Link>
        ) : null}
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <Input
          aria-label="Search leases"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setPage(1);
          }}
          placeholder="Lease number, property, tenant…"
        />
        <Select
          aria-label="Status filter"
          value={statusFilter}
          onChange={(event) => {
            setStatusFilter(event.target.value);
            setPage(1);
          }}
        >
          <option value="all">All statuses</option>
          {LEASE_STATUSES.map((status) => (
            <option key={status} value={status}>
              {toLeaseStatusLabel(status)}
            </option>
          ))}
        </Select>
        <Select
          aria-label="Renewal filter"
          value={renewalFilter}
          onChange={(event) => {
            setRenewalFilter(event.target.value);
            setPage(1);
          }}
        >
          <option value="all">All renewal statuses</option>
          {LEASE_RENEWAL_STATUSES.map((status) => (
            <option key={status} value={status}>
              {toLeaseRenewalStatusLabel(status)}
            </option>
          ))}
        </Select>
      </div>

      {error ? <p className="text-sm text-[var(--mpa-color-feedback-error)]">{error}</p> : null}

      <div className="overflow-x-auto">
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Lease</TableHeaderCell>
              <TableHeaderCell>Property</TableHeaderCell>
              <TableHeaderCell>Unit</TableHeaderCell>
              <TableHeaderCell>Tenant</TableHeaderCell>
              <TableHeaderCell>Rent</TableHeaderCell>
              <TableHeaderCell>End date</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell>Renewal</TableHeaderCell>
              <TableHeaderCell>Actions</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {pagedItems.map((item) => {
              const busyArchive =
                submittingAction === `${item.id}:archive` || submittingAction === `${item.id}:restore`;
              const busyDelete = submittingAction === `${item.id}:soft_delete`;
              const isArchived = item.archivedAt !== null;
              const canEdit = permissions.canUpdate && (item.status === "draft" || item.status === "signed");
              return (
                <TableRow key={item.id}>
                  <TableCell>
                    <Link
                      href={`/leases/${item.id}`}
                      className="font-medium text-[var(--mpa-color-brand-primary)] hover:underline"
                    >
                      {item.leaseNumber}
                    </Link>
                    {isArchived ? (
                      <Badge variant="warning" className="ml-2">
                        Archived
                      </Badge>
                    ) : null}
                  </TableCell>
                  <TableCell>{item.propertyName ?? "—"}</TableCell>
                  <TableCell>{item.unitNumber ?? "—"}</TableCell>
                  <TableCell>{item.tenantName ?? "—"}</TableCell>
                  <TableCell>{formatCurrency(item.rentAmount)}</TableCell>
                  <TableCell>{item.endDate}</TableCell>
                  <TableCell>
                    <Badge variant={statusBadgeVariant(item.status)}>{toLeaseStatusLabel(item.status)}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={renewalBadgeVariant(item.renewalStatus)}>
                      {toLeaseRenewalStatusLabel(item.renewalStatus)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      <Link href={`/leases/${item.id}`}>
                        <Button variant="secondary" size="sm">
                          View
                        </Button>
                      </Link>
                      {canEdit ? (
                        <Link href={`/leases/${item.id}/edit`}>
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
