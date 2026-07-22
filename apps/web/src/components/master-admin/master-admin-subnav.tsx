"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navPillClassName } from "@mpa/ui";

const ITEMS = [
  { href: "/master-admin", label: "Mission Control", exact: true },
  { href: "/master-admin/health", label: "Platform", exact: false },
  { href: "/master-admin/impersonation", label: "Customers", exact: false },
  { href: "/migration", label: "Migration", exact: false },
  { href: "/portal", label: "Support", exact: false },
  { href: "/master-admin/testing", label: "Demo", exact: false },
  { href: "/master-admin/providers", label: "Integrations", exact: false },
  { href: "/master-admin/flags", label: "Flags", exact: false }
] as const;

export function MasterAdminSubnav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Master Admin"
      className="flex flex-wrap gap-1 border-b border-[var(--mpa-color-border-default)] pb-3"
    >
      <span className="mr-3 self-center font-display text-xs font-semibold uppercase tracking-[0.14em] text-[var(--mpa-color-text-muted)]">
        HQ
      </span>
      {ITEMS.map((item) => {
        const active = item.exact
          ? pathname === item.href
          : pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link key={item.href} href={item.href} className={navPillClassName(active)}>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
