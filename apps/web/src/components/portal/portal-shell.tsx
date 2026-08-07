"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Badge } from "@mpa/ui";
import { OrganizationSwitcher } from "../shell/organization-switcher";
import { RoleSwitcher } from "../shell/role-switcher";
import { ProfileMenu } from "../shell/profile-menu";
import { SkipToContent } from "../shell/skip-to-content";

type PortalNavigationItem = {
  href: string;
  label: string;
};

export function PortalShell({
  title,
  subtitle,
  roleBadgeLabel,
  navigation,
  children
}: {
  title: string;
  subtitle: string;
  roleBadgeLabel: string;
  navigation: readonly PortalNavigationItem[];
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[var(--mpa-color-bg-app)]">
      <SkipToContent />
      <header className="sticky top-0 z-20 border-b border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] px-4 py-3">
        <div className="mx-auto flex w-full max-w-7xl items-center gap-3">
          <p className="font-display text-xl font-semibold text-[var(--mpa-color-text-primary)]">{title}</p>
          <Badge>{roleBadgeLabel}</Badge>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <OrganizationSwitcher />
            <RoleSwitcher />
            <ProfileMenu />
          </div>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-7xl gap-4 px-4 py-4 lg:grid-cols-[240px_1fr]">
        <nav
          aria-label={`${roleBadgeLabel} portal`}
          className="h-fit rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] p-3"
        >
          <p className="text-xs uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">Navigation</p>
          <ul className="mt-3 space-y-1">
            {navigation.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="block rounded-md px-2 py-2 text-sm text-[var(--mpa-color-text-secondary)] hover:bg-[var(--mpa-color-bg-app)] hover:text-[var(--mpa-color-text-primary)]"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <main id="main-content" className="min-w-0 space-y-4">
          <header className="space-y-1">
            <h1 className="font-display text-2xl font-semibold text-[var(--mpa-color-text-primary)]">{title}</h1>
            <p className="text-sm text-[var(--mpa-color-text-secondary)]">{subtitle}</p>
          </header>
          {children}
        </main>
      </div>
    </div>
  );
}
