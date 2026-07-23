"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Badge, Input, Select } from "@mpa/ui";
import {
  NOTIFICATION_CATEGORIES,
  notificationCategoryLabel,
  type NotificationCategory,
  type InAppNotificationRecord
} from "../../lib/notifications/contracts";

type FilterMode = "inbox" | "unread" | "archived";

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<InAppNotificationRecord[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<FilterMode>("inbox");
  const [category, setCategory] = useState<NotificationCategory | "all">("all");
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  async function loadNotifications() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "20" });
      if (filter === "unread") params.set("unreadOnly", "true");
      if (filter === "archived") params.set("archived", "true");
      if (category !== "all") params.set("category", category);
      if (query.trim()) params.set("q", query.trim());
      const response = await fetch(`/api/notifications?${params.toString()}`, { cache: "no-store" });
      if (!response.ok) return;
      const payload = (await response.json()) as { items?: InAppNotificationRecord[]; unreadCount?: number };
      setItems(payload.items ?? []);
      setUnreadCount(payload.unreadCount ?? 0);
    } finally {
      setLoading(false);
    }
  }

  async function toggleOpen() {
    const next = !open;
    setOpen(next);
    if (next) await loadNotifications();
  }

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => {
      void loadNotifications();
    }, 0);
    const interval = setInterval(() => {
      void loadNotifications();
    }, 30000);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, filter, category]);

  useEffect(() => {
    function handleKeydown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    window.addEventListener("keydown", handleKeydown);
    window.addEventListener("mousedown", handlePointerDown);
    return () => {
      window.removeEventListener("keydown", handleKeydown);
      window.removeEventListener("mousedown", handlePointerDown);
    };
  }, []);

  async function markAllRead() {
    await fetch("/api/notifications/read-all", { method: "POST" });
    await loadNotifications();
  }

  async function mutate(notificationId: string, action: string) {
    await fetch(`/api/notifications/${notificationId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action })
    });
    await loadNotifications();
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => void toggleOpen()}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls="notification-menu"
        className="relative inline-flex h-9 items-center gap-2 rounded-[var(--mpa-radius-md)] border border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-surface)] px-3 text-sm text-[var(--mpa-color-text-secondary)] shadow-[var(--mpa-shadow-xs)] transition-colors hover:bg-[var(--mpa-color-interactive-row-hover)]"
        aria-label={`Open notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
      >
        <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
          <path d="M10 3.5a4.5 4.5 0 0 0-4.5 4.5v2.5l-1.5 2h12l-1.5-2V8a4.5 4.5 0 0 0-4.5-4.5z" />
          <path d="M8.5 15.5a1.5 1.5 0 0 0 3 0" />
        </svg>
        <span className="hidden sm:inline">Alerts</span>
        <span className="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-[var(--mpa-color-brand-primary)] px-1 text-[10px] font-semibold text-[var(--mpa-color-text-inverse)]">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      </button>

      {open ? (
        <div
          id="notification-menu"
          role="menu"
          aria-label="Notifications"
          className="absolute right-0 top-11 z-40 w-[min(24rem,calc(100vw-2rem))] rounded-[var(--mpa-radius-lg)] border border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-surface)] p-3 shadow-[var(--mpa-shadow-lg)]"
        >
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-[var(--mpa-color-text-primary)]">Notifications</p>
            <div className="flex items-center gap-2">
              <Badge variant="info">Live</Badge>
              {unreadCount > 0 && filter !== "archived" ? (
                <button type="button" className="text-xs font-semibold text-[var(--mpa-color-brand-primary)]" onClick={() => void markAllRead()}>
                  Mark all read
                </button>
              ) : null}
            </div>
          </div>

          <div className="mb-2 grid gap-2">
            <div className="flex gap-1">
              {(["inbox", "unread", "archived"] as FilterMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setFilter(mode)}
                  className={[
                    "rounded-[var(--mpa-radius-md)] px-2 py-1 text-[11px] font-medium capitalize",
                    filter === mode
                      ? "bg-[var(--mpa-color-brand-primary)]/10 text-[var(--mpa-color-brand-primary)]"
                      : "text-[var(--mpa-color-text-secondary)] hover:bg-[var(--mpa-color-interactive-row-hover)]"
                  ].join(" ")}
                >
                  {mode}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <Select
                aria-label="Category filter"
                value={category}
                onChange={(event) => setCategory(event.target.value as NotificationCategory | "all")}
                className="h-8 text-xs"
              >
                <option value="all">All categories</option>
                {NOTIFICATION_CATEGORIES.map((entry) => (
                  <option key={entry} value={entry}>
                    {notificationCategoryLabel(entry)}
                  </option>
                ))}
              </Select>
            </div>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void loadNotifications();
              }}
            >
              <Input
                aria-label="Search notifications"
                placeholder="Search title or body"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="h-8 text-xs"
              />
            </form>
          </div>

          {loading ? (
            <p className="text-xs text-[var(--mpa-color-text-secondary)]">Loading…</p>
          ) : items.length === 0 ? (
            <p className="rounded-[var(--mpa-radius-md)] border border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-surface-muted)]/40 p-2.5 text-xs leading-relaxed text-[var(--mpa-color-text-secondary)]">
              No notifications in this view. Messages, maintenance, and announcements appear here.
            </p>
          ) : (
            <ul className="max-h-80 space-y-2 overflow-y-auto">
              {items.map((item) => (
                <li
                  key={item.id}
                  className={[
                    "rounded-[var(--mpa-radius-md)] border p-2.5 text-xs leading-relaxed",
                    item.priority === "emergency"
                      ? "border-[var(--mpa-color-feedback-error)]/40 bg-[var(--mpa-color-feedback-error)]/5"
                      : item.readAt
                        ? "border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-surface-muted)]/20 text-[var(--mpa-color-text-secondary)]"
                        : "border-[var(--mpa-color-brand-primary)]/20 bg-[var(--mpa-color-brand-primary)]/5 text-[var(--mpa-color-text-primary)]"
                  ].join(" ")}
                >
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="font-semibold">
                      {notificationCategoryLabel(item.category)}
                      {item.priority === "emergency" || item.priority === "high" ? ` · ${item.priority}` : ""}
                    </span>
                    <div className="flex gap-2">
                      {!item.readAt ? (
                        <button type="button" className="text-[var(--mpa-color-brand-primary)]" onClick={() => void mutate(item.id, "mark_read")}>
                          Read
                        </button>
                      ) : null}
                      {filter === "archived" ? (
                        <button type="button" className="text-[var(--mpa-color-text-secondary)]" onClick={() => void mutate(item.id, "unarchive")}>
                          Restore
                        </button>
                      ) : (
                        <button type="button" className="text-[var(--mpa-color-text-secondary)]" onClick={() => void mutate(item.id, "archive")}>
                          Archive
                        </button>
                      )}
                      <button type="button" className="text-[var(--mpa-color-text-secondary)]" onClick={() => void mutate(item.id, "delete")}>
                        Delete
                      </button>
                    </div>
                  </div>
                  <p className="font-medium">{item.title}</p>
                  <p className="mt-0.5">{item.body}</p>
                  {item.href ? (
                    <Link
                      href={item.href}
                      onClick={() => {
                        if (!item.readAt) void mutate(item.id, "mark_read");
                        setOpen(false);
                      }}
                      className="mt-1 inline-block font-semibold text-[var(--mpa-color-brand-primary)] hover:underline"
                    >
                      View
                    </Link>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
