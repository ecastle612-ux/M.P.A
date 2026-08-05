"use client";

import type { ReactNode } from "react";
import type { UserRole } from "@mpa/shared";
import type { OrganizationSummary } from "../../lib/organization/contracts";
import { AuthenticatedContextProviders } from "./authenticated-context-providers";
import { Sidebar } from "./sidebar";
import { TopNavigation } from "./top-navigation";
import { ResponsiveNavigation } from "./responsive-navigation";

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
      <div className="mpa-safe-pad flex min-h-screen bg-[var(--mpa-color-bg-app)]">
        <Sidebar />
        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <div className="flex items-center justify-between gap-3 border-b border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-surface)] px-4 py-3 lg:hidden">
            <div>
              <p className="font-display text-lg font-semibold tracking-tight text-[var(--mpa-color-text-primary)]">
                M.P.A.
              </p>
              <p className="text-xs text-[var(--mpa-color-text-muted)]">Workspace</p>
            </div>
            <ResponsiveNavigation />
          </div>
          <TopNavigation />
          <div className="mpa-page-enter min-h-0 flex-1">{children}</div>
        </div>
      </div>
    </AuthenticatedContextProviders>
  );
}
