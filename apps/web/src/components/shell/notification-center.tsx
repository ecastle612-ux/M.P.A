"use client";

import { useState } from "react";
import { Badge } from "@mpa/ui";

const PLACEHOLDER_NOTIFICATIONS = [
  "Notification framework initialized",
  "No business alerts configured yet",
  "Use this center for platform-level events"
];

export function NotificationCenter() {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="relative inline-flex min-h-9 items-center rounded-[var(--mpa-radius-md)] border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] px-3 py-2 text-sm text-[var(--mpa-color-text-secondary)] transition-[background-color,border-color] duration-[var(--mpa-motion-fast)] hover:border-[var(--mpa-color-border-strong)] hover:bg-[var(--mpa-color-bg-row-hover)]"
        aria-label="Open notifications"
      >
        Notifications
        <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--mpa-color-brand-primary)] px-1 text-xs text-white">
          3
        </span>
      </button>

      {open ? (
        <div
          role="menu"
          aria-label="Notifications"
          className="absolute right-0 top-12 z-40 w-80 max-w-[calc(100vw-2rem)] rounded-[var(--mpa-radius-lg)] border border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-surface)] p-3 shadow-mpa-md animate-[mpa-slide-in-down_var(--mpa-motion-normal)_var(--mpa-ease-standard)]"
        >
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-[var(--mpa-color-text-primary)]">Notifications</p>
            <Badge variant="info">Framework</Badge>
          </div>
          <ul className="space-y-2">
            {PLACEHOLDER_NOTIFICATIONS.map((item) => (
              <li
                key={item}
                className="rounded-[var(--mpa-radius-md)] border border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-surface-muted)] p-2.5 text-xs leading-relaxed text-[var(--mpa-color-text-secondary)]"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
