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
  VENDOR_SERVICE_TYPES,
  VENDOR_STATUSES,
  toVendorServiceLabel,
  toVendorStatusLabel,
  type VendorRecord
} from "../../lib/vendor/contracts";
import { DataTableLayout } from "../presentation/data-table-layout";
import { ListWorkspaceHeader } from "../presentation/list-workspace-header";
import { ExperienceEmptyState } from "../experience/experience-empty-state";
import { getFilteredEmptyMessage } from "../../lib/experience/empty-states";

const PAGE_SIZE = 10;

export function VendorsTable({
  initialItems,
  permissions
}: {
  initialItems: VendorRecord[];
  permissions: {
    canCreate: boolean;
    canUpdate: boolean;
    canArchive: boolean;
    canDelete: boolean;
  };
}) {
  const [items, setItems] = useState(initialItems);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("active");
  const [serviceFilter, setServiceFilter] = useState<string>("all");
  const [preferredFilter, setPreferredFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [submittingAction, setSubmittingAction] = useState<string | null>(null);

  const visibleItems = useMemo(() => items.filter((item) => item.deletedAt === null), [items]);

  const filteredItems = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    return visibleItems
      .filter((item) => {
        if (statusFilter !== "all" && item.status !== statusFilter) return false;
        if (preferredFilter === "preferred" && !item.preferredVendor) return false;
        if (preferredFilter === "standard" && item.preferredVendor) return false;
        if (serviceFilter !== "all" && !item.services.includes(serviceFilter)) return false;
        if (!trimmed) return true;
        return (
          item.businessName.toLowerCase().includes(trimmed) ||
          (item.primaryContactName ?? "").toLowerCase().includes(trimmed) ||
          (item.email ?? "").toLowerCase().includes(trimmed) ||
          (item.phone ?? "").toLowerCase().includes(trimmed)
        );
      })
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
  }, [visibleItems, query, statusFilter, serviceFilter, preferredFilter]);

  const pageCount = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pagedItems = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredItems.slice(start, start + PAGE_SIZE);
  }, [currentPage, filteredItems]);

  async function runAction(vendorId: string, action: "archive" | "restore" | "soft_delete") {
    setError(null);
    setSubmittingAction(`${vendorId}:${action}`);
    const response = await fetch(`/api/vendors/${vendorId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action })
    });
    setSubmittingAction(null);

    if (!response.ok) {
      const payload = (await response.json()) as { error?: string };
      setError(payload.error ?? "Vendor action failed.");
      return;
    }

    const payload = (await response.json()) as { vendor?: VendorRecord };
    if (!payload.vendor) return;

    if (action === "soft_delete") {
      setItems((current) => current.filter((item) => item.id !== vendorId));
      return;
    }

    setItems((current) => current.map((item) => (item.id === vendorId ? { ...item, ...payload.vendor } : item)));
  }

  if (visibleItems.length === 0) {
    return <ExperienceEmptyState module="vendors" canCreate={permissions.canCreate} />;
  }

  const activeVendors = visibleItems.filter((item) => item.status === "active").length;
  const preferredVendors = visibleItems.filter((item) => item.preferredVendor).length;
  const ratedVendors = visibleItems.filter((item) => item.rating !== null);
  const avgRating =
    ratedVendors.length > 0
      ? (ratedVendors.reduce((sum, item) => sum + (item.rating ?? 0), 0) / ratedVendors.length).toFixed(1)
      : null;

  return (
    <div className="space-y-5">
      <ListWorkspaceHeader
        metrics={[
          { label: "Vendors", value: visibleItems.length.toString(), hint: `${activeVendors} active` },
          ...(preferredVendors > 0 ? [{ label: "Preferred", value: preferredVendors.toString() }] : []),
          ...(avgRating ? [{ label: "Avg rating", value: avgRating }] : [])
        ]}
        {...(visibleItems.length > 0 && preferredVendors === 0
          ? {
              recommendationsPlaceholder:
                "Mark go-to contractors as preferred so your team finds them quickly during emergencies."
            }
          : {})}
      />
    <DataTableLayout
      overline="Operations"
      title="Vendors"
      description="Manage service providers, ratings, and preferred vendor relationships."
      actions={
        permissions.canCreate ? (
          <Link href="/vendors/new">
            <Button>Create vendor</Button>
          </Link>
        ) : null
      }
      filters={
        <>
          <Input
            aria-label="Search vendors"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(1);
            }}
            placeholder="Business name, contact, email…"
          />
          <Select
            aria-label="Status filter"
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value);
              setPage(1);
            }}
          >
            <option value="active">Active vendors</option>
            <option value="all">All statuses</option>
            {VENDOR_STATUSES.map((status) => (
              <option key={status} value={status}>
                {toVendorStatusLabel(status)}
              </option>
            ))}
          </Select>
          <Select
            aria-label="Service filter"
            value={serviceFilter}
            onChange={(event) => {
              setServiceFilter(event.target.value);
              setPage(1);
            }}
          >
            <option value="all">All services</option>
            {VENDOR_SERVICE_TYPES.map((service) => (
              <option key={service} value={service}>
                {toVendorServiceLabel(service)}
              </option>
            ))}
          </Select>
          <Select
            aria-label="Preferred filter"
            value={preferredFilter}
            onChange={(event) => {
              setPreferredFilter(event.target.value);
              setPage(1);
            }}
          >
            <option value="all">All vendors</option>
            <option value="preferred">Preferred only</option>
            <option value="standard">Non-preferred</option>
          </Select>
        </>
      }
      error={error}
      showEmptyFiltered={filteredItems.length === 0}
      emptyFilteredMessage={getFilteredEmptyMessage("vendors")}
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
                <TableHeaderCell>Business</TableHeaderCell>
                <TableHeaderCell>Services</TableHeaderCell>
                <TableHeaderCell>Rating</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell className="text-right">Actions</TableHeaderCell>
              </TableRow>
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
                      <Link
                        href={`/vendors/${item.id}`}
                        className="font-medium text-[var(--mpa-color-brand-primary)] hover:underline"
                      >
                        {item.businessName}
                      </Link>
                      {item.preferredVendor ? (
                        <Badge showDot variant="success" className="ml-2">
                          Preferred
                        </Badge>
                      ) : null}
                      <p className="text-xs text-[var(--mpa-color-text-secondary)]">
                        {item.primaryContactName ?? item.email ?? item.phone ?? "No contact"}
                      </p>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">
                        {item.services.length > 0
                          ? item.services.slice(0, 3).map(toVendorServiceLabel).join(", ")
                          : "—"}
                      </p>
                      {item.services.length > 3 ? (
                        <p className="text-xs text-[var(--mpa-color-text-secondary)]">+{item.services.length - 3} more</p>
                      ) : null}
                    </TableCell>
                    <TableCell>{item.rating !== null ? `${item.rating.toFixed(1)} / 5` : "—"}</TableCell>
                    <TableCell>
                      <Badge
                        showDot
                        variant={item.status === "active" ? "success" : item.status === "archived" ? "warning" : "info"}
                      >
                        {toVendorStatusLabel(item.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-wrap justify-end gap-2">
                        <Link href={`/vendors/${item.id}`}>
                          <Button variant="secondary" size="sm">
                            View
                          </Button>
                        </Link>
                        {permissions.canUpdate ? (
                          <Link href={`/vendors/${item.id}/edit`}>
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
