"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useState } from "react";
import {
  NavIconCommunications,
  NavIconDashboard,
  NavIconMaintenance,
  NavIconPortals
} from "../presentation/nav-icons";
import { MOBILE_QUICK_CREATE_ACTIONS, isMasterAdminOnlyPermissions, shellHomeHref } from "./navigation-config";
import { openMobileNavDrawer, openNotificationCenter } from "./nav-history";
import { useSessionPermissions } from "./use-session-permissions";

/**
 * UX-016 Slice C — ops mobile bottom nav:
 * Home · My Work · Create · Notifications · More
 */
export function OpsMobileBottomNav() {
  const pathname = usePathname() ?? "";
  const { permissions, masterAdminOnlyShell } = useSessionPermissions();
  const homeHref = shellHomeHref(permissions, { masterAdminOnlyShell });
  const [createOpen, setCreateOpen] = useState(false);
  const createMenuId = useId();

  const createActions =
    masterAdminOnlyShell || isMasterAdminOnlyPermissions(permissions) ? [] : MOBILE_QUICK_CREATE_ACTIONS;

  useEffect(() => {
    if (!createOpen) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setCreateOpen(false);
    }
    function onPointer(event: MouseEvent) {
      const target = event.target as HTMLElement | null;
      if (!target?.closest("[data-ops-bottom-create]")) setCreateOpen(false);
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onPointer);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onPointer);
    };
  }, [createOpen]);

  const homeActive = pathname === homeHref || pathname === "/dashboard";
  const workActive =
    pathname.startsWith("/inbox") ||
    pathname.startsWith("/maintenance") ||
    pathname.startsWith("/facility") ||
    pathname.startsWith("/activity");

  return (
    <nav
      aria-label="Primary mobile navigation"
      className="fixed inset-x-0 z-30 border-t border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)]/95 pb-[max(var(--mpa-safe-bottom),env(safe-area-inset-bottom))] backdrop-blur-sm lg:hidden"
      style={{ bottom: "var(--mpa-keyboard-inset, 0px)" }}
    >
      <ul className="mx-auto grid max-w-lg grid-cols-5 gap-0 px-1 pt-1">
        <li>
          <Link
            href={homeHref}
            aria-current={homeActive ? "page" : undefined}
            className={tabClass(homeActive)}
          >
            <NavIconDashboard className="h-5 w-5" />
            <span className="truncate text-[10px] font-medium leading-none">Home</span>
          </Link>
        </li>
        <li>
          <Link
            href="/inbox"
            aria-current={workActive ? "page" : undefined}
            className={tabClass(workActive)}
          >
            <NavIconMaintenance className="h-5 w-5" />
            <span className="truncate text-[10px] font-medium leading-none">My Work</span>
          </Link>
        </li>
        <li className="relative" data-ops-bottom-create>
          <button
            type="button"
            aria-haspopup="menu"
            aria-expanded={createOpen}
            aria-controls={createMenuId}
            onClick={() => setCreateOpen((value) => !value)}
            className="mpa-chrome-control flex min-h-[3.25rem] w-full flex-col items-center justify-center gap-0.5 rounded-[var(--mpa-radius-md)] px-1 text-[var(--mpa-color-brand-primary)] transition-colors"
          >
            <span
              aria-hidden="true"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--mpa-color-brand-primary)] text-lg font-semibold leading-none text-[var(--mpa-color-text-inverse)] shadow-[var(--mpa-shadow-sm)]"
            >
              ＋
            </span>
            <span className="truncate text-[10px] font-medium leading-none">Create</span>
          </button>
          {createOpen && createActions.length > 0 ? (
            <div
              id={createMenuId}
              role="menu"
              aria-label="Quick create"
              className="absolute bottom-[calc(100%+0.5rem)] left-1/2 z-40 w-48 -translate-x-1/2 overflow-hidden rounded-[var(--mpa-radius-lg)] border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] shadow-[var(--mpa-shadow-md)]"
            >
              {createActions.map((action) => (
                <Link
                  key={action.href}
                  role="menuitem"
                  href={action.href}
                  onClick={() => setCreateOpen(false)}
                  className="flex min-h-11 items-center px-4 py-2.5 text-sm font-medium text-[var(--mpa-color-text-primary)] transition-colors hover:bg-[var(--mpa-color-bg-app)]"
                >
                  {action.label}
                </Link>
              ))}
            </div>
          ) : null}
        </li>
        <li>
          <button
            type="button"
            onClick={() => openNotificationCenter()}
            className={tabClass(false)}
          >
            <NavIconCommunications className="h-5 w-5" />
            <span className="truncate text-[10px] font-medium leading-none">Alerts</span>
          </button>
        </li>
        <li>
          <button type="button" onClick={() => openMobileNavDrawer()} className={tabClass(false)}>
            <NavIconPortals className="h-5 w-5" />
            <span className="truncate text-[10px] font-medium leading-none">More</span>
          </button>
        </li>
      </ul>
    </nav>
  );
}

function tabClass(active: boolean): string {
  return active
    ? "mpa-chrome-control flex min-h-[3.25rem] flex-col items-center justify-center gap-0.5 rounded-[var(--mpa-radius-md)] px-1 text-[var(--mpa-color-brand-primary)] transition-colors"
    : "mpa-chrome-control flex min-h-[3.25rem] w-full flex-col items-center justify-center gap-0.5 rounded-[var(--mpa-radius-md)] px-1 text-[var(--mpa-color-text-secondary)] transition-colors hover:text-[var(--mpa-color-text-primary)]";
}
