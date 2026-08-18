"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useReducer } from "react";
import { MASTER_ADMIN_NAV, presentMasterAdminNav } from "@mpa/shared";
import type { ReactNode } from "react";
import { useFocusTrap } from "@mpa/ui";
import { reduceDismissibleMenu } from "../../lib/ui/dismissible-menu";
import { AppNavRail, SidebarBrandLockup } from "../shell/app-nav-rail";
import { SkipToContent } from "../shell/skip-to-content";
import { useSidebarCollapse } from "../shell/use-sidebar-collapse";

function AdminMobileDrawer({
  pathname,
  operatorEmail
}: {
  pathname: string;
  operatorEmail: string;
}) {
  const [menu, dispatch] = useReducer(reduceDismissibleMenu, { open: false, pathname });
  const panelRef = useFocusTrap<HTMLDivElement>(menu.open, () => dispatch({ type: "close" }));
  const groups = useMemo(() => presentMasterAdminNav(MASTER_ADMIN_NAV, pathname), [pathname]);

  useEffect(() => {
    dispatch({ type: "pathname", pathname });
  }, [pathname]);

  useEffect(() => {
    if (!menu.open) {
      return;
    }
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [menu.open]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border border-[var(--mpa-color-border-default)] px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mpa-color-border-focus)]"
        aria-expanded={menu.open}
        aria-haspopup="dialog"
        aria-controls="admin-mobile-nav-drawer"
        onClick={() => dispatch({ type: "toggle" })}
      >
        Menu
      </button>
      {menu.open ? (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            aria-label="Close navigation"
            className="absolute inset-0 bg-[var(--mpa-color-bg-overlay)]"
            onClick={() => dispatch({ type: "close" })}
          />
          <div
            ref={panelRef}
            id="admin-mobile-nav-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Owner Operations navigation"
            className="absolute inset-y-0 left-0 flex h-full w-[min(20rem,100%)] motion-safe:animate-[mpa-rise_200ms_ease-out] motion-reduce:animate-none"
          >
            <AppNavRail
              mobile
              collapsed={false}
              pathname={pathname}
              groups={groups}
              showProductTitles={false}
              brand={
                <SidebarBrandLockup
                  href="/admin"
                  collapsed={false}
                  organizationName="Owner Operations"
                  surfaceLabel="Platform console"
                />
              }
              footer={<p className="truncate px-2 text-xs text-[var(--mpa-color-text-sidebar)]">{operatorEmail}</p>}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function MasterAdminShell({ children, operatorEmail }: { children: ReactNode; operatorEmail: string }) {
  const pathname = usePathname() ?? "";
  const { collapsed, toggleCollapsed } = useSidebarCollapse();
  const groups = useMemo(() => presentMasterAdminNav(MASTER_ADMIN_NAV, pathname), [pathname]);

  return (
    <div className="flex min-h-screen bg-[var(--mpa-color-bg-app)]">
      <SkipToContent />
      <div className="hidden h-screen shrink-0 lg:sticky lg:top-0 lg:block lg:self-start">
        <AppNavRail
          collapsed={collapsed}
          onToggleCollapsed={toggleCollapsed}
          pathname={pathname}
          groups={groups}
          showProductTitles={false}
          brand={
            <SidebarBrandLockup
              href="/admin"
              collapsed={collapsed}
              organizationName="Owner Operations"
              surfaceLabel="Platform console"
            />
          }
          footer={
            collapsed ? (
              <p className="sr-only">{operatorEmail}</p>
            ) : (
              <p className="truncate px-2 text-xs text-[var(--mpa-color-text-sidebar)]">{operatorEmail}</p>
            )
          }
        />
      </div>
      <div className="min-w-0 flex-1">
        <header className="flex min-h-14 items-center justify-between gap-3 border-b border-[var(--mpa-color-border-default)] bg-white px-4 py-2">
          <div className="flex min-w-0 items-center gap-3">
            <AdminMobileDrawer pathname={pathname} operatorEmail={operatorEmail} />
            <p className="hidden truncate text-sm text-[var(--mpa-color-text-secondary)] sm:block">
              Diagnose · verify · support every customer from one place
            </p>
          </div>
          <Link href="/dashboard" className="shrink-0 text-sm text-[var(--mpa-color-brand-primary)] underline">
            Exit to customer app
          </Link>
        </header>
        <div id="main-content">{children}</div>
      </div>
    </div>
  );
}
