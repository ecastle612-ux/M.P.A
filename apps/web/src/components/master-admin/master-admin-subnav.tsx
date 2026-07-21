"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/master-admin", label: "Hub", exact: true },
  { href: "/master-admin/impersonation", label: "Impersonation", exact: false },
  { href: "/master-admin/dashboards", label: "Dashboards", exact: false },
  { href: "/master-admin/providers", label: "Providers", exact: false },
  { href: "/master-admin/testing", label: "Testing", exact: false },
  { href: "/master-admin/health", label: "Health", exact: false },
  { href: "/master-admin/flags", label: "Flags", exact: false }
] as const;

export function MasterAdminSubnav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Master Admin"
      className="flex flex-wrap gap-1 border-b border-[var(--mpa-color-border-default)] pb-3"
    >
      <span className="mr-3 self-center font-display text-xs font-semibold uppercase tracking-[0.14em] text-[var(--mpa-color-text-tertiary)]">
        Master Admin
      </span>
      {ITEMS.map((item) => {
        const active = item.exact
          ? pathname === item.href
          : pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={
              active
                ? "rounded-md bg-[var(--mpa-color-surface-muted)] px-3 py-1.5 text-sm font-medium text-[var(--mpa-color-text-primary)]"
                : "rounded-md px-3 py-1.5 text-sm text-[var(--mpa-color-text-secondary)] transition hover:bg-[var(--mpa-color-surface-muted)] hover:text-[var(--mpa-color-text-primary)]"
            }
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
