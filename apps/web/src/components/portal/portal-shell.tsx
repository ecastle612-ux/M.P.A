"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Badge, Card } from "@mpa/ui";
import { OrganizationSwitcher } from "../shell/organization-switcher";
import { RoleSwitcher } from "../shell/role-switcher";
import { ProfileMenu } from "../shell/profile-menu";
import { ThemeModeToggle } from "../shell/theme-mode-toggle";
import { BrandLogo } from "../branding/brand-logo";
import { PushEnrollmentBanner } from "../communication/push-enrollment-banner";
import { PwaNativeOnboarding } from "../pwa/pwa-native-onboarding";
import { NativeShellEffects } from "../pwa/native-shell-effects";
import { FloatingAiCopilot } from "../ai/floating-ai-copilot";
import { AiRouteContextSync } from "../ai/ai-route-context-sync";
import { PortalMobileBottomNav } from "./owner-mobile-bottom-nav";
import type { PortalNavigationItem } from "./navigation";

function isNavItemActive(pathname: string, href: string, exact = false): boolean {
  if (
    exact ||
    href === "/portal/owner" ||
    href === "/portal/tenant" ||
    href === "/portal/vendor" ||
    href === "/portal/manager"
  ) {
    return pathname === href;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

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
  fetchProfile = true,
  masterAdminBanner,
  mobileBottomNavigation,
  consumerChrome = false
}: {
  title: string;
  subtitle: string;
  roleBadgeLabel: string;
  navigation: readonly PortalNavigationItem[];
  children: ReactNode;
  notificationSettingsHref?: string | undefined;
  showPushEnrollmentBanner?: boolean | undefined;
  fetchProfile?: boolean | undefined;
  masterAdminBanner?: ReactNode;
  /** When set, side nav is desktop-only and bottom tabs show on mobile. */
  mobileBottomNavigation?: readonly PortalNavigationItem[] | undefined;
  /** Quieter header for resident / consumer-facing portals. */
  consumerChrome?: boolean | undefined;
}) {
  const pathname = usePathname() ?? "";
  const hasMobileBottomNav = Boolean(mobileBottomNavigation?.length);
  const showRoleBadge = Boolean(roleBadgeLabel?.trim()) && !consumerChrome;

  return (
    <div className="mpa-native-shell min-h-[100dvh] min-h-screen bg-[var(--mpa-color-bg-app)] pl-[var(--mpa-safe-left)] pr-[var(--mpa-safe-right)]">
      <NativeShellEffects />
      {masterAdminBanner}
      <header className="sticky top-0 z-20 border-b border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)]/95 px-4 pb-3 pt-[calc(0.75rem+var(--mpa-safe-top))] backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-7xl items-center gap-3">
          <BrandLogo purpose="header" />
          <div className="min-w-0">
            <p className="truncate font-display text-base font-semibold text-[var(--mpa-color-text-primary)]">{title}</p>
            {subtitle.trim() ? (
              <p className="truncate text-xs text-[var(--mpa-color-text-secondary)]">{subtitle}</p>
            ) : null}
          </div>
          {showRoleBadge ? <Badge variant="neutral">{roleBadgeLabel}</Badge> : null}
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <ThemeModeToggle />
            <OrganizationSwitcher />
            <RoleSwitcher />
            <ProfileMenu fetchProfile={fetchProfile} />
          </div>
        </div>
      </header>

      <PwaNativeOnboarding settingsHref={notificationSettingsHref} />
      {showPushEnrollmentBanner ? <PushEnrollmentBanner settingsHref={notificationSettingsHref} /> : null}

      <div
        className={
          hasMobileBottomNav
            ? "mpa-native-shell-scroll mx-auto grid w-full max-w-7xl gap-5 px-4 py-5 pb-24 lg:grid-cols-[15rem_1fr] lg:pb-5"
            : "mpa-native-shell-scroll mx-auto grid w-full max-w-7xl gap-5 px-4 py-5 lg:grid-cols-[15rem_1fr]"
        }
      >
        <Card
          variant="elevated"
          className={hasMobileBottomNav ? "hidden h-fit p-1 lg:block" : "h-fit p-1"}
        >
          <p className="px-2 pt-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--mpa-color-text-secondary)]">
            Navigation
          </p>
          <nav className="mt-1 space-y-0.5 p-1" aria-label="Portal navigation">
            {navigation.map((item) => {
              const active = isNavItemActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={
                    active
                      ? "block rounded-[var(--mpa-radius-md)] bg-[var(--mpa-color-bg-muted)] px-2.5 py-2 text-sm font-medium text-[var(--mpa-color-text-primary)]"
                      : "block rounded-[var(--mpa-radius-md)] px-2.5 py-2 text-sm text-[var(--mpa-color-text-secondary)] transition-colors hover:bg-[var(--mpa-color-bg-muted)] hover:text-[var(--mpa-color-text-primary)]"
                  }
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </Card>

        <main className="space-y-5">{children}</main>
      </div>

      {mobileBottomNavigation?.length ? (
        <PortalMobileBottomNav items={mobileBottomNavigation} />
      ) : null}

      {/* AI-001: same OS launcher on portal chrome (permission-gated inside component). */}
      <AiRouteContextSync />
      <FloatingAiCopilot />
    </div>
  );
}
