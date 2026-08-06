import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import type { UserRole } from "@mpa/shared";
import { createAuthServerClient } from "../../../../lib/auth/server";
import { resolveAuthenticatedShellContext } from "../../../../lib/auth/get-shell-context";
import { isPlatformOperatorUser } from "../../../../lib/commercial/server";
import { OWNER_PORTAL_NAVIGATION } from "../../../../components/portal/navigation";
import { RolePortalFrame } from "../../../../components/portal/role-portal-frame";

const OWNER_PORTAL_ROLES: readonly UserRole[] = [
  "property_owner",
  "property_manager",
  "organization_admin"
];

export default async function OwnerPortalLayout({ children }: { children: ReactNode }) {
  const supabase = await createAuthServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const shellContext = await resolveAuthenticatedShellContext(user);
  if (!shellContext.defaultOrganizationId) {
    redirect("/dashboard");
  }

  const hasOwnerPortalRole = shellContext.availableRoles.some((role) =>
    OWNER_PORTAL_ROLES.includes(role)
  );
  const platformOperator = await isPlatformOperatorUser(user);
  if (!hasOwnerPortalRole && !platformOperator) {
    redirect("/unauthorized");
  }

  const defaultRole = shellContext.availableRoles.includes("property_owner")
    ? "property_owner"
    : shellContext.availableRoles.includes("property_manager")
      ? "property_manager"
      : shellContext.availableRoles.includes("organization_admin")
        ? "organization_admin"
        : shellContext.defaultRole;

  return (
    <RolePortalFrame
      availableRoles={shellContext.availableRoles}
      defaultRole={defaultRole}
      organizations={shellContext.organizations}
      defaultOrganizationId={shellContext.defaultOrganizationId}
      title="Property Owner Portal"
      subtitle="Portfolio health — occupancy, rent, balances, maintenance, and recent activity."
      roleBadgeLabel="Owner"
      navigation={OWNER_PORTAL_NAVIGATION}
    >
      {children}
    </RolePortalFrame>
  );
}
