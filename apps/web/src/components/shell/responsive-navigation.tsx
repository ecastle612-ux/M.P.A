"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@mpa/ui";

const MOBILE_ITEMS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/profile", label: "Settings" },
  { href: "#", label: "Search" },
  { href: "#", label: "Notifications" }
];

export function ResponsiveNavigation() {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative lg:hidden">
      <Button
        variant="secondary"
        size="sm"
        className="mpa-touch-target"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="sr-only" aria-live="polite">
          {open ? "Navigation open" : "Navigation closed"}
        </span>
        Menu
      </Button>
      {open ? (
        <div className="absolute right-0 top-12 z-40 w-64 rounded-[var(--mpa-radius-lg)] border border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-surface)] p-2 shadow-mpa-md animate-[mpa-slide-in-down_var(--mpa-motion-normal)_var(--mpa-ease-standard)]">
          <ul className="space-y-1">
            {MOBILE_ITEMS.map((item) => (
              <li key={item.label}>
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="flex min-h-11 items-center rounded-[var(--mpa-radius-md)] px-3 py-2 text-sm text-[var(--mpa-color-text-primary)] transition-colors duration-[var(--mpa-motion-fast)] hover:bg-[var(--mpa-color-bg-row-hover)]"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
