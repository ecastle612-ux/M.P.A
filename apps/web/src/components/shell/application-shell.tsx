"use client";

import type { ReactNode } from "react";
import type { UserRole } from "@mpa/shared";
import type { OrganizationSummary } from "../../lib/organization/contracts";
import { AuthenticatedContextProviders } from "./authenticated-context-providers";
import { CommandCenterTracker } from "./command-center-tracker";
import { Sidebar } from "./sidebar";
import { TopNavigation } from "./top-navigation";
import { ResponsiveNavigation } from "./responsive-navigation";
import { BrandLogo } from "../branding/brand-logo";
import { SetupGate } from "../setup/setup-gate";
import { PushEnrollmentBanner } from "../communication/push-enrollment-banner";
import { DeploymentBadge } from "../launch/deployment-badge";
import type { DeploymentMeta } from "../../lib/launch/deployment-meta";

export function ApplicationShell({
  children,
  availableRoles,
  defaultRole,
  organizations,
  defaultOrganizationId,
  isSetupComplete,
  deploymentMeta
}: {
  children: ReactNode;
  availableRoles: UserRole[];
  defaultRole: UserRole;
  organizations: OrganizationSummary[];
  defaultOrganizationId: string | null;
  isSetupComplete: boolean;
  deploymentMeta: DeploymentMeta;
}) {
  return (
    <AuthenticatedContextProviders
      availableRoles={availableRoles}
      defaultRole={defaultRole}
      organizations={organizations}
      defaultOrganizationId={defaultOrganizationId}
    >
      <SetupGate isSetupComplete={isSetupComplete} />
      <a
        href="#app-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-white focus:px-3 focus:py-2"
      >
        Skip to content
      </a>
      <CommandCenterTracker />
      <div className="flex min-h-screen bg-[var(--mpa-color-bg-app)] text-[var(--mpa-color-text-primary)]">
        <Sidebar />
        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <header className="flex h-16 items-center justify-between gap-3 border-b border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-surface)] px-4 lg:hidden">
            <BrandLogo purpose="header" priority />
            <div className="flex items-center gap-2">
              <DeploymentBadge meta={deploymentMeta} />
              <ResponsiveNavigation />
            </div>
          </header>
          <TopNavigation deploymentMeta={deploymentMeta} />
          <PushEnrollmentBanner settingsHref="/settings/notifications" />
          <div id="app-content" className="mpa-app-main flex min-h-0 min-w-0 flex-col">
            {children}
          </div>
        </div>
      </div>
    </AuthenticatedContextProviders>
  );
}
