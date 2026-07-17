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
  EXPENSE_CATEGORIES,
  EXPENSE_STATUSES,
  formatCurrency,
  toExpenseCategoryLabel,
  type ExpenseStatus
} from "../../lib/financial/contracts";
import type { ExpenseListItem } from "../../lib/financial/server";
import { DataTableLayout } from "../presentation/data-table-layout";
import { ExperienceEmptyState } from "../experience/experience-empty-state";
import { getFilteredEmptyMessage } from "../../lib/experience/empty-states";

const PAGE_SIZE = 10;

function expenseStatusLabel(status: ExpenseStatus): string {
  const labels: Record<ExpenseStatus, string> = {
    pending: "Pending",
    approved: "Approved",
    paid: "Paid",
    archived: "Archived"
  };
  return labels[status];
}

function statusBadgeVariant(status: ExpenseStatus): "success" | "warning" | "info" {
  if (status === "paid" || status === "approved") return "success";
  if (status === "pending") return "warning";
  return "info";
}

export function ExpensesTable({
  initialItems,
  permissions
}: {
  initialItems: ExpenseListItem[];
  permissions: { canCreate: boolean };
}) {
  const [items] = useState(initialItems);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [page, setPage] = useState(1);

  const visibleItems = useMemo(() => items.filter((item) => item.deletedAt === null), [items]);

  const filteredItems = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    return visibleItems
      .filter((item) => {
        if (statusFilter !== "all" && item.status !== statusFilter) return false;
        if (categoryFilter !== "all" && item.category !== categoryFilter) return false;
        if (!trimmed) return true;
        return (
          item.expenseNumber.toLowerCase().includes(trimmed) ||
          item.description.toLowerCase().includes(trimmed) ||
          (item.propertyName ?? "").toLowerCase().includes(trimmed)
        );
      })
      .sort((left, right) => right.expenseDate.localeCompare(left.expenseDate));
  }, [visibleItems, query, statusFilter, categoryFilter]);

  const pageCount = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pagedItems = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredItems.slice(start, start + PAGE_SIZE);
  }, [currentPage, filteredItems]);

  if (visibleItems.length === 0) {
    return <ExperienceEmptyState module="expenses" canCreate={permissions.canCreate} />;
  }

  return (
    <DataTableLayout
      overline="Financials"
      title="Expenses"
      description="Record and track property operating expenses."
      actions={
        permissions.canCreate ? (
          <Link href="/financials/expenses/new">
            <Button>Record expense</Button>
          </Link>
        ) : null
      }
      filters={
        <>
          <Input
            aria-label="Search expenses"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(1);
            }}
            placeholder="Expense number, description…"
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
            {EXPENSE_STATUSES.map((status) => (
              <option key={status} value={status}>
                {expenseStatusLabel(status)}
              </option>
            ))}
          </Select>
          <Select
            aria-label="Category filter"
            value={categoryFilter}
            onChange={(event) => {
              setCategoryFilter(event.target.value);
              setPage(1);
            }}
          >
            <option value="all">All categories</option>
            {EXPENSE_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {toExpenseCategoryLabel(category)}
              </option>
            ))}
          </Select>
        </>
      }
      showEmptyFiltered={filteredItems.length === 0}
      emptyFilteredMessage={getFilteredEmptyMessage("expenses")}
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
                <TableHeaderCell>Expense</TableHeaderCell>
                <TableHeaderCell>Property</TableHeaderCell>
                <TableHeaderCell>Category</TableHeaderCell>
                <TableHeaderCell>Amount</TableHeaderCell>
                <TableHeaderCell>Date</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pagedItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <p className="font-medium text-[var(--mpa-color-text-primary)]">{item.expenseNumber}</p>
                    <p className="text-xs text-[var(--mpa-color-text-secondary)]">{item.description}</p>
                  </TableCell>
                  <TableCell>{item.propertyName ?? "—"}</TableCell>
                  <TableCell>
                    {item.category === "custom" && item.customCategory
                      ? item.customCategory
                      : toExpenseCategoryLabel(item.category)}
                  </TableCell>
                  <TableCell>{formatCurrency(item.amount)}</TableCell>
                  <TableCell>{new Date(item.expenseDate).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Badge showDot variant={statusBadgeVariant(item.status)}>
                      {expenseStatusLabel(item.status)}
                    </Badge>
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
