"use client";

import Link from "next/link";
import { useState } from "react";
import type { UnifiedNotificationRecord } from "@mpa/shared";
import { Badge } from "@mpa/ui";

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<UnifiedNotificationRecord[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const response = await fetch("/api/shared/communications/notifications");
      const body = await response.json();
      if (!response.ok) {
        setItems([]);
        setUnreadCount(0);
        setError(null);
        return;
      }
      setItems((body.notifications as UnifiedNotificationRecord[]).slice(0, 12));
      setUnreadCount(Number(body.unreadCount ?? 0));
      setError(null);
    } catch {
      setError("Unable to load notifications");
    } finally {
      setLoading(false);
    }
  }

  async function toggle() {
    const next = !open;
    setOpen(next);
    if (next) {
      await load();
    }
  }

  async function markRead(notificationId: string) {
    await fetch("/api/shared/communications/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notificationId })
    });
    await load();
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => void toggle()}
        aria-haspopup="menu"
        aria-expanded={open}
        className="relative rounded-md border border-[var(--mpa-color-border-default)] bg-white px-3 py-2 text-sm text-[var(--mpa-color-text-secondary)] hover:bg-gray-50"
        aria-label="Open notifications"
      >
        Notifications
        <span className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-[var(--mpa-color-brand-primary)] text-xs text-white">
          {unreadCount}
        </span>
      </button>

      {open ? (
        <div
          role="menu"
          aria-label="Notifications"
          className="absolute right-0 top-12 z-40 w-96 rounded-md border border-[var(--mpa-color-border-default)] bg-white p-3 shadow-xl"
        >
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-semibold text-[var(--mpa-color-text-primary)]">Notifications</p>
            <Link
              href="/shared/communications"
              className="text-xs text-[var(--mpa-color-brand-primary)] underline"
            >
              Open Communications
            </Link>
          </div>
          {error ? <p className="text-xs text-[#C0392B]">{error}</p> : null}
          {loading ? (
            <p className="text-xs text-[var(--mpa-color-text-secondary)]">Loading…</p>
          ) : items.length === 0 ? (
            <p className="text-xs text-[var(--mpa-color-text-secondary)]">
              No system notifications yet. Finance, maintenance, and messages appear here.
            </p>
          ) : (
            <ul className="max-h-80 space-y-2 overflow-auto">
              {items.map((item) => (
                <li
                  key={item.id}
                  className="rounded-md border border-[var(--mpa-color-border-subtle)] p-2 text-xs text-[var(--mpa-color-text-secondary)]"
                >
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="font-medium text-[var(--mpa-color-text-primary)]">
                      {item.title}
                    </span>
                    <Badge variant={item.readAt ? "neutral" : "info"}>{item.source}</Badge>
                  </div>
                  {item.body}
                  <div className="mt-2 flex flex-wrap gap-2">
                    {item.href ? (
                      <Link
                        href={item.href}
                        className="text-[var(--mpa-color-brand-primary)] underline"
                      >
                        Open
                      </Link>
                    ) : null}
                    {!item.readAt ? (
                      <button
                        type="button"
                        className="text-[var(--mpa-color-brand-primary)] underline"
                        onClick={() => void markRead(item.id)}
                      >
                        Mark read
                      </button>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
