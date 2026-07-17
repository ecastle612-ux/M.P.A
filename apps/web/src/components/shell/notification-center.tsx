"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Badge } from "@mpa/ui";
import { notificationCategoryLabel, type NotificationCategory } from "../../lib/notifications/contracts";
import type { InAppNotificationRecord } from "../../lib/notifications/contracts";

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<InAppNotificationRecord[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  async function loadNotifications() {
    setLoading(true);
    try {
      const response = await fetch("/api/notifications?limit=8", { cache: "no-store" });
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
    if (next) {
      await loadNotifications();
    }
  }

  useEffect(() => {
    if (!open) return;
    const interval = setInterval(() => {
      void loadNotifications();
    }, 30000);
    return () => clearInterval(interval);
  }, [open]);

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

  async function markRead(notificationId: string) {
    await fetch(`/api/notifications/${notificationId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "mark_read" })
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
        aria-label="Open notifications"
      >
        <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
          <path d="M10 3.5a4.5 4.5 0 0 0-4.5 4.5v2.5l-1.5 2h12l-1.5-2V8a4.5 4.5 0 0 0-4.5-4.5z" />
          <path d="M8.5 15.5a1.5 1.5 0 0 0 3 0" />
        </svg>
        <span className="hidden sm:inline">Alerts</span>
        <span className="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-[var(--mpa-color-brand-primary)] px-1 text-[10px] font-semibold text-white">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      </button>

      {open ? (
        <div
          id="notification-menu"
          role="menu"
          aria-label="Notifications"
          className="absolute right-0 top-11 z-40 w-[min(22rem,calc(100vw-2rem))] rounded-[var(--mpa-radius-lg)] border border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-surface)] p-3 shadow-[var(--mpa-shadow-lg)]"
        >
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-[var(--mpa-color-text-primary)]">Notifications</p>
            <div className="flex items-center gap-2">
              <Badge variant="info">Live</Badge>
              {unreadCount > 0 ? (
                <button type="button" className="text-xs font-semibold text-[var(--mpa-color-brand-primary)]" onClick={() => void markAllRead()}>
                  Mark all read
                </button>
              ) : null}
            </div>
          </div>
          {loading ? (
            <p className="text-xs text-[var(--mpa-color-text-secondary)]">Loading…</p>
          ) : items.length === 0 ? (
            <p className="rounded-[var(--mpa-radius-md)] border border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-surface-muted)]/40 p-2.5 text-xs leading-relaxed text-[var(--mpa-color-text-secondary)]">
              No new notifications. Messages, maintenance updates, and announcements appear here.
            </p>
          ) : (
            <ul className="max-h-80 space-y-2 overflow-y-auto">
              {items.map((item) => (
                <li
                  key={item.id}
                  className={[
                    "rounded-[var(--mpa-radius-md)] border p-2.5 text-xs leading-relaxed",
                    item.readAt
                      ? "border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-surface-muted)]/20 text-[var(--mpa-color-text-secondary)]"
                      : "border-[var(--mpa-color-brand-primary)]/20 bg-[var(--mpa-color-brand-primary)]/5 text-[var(--mpa-color-text-primary)]"
                  ].join(" ")}
                >
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="font-semibold">{notificationCategoryLabel(item.category as NotificationCategory)}</span>
                    {!item.readAt ? (
                      <button type="button" className="text-[var(--mpa-color-brand-primary)]" onClick={() => void markRead(item.id)}>
                        Mark read
                      </button>
                    ) : null}
                  </div>
                  <p className="font-medium">{item.title}</p>
                  <p className="mt-0.5">{item.body}</p>
                  {item.href ? (
                    <Link href={item.href} className="mt-1 inline-block font-semibold text-[var(--mpa-color-brand-primary)] hover:underline">
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
