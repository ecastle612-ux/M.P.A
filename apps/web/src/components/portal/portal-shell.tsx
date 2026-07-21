"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Badge, Card } from "@mpa/ui";
import { OrganizationSwitcher } from "../shell/organization-switcher";
import { RoleSwitcher } from "../shell/role-switcher";
import { ProfileMenu } from "../shell/profile-menu";
import { BrandLogo } from "../branding/brand-logo";
import { PushEnrollmentBanner } from "../communication/push-enrollment-banner";

type PortalNavigationItem = {
  href: string;
  label: string;
};

/**
 * Portal chrome uses the same ThemeProvider → BrandSurfaceTone path as the main app.
 * Do not maintain an independent theme useState (that caused logo swaps on refresh).
 */
export function PortalShell({
  title,
  subtitle,
  roleBadgeLabel,
  navigation,
  children,
  notificationSettingsHref = "/portal/tenant/preferences",
  showPushEnrollmentBanner = true,
  fetchProfile = true
}: {
  title: string;
  subtitle: string;
  roleBadgeLabel: string;
  navigation: readonly PortalNavigationItem[];
  children: ReactNode;
  notificationSettingsHref?: string | undefined;
  showPushEnrollmentBanner?: boolean | undefined;
  fetchProfile?: boolean | undefined;
}) {
  return (
    <div className="min-h-screen bg-[var(--mpa-color-bg-app)]">
      <header className="sticky top-0 z-20 border-b border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)]/95 px-4 py-3 backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-7xl items-center gap-3">
          <BrandLogo purpose="header" />
          <div className="min-w-0">
            <p className="truncate font-display text-base font-semibold text-[var(--mpa-color-text-primary)]">{title}</p>
            <p className="truncate text-xs text-[var(--mpa-color-text-secondary)]">{subtitle}</p>
          </div>
          <Badge variant="neutral">{roleBadgeLabel}</Badge>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <OrganizationSwitcher />
            <RoleSwitcher />
            <ProfileMenu fetchProfile={fetchProfile} />
          </div>
        </div>
      </header>

      {showPushEnrollmentBanner ? <PushEnrollmentBanner settingsHref={notificationSettingsHref} /> : null}

      <div className="mx-auto grid w-full max-w-7xl gap-5 px-4 py-5 lg:grid-cols-[15rem_1fr]">
        <Card variant="elevated" className="h-fit p-1">
          <p className="px-2 pt-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--mpa-color-text-secondary)]">
            Navigation
          </p>
          <nav className="mt-1 space-y-0.5 p-1">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block rounded-[var(--mpa-radius-md)] px-2.5 py-2 text-sm text-[var(--mpa-color-text-secondary)] transition-colors hover:bg-[var(--mpa-color-bg-muted)] hover:text-[var(--mpa-color-text-primary)]"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </Card>

        <main className="space-y-5">{children}</main>
      </div>
    </div>
  );
}
