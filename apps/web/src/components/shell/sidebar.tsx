"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { BrandSurfaceTone } from "../branding/brand-surface-tone";
import { SidebarBrandHeader } from "./sidebar-brand-header";
import { NAV_ICON_MAP } from "../presentation/nav-icons";
import {
  getShellNavigationGroups,
  isRouteActive,
  navItemFavoriteKey,
  shellHomeHref,
  type NavigationItem
} from "./navigation-config";
import { useSessionPermissions } from "./use-session-permissions";
import {
  getFavoriteItems,
  getRecentItems,
  type CommandCenterStoredItem
} from "../../lib/command-center/storage";
import {
  isContextualNavActive,
  resolveContextualNavigation
} from "../../lib/shell/contextual-navigation";

const STORAGE_KEY = "mpa.sidebar.collapsed.v2";
const COOKIE_KEY = "mpa_sidebar_collapsed";
const GROUP_EXPAND_KEY = "mpa.sidebar.groupExpand.v1";
const NAV_HISTORY_EVENT = "mpa:nav-history";

const EMPTY_HISTORY: CommandCenterStoredItem[] = [];
let favoritesCache: CommandCenterStoredItem[] = EMPTY_HISTORY;
let favoritesKey = "";
let recentsCache: CommandCenterStoredItem[] = EMPTY_HISTORY;
let recentsKey = "";

function cacheHistory(
  items: CommandCenterStoredItem[],
  previousKey: string,
  previousValue: CommandCenterStoredItem[]
) {
  const key = JSON.stringify(items);
  if (key === previousKey) return { key: previousKey, value: previousValue };
  return { key, value: items.length === 0 ? EMPTY_HISTORY : items };
}

function subscribeNavHistory(onStoreChange: () => void) {
  const onLocal = () => onStoreChange();
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(NAV_HISTORY_EVENT, onLocal);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(NAV_HISTORY_EVENT, onLocal);
  };
}

function getFavoritesSnapshot() {
  const next = cacheHistory(getFavoriteItems().slice(0, 6), favoritesKey, favoritesCache);
  favoritesKey = next.key;
  favoritesCache = next.value;
  return favoritesCache;
}

function getRecentsSnapshot() {
  const next = cacheHistory(getRecentItems().slice(0, 5), recentsKey, recentsCache);
  recentsKey = next.key;
  recentsCache = next.value;
  return recentsCache;
}

function getEmptyHistorySnapshot() {
  return EMPTY_HISTORY;
}

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

function getSidebarCollapsedSnapshot(initialCollapsed: boolean) {
  if (hasCollapsedCookie()) return readCollapsedFromCookie();
  return initialCollapsed;
}

function readGroupExpandState(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(GROUP_EXPAND_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, boolean>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function persistGroupExpandState(state: Record<string, boolean>) {
  try {
    window.localStorage.setItem(GROUP_EXPAND_KEY, JSON.stringify(state));
  } catch {
    // Non-fatal preference persistence.
  }
}

function NavLinkRow({
  item,
  pathname,
  collapsed
}: {
  item: NavigationItem;
  pathname: string;
  collapsed: boolean;
}) {
  const active = isRouteActive(pathname, item.href, item.exact);
  const Icon = NAV_ICON_MAP[item.href];
  return (
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
  );
}

/**
 * DPX-002 / SH-001 / UX-016 Slice C: work-first sidebar with Favorites, Recent,
 * contextual property/vendor nav, and collapsible workflow groups.
 */
export function Sidebar({ initialCollapsed = false }: { initialCollapsed?: boolean }) {
  const pathname = usePathname();
  const { canAccess, permissions, masterAdminOnlyShell, entitledModules } = useSessionPermissions();
  const navigationGroups = getShellNavigationGroups(permissions, {
    masterAdminOnlyShell,
    entitledModules
  });
  const homeHref = shellHomeHref(permissions, { masterAdminOnlyShell });
  const contextual = resolveContextualNavigation(pathname);
  const favorites = useSyncExternalStore(subscribeNavHistory, getFavoritesSnapshot, getEmptyHistorySnapshot);
  const recents = useSyncExternalStore(subscribeNavHistory, getRecentsSnapshot, getEmptyHistorySnapshot);
  const collapsed = useSyncExternalStore(
    subscribeSidebarCollapsed,
    () => getSidebarCollapsedSnapshot(initialCollapsed),
    () => initialCollapsed
  );
  const [groupExpand, setGroupExpand] = useState<Record<string, boolean>>({});

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

  useEffect(() => {
    setGroupExpand(readGroupExpandState());
  }, []);

  function toggleCollapsed() {
    persistCollapsed(!collapsed);
  }

  function isGroupExpanded(title: string, hasActiveChild: boolean) {
    if (title === "Dashboard" || title === "My Work") return true;
    if (hasActiveChild) return true;
    if (groupExpand[title] != null) return groupExpand[title]!;
    // Default: collapse secondary groups with many children.
    return false;
  }

  function toggleGroup(title: string, currentlyExpanded: boolean) {
    const next = { ...groupExpand, [title]: !currentlyExpanded };
    setGroupExpand(next);
    persistGroupExpandState(next);
  }

  return (
    <BrandSurfaceTone tone="dark-surface">
      <aside
        data-brand-surface="dark-surface"
        data-ux016="workspace-sidebar"
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
              ? "min-h-[7.5rem] flex-col items-center justify-center gap-2 px-2 py-3"
              : "min-h-[7rem] items-center justify-between gap-2 px-[18px] py-[18px]"
          ].join(" ")}
          suppressHydrationWarning
        >
          <Link
            href={homeHref}
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

        <nav className="flex-1 space-y-4 overflow-y-auto overflow-x-hidden px-2.5 pb-4 pt-2" aria-label="Primary">
          {!collapsed && favorites.length > 0 ? (
            <div>
              <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--mpa-color-text-sidebar)]/50">
                Favorites
              </p>
              <ul className="space-y-1">
                {favorites.map((item) => (
                  <li key={item.key}>
                    <Link
                      href={item.href}
                      className="block truncate rounded-[var(--mpa-radius-md)] px-2.5 py-2 text-[13px] text-[var(--mpa-color-text-sidebar)] hover:bg-[var(--mpa-color-bg-sidebar-elevated)] hover:text-[var(--mpa-color-text-sidebar-active)]"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {!collapsed && contextual ? (
            <div data-ux016="contextual-nav">
              <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--mpa-color-sidebar-accent)]">
                {contextual.title}
              </p>
              <ul className="space-y-1">
                {contextual.items.map((item) => {
                  const active = isContextualNavActive(pathname, "", item);
                  return (
                    <li key={`${item.label}:${item.href}`}>
                      <Link
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        className={[
                          "block truncate rounded-[var(--mpa-radius-md)] px-2.5 py-2 text-[13px]",
                          active
                            ? "bg-[var(--mpa-color-bg-sidebar-elevated)] font-medium text-[var(--mpa-color-text-sidebar-active)] shadow-[inset_3px_0_0_0_var(--mpa-color-sidebar-accent)]"
                            : "text-[var(--mpa-color-text-sidebar)] hover:bg-[var(--mpa-color-bg-sidebar-elevated)] hover:text-[var(--mpa-color-text-sidebar-active)]"
                        ].join(" ")}
                      >
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}

          {navigationGroups.map((group) => {
            const items = group.items.filter((item) => canAccess(item.requiredCapability));
            if (items.length === 0) return null;
            const hasActiveChild = items.some((item) => isRouteActive(pathname, item.href, item.exact));
            const expanded = collapsed ? true : isGroupExpanded(group.title, hasActiveChild);
            const collapsible = group.title !== "Dashboard" && group.title !== "My Work" && items.length > 1;

            return (
              <div key={group.title}>
                {!collapsed ? (
                  collapsible ? (
                    <button
                      type="button"
                      onClick={() => toggleGroup(group.title, expanded)}
                      aria-expanded={expanded}
                      className="mb-2 flex w-full items-center justify-between px-2 text-left text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--mpa-color-text-sidebar)]/50 hover:text-[var(--mpa-color-text-sidebar)]"
                    >
                      <span>{group.title}</span>
                      <span aria-hidden="true">{expanded ? "−" : "+"}</span>
                    </button>
                  ) : (
                    <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--mpa-color-text-sidebar)]/50">
                      {group.title === "My Work" ? "My Work ★" : group.title}
                    </p>
                  )
                ) : null}
                {expanded ? (
                  <ul className="space-y-1">
                    {items.map((item) => (
                      <li key={`${item.label}:${navItemFavoriteKey(item.href)}`}>
                        <NavLinkRow item={item} pathname={pathname} collapsed={collapsed} />
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            );
          })}

          {!collapsed && recents.length > 0 ? (
            <div>
              <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--mpa-color-text-sidebar)]/50">
                Recent
              </p>
              <ul className="space-y-1">
                {recents.map((item) => (
                  <li key={`recent:${item.key}`}>
                    <Link
                      href={item.href}
                      className="block truncate rounded-[var(--mpa-radius-md)] px-2.5 py-2 text-[12px] text-[var(--mpa-color-text-sidebar)]/80 hover:bg-[var(--mpa-color-bg-sidebar-elevated)] hover:text-[var(--mpa-color-text-sidebar-active)]"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </nav>
      </aside>
    </BrandSurfaceTone>
  );
}
