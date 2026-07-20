"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";
import { BrandSurfaceTone } from "../branding/logo";
import { SidebarBrandHeader } from "./sidebar-brand-header";
import { NAV_ICON_MAP } from "../presentation/nav-icons";
import { SHELL_NAVIGATION_GROUPS, isRouteActive } from "./navigation-config";
import { useSessionPermissions } from "./use-session-permissions";

const STORAGE_KEY = "mpa.sidebar.collapsed.v2";

function subscribeSidebarCollapsed(onStoreChange: () => void) {
  const onLocalChange = () => onStoreChange();
  window.addEventListener("storage", onStoreChange);
  window.addEventListener("mpa:sidebar-collapsed", onLocalChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener("mpa:sidebar-collapsed", onLocalChange);
  };
}

function getSidebarCollapsedSnapshot() {
  return window.localStorage.getItem(STORAGE_KEY) === "true";
}

function getSidebarCollapsedServerSnapshot() {
  return false;
}

export function Sidebar() {
  const pathname = usePathname();
  const { canAccess } = useSessionPermissions();
  const collapsed = useSyncExternalStore(
    subscribeSidebarCollapsed,
    getSidebarCollapsedSnapshot,
    getSidebarCollapsedServerSnapshot
  );

  function toggleCollapsed() {
    const next = !collapsed;
    window.localStorage.setItem(STORAGE_KEY, String(next));
    window.dispatchEvent(new Event("mpa:sidebar-collapsed"));
  }

  return (
    <BrandSurfaceTone tone="dark-surface">
      <aside
        className={[
          "hidden shrink-0 flex-col border-r border-[var(--mpa-color-border-sidebar)] bg-[var(--mpa-color-bg-sidebar)] text-[var(--mpa-color-text-sidebar)] transition-[width] duration-[var(--mpa-duration-moderate)] lg:flex",
          collapsed ? "w-[var(--mpa-sidebar-collapsed-width)]" : "w-[var(--mpa-sidebar-width)]"
        ].join(" ")}
        aria-label="Primary application sidebar"
      >
        <div
          className={[
            "flex shrink-0 border-b border-[var(--mpa-color-border-sidebar)]",
            collapsed
              ? "min-h-[5.5rem] flex-col items-center justify-center gap-2 px-2 py-3"
              : "min-h-[5.25rem] items-center justify-between gap-2 px-[18px] py-[18px]"
          ].join(" ")}
        >
          <Link
            href="/dashboard"
            className={[
              "flex min-h-[34px] items-center rounded-[var(--mpa-radius-md)] transition-opacity hover:opacity-90",
              collapsed ? "justify-center" : "min-w-0 flex-1"
            ].join(" ")}
            aria-label="M.P.A. My Property Assistant"
          >
            <SidebarBrandHeader collapsed={collapsed} />
          </Link>
          <button
            type="button"
            onClick={toggleCollapsed}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={[
              "hidden h-8 w-8 shrink-0 items-center justify-center rounded-[var(--mpa-radius-md)] text-[var(--mpa-color-text-sidebar)]/70 transition-colors hover:bg-[var(--mpa-color-bg-sidebar-elevated)] hover:text-[var(--mpa-color-text-sidebar-active)] lg:flex",
              collapsed ? "" : "self-center"
            ].join(" ")}
          >
            <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
              {collapsed ? <path d="M7 5l5 5-5 5" /> : <path d="M13 5l-5 5 5 5" />}
            </svg>
          </button>
        </div>

        <nav className="flex-1 space-y-5 overflow-y-auto overflow-x-hidden px-2.5 pb-4 pt-2" aria-label="Primary">
          {SHELL_NAVIGATION_GROUPS.map((group) => {
            const items = group.items.filter((item) => canAccess(item.requiredCapability));
            if (items.length === 0) return null;
            return (
            <div key={group.title}>
              {!collapsed ? (
                <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--mpa-color-text-sidebar)]/50">
                  {group.title}
                </p>
              ) : null}
              <ul className="space-y-1">
                {items.map((item) => {
                  const active = isRouteActive(pathname, item.href, item.exact);
                  const Icon = NAV_ICON_MAP[item.href];
                  return (
                    <li key={item.label}>
                      <Link
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        title={collapsed ? item.label : undefined}
                        className={[
                          "group flex items-center rounded-[var(--mpa-radius-md)] text-[13px] transition-all duration-[var(--mpa-duration-fast)]",
                          collapsed ? "justify-center px-2 py-2.5" : "gap-3 px-2.5 py-2.5",
                          active
                            ? "bg-[var(--mpa-color-bg-sidebar-elevated)] font-medium text-[var(--mpa-color-text-sidebar-active)] shadow-[inset_3px_0_0_0_var(--mpa-color-sidebar-accent)]"
                            : "text-[var(--mpa-color-text-sidebar)] hover:bg-[var(--mpa-color-bg-sidebar-elevated)] hover:text-[var(--mpa-color-text-sidebar-active)]"
                        ].join(" ")}
                      >
                        <span
                          className={[
                            "flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--mpa-radius-sm)] transition-colors",
                            active
                              ? "bg-[var(--mpa-color-sidebar-accent)]/15 text-[var(--mpa-color-sidebar-accent)]"
                              : "text-[var(--mpa-color-text-sidebar)]/80 group-hover:text-[var(--mpa-color-text-sidebar-active)]"
                          ].join(" ")}
                        >
                          {Icon ? <Icon className="h-[18px] w-[18px]" /> : <span aria-hidden="true">•</span>}
                        </span>
                        {!collapsed ? <span className="min-w-0 flex-1 truncate leading-snug">{item.label}</span> : null}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
            );
          })}
        </nav>
      </aside>
    </BrandSurfaceTone>
  );
}
