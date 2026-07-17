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
  ANNOUNCEMENT_CATEGORIES,
  ANNOUNCEMENT_PRIORITIES,
  ANNOUNCEMENT_STATUSES,
  announcementCategoryLabel,
  announcementPriorityLabel,
  announcementStatusLabel,
  type AnnouncementRecord
} from "../../lib/communication/contracts";
import { DataTableLayout } from "../presentation/data-table-layout";
import { ExperienceEmptyState } from "../experience/experience-empty-state";
import { getFilteredEmptyMessage } from "../../lib/experience/empty-states";

const PAGE_SIZE = 10;

export function AnnouncementsTable({
  initialItems,
  permissions
}: {
  initialItems: AnnouncementRecord[];
  permissions: {
    canCreate: boolean;
    canUpdate: boolean;
    canArchive: boolean;
    canDelete: boolean;
    canPublish: boolean;
  };
}) {
  const [items, setItems] = useState(initialItems);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [submittingAction, setSubmittingAction] = useState<string | null>(null);

  const visibleItems = useMemo(() => items.filter((item) => item.deletedAt === null), [items]);

  const filteredItems = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    return visibleItems
      .filter((item) => {
        if (statusFilter !== "all" && item.status !== statusFilter) return false;
        if (priorityFilter !== "all" && item.priority !== priorityFilter) return false;
        if (categoryFilter !== "all" && item.category !== categoryFilter) return false;
        if (!trimmed) return true;
        return item.title.toLowerCase().includes(trimmed) || item.message.toLowerCase().includes(trimmed);
      })
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
  }, [visibleItems, query, statusFilter, priorityFilter, categoryFilter]);

  const pageCount = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pagedItems = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredItems.slice(start, start + PAGE_SIZE);
  }, [currentPage, filteredItems]);

  function statusBadgeVariant(status: AnnouncementRecord["status"]): "success" | "warning" | "info" {
    if (status === "published") return "success";
    if (status === "archived") return "warning";
    if (status === "scheduled") return "info";
    return "info";
  }

  function priorityBadgeVariant(priority: AnnouncementRecord["priority"]): "success" | "warning" | "info" {
    if (priority === "emergency") return "warning";
    if (priority === "high") return "warning";
    return "info";
  }

  async function runAction(announcementId: string, action: "archive" | "restore" | "soft_delete") {
    setError(null);
    setSubmittingAction(`${announcementId}:${action}`);
    const response = await fetch(`/api/announcements/${announcementId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action })
    });
    setSubmittingAction(null);

    if (!response.ok) {
      const payload = (await response.json()) as { error?: string };
      setError(payload.error ?? "Announcement action failed.");
      return;
    }

    const payload = (await response.json()) as { announcement?: AnnouncementRecord };
    if (!payload.announcement) return;

    if (action === "soft_delete") {
      setItems((current) => current.filter((item) => item.id !== announcementId));
      return;
    }

    setItems((current) =>
      current.map((item) => (item.id === announcementId ? { ...item, ...payload.announcement! } : item))
    );
  }

  if (visibleItems.length === 0) {
    return <ExperienceEmptyState module="announcements" canCreate={permissions.canCreate} />;
  }

  return (
    <DataTableLayout
      overline="Communications"
      title="Announcements"
      description="Compose, schedule, and track resident announcements across your portfolio."
      actions={
        permissions.canCreate ? (
          <Link href="/communications/new">
            <Button>Create announcement</Button>
          </Link>
        ) : null
      }
      filters={
        <>
          <Input
            aria-label="Search announcements"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(1);
            }}
            placeholder="Title or message…"
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
            {ANNOUNCEMENT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {announcementStatusLabel(status)}
              </option>
            ))}
          </Select>
          <Select
            aria-label="Priority filter"
            value={priorityFilter}
            onChange={(event) => {
              setPriorityFilter(event.target.value);
              setPage(1);
            }}
          >
            <option value="all">All priorities</option>
            {ANNOUNCEMENT_PRIORITIES.map((priority) => (
              <option key={priority} value={priority}>
                {announcementPriorityLabel(priority)}
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
            {ANNOUNCEMENT_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {announcementCategoryLabel(category)}
              </option>
            ))}
          </Select>
        </>
      }
      error={error}
      showEmptyFiltered={filteredItems.length === 0}
      emptyFilteredMessage={getFilteredEmptyMessage("announcements")}
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
                <TableHeaderCell>Title</TableHeaderCell>
                <TableHeaderCell>Category</TableHeaderCell>
                <TableHeaderCell>Priority</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell>Recipients</TableHeaderCell>
                <TableHeaderCell>Read</TableHeaderCell>
                <TableHeaderCell>Published</TableHeaderCell>
                <TableHeaderCell className="text-right">Actions</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pagedItems.map((item) => {
                const busyArchive =
                  submittingAction === `${item.id}:archive` || submittingAction === `${item.id}:restore`;
                const busyDelete = submittingAction === `${item.id}:soft_delete`;
                const isArchived = item.archivedAt !== null;
                const canEdit = permissions.canUpdate && item.status === "draft";
                return (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Link
                        href={`/communications/${item.id}`}
                        className="font-medium text-[var(--mpa-color-brand-primary)] hover:underline"
                      >
                        {item.title}
                      </Link>
                      {isArchived ? (
                        <Badge showDot variant="warning" className="ml-2">
                          Archived
                        </Badge>
                      ) : null}
                    </TableCell>
                    <TableCell>{announcementCategoryLabel(item.category)}</TableCell>
                    <TableCell>
                      <Badge showDot variant={priorityBadgeVariant(item.priority)}>
                        {announcementPriorityLabel(item.priority)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge showDot variant={statusBadgeVariant(item.status)}>
                        {announcementStatusLabel(item.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>{item.recipientCount}</TableCell>
                    <TableCell>{item.readCount}</TableCell>
                    <TableCell>{item.publishedAt ? new Date(item.publishedAt).toLocaleDateString() : "—"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-wrap justify-end gap-2">
                        <Link href={`/communications/${item.id}`}>
                          <Button variant="secondary" size="sm">
                            View
                          </Button>
                        </Link>
                        {canEdit ? (
                          <Link href={`/communications/${item.id}/edit`}>
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
  );
}
