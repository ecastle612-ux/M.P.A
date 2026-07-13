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
        className="relative rounded-md border border-[var(--mpa-color-border-default)] bg-white px-3 py-2 text-sm text-[var(--mpa-color-text-secondary)] hover:bg-gray-50"
        aria-label="Open notifications"
      >
        Notifications
        <span className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-[var(--mpa-color-brand-primary)] text-xs text-white">
          3
        </span>
      </button>

      {open ? (
        <div
          role="menu"
          aria-label="Notifications"
          className="absolute right-0 top-12 z-40 w-80 rounded-md border border-[var(--mpa-color-border-default)] bg-white p-3 shadow-xl"
        >
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-semibold text-[var(--mpa-color-text-primary)]">Notifications</p>
            <Badge variant="info">Framework</Badge>
          </div>
          <ul className="space-y-2">
            {PLACEHOLDER_NOTIFICATIONS.map((item) => (
              <li key={item} className="rounded-md border border-[var(--mpa-color-border-subtle)] p-2 text-xs text-[var(--mpa-color-text-secondary)]">
                {item}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
