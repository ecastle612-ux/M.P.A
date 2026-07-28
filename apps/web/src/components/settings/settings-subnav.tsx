"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { SettingsNavItem } from "../../lib/settings/nav";

function pillClass(active: boolean): string {
  return [
    "inline-flex items-center rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
    active
      ? "bg-[var(--mpa-color-brand-primary)] text-[var(--mpa-color-text-inverse)]"
      : "text-[var(--mpa-color-text-secondary)] hover:bg-[var(--mpa-color-interactive-row-hover)] hover:text-[var(--mpa-color-text-primary)]"
  ].join(" ");
}

/**
 * UX-012 A09 — capability-filtered Settings pills only.
 */
export function SettingsSubnav({ items }: { items: readonly SettingsNavItem[] }) {
  const pathname = usePathname();

  if (items.length === 0) return null;

  return (
    <nav
      aria-label="Settings"
      className="flex flex-wrap gap-1 border-b border-[var(--mpa-color-border-default)] pb-3"
    >
      <span className="mr-3 self-center font-display text-xs font-semibold uppercase tracking-[0.14em] text-[var(--mpa-color-text-muted)]">
        Settings
      </span>
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link key={item.href} href={item.href} className={pillClass(active)}>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
