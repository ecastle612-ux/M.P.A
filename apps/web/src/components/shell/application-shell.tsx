"use client";

import dynamic from "next/dynamic";
import type { ReactNode } from "react";
import type { UserRole } from "@mpa/shared";
import type { OrganizationSummary } from "../../lib/organization/contracts";
import { AuthenticatedContextProviders } from "./authenticated-context-providers";
import { CommandCenterTracker } from "./command-center-tracker";
import { Sidebar } from "./sidebar";
import { TopNavigation } from "./top-navigation";
import { ResponsiveNavigation } from "./responsive-navigation";
import { OpsMobileBottomNav } from "./ops-mobile-bottom-nav";
import { BrandLogo } from "../branding/brand-logo";
import { SetupGate } from "../setup/setup-gate";
import { PushEnrollmentBanner } from "../communication/push-enrollment-banner";
import { PwaNativeOnboarding } from "../pwa/pwa-native-onboarding";
import { NativeShellEffects } from "../pwa/native-shell-effects";
import { DeploymentBadge } from "../launch/deployment-badge";
import { AiRouteContextSync } from "../ai/ai-route-context-sync";
import type { DeploymentMeta } from "../../lib/launch/deployment-meta";

/** PMX-004 Phase 8 — defer heavy AI copilot until after shell paint. */
const FloatingAiCopilot = dynamic(
  () => import("../ai/floating-ai-copilot").then((m) => ({ default: m.FloatingAiCopilot })),
  { ssr: false }
);

export function ApplicationShell({
  children,
  availableRoles,
  defaultRole,
  organizations,
  defaultOrganizationId,
  isSetupComplete,
  deploymentMeta,
  masterAdminBanner,
  initialSidebarCollapsed = false,
  initialPermissions = [],
  initialEntitledModules = null,
  masterAdminOnlyShell = false
}: {
  children: ReactNode;
  availableRoles: UserRole[];
  defaultRole: UserRole;
  organizations: OrganizationSummary[];
  defaultOrganizationId: string | null;
  isSetupComplete: boolean;
  deploymentMeta: DeploymentMeta;
  masterAdminBanner?: ReactNode;
  initialSidebarCollapsed?: boolean;
  initialPermissions?: string[];
  initialEntitledModules?: string[] | null;
  masterAdminOnlyShell?: boolean;
}) {
  return (
    <AuthenticatedContextProviders
      availableRoles={availableRoles}
      defaultRole={defaultRole}
      organizations={organizations}
      defaultOrganizationId={defaultOrganizationId}
      initialPermissions={initialPermissions}
      initialEntitledModules={initialEntitledModules}
      masterAdminOnlyShell={masterAdminOnlyShell}
    >
      <SetupGate isSetupComplete={isSetupComplete} />
      <a
        href="#app-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-[var(--mpa-color-bg-surface)] focus:px-3 focus:py-2 focus:text-[var(--mpa-color-text-primary)] focus:shadow-[var(--mpa-shadow-md)]"
      >
        Skip to content
      </a>
      <CommandCenterTracker />
      {masterAdminBanner}
      <NativeShellEffects />
      <div className="mpa-native-shell flex min-h-[100dvh] min-h-screen bg-[var(--mpa-color-bg-app)] text-[var(--mpa-color-text-primary)] pl-[var(--mpa-safe-left)] pr-[var(--mpa-safe-right)]">
        <Sidebar initialCollapsed={initialSidebarCollapsed} />
        <div className="flex min-h-[100dvh] min-h-screen min-w-0 flex-1 flex-col">
          <header className="flex min-h-16 items-center justify-between gap-3 border-b border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-surface)] px-4 pt-[var(--mpa-safe-top)] lg:hidden">
            <BrandLogo purpose="header" priority className="min-w-0" />
            <div className="flex shrink-0 items-center gap-2">
              <DeploymentBadge meta={deploymentMeta} />
              <ResponsiveNavigation hideTrigger={!masterAdminOnlyShell} />
            </div>
          </header>
          <TopNavigation deploymentMeta={deploymentMeta} />
          <PwaNativeOnboarding settingsHref="/settings/preferences" />
          <PushEnrollmentBanner settingsHref="/settings/preferences" />
          <div
            id="app-content"
            className={[
              "mpa-app-main mpa-native-shell-scroll flex min-h-0 min-w-0 flex-col",
              masterAdminOnlyShell
                ? "pb-[var(--mpa-safe-bottom)]"
                : "pb-[calc(var(--mpa-safe-bottom)+4.5rem)] lg:pb-[var(--mpa-safe-bottom)]"
            ].join(" ")}
          >
            {children}
          </div>
          {masterAdminOnlyShell ? null : <OpsMobileBottomNav />}
        </div>
      </div>
      {/* AI-001 / SH-002: copilot + route context outside shell subscription tree. */}
      <AiRouteContextSync />
      <FloatingAiCopilot />
    </AuthenticatedContextProviders>
  );
}
