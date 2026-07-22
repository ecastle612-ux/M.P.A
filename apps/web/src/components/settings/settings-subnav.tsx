"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navPillClassName } from "@mpa/ui";

const ITEMS = [
  { href: "/settings/organization", label: "Organization", exact: false },
  { href: "/settings/team", label: "Team", exact: false },
  { href: "/settings/billing", label: "Billing", exact: false },
  { href: "/settings/appearance", label: "Appearance", exact: false },
  { href: "/settings/integrations", label: "Integrations", exact: false },
  { href: "/settings/documents", label: "Documents", exact: false },
  { href: "/settings/notifications", label: "Notifications", exact: false }
] as const;

export function SettingsSubnav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Settings"
      className="flex flex-wrap gap-1 border-b border-[var(--mpa-color-border-default)] pb-3"
    >
      <span className="mr-3 self-center font-display text-xs font-semibold uppercase tracking-[0.14em] text-[var(--mpa-color-text-muted)]">
        Settings
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
