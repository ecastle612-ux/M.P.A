"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Badge, Card, cn } from "@mpa/ui";
import { OrganizationSwitcher } from "../shell/organization-switcher";
import { RoleSwitcher } from "../shell/role-switcher";
import { ProfileMenu } from "../shell/profile-menu";

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
  const pathname = usePathname();

  return (
    <div className="mpa-safe-pad min-h-screen bg-[var(--mpa-color-bg-app)]">
      <header className="sticky top-0 z-20 border-b border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-surface)]/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center gap-3">
          <div className="min-w-0">
            <p className="font-display text-xl font-semibold tracking-tight text-[var(--mpa-color-text-primary)]">
              {title}
            </p>
            <p className="text-xs text-[var(--mpa-color-text-muted)]">M.P.A. portal foundation</p>
          </div>
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
          aria-label="Portal"
          className="h-fit rounded-[var(--mpa-radius-lg)] border border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-surface)] p-3"
        >
          <p className="px-2 text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--mpa-color-text-muted)]">
            Navigation
          </p>
          <ul className="mt-2 space-y-1">
            {navigation.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex min-h-11 items-center rounded-[var(--mpa-radius-md)] px-3 py-2 text-sm transition-colors duration-[var(--mpa-motion-fast)]",
                      active
                        ? "bg-[var(--mpa-color-interactive-selected)] font-medium text-[var(--mpa-color-brand-primary)]"
                        : "text-[var(--mpa-color-text-secondary)] hover:bg-[var(--mpa-color-bg-row-hover)] hover:text-[var(--mpa-color-text-primary)]",
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <main className="mpa-page-enter space-y-4">
          <Card className="space-y-1">
            <h1 className="font-display text-2xl font-semibold tracking-tight text-[var(--mpa-color-text-primary)]">
              {title}
            </h1>
            <p className="text-sm leading-relaxed text-[var(--mpa-color-text-secondary)]">{subtitle}</p>
          </Card>
          {children}
        </main>
      </div>
    </div>
  );
}
