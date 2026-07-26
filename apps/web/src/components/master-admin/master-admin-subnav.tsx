"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NavList, navItemClassName } from "@mpa/ui";

const ITEMS = [
  { href: "/master-admin", label: "Mission Control", exact: true },
  { href: "/settings/appearance", label: "Appearance", exact: false },
  { href: "/settings", label: "Settings", exact: false },
  { href: "/master-admin/health", label: "Platform", exact: false },
  { href: "/master-admin/notifications", label: "Push", exact: false },
  { href: "/master-admin/impersonation", label: "Customers", exact: false },
  { href: "/master-admin/recovery", label: "Recovery", exact: false },
  { href: "/master-admin/commercial", label: "Commercial", exact: false },
  { href: "/migration", label: "Migration", exact: false },
  { href: "/portal", label: "Support", exact: false },
  { href: "/master-admin/testing", label: "Demo", exact: false },
  { href: "/master-admin/providers", label: "Integrations", exact: false },
  { href: "/master-admin/flags", label: "Flags", exact: false }
] as const;

export function MasterAdminSubnav() {
  const pathname = usePathname();

  return (
    <NavList
      aria-label="Master Admin"
      className="border-b border-[var(--mpa-color-border-default)] pb-[var(--mpa-space-3)]"
    >
      <span className="mr-[var(--mpa-space-3)] self-center font-display text-[var(--mpa-font-size-micro)] font-[var(--mpa-font-weight-semibold)] uppercase tracking-[0.14em] text-[var(--mpa-color-text-muted)]">
        HQ
      </span>
      {ITEMS.map((item) => {
        const active = item.exact
          ? pathname === item.href
          : pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={navItemClassName(active)}
            aria-current={active ? "page" : undefined}
          >
            {item.label}
          </Link>
        );
      })}
    </NavList>
  );
}
