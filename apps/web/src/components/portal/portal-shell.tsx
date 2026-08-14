"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Badge } from "@mpa/ui";
import { OrganizationSwitcher } from "../shell/organization-switcher";
import { RoleSwitcher } from "../shell/role-switcher";
import { NotificationCenter } from "../shell/notification-center";
import { ProfileMenu } from "../shell/profile-menu";
import { SkipToContent } from "../shell/skip-to-content";

type PortalNavigationItem = {
  href: string;
  label: string;
  shortLabel?: string;
};

const linkFocus =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mpa-color-border-focus,#0F6B56)] focus-visible:ring-offset-2";

function isActivePath(pathname: string, href: string) {
  if (href === "/portal/tenant" || href === "/portal/vendor") {
    return pathname === href;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function PortalShell({
  title,
  subtitle,
  roleBadgeLabel,
  navigation,
  children,
  experience = "default",
  showNotifications = false,
  notificationsInboxHref = "/portal/tenant/messages",
  notificationsInboxLabel = "Open messages"
}: {
  title: string;
  subtitle: string;
  roleBadgeLabel: string;
  navigation: readonly PortalNavigationItem[];
  children: ReactNode;
  experience?: "default" | "resident" | "technician" | "vendor";
  showNotifications?: boolean;
  notificationsInboxHref?: string;
  notificationsInboxLabel?: string;
}) {
  const pathname = usePathname() ?? "";
  const isResident = experience === "resident";
  const isTechnician = experience === "technician";
  const isVendor = experience === "vendor";
  const useMobileBottomNav = isResident || isTechnician || isVendor;
  const bottomCols = Math.min(Math.max(navigation.length, 2), 5);
  const shortcutsLabel = isVendor
    ? "Vendor shortcuts"
    : isTechnician
      ? "Technician shortcuts"
      : "Resident shortcuts";

  return (
    <div
      className={`min-h-screen bg-[var(--mpa-color-bg-app)] ${
        useMobileBottomNav ? "pb-[calc(4.5rem+env(safe-area-inset-bottom))] lg:pb-0" : ""
      }`}
    >
      <SkipToContent />
      <header
        className={`sticky top-0 z-20 border-b border-[var(--mpa-color-border-default)] bg-white ${
          useMobileBottomNav ? "px-3 py-2.5 sm:px-4" : "px-4 py-3"
        }`}
      >
        <div className="mx-auto flex w-full max-w-7xl items-center gap-2 sm:gap-3">
          <div className="min-w-0">
            <p className="truncate font-display text-lg font-semibold text-[var(--mpa-color-text-primary)] sm:text-xl">
              {title}
            </p>
            {useMobileBottomNav ? (
              <p className="truncate text-xs text-[var(--mpa-color-text-secondary)] sm:hidden">
                {subtitle}
              </p>
            ) : null}
          </div>
          {!useMobileBottomNav ? <Badge>{roleBadgeLabel}</Badge> : null}
          <div className={`ml-auto flex items-center gap-1.5 sm:gap-2 ${useMobileBottomNav ? "" : "flex-wrap"}`}>
            {!useMobileBottomNav ? (
              <>
                <OrganizationSwitcher />
                <RoleSwitcher />
              </>
            ) : (
              <div className="hidden items-center gap-2 lg:flex">
                <OrganizationSwitcher />
                <RoleSwitcher />
              </div>
            )}
            {showNotifications ? (
              <NotificationCenter
                inboxHref={notificationsInboxHref}
                inboxLabel={notificationsInboxLabel}
              />
            ) : null}
            <ProfileMenu />
          </div>
        </div>
      </header>

      <div
        className={`mx-auto grid w-full max-w-7xl gap-4 px-3 py-4 sm:px-4 ${
          useMobileBottomNav ? "lg:grid-cols-[220px_1fr]" : "lg:grid-cols-[240px_1fr]"
        }`}
      >
        <nav
          aria-label={`${roleBadgeLabel} portal`}
          className={`h-fit rounded-md border border-[var(--mpa-color-border-default)] bg-white p-3 ${
            useMobileBottomNav ? "hidden lg:block" : ""
          }`}
        >
          <p className="text-xs uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
            Navigation
          </p>
          <ul className="mt-3 space-y-1">
            {navigation.map((item) => {
              const active = isActivePath(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`block rounded-md px-3 py-3 text-sm ${linkFocus} ${
                      active
                        ? "bg-[var(--mpa-color-bg-app)] font-semibold text-[var(--mpa-color-brand-primary)]"
                        : "text-[var(--mpa-color-text-secondary)] hover:bg-[var(--mpa-color-bg-app)] hover:text-[var(--mpa-color-text-primary)]"
                    }`}
                    aria-current={active ? "page" : undefined}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <main id="main-content" className="min-w-0 space-y-4">
          {isResident ? null : (
            <header className="space-y-1">
              <h1 className="font-display text-2xl font-semibold text-[var(--mpa-color-text-primary)]">
                {title}
              </h1>
              <p className="text-sm text-[var(--mpa-color-text-secondary)]">{subtitle}</p>
            </header>
          )}
          {children}
        </main>
      </div>

      {useMobileBottomNav ? (
        <nav
          aria-label={shortcutsLabel}
          className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--mpa-color-border-default)] bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/90 lg:hidden"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <ul
            className="mx-auto grid max-w-lg gap-0 px-1 pt-1"
            style={{ gridTemplateColumns: `repeat(${bottomCols}, minmax(0, 1fr))` }}
          >
            {navigation.map((item) => {
              const active = isActivePath(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-md px-1 text-center text-[11px] font-medium leading-tight ${linkFocus} ${
                      active
                        ? "text-[var(--mpa-color-brand-primary)]"
                        : "text-[var(--mpa-color-text-secondary)]"
                    }`}
                    aria-current={active ? "page" : undefined}
                  >
                    <span
                      className={`h-1 w-6 rounded-full ${
                        active ? "bg-[var(--mpa-color-brand-primary)]" : "bg-transparent"
                      }`}
                      aria-hidden
                    />
                    {item.shortLabel ?? item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      ) : null}
    </div>
  );
}
