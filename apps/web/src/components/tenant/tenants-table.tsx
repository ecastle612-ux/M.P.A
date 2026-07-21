"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Avatar,
  Badge,
  Button,
  Card,
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
import { toTenantStatusLabel, type TenantRecord } from "../../lib/tenant/contracts";
import { toLifecycleStatusLabel } from "../../lib/resident-lifecycle/contracts";
import { DataTableLayout } from "../presentation/data-table-layout";
import { ListWorkspaceHeader } from "../presentation/list-workspace-header";
import { ExperienceEmptyState } from "../experience/experience-empty-state";
import { getFilteredEmptyMessage } from "../../lib/experience/empty-states";

type TenantListItem = TenantRecord & {
  propertyName: string | null;
  unitNumber: string | null;
};

const PAGE_SIZE = 10;

export function TenantsTable({
  initialItems,
  permissions,
  initialPropertyId = null,
  initialQuery = ""
}: {
  initialItems: TenantListItem[];
  permissions: {
    canCreate: boolean;
    canUpdate: boolean;
    canArchive: boolean;
    canDelete: boolean;
  };
  initialPropertyId?: string | null;
  initialQuery?: string;
}) {
  const [items, setItems] = useState(initialItems);
  const [query, setQuery] = useState(initialQuery);
  const [propertyFilter, setPropertyFilter] = useState<string>(initialPropertyId ?? "all");
  const [sortBy, setSortBy] = useState<"name" | "status" | "updated">("updated");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const scopedInitial =
    initialPropertyId != null
      ? initialItems.find((item) => item.propertyId === initialPropertyId) ?? initialItems[0]
      : initialItems[0];
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(scopedInitial?.id ?? null);
  const [error, setError] = useState<string | null>(null);
  const [submittingAction, setSubmittingAction] = useState<string | null>(null);

  const visibleItems = useMemo(() => items.filter((item) => item.deletedAt === null), [items]);
  const propertyOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const item of visibleItems) {
      if (item.propertyId && item.propertyName) map.set(item.propertyId, item.propertyName);
    }
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [visibleItems]);
  const filteredItems = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    const matched = visibleItems.filter((item) => {
      if (propertyFilter !== "all" && item.propertyId !== propertyFilter) return false;
      if (!trimmed) return true;
      const fullName = `${item.firstName} ${item.lastName}`.toLowerCase();
      return (
        fullName.includes(trimmed) ||
        (item.preferredName ?? "").toLowerCase().includes(trimmed) ||
        item.email.toLowerCase().includes(trimmed) ||
        (item.phone ?? "").toLowerCase().includes(trimmed) ||
        (item.propertyName ?? "").toLowerCase().includes(trimmed) ||
        (item.unitNumber ?? "").toLowerCase().includes(trimmed)
      );
    });

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
  }, [query, propertyFilter, sortBy, sortOrder, visibleItems]);

  const pageCount = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pagedItems = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredItems.slice(start, start + PAGE_SIZE);
  }, [currentPage, filteredItems]);
  const selectedTenant =
    filteredItems.find((item) => item.id === selectedTenantId) ?? pagedItems[0] ?? filteredItems[0] ?? null;

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
    return <ExperienceEmptyState module="tenants" canCreate={permissions.canCreate} />;
  }

  const activeTenants = visibleItems.filter((item) => item.status === "active").length;
  const assignedTenants = visibleItems.filter((item) => item.propertyId).length;

  return (
    <div className="space-y-5">
      <ListWorkspaceHeader
        metrics={[
          { label: "Tenants", value: visibleItems.length.toString(), hint: `${activeTenants} active` },
          { label: "Assigned", value: assignedTenants.toString(), hint: "Linked to properties" },
          {
            label: "Unassigned",
            value: (visibleItems.length - assignedTenants).toString(),
            hint: "Need property/unit"
          }
        ]}
        recommendationsPlaceholder="Add lease and renewal guidance here as your resident records grow."
      />
    <DataTableLayout
      overline="Residents"
      title="Tenants"
      description="Manage tenant profiles, assignments, and contact information across your portfolio."
      actions={
        <div className="flex flex-wrap gap-2">
          {permissions.canCreate ? (
            <>
              <Link href="/residents/move-in">
                <Button>+ New Resident</Button>
              </Link>
              <Link href="/residents/move-out">
                <Button variant="secondary">Move out</Button>
              </Link>
              <Link href="/residents/transfer">
                <Button variant="secondary">Transfer</Button>
              </Link>
              <Link href="/tenants/new">
                <Button variant="ghost">Manual entry</Button>
              </Link>
            </>
          ) : null}
        </div>
      }
      filters={
        <>
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
            aria-label="Filter by property"
            value={propertyFilter}
            onChange={(event) => {
              setPropertyFilter(event.target.value);
              setPage(1);
            }}
          >
            <option value="all">All properties</option>
            {propertyOptions.map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </Select>
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
        </>
      }
      error={error}
      showEmptyFiltered={filteredItems.length === 0}
      emptyFilteredMessage={getFilteredEmptyMessage("tenants")}
      page={currentPage}
      pageCount={pageCount}
      totalItems={filteredItems.length}
      pageSize={PAGE_SIZE}
      onPreviousPage={() => setPage((value) => Math.max(1, value - 1))}
      onNextPage={() => setPage((value) => Math.min(pageCount, value + 1))}
    >
      <div className="grid gap-4 xl:grid-cols-[2fr_1fr]">
        <TableContainer className="rounded-none border-0 shadow-none">
          <div className="overflow-x-auto">
            <Table>
              <TableHead>
                <tr>
                  <TableHeaderCell>Tenant</TableHeaderCell>
                  <TableHeaderCell>Assignment</TableHeaderCell>
                  <TableHeaderCell>Contact</TableHeaderCell>
                  <TableHeaderCell>Timeline</TableHeaderCell>
                  <TableHeaderCell>Status</TableHeaderCell>
                  <TableHeaderCell className="text-right">Actions</TableHeaderCell>
                </tr>
              </TableHead>
              <TableBody>
                {pagedItems.map((item) => {
                  const busyArchive =
                    submittingAction === `${item.id}:archive` || submittingAction === `${item.id}:restore`;
                  const busyDelete = submittingAction === `${item.id}:soft_delete`;
                  const isArchived = item.status === "archived";
                  const isSelected = selectedTenant?.id === item.id;
                  return (
                    <TableRow key={item.id} className={isSelected ? "bg-[var(--mpa-color-bg-surface-muted)]" : undefined}>
                      <TableCell>
                        <button
                          type="button"
                          className="flex w-full items-center gap-2 text-left"
                          onClick={() => setSelectedTenantId(item.id)}
                        >
                          <Avatar
                            src={item.avatarUrl ?? undefined}
                            fallback={`${item.firstName[0] ?? "T"}${item.lastName[0] ?? ""}`}
                          />
                          <span>
                            <span className="block font-medium text-[var(--mpa-color-text-primary)]">
                              {item.preferredName || `${item.firstName} ${item.lastName}`}
                            </span>
                            <span className="block text-xs text-[var(--mpa-color-text-secondary)]">
                              Legal: {item.firstName} {item.lastName}
                            </span>
                          </span>
                        </button>
                      </TableCell>
                      <TableCell>
                        <p>{item.propertyName ?? "No property"}</p>
                        <p className="text-xs text-[var(--mpa-color-text-secondary)]">
                          {item.unitNumber ? `Unit ${item.unitNumber}` : "No unit"}
                        </p>
                      </TableCell>
                      <TableCell>
                        <p>{item.email}</p>
                        <p className="text-xs text-[var(--mpa-color-text-secondary)]">{item.phone ?? "No phone"}</p>
                      </TableCell>
                      <TableCell>
                        <p className="text-xs text-[var(--mpa-color-text-secondary)]">Move-in: {item.moveInDate ?? "—"}</p>
                        <p className="text-xs text-[var(--mpa-color-text-secondary)]">Move-out: {item.moveOutDate ?? "—"}</p>
                      </TableCell>
                      <TableCell>
                        <Badge
                          showDot
                          variant={item.status === "active" ? "success" : item.status === "archived" ? "warning" : "info"}
                        >
                          {toLifecycleStatusLabel(item.lifecycleStatus)}
                        </Badge>
                        <p className="mt-1 text-xs text-[var(--mpa-color-text-secondary)]">
                          CRM: {toTenantStatusLabel(item.status)}
                        </p>
                      </TableCell>
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
        </TableContainer>
        {selectedTenant ? (
          <Card className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--mpa-color-text-muted)]">Details panel</h3>
            <div className="flex items-center gap-2">
              <Avatar
                src={selectedTenant.avatarUrl ?? undefined}
                fallback={`${selectedTenant.firstName[0] ?? "T"}${selectedTenant.lastName[0] ?? ""}`}
              />
              <div>
                <p className="font-medium text-[var(--mpa-color-text-primary)]">
                  {selectedTenant.preferredName || `${selectedTenant.firstName} ${selectedTenant.lastName}`}
                </p>
                <p className="text-xs text-[var(--mpa-color-text-secondary)]">{selectedTenant.email}</p>
              </div>
            </div>
            <p className="text-xs text-[var(--mpa-color-text-secondary)]">
              Assignment: {selectedTenant.propertyName ?? "No property"} /{" "}
              {selectedTenant.unitNumber ? `Unit ${selectedTenant.unitNumber}` : "No unit"}
            </p>
            <p className="text-xs text-[var(--mpa-color-text-secondary)]">
              Emergency: {selectedTenant.emergencyContactName ?? "None"}{" "}
              {selectedTenant.emergencyContactPhone ? `(${selectedTenant.emergencyContactPhone})` : ""}
            </p>
            <p className="text-xs text-[var(--mpa-color-text-secondary)]">
              Document notes: {selectedTenant.documentsPlaceholder?.trim() || "None yet"}
            </p>
            <div className="flex flex-wrap gap-2">
              <Link href={`/tenants/${selectedTenant.id}`}>
                <Button size="sm" variant="secondary">
                  Open profile
                </Button>
              </Link>
              {permissions.canUpdate ? (
                <Link href={`/tenants/${selectedTenant.id}/edit`}>
                  <Button size="sm" variant="ghost">
                    Quick edit
                  </Button>
                </Link>
              ) : null}
            </div>
          </Card>
        ) : null}
      </div>
    </DataTableLayout>
    </div>
  );
}
