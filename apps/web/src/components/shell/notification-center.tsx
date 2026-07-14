"use client";

import { useEffect, useRef, useState } from "react";
import { Badge } from "@mpa/ui";

const PLACEHOLDER_NOTIFICATIONS = [
  "No new notifications right now.",
  "Property and unit updates appear here.",
  "Actionable alerts will be prioritized at the top."
];

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleKeydown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }
    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeydown);
    window.addEventListener("mousedown", handlePointerDown);
    return () => {
      window.removeEventListener("keydown", handleKeydown);
      window.removeEventListener("mousedown", handlePointerDown);
    };
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls="notification-menu"
        className="relative rounded-md border border-[var(--mpa-color-border-default)] bg-white px-3 py-2 text-sm text-[var(--mpa-color-text-secondary)] transition-colors hover:bg-gray-50"
        aria-label="Open notifications"
      >
        Alerts
        <span className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-[var(--mpa-color-brand-primary)] text-xs text-white">
          0
        </span>
      </button>

      {open ? (
        <div
          id="notification-menu"
          role="menu"
          aria-label="Notifications"
          className="absolute right-0 top-12 z-40 w-80 rounded-md border border-[var(--mpa-color-border-default)] bg-white p-3 shadow-xl"
        >
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-semibold text-[var(--mpa-color-text-primary)]">Notifications</p>
            <Badge variant="info">Live</Badge>
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
