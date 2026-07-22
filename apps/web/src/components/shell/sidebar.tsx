"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useSyncExternalStore } from "react";
import { BrandSurfaceTone } from "../branding/brand-logo";
import { SidebarBrandHeader } from "./sidebar-brand-header";
import { NAV_ICON_MAP } from "../presentation/nav-icons";
import { SHELL_NAVIGATION_GROUPS, isRouteActive } from "./navigation-config";
import { useSessionPermissions } from "./use-session-permissions";

const STORAGE_KEY = "mpa.sidebar.collapsed.v2";
const COOKIE_KEY = "mpa_sidebar_collapsed";

function subscribeSidebarCollapsed(onStoreChange: () => void) {
  const onLocalChange = () => onStoreChange();
  window.addEventListener("storage", onStoreChange);
  window.addEventListener("mpa:sidebar-collapsed", onLocalChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener("mpa:sidebar-collapsed", onLocalChange);
  };
}

function hasCollapsedCookie(): boolean {
  return typeof document !== "undefined" && document.cookie.includes(`${COOKIE_KEY}=`);
}

function readCollapsedFromCookie(): boolean {
  if (typeof document === "undefined") return false;
  const match = document.cookie.match(/(?:^|; )mpa_sidebar_collapsed=([^;]*)/);
  return match?.[1] === "1";
}

function persistCollapsed(next: boolean) {
  window.localStorage.setItem(STORAGE_KEY, String(next));
  document.cookie = `${COOKIE_KEY}=${next ? "1" : "0"}; path=/; max-age=31536000; samesite=lax`;
  window.dispatchEvent(new Event("mpa:sidebar-collapsed"));
}

/** Prefer cookie (SSR-aligned). Avoid reading localStorage during hydration. */
function getSidebarCollapsedSnapshot(initialCollapsed: boolean) {
  if (hasCollapsedCookie()) return readCollapsedFromCookie();
  return initialCollapsed;
}

/**
 * DPX-002 / SH-001: SSR uses cookie-backed initialCollapsed so first paint matches
 * client preference — no width jump, no transition flicker.
 */
export function Sidebar({ initialCollapsed = false }: { initialCollapsed?: boolean }) {
  const pathname = usePathname();
  const { canAccess } = useSessionPermissions();
  const collapsed = useSyncExternalStore(
    subscribeSidebarCollapsed,
    () => getSidebarCollapsedSnapshot(initialCollapsed),
    () => initialCollapsed
  );

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (!hasCollapsedCookie() && (stored === "true" || stored === "false")) {
        persistCollapsed(stored === "true");
        return;
      }
      if (hasCollapsedCookie()) {
        window.localStorage.setItem(STORAGE_KEY, String(readCollapsedFromCookie()));
      }
    } catch {
      // Non-fatal preference sync.
    }
  }, []);

  function toggleCollapsed() {
    persistCollapsed(!collapsed);
  }

  return (
    <BrandSurfaceTone tone="dark-surface">
      <aside
        className={[
          "hidden shrink-0 flex-col border-r border-[var(--mpa-color-border-sidebar)] bg-[var(--mpa-color-bg-sidebar)] text-[var(--mpa-color-text-sidebar)] lg:flex",
          "w-[var(--mpa-sidebar-width)]",
          collapsed ? "!w-[var(--mpa-sidebar-collapsed-width)]" : ""
        ].join(" ")}
        style={{ width: collapsed ? "var(--mpa-sidebar-collapsed-width)" : "var(--mpa-sidebar-width)" }}
        suppressHydrationWarning
        aria-label="Primary application sidebar"
      >
        <div
          className={[
            "flex shrink-0 border-b border-[var(--mpa-color-border-sidebar)]",
            collapsed
              ? "min-h-[5.5rem] flex-col items-center justify-center gap-2 px-2 py-3"
              : "min-h-[5.25rem] items-center justify-between gap-2 px-[18px] py-[18px]"
          ].join(" ")}
          suppressHydrationWarning
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
                          "group flex items-center rounded-[var(--mpa-radius-md)] text-[13px] transition-colors duration-[var(--mpa-duration-fast)]",
                          collapsed ? "justify-center px-2 py-2.5" : "gap-3 px-2.5 py-2.5",
                          active
                            ? "bg-[var(--mpa-color-bg-sidebar-elevated)] font-medium text-[var(--mpa-color-text-sidebar-active)] shadow-[inset_3px_0_0_0_var(--mpa-color-sidebar-accent)]"
                            : "text-[var(--mpa-color-text-sidebar)] hover:bg-[var(--mpa-color-bg-sidebar-elevated)] hover:text-[var(--mpa-color-text-sidebar-active)]"
                        ].join(" ")}
                      >
                        <span
                          className={[
                            "flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--mpa-radius-sm)]",
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
