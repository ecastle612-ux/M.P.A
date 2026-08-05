"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { isRouteActive, shellHomeHref } from "./navigation-config";
import { useSessionPermissions } from "./use-session-permissions";

function openCommandCenter() {
  window.dispatchEvent(new Event("mpa:open-command-center"));
}

function openNotifications() {
  window.dispatchEvent(new Event("mpa:open-notifications"));
}

/**
 * UX-016 Slice C — Ops mobile bottom nav (≤ 5).
 * Dashboard · My Work · Search · Notifications · Profile
 */
export function OpsMobileBottomNav() {
  const pathname = usePathname();
  const { permissions, masterAdminOnlyShell } = useSessionPermissions();
  const homeHref = shellHomeHref(permissions, { masterAdminOnlyShell });
  const workHref = masterAdminOnlyShell ? "/master-admin/impersonation" : "/inbox";

  const items = [
    {
      id: "dashboard",
      label: "Dashboard",
      href: homeHref,
      active: isRouteActive(pathname, homeHref, homeHref === "/master-admin"),
      onClick: null as (() => void) | null
    },
    {
      id: "my-work",
      label: "My Work",
      href: workHref,
      active: isRouteActive(pathname, workHref),
      onClick: null as (() => void) | null
    },
    {
      id: "search",
      label: "Search",
      href: "#search",
      active: false,
      onClick: openCommandCenter
    },
    {
      id: "notifications",
      label: "Alerts",
      href: "#notifications",
      active: false,
      onClick: openNotifications
    },
    {
      id: "profile",
      label: "Profile",
      href: "/profile",
      active: isRouteActive(pathname, "/profile", true),
      onClick: null as (() => void) | null
    }
  ] as const;

  return (
    <nav
      data-ux016="ops-mobile-bottom-nav"
      aria-label="Primary mobile"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-surface)]/95 pb-[var(--mpa-safe-bottom)] backdrop-blur-md lg:hidden"
    >
      <ul className="grid grid-cols-5 gap-1 px-1 pt-1">
        {items.map((item) => {
          const className = [
            "flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-[var(--mpa-radius-md)] px-1 py-1 text-[10px] font-medium",
            item.active
              ? "text-[var(--mpa-color-brand-primary)]"
              : "text-[var(--mpa-color-text-secondary)] hover:text-[var(--mpa-color-text-primary)]"
          ].join(" ");

          if (item.onClick) {
            return (
              <li key={item.id}>
                <button type="button" className={`w-full ${className}`} onClick={item.onClick}>
                  <span aria-hidden="true" className="text-base leading-none">
                    {item.id === "search" ? "⌕" : item.id === "notifications" ? "◉" : "•"}
                  </span>
                  <span>{item.label}</span>
                </button>
              </li>
            );
          }

          return (
            <li key={item.id}>
              <Link href={item.href} className={className} aria-current={item.active ? "page" : undefined}>
                <span aria-hidden="true" className="text-base leading-none">
                  {item.id === "dashboard" ? "⌂" : item.id === "my-work" ? "★" : "•"}
                </span>
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
