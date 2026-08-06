"use client";

import { useState, type ReactNode } from "react";
import type { ProductSku, UserRole } from "@mpa/shared";
import type { OrganizationSummary } from "../../lib/organization/contracts";
import { OrganizationProvider } from "./organization-context";
import { RoleProvider } from "./role-context";
import { CommercialProvider } from "./commercial-context";
import { OperatorProvider } from "./operator-context";

export function AuthenticatedContextProviders({
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
  const [organizationState, setOrganizationState] = useState<OrganizationSummary[]>(organizations);

  return (
    <OperatorProvider isPlatformOperator={isPlatformOperator}>
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
              productSku: ProductSku | null;
              productLabel: string | null;
              setupComplete: boolean;
            }>;
          };
          const refreshedOrganizations = (payload.memberships ?? []).map((membership) => ({
            id: membership.organizationId,
            name: membership.organizationName,
            slug: membership.organizationSlug,
            roles: membership.roles,
            productSku: membership.productSku,
            productLabel: membership.productLabel,
            setupComplete: membership.setupComplete
          }));
          setOrganizationState(refreshedOrganizations);
        }}
      >
        <CommercialProvider>
          <RoleProvider fallbackRoles={availableRoles} defaultRole={defaultRole}>
            {children}
          </RoleProvider>
        </CommercialProvider>
      </OrganizationProvider>
    </OperatorProvider>
  );
}
