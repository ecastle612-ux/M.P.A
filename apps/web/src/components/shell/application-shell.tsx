"use client";

import type { ReactNode } from "react";
import type { UserRole } from "@mpa/shared";
import type { OrganizationSummary } from "../../lib/organization/contracts";
import { AuthenticatedContextProviders } from "./authenticated-context-providers";
import { CommandCenterTracker } from "./command-center-tracker";
import { Sidebar } from "./sidebar";
import { TopNavigation } from "./top-navigation";
import { ResponsiveNavigation } from "./responsive-navigation";
import { MpaLogo } from "../branding/mpa-logo";

export function ApplicationShell({
  children,
  availableRoles,
  defaultRole,
  organizations,
  defaultOrganizationId
}: {
  children: ReactNode;
  availableRoles: UserRole[];
  defaultRole: UserRole;
  organizations: OrganizationSummary[];
  defaultOrganizationId: string | null;
}) {
  return (
    <AuthenticatedContextProviders
      availableRoles={availableRoles}
      defaultRole={defaultRole}
      organizations={organizations}
      defaultOrganizationId={defaultOrganizationId}
    >
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
          <header className="flex h-14 items-center justify-between border-b border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] px-4 lg:hidden">
            <MpaLogo className="h-8 w-auto" alt="M.P.A. logo" />
            <ResponsiveNavigation />
          </header>
          <TopNavigation />
          <div id="app-content" className="flex min-h-0 min-w-0 flex-1 flex-col">
            {children}
          </div>
        </div>
      </div>
    </AuthenticatedContextProviders>
  );
}
