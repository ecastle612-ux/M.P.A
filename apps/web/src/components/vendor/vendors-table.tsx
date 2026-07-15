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
  VENDOR_SERVICE_TYPES,
  VENDOR_STATUSES,
  toVendorServiceLabel,
  toVendorStatusLabel,
  type VendorRecord
} from "../../lib/vendor/contracts";
import { MpaLogo } from "../branding/mpa-logo";

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
    return (
      <Card>
        <MpaLogo className="mb-2 h-12 w-auto" alt="M.P.A. logo" />
        <h1 className="text-xl font-semibold text-[var(--mpa-color-text-primary)]">Vendors</h1>
        <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
          Build your vendor directory to assign trades to maintenance work orders.
        </p>
        <div className="mt-4 rounded-lg border border-dashed border-[var(--mpa-color-border-default)] p-6 text-center">
          <p className="text-sm font-medium text-[var(--mpa-color-text-primary)]">No vendors yet</p>
          {permissions.canCreate ? (
            <Link href="/vendors/new" className="mt-4 inline-block">
              <Button>Create Vendor</Button>
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
          <h1 className="font-display text-2xl font-semibold text-[var(--mpa-color-text-primary)]">Vendors</h1>
          <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
            {filteredItems.length} vendor{filteredItems.length === 1 ? "" : "s"} · Service provider directory
          </p>
        </div>
        {permissions.canCreate ? (
          <Link href="/vendors/new">
            <Button>Create Vendor</Button>
          </Link>
        ) : null}
      </div>

      <div className="grid gap-3 md:grid-cols-4">
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
      </div>

      {error ? <p className="text-sm text-[var(--mpa-color-feedback-error)]">{error}</p> : null}

      <div className="overflow-x-auto">
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Business</TableHeaderCell>
              <TableHeaderCell>Services</TableHeaderCell>
              <TableHeaderCell>Rating</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell>Actions</TableHeaderCell>
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
                      <Badge variant="success" className="ml-2">
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
                      variant={item.status === "active" ? "success" : item.status === "archived" ? "warning" : "info"}
                    >
                      {toVendorStatusLabel(item.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
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
