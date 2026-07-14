"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Badge, Button, Card, Input, Select, Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@mpa/ui";
import { toTenantStatusLabel, type TenantRecord } from "../../lib/tenant/contracts";
import { MpaLogo } from "../branding/mpa-logo";

type TenantListItem = TenantRecord;

const PAGE_SIZE = 10;

export function TenantsTable({
  initialItems,
  permissions
}: {
  initialItems: TenantListItem[];
  permissions: {
    canCreate: boolean;
    canUpdate: boolean;
    canArchive: boolean;
    canDelete: boolean;
  };
}) {
  const [items, setItems] = useState(initialItems);
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "status" | "updated">("updated");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [submittingAction, setSubmittingAction] = useState<string | null>(null);

  const visibleItems = useMemo(() => items.filter((item) => item.deletedAt === null), [items]);
  const filteredItems = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    const matched = trimmed
      ? visibleItems.filter((item) => {
          const fullName = `${item.firstName} ${item.lastName}`.toLowerCase();
          return (
            fullName.includes(trimmed) ||
            (item.preferredName ?? "").toLowerCase().includes(trimmed) ||
            item.email.toLowerCase().includes(trimmed) ||
            (item.phone ?? "").toLowerCase().includes(trimmed)
          );
        })
      : visibleItems;

    return [...matched].sort((left, right) => {
      const direction = sortOrder === "asc" ? 1 : -1;
      if (sortBy === "status") {
        return left.status.localeCompare(right.status) * direction;
      }
      if (sortBy === "name") {
        const leftName = `${left.lastName},${left.firstName}`.toLowerCase();
        const rightName = `${right.lastName},${right.firstName}`.toLowerCase();
        return leftName.localeCompare(rightName) * direction;
      }
      return left.updatedAt.localeCompare(right.updatedAt) * direction;
    });
  }, [query, sortBy, sortOrder, visibleItems]);

  const pageCount = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pagedItems = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredItems.slice(start, start + PAGE_SIZE);
  }, [currentPage, filteredItems]);

  async function runAction(tenantId: string, action: "archive" | "restore" | "soft_delete") {
    setError(null);
    setSubmittingAction(`${tenantId}:${action}`);
    const response = await fetch(`/api/tenants/${tenantId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action })
    });
    setSubmittingAction(null);

    if (!response.ok) {
      const payload = (await response.json()) as { error?: string };
      setError(payload.error ?? "Tenant action failed.");
      return;
    }

    const payload = (await response.json()) as { tenant?: TenantListItem };
    if (!payload.tenant) return;

    if (action === "soft_delete") {
      setItems((current) => current.filter((item) => item.id !== tenantId));
      return;
    }

    setItems((current) => current.map((item) => (item.id === tenantId ? { ...item, ...payload.tenant } : item)));
  }

  if (visibleItems.length === 0) {
    return (
      <Card>
        <MpaLogo className="mb-2 h-12 w-auto" alt="M.P.A. logo" />
        <h2 className="text-lg font-semibold text-[var(--mpa-color-text-primary)]">No tenants yet</h2>
        <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
          Build your canonical tenant records to power leases, messaging, and future AI workflows.
        </p>
        {permissions.canCreate ? (
          <Link href="/tenants/new" className="mt-3 inline-block">
            <Button>Create Tenant</Button>
          </Link>
        ) : null}
      </Card>
    );
  }

  return (
    <Card className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-[var(--mpa-color-text-primary)]">Tenants</h2>
        {permissions.canCreate ? (
          <Link href="/tenants/new">
            <Button>Create Tenant</Button>
          </Link>
        ) : null}
      </div>
      <div className="grid gap-2 md:grid-cols-[2fr_1fr_1fr]">
        <Input
          aria-label="Search tenants"
          placeholder="Search by name, email, phone"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setPage(1);
          }}
        />
        <Select
          aria-label="Sort tenants"
          value={sortBy}
          onChange={(event) => {
            setSortBy(event.target.value as "name" | "status" | "updated");
            setPage(1);
          }}
        >
          <option value="updated">Sort by updated</option>
          <option value="name">Sort by name</option>
          <option value="status">Sort by status</option>
        </Select>
        <Select
          aria-label="Sort order"
          value={sortOrder}
          onChange={(event) => {
            setSortOrder(event.target.value as "asc" | "desc");
            setPage(1);
          }}
        >
          <option value="desc">Descending</option>
          <option value="asc">Ascending</option>
        </Select>
      </div>
      {error ? <p className="text-sm text-[var(--mpa-color-feedback-error)]">{error}</p> : null}
      <div className="overflow-x-auto">
        <Table>
          <TableHead>
            <tr>
              <TableHeaderCell>Tenant</TableHeaderCell>
              <TableHeaderCell>Contact</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell>Updated</TableHeaderCell>
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
                    <p className="font-medium text-[var(--mpa-color-text-primary)]">
                      {item.preferredName || `${item.firstName} ${item.lastName}`}
                    </p>
                    <p className="text-xs text-[var(--mpa-color-text-secondary)]">
                      Legal: {item.firstName} {item.lastName}
                    </p>
                  </TableCell>
                  <TableCell>
                    <p>{item.email}</p>
                    <p className="text-xs text-[var(--mpa-color-text-secondary)]">{item.phone ?? "No phone"}</p>
                  </TableCell>
                  <TableCell>
                    <Badge variant={item.status === "active" ? "success" : item.status === "archived" ? "warning" : "info"}>
                      {toTenantStatusLabel(item.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(item.updatedAt)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex flex-wrap justify-end gap-2">
                      <Link href={`/tenants/${item.id}`}>
                        <Button variant="secondary" size="sm">
                          View
                        </Button>
                      </Link>
                      {permissions.canUpdate ? (
                        <Link href={`/tenants/${item.id}/edit`}>
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
          Showing {(currentPage - 1) * PAGE_SIZE + 1}-{Math.min(currentPage * PAGE_SIZE, filteredItems.length)} of{" "}
          {filteredItems.length}
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

function formatDate(value: string): string {
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) return "recently";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(timestamp);
}
