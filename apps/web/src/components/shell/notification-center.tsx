"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { UnifiedNotificationRecord } from "@mpa/shared";
import { Badge, EmptyState, Skeleton } from "@mpa/ui";

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<UnifiedNotificationRecord[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const inFlight = useRef<AbortController | null>(null);

  const load = useCallback(async (options?: { showLoading?: boolean }) => {
    inFlight.current?.abort();
    const controller = new AbortController();
    inFlight.current = controller;

    if (options?.showLoading) {
      setLoading(true);
    }

    try {
      const response = await fetch("/api/shared/communications/notifications", {
        signal: controller.signal
      });
      const body = await response.json();
      if (controller.signal.aborted) {
        return;
      }
      if (!response.ok) {
        setItems([]);
        setUnreadCount(0);
        setError(
          response.status === 403
            ? "Notifications are not available for this role."
            : "Unable to load notifications"
        );
        return;
      }
      setItems((body.notifications as UnifiedNotificationRecord[]).slice(0, 12));
      setUnreadCount(Number(body.unreadCount ?? 0));
      setError(null);
    } catch (err) {
      if (controller.signal.aborted) {
        return;
      }
      if (err instanceof DOMException && err.name === "AbortError") {
        return;
      }
      setError("Unable to load notifications");
    } finally {
      if (!controller.signal.aborted && options?.showLoading) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void load();
    return () => {
      inFlight.current?.abort();
    };
  }, [load]);

  async function toggle() {
    const next = !open;
    setOpen(next);
    if (next) {
      await load({ showLoading: true });
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
        aria-label={`Open notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
      >
        Notifications
        {unreadCount > 0 ? (
          <span
            className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--mpa-color-brand-primary)] px-1 text-xs text-white"
            aria-hidden="true"
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          role="menu"
          aria-label="Notifications"
          className="absolute right-0 top-12 z-40 w-[min(24rem,calc(100vw-2rem))] rounded-md border border-[var(--mpa-color-border-default)] bg-white p-3 shadow-xl"
        >
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-[var(--mpa-color-text-primary)]">Notifications</p>
            <Link
              href="/shared/communications"
              role="menuitem"
              className="text-xs text-[var(--mpa-color-brand-primary)] underline"
            >
              Open Communications
            </Link>
          </div>
          {error ? <p className="text-xs text-[#C0392B]">{error}</p> : null}
          {loading ? (
            <div className="space-y-2" aria-busy="true">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : items.length === 0 ? (
            <EmptyState
              className="border-0 bg-transparent px-0 py-2"
              title="No notifications yet"
              description="Finance, maintenance, and messages appear here when activity starts."
            />
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
                        role="menuitem"
                        className="text-[var(--mpa-color-brand-primary)] underline"
                      >
                        Open
                      </Link>
                    ) : null}
                    {!item.readAt ? (
                      <button
                        type="button"
                        role="menuitem"
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
