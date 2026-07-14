"use client";

import type { ReactNode } from "react";
import type { UserRole } from "@mpa/shared";
import type { OrganizationSummary } from "../../lib/organization/contracts";
import { AuthenticatedContextProviders } from "../shell/authenticated-context-providers";
import { PortalShell } from "./portal-shell";

type PortalNavigationItem = {
  href: string;
  label: string;
};

export function RolePortalFrame({
  children,
  availableRoles,
  defaultRole,
  organizations,
  defaultOrganizationId,
  title,
  subtitle,
  roleBadgeLabel,
  navigation
}: {
  children: ReactNode;
  availableRoles: UserRole[];
  defaultRole: UserRole;
  organizations: OrganizationSummary[];
  defaultOrganizationId: string | null;
  title: string;
  subtitle: string;
  roleBadgeLabel: string;
  navigation: readonly PortalNavigationItem[];
}) {
  return (
    <AuthenticatedContextProviders
      availableRoles={availableRoles}
      defaultRole={defaultRole}
      organizations={organizations}
      defaultOrganizationId={defaultOrganizationId}
    >
      <PortalShell title={title} subtitle={subtitle} roleBadgeLabel={roleBadgeLabel} navigation={navigation}>
        {children}
      </PortalShell>
    </AuthenticatedContextProviders>
  );
}
