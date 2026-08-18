"use client";

import type { ReactNode } from "react";
import type { UserRole } from "@mpa/shared";
import type { OrganizationSummary } from "../../lib/organization/contracts";
import { MPA_BRAND_NAME, MPA_BRAND_TAGLINE } from "../../lib/branding";
import { AuthenticatedContextProviders } from "./authenticated-context-providers";
import { useOrganizationContext } from "./organization-context";
import { Sidebar } from "./sidebar";
import { TopNavigation } from "./top-navigation";
import { ResponsiveNavigation } from "./responsive-navigation";
import { SkipToContent } from "./skip-to-content";

function OrgScopedMain({ children }: { children: ReactNode }) {
  const { activeOrganizationId } = useOrganizationContext();
  return (
    <div
      id="main-content"
      key={activeOrganizationId ?? "no-org"}
      className="flex min-h-0 flex-1 flex-col"
    >
      {children}
    </div>
  );
}

function MobileBrand() {
  const { activeOrganization } = useOrganizationContext();
  return (
    <div className="min-w-0">
      <p className="truncate font-display text-base font-semibold text-[var(--mpa-color-text-primary)]">
        {MPA_BRAND_TAGLINE}
      </p>
      <p className="truncate text-xs text-[var(--mpa-color-text-secondary)]">
        {activeOrganization?.name ?? MPA_BRAND_NAME}
        {activeOrganization?.productLabel ? ` · ${activeOrganization.productLabel}` : ""}
      </p>
    </div>
  );
}

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
          <div className="flex items-center justify-between gap-3 px-4 pt-3 lg:hidden">
            <MobileBrand />
            <ResponsiveNavigation />
          </div>
          <TopNavigation />
          <OrgScopedMain>{children}</OrgScopedMain>
        </div>
      </div>
    </AuthenticatedContextProviders>
  );
}
