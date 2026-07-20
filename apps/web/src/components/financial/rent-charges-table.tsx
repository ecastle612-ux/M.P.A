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
  CHARGE_STATUSES,
  CHARGE_TYPES,
  formatCurrency,
  toChargeStatusLabel,
  type ChargeStatus,
  type ChargeType
} from "../../lib/financial/contracts";
import type { RentChargeListItem } from "../../lib/financial/server";
import { DataTableLayout } from "../presentation/data-table-layout";
import { ExperienceEmptyState } from "../experience/experience-empty-state";
import { getFilteredEmptyMessage } from "../../lib/experience/empty-states";

const PAGE_SIZE = 10;

function chargeTypeLabel(type: ChargeType): string {
  const labels: Record<ChargeType, string> = {
    monthly_rent: "Monthly rent",
    custom: "Custom",
    security_deposit: "Security deposit",
    late_fee: "Late fee",
    adjustment: "Adjustment",
    credit: "Credit",
    other: "Other"
  };
  return labels[type];
}

function statusBadgeVariant(status: ChargeStatus): "success" | "warning" | "info" {
  if (status === "paid") return "success";
  if (status === "overdue" || status === "partial") return "warning";
  return "info";
}

export function RentChargesTable({
  initialItems,
  permissions,
  initialTenantId,
  initialPropertyId
}: {
  initialItems: RentChargeListItem[];
  permissions: { canCreate: boolean };
  initialTenantId?: string;
  initialPropertyId?: string;
}) {
  const [items] = useState(initialItems);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [page, setPage] = useState(1);

  const visibleItems = useMemo(() => items.filter((item) => item.deletedAt === null), [items]);

  const filteredItems = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    return visibleItems
      .filter((item) => {
        if (initialTenantId && item.tenantId !== initialTenantId) return false;
        if (initialPropertyId && item.propertyId !== initialPropertyId) return false;
        if (statusFilter !== "all" && item.status !== statusFilter) return false;
        if (typeFilter !== "all" && item.chargeType !== typeFilter) return false;
        if (!trimmed) return true;
        return (
          item.chargeNumber.toLowerCase().includes(trimmed) ||
          item.description.toLowerCase().includes(trimmed) ||
          (item.propertyName ?? "").toLowerCase().includes(trimmed) ||
          (item.unitNumber ?? "").toLowerCase().includes(trimmed) ||
          (item.tenantName ?? "").toLowerCase().includes(trimmed)
        );
      })
      .sort((left, right) => right.dueDate.localeCompare(left.dueDate));
  }, [visibleItems, query, statusFilter, typeFilter, initialTenantId, initialPropertyId]);

  const pageCount = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pagedItems = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredItems.slice(start, start + PAGE_SIZE);
  }, [currentPage, filteredItems]);

  if (visibleItems.length === 0) {
    return <ExperienceEmptyState module="rentCharges" canCreate={permissions.canCreate} />;
  }

  return (
    <DataTableLayout
      overline="Financials"
      title="Rent Charges"
      description="Track rent charges, balances, and payment status across leases."
      actions={
        permissions.canCreate ? (
          <div className="flex flex-wrap gap-2">
            <Link href="/financials/payments/new">
              <Button>Record payment</Button>
            </Link>
            <Link href="/financials/charges/new">
              <Button variant="secondary">Create charge</Button>
            </Link>
          </div>
        ) : null
      }
      filters={
        <>
          <Input
            aria-label="Search charges"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(1);
            }}
            placeholder="Charge number, tenant, property…"
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
            {CHARGE_STATUSES.map((status) => (
              <option key={status} value={status}>
                {toChargeStatusLabel(status)}
              </option>
            ))}
          </Select>
          <Select
            aria-label="Type filter"
            value={typeFilter}
            onChange={(event) => {
              setTypeFilter(event.target.value);
              setPage(1);
            }}
          >
            <option value="all">All types</option>
            {CHARGE_TYPES.map((type) => (
              <option key={type} value={type}>
                {chargeTypeLabel(type)}
              </option>
            ))}
          </Select>
        </>
      }
      showEmptyFiltered={filteredItems.length === 0}
      emptyFilteredMessage={getFilteredEmptyMessage("rentCharges")}
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
                <TableHeaderCell>Charge</TableHeaderCell>
                <TableHeaderCell>Property</TableHeaderCell>
                <TableHeaderCell>Unit</TableHeaderCell>
                <TableHeaderCell>Tenant</TableHeaderCell>
                <TableHeaderCell>Amount</TableHeaderCell>
                <TableHeaderCell>Outstanding</TableHeaderCell>
                <TableHeaderCell>Due</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell className="text-right">Actions</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pagedItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <Link
                      href={`/financials/charges/${item.id}`}
                      className="font-medium text-[var(--mpa-color-brand-primary)] hover:underline"
                    >
                      {item.chargeNumber}
                    </Link>
                    <p className="text-xs text-[var(--mpa-color-text-secondary)]">{chargeTypeLabel(item.chargeType)}</p>
                  </TableCell>
                  <TableCell>{item.propertyName ?? "—"}</TableCell>
                  <TableCell>{item.unitNumber ?? "—"}</TableCell>
                  <TableCell>{item.tenantName ?? "—"}</TableCell>
                  <TableCell>{formatCurrency(item.amount)}</TableCell>
                  <TableCell>{formatCurrency(item.outstandingBalance)}</TableCell>
                  <TableCell>{new Date(item.dueDate).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Badge showDot variant={statusBadgeVariant(item.status)}>
                      {toChargeStatusLabel(item.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/financials/charges/${item.id}`}>
                      <Button variant="secondary" size="sm">
                        View
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </TableContainer>
    </DataTableLayout>
  );
}
