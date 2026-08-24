"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import {
  isNavItemActive,
  navCandidatesFromGroups,
  type PresentedNavGroup
} from "@mpa/shared";
import { NavIcon, Tooltip, cn } from "@mpa/ui";
import {
  MPA_BRAND_NAME,
  MPA_BRAND_TAGLINE,
  logoPathForSurface,
  logoWebpPathForSurface
} from "../../lib/branding";

const railFocus =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mpa-color-border-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--mpa-color-bg-sidebar)]";

export function SidebarBrandLockup({
  href,
  collapsed,
  organizationName,
  surfaceLabel
}: {
  href: string;
  collapsed: boolean;
  organizationName?: string | null;
  surfaceLabel?: string | null;
}) {
  const alt = `${MPA_BRAND_NAME} ${MPA_BRAND_TAGLINE}`;
  const png = logoPathForSurface("dark");
  const webp = logoWebpPathForSurface("dark");

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-md px-1 py-1",
        railFocus,
        collapsed && "justify-center px-0"
      )}
      aria-label={`${alt}${surfaceLabel ? ` — ${surfaceLabel}` : ""}`}
    >
      <span className="relative inline-flex h-9 w-9 shrink-0 overflow-hidden rounded-md bg-[var(--mpa-color-bg-sidebar-elevated)]">
        <picture className="pointer-events-none absolute left-1/2 top-1/2 block h-[180%] w-[180%] -translate-x-1/2 -translate-y-1/2">
          <source srcSet={webp} type="image/webp" />
          <img src={png} alt="" width={72} height={72} className="h-full w-full object-contain" />
        </picture>
      </span>
      {collapsed ? (
        <span className="sr-only">{alt}</span>
      ) : (
        <span className="min-w-0">
          <span className="block truncate font-display text-sm font-semibold leading-tight text-[var(--mpa-color-text-sidebar-active)]">
            {MPA_BRAND_TAGLINE}
          </span>
          {organizationName ? (
            <span className="mt-0.5 block truncate text-xs text-[var(--mpa-color-text-sidebar)]">
              {organizationName}
            </span>
          ) : null}
          {surfaceLabel ? (
            <span className="block truncate text-[11px] text-[var(--mpa-color-text-sidebar)]/80">
              {surfaceLabel}
            </span>
          ) : null}
        </span>
      )}
    </Link>
  );
}

export function AppNavItem({
  href,
  label,
  icon,
  active,
  collapsed,
  planned
}: {
  href: string;
  label: string;
  icon: Parameters<typeof NavIcon>[0]["name"];
  active: boolean;
  collapsed: boolean;
  planned?: boolean;
}) {
  const link = (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      aria-label={collapsed ? label : undefined}
      title={collapsed ? label : undefined}
      className={cn(
        "relative flex min-h-11 items-center gap-3 rounded-md px-2.5 text-sm motion-safe:transition-colors motion-safe:duration-[var(--mpa-motion-fast)] motion-reduce:transition-none",
        railFocus,
        collapsed && "justify-center px-0",
        active
          ? "bg-[var(--mpa-color-bg-sidebar-active)] font-semibold text-[var(--mpa-color-text-sidebar-active)]"
          : "text-[var(--mpa-color-text-sidebar)] hover:bg-[var(--mpa-color-bg-sidebar-hover)] hover:text-[var(--mpa-color-text-sidebar-active)]"
      )}
    >
      <span
        aria-hidden
        className={cn(
          "absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-r bg-[var(--mpa-color-border-sidebar-accent)] motion-safe:transition-opacity motion-safe:duration-[var(--mpa-motion-fast)]",
          active ? "opacity-100" : "opacity-0"
        )}
      />
      <NavIcon
        name={icon}
        className={active ? "text-[var(--mpa-color-text-sidebar-active)]" : "opacity-85"}
      />
      {collapsed ? <span className="sr-only">{label}</span> : <span className="min-w-0 flex-1 truncate">{label}</span>}
      {!collapsed && planned ? (
        <span className="text-[10px] uppercase tracking-wide opacity-70">Planned</span>
      ) : null}
    </Link>
  );

  if (!collapsed) {
    return link;
  }

  return (
    <Tooltip label={label} side="right">
      {link}
    </Tooltip>
  );
}

export function AppNavGroups({
  groups,
  pathname,
  collapsed,
  showProductTitles
}: {
  groups: readonly PresentedNavGroup[];
  pathname: string;
  collapsed: boolean;
  showProductTitles: boolean;
}) {
  const candidates = navCandidatesFromGroups(groups);

  return (
    <nav
      id="app-sidebar-nav"
      aria-label="Workspace"
      className={cn("space-y-5 px-2 py-4", collapsed && "px-1.5")}
    >
      {groups.map((group) => (
        <div
          key={group.id}
          className={cn(
            showProductTitles && group.current && "rounded-lg bg-[var(--mpa-color-bg-sidebar-elevated)]/70 py-2",
            showProductTitles && !group.current && "opacity-90"
          )}
        >
          {showProductTitles && !collapsed ? (
            <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--mpa-color-text-sidebar-active)]">
              {group.title}
            </p>
          ) : null}
          <div className="space-y-4">
            {group.sections.map((section) => (
              <div key={`${group.id}-${section.id}`}>
                {!collapsed ? (
                  <p className="mb-1.5 px-2 text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--mpa-color-text-sidebar)]/70">
                    {section.title}
                  </p>
                ) : (
                  <div className="mx-auto mb-1.5 h-px w-6 bg-[var(--mpa-color-border-sidebar)]" aria-hidden />
                )}
                <ul className="space-y-0.5">
                  {section.items.map((item) => (
                    <li key={`${group.id}-${item.href}`}>
                      <AppNavItem
                        href={item.href}
                        label={item.label}
                        icon={item.icon}
                        collapsed={collapsed}
                        planned={item.readiness === "planned"}
                        active={isNavItemActive(pathname, item.href, candidates)}
                      />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      ))}
    </nav>
  );
}

export function AppNavRail({
  collapsed,
  onToggleCollapsed,
  brand,
  context,
  groups,
  pathname,
  showProductTitles,
  footer,
  mobile = false
}: {
  collapsed: boolean;
  onToggleCollapsed?: () => void;
  brand: ReactNode;
  context?: ReactNode;
  groups: readonly PresentedNavGroup[];
  pathname: string;
  showProductTitles: boolean;
  footer: ReactNode;
  mobile?: boolean;
}) {
  return (
    <aside
      className={cn(
        "flex h-full min-h-0 flex-col border-r border-[var(--mpa-color-border-sidebar)] bg-[var(--mpa-color-bg-sidebar)] text-[var(--mpa-color-text-sidebar)] motion-safe:transition-[width] motion-safe:duration-[var(--mpa-motion-normal)] motion-safe:ease-[var(--mpa-ease-standard)] motion-reduce:transition-none",
        mobile ? "w-full max-w-[20rem]" : collapsed ? "w-[4.5rem]" : "w-72"
      )}
    >
      <div className="shrink-0 border-b border-[var(--mpa-color-border-sidebar)] px-3 py-3">
        {brand}
        {context && !collapsed ? <div className="mt-3">{context}</div> : null}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <AppNavGroups
          groups={groups}
          pathname={pathname}
          collapsed={collapsed}
          showProductTitles={showProductTitles}
        />
      </div>
      <div className="shrink-0 space-y-2 border-t border-[var(--mpa-color-border-sidebar)] px-2 py-3">
        {onToggleCollapsed && !mobile ? (
          <button
            type="button"
            onClick={onToggleCollapsed}
            aria-pressed={collapsed}
            aria-expanded={!collapsed}
            aria-controls="app-sidebar-nav"
            className={cn(
              "flex min-h-11 w-full items-center gap-3 rounded-md px-2.5 text-sm text-[var(--mpa-color-text-sidebar)] hover:bg-[var(--mpa-color-bg-sidebar-hover)] hover:text-[var(--mpa-color-text-sidebar-active)]",
              railFocus,
              collapsed && "justify-center px-0"
            )}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              className="h-5 w-5 shrink-0"
              aria-hidden
            >
              {collapsed ? (
                <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
              ) : (
                <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
              )}
            </svg>
            {collapsed ? <span className="sr-only">Expand sidebar</span> : <span>Collapse</span>}
          </button>
        ) : null}
        {footer}
      </div>
    </aside>
  );
}
