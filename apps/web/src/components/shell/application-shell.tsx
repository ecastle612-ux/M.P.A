"use client";

import type { ReactNode } from "react";
import type { UserRole } from "@mpa/shared";
import type { OrganizationSummary } from "../../lib/organization/contracts";
import { AuthenticatedContextProviders } from "./authenticated-context-providers";
import { Sidebar } from "./sidebar";
import { TopNavigation } from "./top-navigation";
import { ResponsiveNavigation } from "./responsive-navigation";
import { SkipToContent } from "./skip-to-content";

export function ApplicationShell({
  children,
  availableRoles,
  defaultRole,
  organizations,
  defaultOrganizationId,
  isPlatformOperator = false
}: {
  children: ReactNode;
  availableRoles: UserRole[];
  defaultRole: UserRole;
  organizations: OrganizationSummary[];
  defaultOrganizationId: string | null;
  isPlatformOperator?: boolean;
}) {
  return (
    <AuthenticatedContextProviders
      availableRoles={availableRoles}
      defaultRole={defaultRole}
      organizations={organizations}
      defaultOrganizationId={defaultOrganizationId}
      isPlatformOperator={isPlatformOperator}
    >
      <div className="flex min-h-screen bg-[var(--mpa-color-bg-app)]">
        <SkipToContent />
        <Sidebar />
        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <div className="flex items-center justify-between px-4 pt-3 lg:hidden">
            <p className="font-display text-lg font-semibold text-[var(--mpa-color-text-primary)]">M.P.A.</p>
            <ResponsiveNavigation />
          </div>
          <TopNavigation />
          <div id="main-content" className="flex min-h-0 flex-1 flex-col">
            {children}
          </div>
        </div>
      </div>
    </AuthenticatedContextProviders>
  );
}
