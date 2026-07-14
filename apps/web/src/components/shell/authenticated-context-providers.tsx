"use client";

import { useState, type ReactNode } from "react";
import type { UserRole } from "@mpa/shared";
import type { OrganizationSummary } from "../../lib/organization/contracts";
import { OrganizationProvider } from "./organization-context";
import { RoleProvider } from "./role-context";

export function AuthenticatedContextProviders({
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
  const [organizationState, setOrganizationState] = useState<OrganizationSummary[]>(organizations);

  return (
    <OrganizationProvider
      organizations={organizationState}
      defaultOrganizationId={defaultOrganizationId}
      onRefreshOrganizations={async () => {
        const response = await fetch("/api/organizations", { method: "GET" });
        if (!response.ok) {
          return;
        }
        const payload = (await response.json()) as {
          memberships?: Array<{
            organizationId: string;
            organizationName: string;
            organizationSlug: string;
            roles: UserRole[];
          }>;
        };
        const refreshedOrganizations = (payload.memberships ?? []).map((membership) => ({
          id: membership.organizationId,
          name: membership.organizationName,
          slug: membership.organizationSlug,
          roles: membership.roles
        }));
        setOrganizationState(refreshedOrganizations);
      }}
    >
      <RoleProvider fallbackRoles={availableRoles} defaultRole={defaultRole}>
        {children}
      </RoleProvider>
    </OrganizationProvider>
  );
}
