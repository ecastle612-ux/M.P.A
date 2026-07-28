"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { UnifiedInboxItem } from "../../lib/ops/unified-inbox";

const PANEL =
  "rounded-[var(--mpa-radius-xl)] border border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-surface)] shadow-[var(--mpa-shadow-xs)]";

type InboxResponse = {
  items: UnifiedInboxItem[];
  unreadCount: number;
};

const KIND_OPTIONS = [
  { value: "all", label: "All" },
  { value: "notification", label: "Notifications" },
  { value: "task", label: "Tasks" },
  { value: "ai", label: "AI" },
  { value: "system", label: "System" },
  { value: "announcement", label: "Announcements" }
] as const;

export function UnifiedInboxPanel() {
  const searchParams = useSearchParams();
  const initialKind = searchParams.get("kind") ?? "all";
  const [kind, setKind] = useState(initialKind);
  const [status, setStatus] = useState<"all" | "unread" | "open" | "read">("all");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [assignedToMe, setAssignedToMe] = useState(false);
  const [data, setData] = useState<InboxResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (kind !== "all") params.set("kind", kind);
    if (status !== "all") params.set("status", status);
    if (unreadOnly) params.set("unreadOnly", "1");
    if (assignedToMe) params.set("assignedToMe", "1");
    params.set("limit", "60");
    return params.toString();
  }, [kind, status, unreadOnly, assignedToMe]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/ops/inbox?${query}`, { cache: "no-store" });
      if (!response.ok) {
        setError("Could not load Unified Inbox");
        setData(null);
        return;
      }
      const payload = (await response.json()) as InboxResponse;
      setData(payload);
    } catch {
      setError("Could not load Unified Inbox");
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    void load();
  }, [load]);

  async function markRead(item: UnifiedInboxItem) {
    if (!item.itemId.startsWith("notification:")) return;
    const response = await fetch("/api/ops/inbox", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sourceId: item.itemId, read: true })
    });
    if (response.ok) await load();
  }

  return (
    <div className="space-y-[var(--mpa-space-4)]">
      <div className={`${PANEL} p-[var(--mpa-space-4)]`}>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.08em] text-[var(--mpa-color-text-tertiary)]">
              Operations
            </p>
            <h1 className="font-display text-2xl font-semibold text-[var(--mpa-color-text-primary)]">
              Unified Inbox
            </h1>
            <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
              Organization-scoped operational items from notifications, tasks, and AI Director. Distinct from
              messaging inbox.
            </p>
          </div>
          <p className="text-sm text-[var(--mpa-color-text-secondary)]">
            Unread in view: <span className="font-medium text-[var(--mpa-color-text-primary)]">{data?.unreadCount ?? 0}</span>
          </p>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {KIND_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setKind(option.value)}
              className={`rounded-[var(--mpa-radius-md)] px-3 py-1.5 text-sm ${
                kind === option.value
                  ? "bg-[var(--mpa-color-bg-muted)] font-medium text-[var(--mpa-color-text-primary)]"
                  : "text-[var(--mpa-color-text-secondary)]"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap gap-4 text-sm text-[var(--mpa-color-text-secondary)]">
          <label className="inline-flex items-center gap-2">
            Status
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value as typeof status)}
              className="rounded-[var(--mpa-radius-md)] border border-[var(--mpa-color-border-subtle)] bg-transparent px-2 py-1"
            >
              <option value="all">All</option>
              <option value="unread">Unread</option>
              <option value="open">Open</option>
              <option value="read">Read</option>
            </select>
          </label>
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={unreadOnly}
              onChange={(event) => setUnreadOnly(event.target.checked)}
            />
            Unread only
          </label>
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={assignedToMe}
              onChange={(event) => setAssignedToMe(event.target.checked)}
            />
            Assigned to me
          </label>
          <Link href="/activity" className="underline">
            Open timeline
          </Link>
          <Link href="/communications/inbox" className="underline">
            Messaging inbox
          </Link>
        </div>
      </div>

      <div className={`${PANEL} divide-y divide-[var(--mpa-color-border-subtle)]`}>
        {loading ? (
          <p className="p-[var(--mpa-space-4)] text-sm text-[var(--mpa-color-text-tertiary)]">Loading inbox…</p>
        ) : null}
        {error ? (
          <p className="p-[var(--mpa-space-4)] text-sm text-[var(--mpa-color-status-danger)]" role="alert">
            {error}
          </p>
        ) : null}
        {!loading && !error && (data?.items.length ?? 0) === 0 ? (
          <p className="p-[var(--mpa-space-4)] text-sm text-[var(--mpa-color-text-tertiary)]">No matching items.</p>
        ) : null}
        {data?.items.map((item) => (
          <article key={item.itemId} className="flex flex-wrap items-start justify-between gap-3 p-[var(--mpa-space-4)]">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-[var(--mpa-radius-sm)] bg-[var(--mpa-color-bg-muted)] px-2 py-0.5 text-xs uppercase tracking-wide text-[var(--mpa-color-text-tertiary)]">
                  {item.kind}
                </span>
                <span className="text-xs text-[var(--mpa-color-text-tertiary)]">{item.priority}</span>
                {item.status ? (
                  <span className="text-xs text-[var(--mpa-color-text-tertiary)]">{item.status}</span>
                ) : null}
                {item.assignmentState ? (
                  <span className="text-xs text-[var(--mpa-color-text-tertiary)]">{item.assignmentState}</span>
                ) : null}
                {!item.readAt ? (
                  <span className="text-xs font-medium text-[var(--mpa-color-text-primary)]">Unread</span>
                ) : null}
              </div>
              <h2 className="mt-1 text-base font-medium text-[var(--mpa-color-text-primary)]">{item.title}</h2>
              <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">{item.preview}</p>
              <p className="mt-1 text-xs text-[var(--mpa-color-text-tertiary)]">
                {new Date(item.occurredAt).toLocaleString()}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {item.deepLink ? (
                <Link
                  href={item.deepLink}
                  className="rounded-[var(--mpa-radius-md)] border border-[var(--mpa-color-border-subtle)] px-3 py-1.5 text-sm"
                >
                  Open
                </Link>
              ) : null}
              {item.itemId.startsWith("notification:") && !item.readAt ? (
                <button
                  type="button"
                  onClick={() => void markRead(item)}
                  className="rounded-[var(--mpa-radius-md)] bg-[var(--mpa-color-bg-muted)] px-3 py-1.5 text-sm"
                >
                  Mark read
                </button>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
