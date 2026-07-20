"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
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
import {
  LEASE_RENEWAL_STATUSES,
  LEASE_STATUSES,
  toLeaseRenewalStatusLabel,
  toLeaseStatusLabel,
  type LeaseRecord
} from "../../lib/lease/contracts";
import type { LeaseListItem } from "../../lib/lease/server";
import { DataTableLayout } from "../presentation/data-table-layout";
import { ListWorkspaceHeader } from "../presentation/list-workspace-header";
import { ExperienceEmptyState } from "../experience/experience-empty-state";
import { getFilteredEmptyMessage } from "../../lib/experience/empty-states";

const PAGE_SIZE = 10;

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

export function LeasesTable({
  initialItems,
  permissions,
  initialStatusFilter = "all"
}: {
  initialItems: LeaseListItem[];
  permissions: {
    canCreate: boolean;
    canUpdate: boolean;
    canArchive: boolean;
    canDelete: boolean;
  };
  initialStatusFilter?: string;
}) {
  const [items, setItems] = useState(initialItems);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>(initialStatusFilter);
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
    return <ExperienceEmptyState module="leases" canCreate={permissions.canCreate} />;
  }

  const activeLeases = visibleItems.filter((item) => item.status === "active").length;
  const renewalPending = visibleItems.filter(
    (item) =>
      item.status === "active" &&
      (item.renewalStatus === "offered" || item.renewalStatus === "pending" || item.renewalStatus === "notice_given")
  ).length;

  return (
    <div className="space-y-5">
      <ListWorkspaceHeader
        metrics={[
          { label: "Leases", value: visibleItems.length.toString(), hint: `${activeLeases} active` },
          ...(activeLeases > 0
            ? [
                { label: "Renewals pending", value: renewalPending.toString() },
                {
                  label: "Monthly rent",
                  value: formatCurrency(
                    visibleItems.filter((item) => item.status === "active").reduce((sum, item) => sum + item.rentAmount, 0)
                  )
                }
              ]
            : [])
        ]}
        recommendationsPlaceholder={
          activeLeases === 0
            ? "Activate a lease when a tenant is ready to move in — rent collection starts there."
            : "Renewals are easiest to manage before expiration — review upcoming dates monthly."
        }
      />
    <DataTableLayout
      overline="Portfolio"
      title="Leases"
      description="Track lease terms, renewals, and lifecycle events across your portfolio."
      actions={
        permissions.canCreate ? (
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/residents/move-in">
              <Button>Continue Move In</Button>
            </Link>
            <details className="relative">
              <summary className="cursor-pointer list-none text-sm font-medium text-[var(--mpa-color-text-secondary)] underline-offset-2 hover:underline">
                More actions
              </summary>
              <div className="absolute right-0 z-10 mt-2 min-w-[12rem] rounded-[var(--mpa-radius-md)] border border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-surface)] p-2 shadow-sm">
                <Link
                  href="/leases/new"
                  className="block rounded px-2 py-1.5 text-sm text-[var(--mpa-color-text-primary)] hover:bg-[var(--mpa-color-bg-muted)]"
                >
                  New lease (advanced)
                </Link>
              </div>
            </details>
          </div>
        ) : null
      }
      filters={
        <>
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
        </>
      }
      error={error}
      showEmptyFiltered={filteredItems.length === 0}
      emptyFilteredMessage={getFilteredEmptyMessage("leases")}
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
                <TableHeaderCell>Lease</TableHeaderCell>
                <TableHeaderCell>Property</TableHeaderCell>
                <TableHeaderCell>Unit</TableHeaderCell>
                <TableHeaderCell>Tenant</TableHeaderCell>
                <TableHeaderCell>Rent</TableHeaderCell>
                <TableHeaderCell>End date</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell>Renewal</TableHeaderCell>
                <TableHeaderCell className="text-right">Actions</TableHeaderCell>
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
                        <Badge showDot variant="warning" className="ml-2">
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
                      <Badge showDot variant={statusBadgeVariant(item.status)}>
                        {toLeaseStatusLabel(item.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge showDot variant={renewalBadgeVariant(item.renewalStatus)}>
                        {toLeaseRenewalStatusLabel(item.renewalStatus)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-wrap justify-end gap-2">
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
      </TableContainer>
    </DataTableLayout>
    </div>
  );
}
