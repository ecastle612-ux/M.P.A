"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Badge, Button, Input, Select, Table, TableBody, TableCell, TableContainer, TableHead, TableHeaderCell, TableRow } from "@mpa/ui";
import { THREAD_STATUSES, THREAD_TYPES, threadStatusLabel, threadTypeLabel, type ThreadStatus, type ThreadType } from "../../lib/messaging/contracts";
import type { ThreadListItem } from "../../lib/messaging/server";
import { EmptyState } from "@mpa/ui";
import { DataTableLayout } from "../presentation/data-table-layout";

const PAGE_SIZE = 12;

export function MessagingInbox({
  initialItems,
  canCreate
}: {
  initialItems: ThreadListItem[];
  canCreate: boolean;
}) {
  const [items] = useState(initialItems);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [page, setPage] = useState(1);

  const filteredItems = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    return items
      .filter((item) => {
        if (statusFilter !== "all" && item.status !== statusFilter) return false;
        if (typeFilter !== "all" && item.threadType !== typeFilter) return false;
        if (!trimmed) return true;
        return (
          item.subject.toLowerCase().includes(trimmed) ||
          (item.lastMessagePreview ?? "").toLowerCase().includes(trimmed) ||
          (item.propertyName ?? "").toLowerCase().includes(trimmed)
        );
      })
      .sort((left, right) => {
        if (left.pinned !== right.pinned) return left.pinned ? -1 : 1;
        const leftTime = left.lastMessageAt ?? left.updatedAt;
        const rightTime = right.lastMessageAt ?? right.updatedAt;
        return rightTime.localeCompare(leftTime);
      });
  }, [items, query, statusFilter, typeFilter]);

  const pageCount = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pagedItems = filteredItems.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <DataTableLayout
      title="Inbox"
      description="Workflow-linked conversations tied to maintenance, leasing, residents, and vendors."
      actions={
        canCreate ? (
          <Link href="/communications/inbox">
            <Button variant="secondary">Refresh inbox</Button>
          </Link>
        ) : undefined
      }
      filters={
        <div className="grid gap-3 md:grid-cols-3 lg:col-span-3">
          <Input placeholder="Search conversations…" value={query} onChange={(event) => setQuery(event.target.value)} />
          <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="all">All statuses</option>
            {THREAD_STATUSES.map((status) => (
              <option key={status} value={status}>
                {threadStatusLabel(status)}
              </option>
            ))}
          </Select>
          <Select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
            <option value="all">All conversation types</option>
            {THREAD_TYPES.map((type) => (
              <option key={type} value={type}>
                {threadTypeLabel(type)}
              </option>
            ))}
          </Select>
        </div>
      }
      page={currentPage}
      pageCount={pageCount}
      totalItems={filteredItems.length}
      pageSize={PAGE_SIZE}
      onPreviousPage={() => setPage((value) => Math.max(1, value - 1))}
      onNextPage={() => setPage((value) => Math.min(pageCount, value + 1))}
    >
      <div className="border-b border-[var(--mpa-color-border-subtle)] px-5 py-3">
        <p className="rounded-[var(--mpa-radius-md)] border border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-surface-muted)]/60 px-3 py-2 text-xs leading-relaxed text-[var(--mpa-color-text-secondary)]">
          Open a conversation to reply in context. Maintenance threads are created automatically when work orders are opened.
        </p>
      </div>
      {pagedItems.length === 0 ? (
        canCreate ? (
          <EmptyState
            title="No conversations yet"
            description="When residents, vendors, or applicants message you—or when maintenance work orders open—threads appear here with full property context."
            action={{ label: "View announcements", href: "/communications" }}
          />
        ) : (
          <EmptyState
            title="No conversations yet"
            description="When residents, vendors, or applicants message you—or when maintenance work orders open—threads appear here with full property context."
          />
        )
      ) : (
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Conversation</TableHeaderCell>
                <TableHeaderCell>Type</TableHeaderCell>
                <TableHeaderCell>Property</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell>Unread</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pagedItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <Link href={`/communications/threads/${item.id}`} className="font-medium text-[var(--mpa-color-brand-primary)] hover:underline">
                      {item.subject}
                    </Link>
                    {item.lastMessagePreview ? (
                      <p className="mt-0.5 line-clamp-1 text-xs text-[var(--mpa-color-text-secondary)]">{item.lastMessagePreview}</p>
                    ) : null}
                  </TableCell>
                  <TableCell>{threadTypeLabel(item.threadType as ThreadType)}</TableCell>
                  <TableCell>
                    {[item.propertyName, item.unitNumber ? `Unit ${item.unitNumber}` : null].filter(Boolean).join(" · ") || "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={item.status === "unread" ? "warning" : item.status === "resolved" ? "success" : "info"}>
                      {threadStatusLabel(item.status as ThreadStatus)}
                    </Badge>
                  </TableCell>
                  <TableCell>{item.unreadCount > 0 ? item.unreadCount : "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </DataTableLayout>
  );
}
