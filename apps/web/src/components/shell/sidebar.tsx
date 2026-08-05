"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useMemo, useState, useSyncExternalStore } from "react";
import { BrandSurfaceTone } from "../branding/brand-surface-tone";
import { SidebarBrandHeader } from "./sidebar-brand-header";
import { NAV_ICON_MAP } from "../presentation/nav-icons";
import {
  MOBILE_QUICK_CREATE_ACTIONS,
  SIDEBAR_EXPANDED_GROUPS_KEY,
  buildPropertyContextNav,
  getShellNavigationGroups,
  isMasterAdminOnlyPermissions,
  isNavHrefActive,
  isRouteActive,
  navItemFavoriteKey,
  resolveActivePropertyId,
  shellHomeHref,
  type NavigationGroup,
  type NavigationItem
} from "./navigation-config";
import {
  getEmptyHistorySnapshot,
  getFavoritesSnapshot,
  getRecentsSnapshot,
  notifyNavHistory,
  subscribeNavHistory
} from "./nav-history";
import { isFavoriteItem, toggleFavoriteItem } from "../../lib/command-center/storage";
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

function readExpandedGroups(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(SIDEBAR_EXPANDED_GROUPS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, boolean>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeExpandedGroups(next: Record<string, boolean>) {
  try {
    window.localStorage.setItem(SIDEBAR_EXPANDED_GROUPS_KEY, JSON.stringify(next));
  } catch {
    // Non-fatal preference persistence.
  }
}

function NavLinkRow({
  href,
  label,
  active,
  collapsed,
  favorite,
  onToggleFavorite,
  showFavorite
}: {
  href: string;
  label: string;
  active: boolean;
  collapsed: boolean;
  favorite?: boolean;
  onToggleFavorite?: () => void;
  showFavorite?: boolean;
}) {
  const pathOnly = href.split("?")[0] ?? href;
  const Icon = NAV_ICON_MAP[pathOnly] ?? NAV_ICON_MAP[href];
  return (
    <div className="group/row relative">
      <Link
        href={href}
        aria-current={active ? "page" : undefined}
        title={collapsed ? label : undefined}
        className={[
          "group flex items-center rounded-[var(--mpa-radius-md)] text-[13px] transition-[color,background-color,box-shadow,transform] duration-[var(--mpa-duration-fast)]",
          collapsed ? "justify-center px-2 py-2.5" : "gap-3 px-2.5 py-2.5",
          active
            ? "bg-[var(--mpa-color-bg-sidebar-elevated)] font-medium text-[var(--mpa-color-text-sidebar-active)] shadow-[inset_3px_0_0_0_var(--mpa-color-sidebar-accent)]"
            : "text-[var(--mpa-color-text-sidebar)] hover:bg-[var(--mpa-color-bg-sidebar-elevated)] hover:text-[var(--mpa-color-text-sidebar-active)] hover:translate-x-[1px]"
        ].join(" ")}
      >
        <span
          className={[
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--mpa-radius-sm)] transition-colors duration-[var(--mpa-duration-fast)]",
            active
              ? "bg-[var(--mpa-color-sidebar-accent)]/15 text-[var(--mpa-color-sidebar-accent)]"
              : "text-[var(--mpa-color-text-sidebar)]/80 group-hover:text-[var(--mpa-color-text-sidebar-active)]"
          ].join(" ")}
        >
          {Icon ? <Icon className="h-[18px] w-[18px]" /> : <span aria-hidden="true">•</span>}
        </span>
        {!collapsed ? <span className="min-w-0 flex-1 truncate leading-snug">{label}</span> : null}
      </Link>
      {!collapsed && showFavorite && onToggleFavorite ? (
        <button
          type="button"
          aria-label={favorite ? `Unpin ${label}` : `Pin ${label}`}
          title={favorite ? "Unpin" : "Pin"}
          onClick={onToggleFavorite}
          className={[
            "absolute right-1.5 top-1/2 -translate-y-1/2 rounded px-1.5 py-0.5 text-xs transition-opacity",
            favorite
              ? "text-[var(--mpa-color-sidebar-accent)] opacity-100"
              : "text-[var(--mpa-color-text-sidebar)]/40 opacity-0 group-hover/row:opacity-100"
          ].join(" ")}
        >
          {favorite ? "★" : "☆"}
        </button>
      ) : null}
    </div>
  );
}

/**
 * DPX-002 / SH-001 / UX-016 Slice C: workflow sidebar with property context,
 * favorites, recents, and quick create.
 */
export function Sidebar({ initialCollapsed = false }: { initialCollapsed?: boolean }) {
  const pathname = usePathname() ?? "";
  const [search, setSearch] = useState("");
  const { canAccess, permissions, masterAdminOnlyShell, entitledModules } = useSessionPermissions();
  const navigationGroups = getShellNavigationGroups(permissions, {
    masterAdminOnlyShell,
    entitledModules
  });
  const homeHref = shellHomeHref(permissions, { masterAdminOnlyShell });
  const collapsed = useSyncExternalStore(
    subscribeSidebarCollapsed,
    () => getSidebarCollapsedSnapshot(initialCollapsed),
    () => initialCollapsed
  );
  const favorites = useSyncExternalStore(subscribeNavHistory, () => getFavoritesSnapshot(6), getEmptyHistorySnapshot);
  const recents = useSyncExternalStore(subscribeNavHistory, () => getRecentsSnapshot(5), getEmptyHistorySnapshot);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [createOpen, setCreateOpen] = useState(false);
  const [showOrgWorkflows, setShowOrgWorkflows] = useState(false);
  const createMenuId = useId();

  useEffect(() => {
    setSearch(typeof window !== "undefined" ? window.location.search.replace(/^\?/, "") : "");
  }, [pathname]);

  const propertyId = useMemo(() => resolveActivePropertyId(pathname, search), [pathname, search]);

  useEffect(() => {
    setShowOrgWorkflows(false);
  }, [propertyId]);
  const propertyNav = useMemo(() => {
    if (!propertyId) return [];
    const modules = entitledModules;
    const moduleSet = modules && modules.length > 0 ? new Set(modules) : null;
    return buildPropertyContextNav(propertyId).filter((item) => {
      if (item.requiredCapability && !canAccess(item.requiredCapability)) return false;
      if (item.requiredModule && moduleSet && !moduleSet.has(item.requiredModule)) return false;
      return true;
    });
  }, [propertyId, canAccess, entitledModules]);

  const createActions =
    masterAdminOnlyShell || isMasterAdminOnlyPermissions(permissions) ? [] : MOBILE_QUICK_CREATE_ACTIONS;

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
    setExpandedGroups(readExpandedGroups());
  }, []);

  useEffect(() => {
    // Auto-expand the group that owns the active route.
    if (!pathname || propertyId) return;
    for (const group of navigationGroups) {
      const ownsActive = group.items.some(
        (item) => canAccess(item.requiredCapability) && isRouteActive(pathname, item.href, item.exact)
      );
      if (ownsActive) {
        setExpandedGroups((current) => {
          if (current[group.title] !== false && current[group.title] !== undefined) return current;
          const next = { ...current, [group.title]: true };
          writeExpandedGroups(next);
          return next;
        });
        break;
      }
    }
  }, [pathname, navigationGroups, canAccess, propertyId]);

  useEffect(() => {
    if (!createOpen) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setCreateOpen(false);
    }
    function onPointer(event: MouseEvent) {
      const target = event.target as HTMLElement | null;
      if (!target?.closest("[data-sidebar-quick-create]")) setCreateOpen(false);
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onPointer);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onPointer);
    };
  }, [createOpen]);

  function toggleCollapsed() {
    persistCollapsed(!collapsed);
  }

  function isGroupExpanded(group: NavigationGroup): boolean {
    if (group.alwaysExpanded || group.items.length <= 1) return true;
    if (expandedGroups[group.title] === false) return false;
    if (expandedGroups[group.title] === true) return true;
    // Default: expand groups that contain the active route; otherwise expand My Work / Operations.
    const ownsActive = group.items.some((item) => isRouteActive(pathname, item.href, item.exact));
    if (ownsActive) return true;
    return group.title === "My Work" || group.title === "Operations";
  }

  function toggleGroup(title: string) {
    setExpandedGroups((current) => {
      const prior = current[title] ?? (title === "My Work" || title === "Operations");
      const flipped = { ...current, [title]: !prior };
      writeExpandedGroups(flipped);
      return flipped;
    });
  }

  function toggleFavorite(item: NavigationItem) {
    toggleFavoriteItem({
      key: navItemFavoriteKey(item.href),
      kind: "navigation",
      label: item.label,
      subtitle: "Navigate",
      context: item.href,
      badge: "Go",
      status: null,
      href: item.href
    });
    notifyNavHistory();
  }

  const inPropertyContext = Boolean(propertyId) && propertyNav.length > 0 && !showOrgWorkflows;

  // Sidebar chrome is always dark — use dark-mode logo for contrast (not app theme).
  return (
    <BrandSurfaceTone tone="dark-surface">
      <aside
        data-brand-surface="dark-surface"
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

        <nav className="flex-1 space-y-4 overflow-y-auto overflow-x-hidden px-2.5 pb-3 pt-2" aria-label="Primary">
          {!collapsed && favorites.length > 0 ? (
            <section aria-label="Favorites">
              <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--mpa-color-text-sidebar)]/50">
                Favorites
              </p>
              <ul className="space-y-1">
                {favorites.map((item) => (
                  <li key={`fav-${item.key}`}>
                    <Link
                      href={item.href}
                      className="flex items-center gap-2 rounded-[var(--mpa-radius-md)] px-2.5 py-2 text-[13px] text-[var(--mpa-color-text-sidebar)] transition-colors hover:bg-[var(--mpa-color-bg-sidebar-elevated)] hover:text-[var(--mpa-color-text-sidebar-active)]"
                    >
                      <span aria-hidden="true" className="text-[var(--mpa-color-sidebar-accent)]">
                        ★
                      </span>
                      <span className="truncate">{item.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {!collapsed && recents.length > 0 ? (
            <section aria-label="Recent">
              <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--mpa-color-text-sidebar)]/50">
                Recent
              </p>
              <ul className="space-y-1">
                {recents.map((item) => (
                  <li key={`recent-${item.key}`}>
                    <Link
                      href={item.href}
                      className="flex flex-col rounded-[var(--mpa-radius-md)] px-2.5 py-2 text-[13px] transition-colors hover:bg-[var(--mpa-color-bg-sidebar-elevated)]"
                    >
                      <span className="truncate text-[var(--mpa-color-text-sidebar-active)]">{item.label}</span>
                      {item.subtitle ? (
                        <span className="truncate text-[11px] text-[var(--mpa-color-text-sidebar)]/50">{item.subtitle}</span>
                      ) : null}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {inPropertyContext ? (
            <section aria-label="Property navigation" className="space-y-2">
              {!collapsed ? (
                <div className="mb-1 space-y-1 px-2">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--mpa-color-text-sidebar)]/50">
                    This property
                  </p>
                  <Link
                    href="/properties"
                    className="block text-[12px] text-[var(--mpa-color-sidebar-accent)] transition-opacity hover:opacity-90"
                  >
                    ← All properties
                  </Link>
                </div>
              ) : null}
              <ul className="space-y-1">
                {propertyNav.map((item) => (
                  <li key={item.href}>
                    <NavLinkRow
                      href={item.href}
                      label={item.label}
                      active={isNavHrefActive(pathname, search, item.href, item.exact)}
                      collapsed={collapsed}
                    />
                  </li>
                ))}
              </ul>
              {!collapsed ? (
                <button
                  type="button"
                  onClick={() => setShowOrgWorkflows(true)}
                  className="mt-2 w-full rounded-[var(--mpa-radius-md)] px-2.5 py-2 text-left text-[12px] text-[var(--mpa-color-text-sidebar)]/70 transition-colors hover:bg-[var(--mpa-color-bg-sidebar-elevated)] hover:text-[var(--mpa-color-text-sidebar-active)]"
                >
                  Browse all workflows
                </button>
              ) : null}
            </section>
          ) : (
            <>
              {propertyId && !collapsed ? (
                <button
                  type="button"
                  onClick={() => setShowOrgWorkflows(false)}
                  className="mb-1 w-full rounded-[var(--mpa-radius-md)] px-2.5 py-2 text-left text-[12px] text-[var(--mpa-color-sidebar-accent)] transition-colors hover:bg-[var(--mpa-color-bg-sidebar-elevated)]"
                >
                  ← Back to property
                </button>
              ) : null}
              {navigationGroups.map((group) => {
                const items = group.items.filter((item) => canAccess(item.requiredCapability));
                if (items.length === 0) return null;
                const expanded = isGroupExpanded(group);
                const collapsible = !group.alwaysExpanded && items.length > 1;
                return (
                  <div key={group.title}>
                    {!collapsed ? (
                      collapsible ? (
                        <button
                          type="button"
                          aria-expanded={expanded}
                          onClick={() => toggleGroup(group.title)}
                          className="mb-2 flex w-full items-center justify-between px-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--mpa-color-text-sidebar)]/50 transition-colors hover:text-[var(--mpa-color-text-sidebar)]/80"
                        >
                          <span>{group.title}</span>
                          <span aria-hidden="true">{expanded ? "▾" : "▸"}</span>
                        </button>
                      ) : (
                        <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--mpa-color-text-sidebar)]/50">
                          {group.title}
                        </p>
                      )
                    ) : null}
                    {collapsed || expanded ? (
                      <ul className="space-y-1">
                        {items.map((item) => {
                          const active = isNavHrefActive(pathname, search, item.href, item.exact);
                          const favKey = navItemFavoriteKey(item.href);
                          return (
                            <li key={`${group.title}-${item.href}`}>
                              <NavLinkRow
                                href={item.href}
                                label={item.label}
                                active={active}
                                collapsed={collapsed}
                                favorite={isFavoriteItem(favKey)}
                                showFavorite
                                onToggleFavorite={() => toggleFavorite(item)}
                              />
                            </li>
                          );
                        })}
                      </ul>
                    ) : null}
                  </div>
                );
              })}
            </>
          )}
        </nav>

        {createActions.length > 0 ? (
          <div
            data-sidebar-quick-create
            className="relative shrink-0 border-t border-[var(--mpa-color-border-sidebar)] p-2.5"
          >
            <button
              type="button"
              aria-haspopup="menu"
              aria-expanded={createOpen}
              aria-controls={createMenuId}
              onClick={() => setCreateOpen((value) => !value)}
              title="Quick create"
              className={[
                "flex w-full items-center justify-center gap-2 rounded-[var(--mpa-radius-md)] bg-[var(--mpa-color-sidebar-accent)] px-3 py-2.5 text-sm font-semibold text-[var(--mpa-color-text-inverse)] transition-opacity hover:opacity-95",
                collapsed ? "px-2" : ""
              ].join(" ")}
            >
              <span aria-hidden="true" className="text-lg leading-none">
                ＋
              </span>
              {!collapsed ? <span>Create</span> : null}
            </button>
            {createOpen ? (
              <div
                id={createMenuId}
                role="menu"
                aria-label="Quick create"
                className="absolute bottom-[calc(100%+0.5rem)] left-2 right-2 overflow-hidden rounded-[var(--mpa-radius-lg)] border border-[var(--mpa-color-border-sidebar)] bg-[var(--mpa-color-bg-sidebar-elevated)] shadow-[var(--mpa-shadow-md)]"
              >
                {createActions.map((action) => (
                  <Link
                    key={action.href}
                    role="menuitem"
                    href={action.href}
                    onClick={() => setCreateOpen(false)}
                    className="flex min-h-10 items-center px-3 py-2 text-sm text-[var(--mpa-color-text-sidebar-active)] transition-colors hover:bg-[var(--mpa-color-bg-sidebar)]"
                  >
                    {action.label}
                  </Link>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </aside>
    </BrandSurfaceTone>
  );
}
