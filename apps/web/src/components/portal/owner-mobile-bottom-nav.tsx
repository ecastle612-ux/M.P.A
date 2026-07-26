"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  NavIconCommunications,
  NavIconDashboard,
  NavIconFinancials,
  NavIconLeases,
  NavIconMaintenance,
  NavIconPortals,
  NavIconProperties
} from "../presentation/nav-icons";
import type { PortalNavigationItem } from "./navigation";

const ICON_BY_HREF: Record<string, typeof NavIconDashboard> = {
  "/portal/owner": NavIconDashboard,
  "/portal/owner/properties": NavIconProperties,
  "/portal/owner/financials": NavIconFinancials,
  "/portal/owner/messages": NavIconCommunications,
  "/portal/owner/more": NavIconPortals,
  "/portal/tenant": NavIconDashboard,
  "/portal/tenant/payments": NavIconFinancials,
  "/portal/tenant/messages": NavIconCommunications,
  "/portal/tenant/maintenance": NavIconMaintenance,
  "/portal/tenant/more": NavIconPortals,
  "/portal/tenant/documents": NavIconLeases,
  "/portal/tenant/community": NavIconProperties
};

function isBottomNavActive(pathname: string, href: string): boolean {
  if (href === "/portal/owner" || href === "/portal/tenant") {
    return pathname === href;
  }
  if (href === "/portal/owner/more") {
    return (
      pathname === "/portal/owner/more" ||
      pathname.startsWith("/portal/owner/documents") ||
      pathname.startsWith("/portal/owner/reports") ||
      pathname.startsWith("/portal/owner/settings")
    );
  }
  if (href === "/portal/tenant/more") {
    return (
      pathname === "/portal/tenant/more" ||
      pathname.startsWith("/portal/tenant/announcements") ||
      pathname.startsWith("/portal/tenant/notifications") ||
      pathname.startsWith("/portal/tenant/preferences")
    );
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Shared mobile bottom tabs — Owner + Tenant (composition only). */
export function PortalMobileBottomNav({
  items,
  ariaLabel = "Mobile navigation"
}: {
  items: readonly PortalNavigationItem[];
  ariaLabel?: string;
}) {
  const pathname = usePathname() ?? "";
  const cols = Math.min(Math.max(items.length, 3), 5);

  return (
    <nav
      aria-label={ariaLabel}
      className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm lg:hidden"
    >
      <ul
        className="mx-auto grid max-w-lg gap-0 px-1 pt-1"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {items.map((item) => {
          const active = isBottomNavActive(pathname, item.href);
          const Icon = ICON_BY_HREF[item.href] ?? NavIconDashboard;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={
                  active
                    ? "flex min-h-[3.25rem] flex-col items-center justify-center gap-0.5 rounded-[var(--mpa-radius-md)] px-1 text-[var(--mpa-color-brand-primary)] transition-colors"
                    : "flex min-h-[3.25rem] flex-col items-center justify-center gap-0.5 rounded-[var(--mpa-radius-md)] px-1 text-[var(--mpa-color-text-secondary)] transition-colors hover:text-[var(--mpa-color-text-primary)]"
                }
              >
                <Icon className="h-5 w-5" />
                <span className="truncate text-[10px] font-medium leading-none">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** @deprecated Prefer PortalMobileBottomNav — kept for existing owner imports. */
export function OwnerMobileBottomNav({
  items
}: {
  items: readonly PortalNavigationItem[];
}) {
  return <PortalMobileBottomNav items={items} ariaLabel="Owner mobile navigation" />;
}
