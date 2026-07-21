"use client";

import {
  memo,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useState,
  useSyncExternalStore
} from "react";
import Link from "next/link";
import { Button, Drawer } from "@mpa/ui";
import { usePathname, useRouter } from "next/navigation";
import { NAV_ICON_MAP } from "../presentation/nav-icons";
import { MobileBrandLockup } from "./mobile-brand-lockup";
import { OrganizationSwitcher } from "./organization-switcher";
import { RoleSwitcher } from "./role-switcher";
import {
  MOBILE_NAV_EXPANDED_SECTION_KEY,
  MOBILE_NAV_SECTION_ORDER,
  MOBILE_QUICK_CREATE_ACTIONS,
  findMobileSectionForPath,
  flattenShellNavigationItems,
  isRouteActive,
  matchesNavSearch,
  navItemFavoriteKey,
  type MobileNavSectionId,
  type NavigationItem
} from "./navigation-config";
import { useMobileNavSignals } from "./use-mobile-nav-signals";
import { useSessionPermissions } from "./use-session-permissions";
import { useOrganizationContext } from "./organization-context";
import { searchCommandCenter } from "../../lib/command-center/registry";
import type { CommandCenterResult } from "../../lib/command-center/types";
import {
  getFavoriteItems,
  getRecentItems,
  isFavoriteItem,
  recordRecentItem,
  toggleFavoriteItem,
  type CommandCenterStoredItem
} from "../../lib/command-center/storage";

const NAV_HISTORY_EVENT = "mpa:nav-history";

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
  return getFavoriteItems().slice(0, 8);
}

function getRecentsSnapshot() {
  return getRecentItems().slice(0, 6);
}

function getEmptyHistorySnapshot(): CommandCenterStoredItem[] {
  return [];
}

function notifyNavHistory() {
  window.dispatchEvent(new Event(NAV_HISTORY_EVENT));
}

function readExpandedSection(): MobileNavSectionId | null {
  if (typeof window === "undefined") return null;
  try {
    const value = window.localStorage.getItem(MOBILE_NAV_EXPANDED_SECTION_KEY);
    if (!value) return null;
    return MOBILE_NAV_SECTION_ORDER.some((section) => section.id === value)
      ? (value as MobileNavSectionId)
      : null;
  } catch {
    return null;
  }
}

function writeExpandedSection(section: MobileNavSectionId | null) {
  if (typeof window === "undefined") return;
  try {
    if (!section) {
      window.localStorage.removeItem(MOBILE_NAV_EXPANDED_SECTION_KEY);
      return;
    }
    window.localStorage.setItem(MOBILE_NAV_EXPANDED_SECTION_KEY, section);
  } catch {
    // Non-fatal preference persistence failure.
  }
}

function formatBadge(count: number): string {
  return count > 99 ? "99+" : String(count);
}

export function ResponsiveNavigation() {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedSection, setExpandedSection] = useState<MobileNavSectionId | null>(() => readExpandedSection());
  const [createMenuOpen, setCreateMenuOpen] = useState(false);
  const [entityResults, setEntityResults] = useState<CommandCenterResult[]>([]);
  const [entitySearching, setEntitySearching] = useState(false);
  const createMenuId = useId();
  const pathname = usePathname();
  const router = useRouter();
  const { canAccess, permissions, loaded: permissionsLoaded } = useSessionPermissions();
  const { organizations } = useOrganizationContext();
  // Prefetch signals while closed so first open paint already has health/badges.
  const { badges, health } = useMobileNavSignals(true);
  const favorites = useSyncExternalStore(subscribeNavHistory, getFavoritesSnapshot, getEmptyHistorySnapshot);
  const recents = useSyncExternalStore(subscribeNavHistory, getRecentsSnapshot, getEmptyHistorySnapshot);

  const accessibleItems = useMemo(
    () => flattenShellNavigationItems().filter((item) => canAccess(item.requiredCapability)),
    [canAccess]
  );

  const pinnedItems = useMemo(
    () => accessibleItems.filter((item) => item.pinned),
    [accessibleItems]
  );

  const pinnedHrefs = useMemo(() => new Set(pinnedItems.map((item) => item.href)), [pinnedItems]);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return accessibleItems.filter((item) => matchesNavSearch(item, searchQuery)).slice(0, 12);
  }, [accessibleItems, searchQuery]);

  const sections = useMemo(() => {
    return MOBILE_NAV_SECTION_ORDER.map((section) => ({
      ...section,
      items: accessibleItems.filter(
        (item) => item.mobileSection === section.id && !pinnedHrefs.has(item.href)
      )
    })).filter((section) => section.items.length > 0);
  }, [accessibleItems, pinnedHrefs]);

  const createActions = MOBILE_QUICK_CREATE_ACTIONS;

  const firstSectionId = sections[0]?.id ?? null;

  useEffect(() => {
    if (!open) {
      setSearchQuery("");
      setCreateMenuOpen(false);
      return;
    }
    const routeSection = findMobileSectionForPath(pathname);
    const stored = readExpandedSection();
    const next = routeSection ?? stored ?? firstSectionId;
    setExpandedSection((current) => (current === next ? current : next));
  }, [open, pathname, firstSectionId]);

  useEffect(() => {
    if (!open || !permissionsLoaded) return;
    const query = searchQuery.trim();
    if (query.length < 2) {
      setEntityResults([]);
      setEntitySearching(false);
      return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => {
      setEntitySearching(true);
      void searchCommandCenter({
        query,
        organizations,
        permissions,
        signal: controller.signal
      })
        .then((sections) => {
          const flat = sections
            .flatMap((section) => section.items)
            .filter((item) => Boolean(item.href) && item.kind !== "navigation")
            .slice(0, 10);
          setEntityResults(flat);
        })
        .catch(() => {
          if (!controller.signal.aborted) setEntityResults([]);
        })
        .finally(() => {
          if (!controller.signal.aborted) setEntitySearching(false);
        });
    }, 220);

    return () => {
      controller.abort();
      clearTimeout(timeout);
    };
  }, [open, searchQuery, organizations, permissions, permissionsLoaded]);

  const closeDrawer = useCallback(() => {
    setOpen(false);
  }, []);

  const openDrawer = useCallback(() => {
    const routeSection = findMobileSectionForPath(pathname);
    const stored = readExpandedSection();
    setExpandedSection(routeSection ?? stored ?? firstSectionId);
    setOpen(true);
  }, [pathname, firstSectionId]);

  function toggleSection(sectionId: MobileNavSectionId) {
    setExpandedSection((current) => {
      const next = current === sectionId ? null : sectionId;
      writeExpandedSection(next);
      return next;
    });
  }

  function toggleFavorite(item: NavigationItem) {
    const key = navItemFavoriteKey(item.href);
    toggleFavoriteItem({
      key,
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

  const createFooter = (
    <div className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={createMenuOpen}
        aria-controls={createMenuId}
        onClick={() => setCreateMenuOpen((value) => !value)}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-[var(--mpa-radius-lg)] bg-[var(--mpa-color-brand-primary)] px-4 text-sm font-semibold text-[var(--mpa-color-text-inverse)] shadow-[var(--mpa-shadow-sm)] transition-opacity hover:opacity-95"
      >
        <span aria-hidden="true" className="text-lg leading-none">
          ＋
        </span>
        New
      </button>
      {createMenuOpen ? (
        <div
          id={createMenuId}
          role="menu"
          aria-label="Create new"
          className="absolute bottom-[calc(100%+0.5rem)] left-0 right-0 overflow-hidden rounded-[var(--mpa-radius-lg)] border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] shadow-[var(--mpa-shadow-md)]"
        >
          {createActions.map((action) => (
            <Link
              key={action.href}
              role="menuitem"
              href={action.href}
              onClick={closeDrawer}
              className="flex min-h-11 items-center px-4 py-2.5 text-sm font-medium text-[var(--mpa-color-text-primary)] transition-colors hover:bg-[var(--mpa-color-bg-app)]"
            >
              {action.label}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );

  return (
    <div className="lg:hidden">
      <Button
        variant="secondary"
        size="sm"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls="mobile-nav-drawer"
        onClick={() => (open ? closeDrawer() : openDrawer())}
      >
        Menu
      </Button>
      <Drawer
        open={open}
        onClose={closeDrawer}
        title="M.P.A. navigation"
        hideHeader
        keepMounted
        className="max-w-sm bg-[var(--mpa-color-bg-surface)]"
        contentClassName="p-0"
        footer={createFooter}
      >
        <div id="mobile-nav-drawer" className="flex flex-col">
          <div className="sticky top-0 z-10 space-y-3 border-b border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-surface)] px-5 pb-3 pt-4">
            <div className="flex min-h-[6.5rem] items-start justify-between gap-2">
              <div className="flex min-h-[6.5rem] min-w-0 flex-1 items-center justify-center">
                {/* SH-001: never toggle collapsed brand — logo layout must not change after paint. */}
                <MobileBrandLockup collapsed={false} onNavigate={closeDrawer} />
              </div>
              <button
                type="button"
                onClick={closeDrawer}
                tabIndex={open ? 0 : -1}
                className="mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--mpa-radius-md)] text-[var(--mpa-color-text-secondary)] hover:bg-[var(--mpa-color-bg-app)]"
                aria-label="Close navigation"
              >
                ✕
              </button>
            </div>

            <OrganizationSwitcher compact />

            <section
              aria-label="Operations Score"
              className="min-h-[4.75rem] rounded-[var(--mpa-radius-md)] bg-[var(--mpa-color-bg-app)] px-3 py-2.5"
            >
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--mpa-color-text-muted)]">
                  Operations Score
                </p>
                <p className="font-display text-lg font-semibold tabular-nums text-[var(--mpa-color-text-primary)]">
                  {health.ready && health.scorePercent != null ? `${health.scorePercent}%` : "—"}
                </p>
              </div>
              <p className="mt-1 min-h-[2.5rem] text-xs text-[var(--mpa-color-text-secondary)]">
                {health.ready
                  ? `${health.urgentCount} Urgent · ${health.openWorkOrders} Open Work Orders${
                      health.occupancyPercent != null
                        ? ` · ${health.occupancyPercent.toFixed(1)}% Occupancy`
                        : ""
                    }`
                  : "Health snapshot updating…"}
              </p>
            </section>

            <MobileSearchField
              value={searchQuery}
              onChange={setSearchQuery}
              disabled={!open}
            />
          </div>

          <div className="space-y-5 px-5 pb-5 pt-4">
            {searchQuery.trim() ? (
              <div className="space-y-4">
                <section aria-label="Entity results" className="space-y-1">
                  <p className="px-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--mpa-color-text-secondary)]">
                    People & records
                  </p>
                  {entitySearching ? (
                    <p className="px-1 py-2 text-sm text-[var(--mpa-color-text-secondary)]">Searching…</p>
                  ) : entityResults.length === 0 ? (
                    <p className="px-1 py-2 text-sm text-[var(--mpa-color-text-muted)]">
                      No matching residents, properties, or work orders yet.
                    </p>
                  ) : (
                    <ul className="space-y-0.5">
                      {entityResults.map((item) => (
                        <li key={`entity-${item.id}`}>
                          <button
                            type="button"
                            onClick={() => {
                              if (!item.href) return;
                              recordRecentItem({
                                key: item.id,
                                kind: item.kind,
                                label: item.label,
                                subtitle: item.subtitle ?? item.kind,
                                context: null,
                                badge: item.kind,
                                status: null,
                                href: item.href
                              });
                              notifyNavHistory();
                              closeDrawer();
                              router.push(item.href);
                            }}
                            className="flex min-h-11 w-full flex-col justify-center rounded-[var(--mpa-radius-md)] px-2.5 py-2 text-left hover:bg-[var(--mpa-color-bg-app)]"
                          >
                            <span className="truncate text-sm font-medium text-[var(--mpa-color-text-primary)]">
                              {item.label}
                            </span>
                            <span className="truncate text-xs text-[var(--mpa-color-text-secondary)]">
                              {item.subtitle ?? item.kind}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
                <section aria-label="Screen results" className="space-y-1">
                  <p className="px-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--mpa-color-text-secondary)]">
                    Screens
                  </p>
                  {searchResults.length === 0 ? (
                    <p className="px-1 py-2 text-sm text-[var(--mpa-color-text-secondary)]">No matching screens.</p>
                  ) : (
                    <ul className="space-y-0.5">
                      {searchResults.map((item) => (
                        <li key={`search-${item.href}`}>
                          <NavRow
                            item={item}
                            pathname={pathname}
                            badge={item.badgeKey ? badges[item.badgeKey] : undefined}
                            favorite={isFavoriteItem(navItemFavoriteKey(item.href))}
                            onNavigate={closeDrawer}
                            onToggleFavorite={() => toggleFavorite(item)}
                          />
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              </div>
            ) : (
              <>
                <section aria-label="Favorites" className="space-y-1">
                  <p className="px-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--mpa-color-text-secondary)]">
                    Favorites
                  </p>
                  {favorites.length === 0 ? (
                    <p className="px-1 text-xs text-[var(--mpa-color-text-muted)]">Pin pages you use every day.</p>
                  ) : (
                    <ul className="space-y-0.5">
                      {favorites.map((item) => (
                        <li key={`fav-${item.key}`}>
                          <Link
                            href={item.href}
                            onClick={closeDrawer}
                            className="flex min-h-11 items-center gap-3 rounded-[var(--mpa-radius-md)] px-2.5 py-2.5 text-sm text-[var(--mpa-color-text-secondary)] hover:bg-[var(--mpa-color-bg-app)] hover:text-[var(--mpa-color-text-primary)]"
                          >
                            <span aria-hidden="true" className="text-[var(--mpa-color-brand-primary)]">
                              ★
                            </span>
                            <span className="truncate font-medium">{item.label}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                <section aria-label="Recently visited" className="min-h-[2.75rem] space-y-1">
                  <p className="px-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--mpa-color-text-secondary)]">
                    Recent
                  </p>
                  {recents.length === 0 ? (
                    <p className="px-1 text-xs text-[var(--mpa-color-text-muted)]">Recent destinations appear here.</p>
                  ) : (
                    <ul className="space-y-0.5">
                      {recents.map((item) => (
                        <li key={`recent-${item.key}`}>
                          <Link
                            href={item.href}
                            onClick={closeDrawer}
                            className="flex min-h-11 flex-col justify-center rounded-[var(--mpa-radius-md)] px-2.5 py-2 text-sm hover:bg-[var(--mpa-color-bg-app)]"
                          >
                            <span className="truncate font-medium text-[var(--mpa-color-text-primary)]">
                              {item.label}
                            </span>
                            {item.subtitle || item.context ? (
                              <span className="truncate text-xs text-[var(--mpa-color-text-muted)]">
                                {item.subtitle ?? item.context}
                              </span>
                            ) : null}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                <section aria-label="Pinned essentials" className="space-y-1">
                  <p className="px-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--mpa-color-text-secondary)]">
                    Essentials
                  </p>
                  <ul className="space-y-0.5">
                    {pinnedItems.map((item) => (
                      <li key={`pin-${item.href}`}>
                        <NavRow
                          item={item}
                          pathname={pathname}
                          badge={item.badgeKey ? badges[item.badgeKey] : undefined}
                          favorite={isFavoriteItem(navItemFavoriteKey(item.href))}
                          onNavigate={closeDrawer}
                          onToggleFavorite={() => toggleFavorite(item)}
                        />
                      </li>
                    ))}
                  </ul>
                </section>

                <nav aria-label="Mobile primary navigation" className="space-y-2">
                  {sections.map((section) => {
                    const panelId = `mobile-nav-section-${section.id}`;
                    const expanded = expandedSection === section.id;
                    return (
                      <div key={section.id} className="rounded-[var(--mpa-radius-md)]">
                        <button
                          type="button"
                          aria-expanded={expanded}
                          aria-controls={panelId}
                          onClick={() => toggleSection(section.id)}
                          className="flex min-h-11 w-full items-center justify-between rounded-[var(--mpa-radius-md)] px-2.5 text-left text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--mpa-color-text-secondary)] hover:bg-[var(--mpa-color-bg-app)]"
                        >
                          {section.title}
                          <span aria-hidden="true">{expanded ? "▾" : "▸"}</span>
                        </button>
                        {expanded ? (
                          <ul id={panelId} className="mt-0.5 space-y-0.5">
                            {section.items.map((item) => (
                              <li key={item.href}>
                                <NavRow
                                  item={item}
                                  pathname={pathname}
                                  badge={item.badgeKey ? badges[item.badgeKey] : undefined}
                                  favorite={isFavoriteItem(navItemFavoriteKey(item.href))}
                                  onNavigate={closeDrawer}
                                  onToggleFavorite={() => toggleFavorite(item)}
                                />
                              </li>
                            ))}
                          </ul>
                        ) : null}
                      </div>
                    );
                  })}
                </nav>

                <section aria-label="Workspace controls" className="space-y-3 border-t border-[var(--mpa-color-border-default)] pt-4">
                  <RoleSwitcher compact />
                </section>
              </>
            )}
          </div>
        </div>
      </Drawer>
    </div>
  );
}

const MobileSearchField = memo(function MobileSearchField({
  value,
  onChange,
  disabled
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <label className="block">
      <span className="sr-only">Search M.P.A.</span>
      <input
        type="search"
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search M.P.A."
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        className="h-11 w-full rounded-[var(--mpa-radius-md)] border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] px-3 text-sm text-[var(--mpa-color-text-primary)] outline-none ring-[var(--mpa-color-brand-primary)] placeholder:text-[var(--mpa-color-text-muted)] focus:ring-2 disabled:opacity-60"
      />
    </label>
  );
});

function NavRow({
  item,
  pathname,
  badge,
  favorite,
  onNavigate,
  onToggleFavorite
}: {
  item: NavigationItem;
  pathname: string;
  badge?: number | undefined;
  favorite: boolean;
  onNavigate: () => void;
  onToggleFavorite: () => void;
}) {
  const active = isRouteActive(pathname, item.href, item.exact);
  const Icon = NAV_ICON_MAP[item.href];

  return (
    <div
      className={[
        "group flex min-h-11 items-center gap-1 rounded-[var(--mpa-radius-md)] pr-1 transition-colors",
        active
          ? "bg-[var(--mpa-color-bg-app)] font-medium text-[var(--mpa-color-text-primary)] shadow-[var(--mpa-shadow-sm)] ring-1 ring-[var(--mpa-color-brand-primary)]/25"
          : "text-[var(--mpa-color-text-secondary)] hover:bg-[var(--mpa-color-bg-app)] hover:text-[var(--mpa-color-text-primary)]"
      ].join(" ")}
    >
      <Link
        href={item.href}
        aria-current={active ? "page" : undefined}
        onClick={onNavigate}
        className="flex min-h-11 min-w-0 flex-1 items-center gap-3 px-2.5 py-2 text-sm"
      >
        <span
          className={[
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--mpa-radius-sm)] transition-colors",
            active
              ? "bg-[var(--mpa-color-brand-primary)]/10 text-[var(--mpa-color-brand-primary)]"
              : "text-[var(--mpa-color-text-secondary)] group-hover:text-[var(--mpa-color-text-primary)]"
          ].join(" ")}
        >
          {Icon ? <Icon className="h-4 w-4" /> : <span aria-hidden="true">•</span>}
        </span>
        <span className="min-w-0 flex-1 truncate">{item.label}</span>
        {/* SH-001: always reserve badge column so counts do not shift rows. */}
        <span className="ml-2 inline-flex h-5 min-w-[1.5rem] shrink-0 items-center justify-end tabular-nums text-xs font-semibold text-[var(--mpa-color-text-primary)]">
          {typeof badge === "number" && badge > 0 ? formatBadge(badge) : ""}
        </span>
      </Link>
      <button
        type="button"
        aria-label={favorite ? `Unpin ${item.label}` : `Pin ${item.label}`}
        aria-pressed={favorite}
        onClick={onToggleFavorite}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--mpa-radius-sm)] text-[var(--mpa-color-text-muted)] hover:bg-[var(--mpa-color-bg-surface)] hover:text-[var(--mpa-color-brand-primary)]"
      >
        <span aria-hidden="true">{favorite ? "★" : "☆"}</span>
      </button>
    </div>
  );
}
