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
import { STATEMENT_STATUSES, formatCurrency, type StatementStatus } from "../../lib/financial/contracts";
import type { OwnerStatementListItem } from "../../lib/financial/server";
import { DataTableLayout } from "../presentation/data-table-layout";
import { ExperienceEmptyState } from "../experience/experience-empty-state";
import { getFilteredEmptyMessage } from "../../lib/experience/empty-states";

const PAGE_SIZE = 10;

function statementStatusLabel(status: StatementStatus): string {
  const labels: Record<StatementStatus, string> = {
    draft: "Draft",
    generated: "Generated",
    sent: "Sent",
    archived: "Archived"
  };
  return labels[status];
}

function statusBadgeVariant(status: StatementStatus): "success" | "warning" | "info" {
  if (status === "sent") return "success";
  if (status === "generated") return "info";
  if (status === "archived") return "warning";
  return "info";
}

export function OwnerStatementsTable({
  initialItems,
  permissions
}: {
  initialItems: OwnerStatementListItem[];
  permissions: { canCreate: boolean };
}) {
  const [items] = useState(initialItems);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);

  const visibleItems = useMemo(() => items.filter((item) => item.deletedAt === null), [items]);

  const filteredItems = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    return visibleItems
      .filter((item) => {
        if (statusFilter !== "all" && item.status !== statusFilter) return false;
        if (!trimmed) return true;
        return (
          item.statementNumber.toLowerCase().includes(trimmed) ||
          (item.propertyName ?? "").toLowerCase().includes(trimmed) ||
          (item.ownerPlaceholder ?? "").toLowerCase().includes(trimmed)
        );
      })
      .sort((left, right) => right.statementPeriodEnd.localeCompare(left.statementPeriodEnd));
  }, [visibleItems, query, statusFilter]);

  const pageCount = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pagedItems = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredItems.slice(start, start + PAGE_SIZE);
  }, [currentPage, filteredItems]);

  if (visibleItems.length === 0) {
    return <ExperienceEmptyState module="ownerStatements" canCreate={permissions.canCreate} />;
  }

  return (
    <DataTableLayout
      overline="Financials"
      title="Owner Statements"
      description="Generate income and expense summaries for property owners."
      actions={
        permissions.canCreate ? (
          <Link href="/financials/owner-statements/generate">
            <Button>Generate statement</Button>
          </Link>
        ) : null
      }
      filters={
        <>
          <Input
            aria-label="Search statements"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(1);
            }}
            placeholder="Statement number, property, owner…"
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
            {STATEMENT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {statementStatusLabel(status)}
              </option>
            ))}
          </Select>
        </>
      }
      showEmptyFiltered={filteredItems.length === 0}
      emptyFilteredMessage={getFilteredEmptyMessage("ownerStatements")}
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
                <TableHeaderCell>Statement</TableHeaderCell>
                <TableHeaderCell>Property</TableHeaderCell>
                <TableHeaderCell>Period</TableHeaderCell>
                <TableHeaderCell>Net income</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell className="text-right">Actions</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pagedItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <Link
                      href={`/financials/owner-statements/${item.id}`}
                      className="font-medium text-[var(--mpa-color-brand-primary)] hover:underline"
                    >
                      {item.statementNumber}
                    </Link>
                    {item.ownerPlaceholder ? (
                      <p className="text-xs text-[var(--mpa-color-text-secondary)]">{item.ownerPlaceholder}</p>
                    ) : null}
                  </TableCell>
                  <TableCell>{item.propertyName ?? "—"}</TableCell>
                  <TableCell>
                    {new Date(item.statementPeriodStart).toLocaleDateString()} –{" "}
                    {new Date(item.statementPeriodEnd).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{formatCurrency(item.netIncome)}</TableCell>
                  <TableCell>
                    <Badge showDot variant={statusBadgeVariant(item.status)}>
                      {statementStatusLabel(item.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/financials/owner-statements/${item.id}`}>
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
