"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
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
  ANNOUNCEMENT_CATEGORIES,
  announcementCategoryLabel,
  announcementPriorityLabel,
  type AnnouncementRecord
} from "../../lib/communication/contracts";

export type ResidentAnnouncementItem = AnnouncementRecord & {
  readAt: string | null;
  acknowledgedAt: string | null;
};

const PAGE_SIZE = 10;

export function ResidentAnnouncementsInbox({ initialItems }: { initialItems: ResidentAnnouncementItem[] }) {
  const [items, setItems] = useState(initialItems);
  const [query, setQuery] = useState("");
  const [readFilter, setReadFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  const filteredItems = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    return items
      .filter((item) => {
        if (readFilter === "unread" && item.readAt) return false;
        if (readFilter === "read" && !item.readAt) return false;
        if (categoryFilter !== "all" && item.category !== categoryFilter) return false;
        if (!trimmed) return true;
        return item.title.toLowerCase().includes(trimmed) || item.message.toLowerCase().includes(trimmed);
      })
      .sort((left, right) => {
        const leftDate = left.publishedAt ?? left.createdAt;
        const rightDate = right.publishedAt ?? right.createdAt;
        return rightDate.localeCompare(leftDate);
      });
  }, [items, query, readFilter, categoryFilter]);

  const pageCount = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pagedItems = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredItems.slice(start, start + PAGE_SIZE);
  }, [currentPage, filteredItems]);

  async function markRead(announcementId: string, acknowledged = false) {
    setError(null);
    setSubmittingId(announcementId);
    const response = await fetch("/api/resident/announcements", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ announcementId, action: "mark_read", acknowledged })
    });
    setSubmittingId(null);

    if (!response.ok) {
      const payload = (await response.json()) as { error?: string };
      setError(payload.error ?? "Unable to mark announcement as read.");
      return;
    }

    const now = new Date().toISOString();
    setItems((current) =>
      current.map((item) =>
        item.id === announcementId
          ? {
              ...item,
              readAt: item.readAt ?? now,
              acknowledgedAt: acknowledged ? now : item.acknowledgedAt
            }
          : item
      )
    );
  }

  if (items.length === 0) {
    return (
      <Card>
        <h1 className="text-xl font-semibold text-[var(--mpa-color-text-primary)]">Announcements</h1>
        <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
          Your property announcements and community notices will appear here.
        </p>
        <div className="mt-4 rounded-lg border border-dashed border-[var(--mpa-color-border-default)] p-6 text-center">
          <p className="text-sm font-medium text-[var(--mpa-color-text-primary)]">No announcements yet</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-semibold text-[var(--mpa-color-text-primary)]">Announcements</h1>
        <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
          {filteredItems.length} announcement{filteredItems.length === 1 ? "" : "s"} in your inbox
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <Input
          aria-label="Search announcements"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setPage(1);
          }}
          placeholder="Search title or message…"
        />
        <Select
          aria-label="Read filter"
          value={readFilter}
          onChange={(event) => {
            setReadFilter(event.target.value);
            setPage(1);
          }}
        >
          <option value="all">All</option>
          <option value="unread">Unread</option>
          <option value="read">Read</option>
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
      </div>

      {error ? <p className="text-sm text-[var(--mpa-color-feedback-error)]">{error}</p> : null}

      <div className="overflow-x-auto">
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Title</TableHeaderCell>
              <TableHeaderCell>Category</TableHeaderCell>
              <TableHeaderCell>Priority</TableHeaderCell>
              <TableHeaderCell>Published</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell>Actions</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {pagedItems.map((item) => {
              const busy = submittingId === item.id;
              return (
                <TableRow key={item.id}>
                  <TableCell>
                    <Link
                      href={`/portal/tenant/announcements/${item.id}`}
                      className="font-medium text-[var(--mpa-color-brand-primary)] hover:underline"
                    >
                      {item.title}
                    </Link>
                  </TableCell>
                  <TableCell>{announcementCategoryLabel(item.category)}</TableCell>
                  <TableCell>
                    <Badge variant={item.priority === "emergency" || item.priority === "high" ? "warning" : "info"}>
                      {announcementPriorityLabel(item.priority)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {item.publishedAt ? new Date(item.publishedAt).toLocaleDateString() : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={item.readAt ? "success" : "info"}>{item.readAt ? "Read" : "Unread"}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      <Link href={`/portal/tenant/announcements/${item.id}`}>
                        <Button variant="secondary" size="sm">
                          View
                        </Button>
                      </Link>
                      {!item.readAt ? (
                        <Button variant="ghost" size="sm" disabled={busy} onClick={() => markRead(item.id)}>
                          {busy ? "Saving..." : "Mark read"}
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

export function ResidentAnnouncementDetail({ announcement }: { announcement: ResidentAnnouncementItem }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [readAt, setReadAt] = useState<string | null>(announcement.readAt);
  const [acknowledgedAt, setAcknowledgedAt] = useState<string | null>(announcement.acknowledgedAt);

  async function markRead(acknowledged = false) {
    setError(null);
    setSubmitting(true);
    const response = await fetch("/api/resident/announcements", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ announcementId: announcement.id, action: "mark_read", acknowledged })
    });
    setSubmitting(false);

    if (!response.ok) {
      const payload = (await response.json()) as { error?: string };
      setError(payload.error ?? "Unable to mark announcement as read.");
      return;
    }

    const now = new Date().toISOString();
    setReadAt((current) => current ?? now);
    if (acknowledged) setAcknowledgedAt(now);
    router.refresh();
  }

  return (
    <Card className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-[var(--mpa-color-text-primary)]">
            {announcement.title}
          </h1>
          <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
            {announcementCategoryLabel(announcement.category)} ·{" "}
            {announcementPriorityLabel(announcement.priority)} priority
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant={readAt ? "success" : "info"}>{readAt ? "Read" : "Unread"}</Badge>
          {announcement.requiresAcknowledgment ? (
            <Badge variant={acknowledgedAt ? "success" : "warning"}>
              {acknowledgedAt ? "Acknowledged" : "Acknowledgment required"}
            </Badge>
          ) : null}
        </div>
      </div>

      <p className="whitespace-pre-wrap text-sm text-[var(--mpa-color-text-secondary)]">{announcement.message}</p>

      <div className="grid gap-2 text-sm text-[var(--mpa-color-text-secondary)] md:grid-cols-2">
        <p>Published: {announcement.publishedAt ? new Date(announcement.publishedAt).toLocaleString() : "—"}</p>
        <p>Read: {readAt ? new Date(readAt).toLocaleString() : "—"}</p>
      </div>

      {error ? <p className="text-sm text-[var(--mpa-color-feedback-error)]">{error}</p> : null}

      <div className="flex flex-wrap gap-2">
        {!readAt ? (
          <Button disabled={submitting} onClick={() => markRead(false)}>
            {submitting ? "Saving..." : "Mark as read"}
          </Button>
        ) : null}
        {announcement.requiresAcknowledgment && !acknowledgedAt ? (
          <Button variant="secondary" disabled={submitting} onClick={() => markRead(true)}>
            {submitting ? "Saving..." : "Acknowledge"}
          </Button>
        ) : null}
        <Link href="/portal/tenant/announcements">
          <Button variant="ghost">Back to inbox</Button>
        </Link>
      </div>
    </Card>
  );
}
