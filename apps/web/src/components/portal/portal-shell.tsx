"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Badge, Card } from "@mpa/ui";
import { OrganizationSwitcher } from "../shell/organization-switcher";
import { RoleSwitcher } from "../shell/role-switcher";
import { ProfileMenu } from "../shell/profile-menu";
import { MpaLogo } from "../branding/mpa-logo";

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
      <header className="sticky top-0 z-20 border-b border-[var(--mpa-color-border-default)] bg-white px-4 py-3">
        <div className="mx-auto flex w-full max-w-7xl items-center gap-3">
          <MpaLogo className="h-12 w-auto" alt="M.P.A. logo" />
          <p className="font-display text-xl font-semibold text-[var(--mpa-color-text-primary)]">{title}</p>
          <Badge>{roleBadgeLabel}</Badge>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <OrganizationSwitcher />
            <RoleSwitcher />
            <ProfileMenu />
          </div>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-7xl gap-4 px-4 py-4 lg:grid-cols-[260px_1fr]">
        <Card className="h-fit">
          <p className="text-xs uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">Navigation</p>
          <nav className="mt-3 space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block rounded-md px-2 py-2 text-sm text-[var(--mpa-color-text-secondary)] hover:bg-[var(--mpa-color-bg-sidebar-elevated)] hover:text-[var(--mpa-color-text-primary)]"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </Card>

        <main className="space-y-4">
          <Card>
            <h1 className="font-display text-2xl font-semibold text-[var(--mpa-color-text-primary)]">{title}</h1>
            <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">{subtitle}</p>
          </Card>
          {children}
        </main>
      </div>
    </div>
  );
}
