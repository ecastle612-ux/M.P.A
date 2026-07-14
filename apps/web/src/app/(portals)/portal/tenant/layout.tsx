import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createAuthServerComponentClient } from "../../../../lib/auth/server";
import { resolveAuthenticatedShellContext } from "../../../../lib/auth/get-shell-context";
import { TENANT_PORTAL_NAVIGATION } from "../../../../components/portal/navigation";
import { RolePortalFrame } from "../../../../components/portal/role-portal-frame";

export default async function TenantPortalLayout({ children }: { children: ReactNode }) {
  const supabase = await createAuthServerComponentClient();
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
  if (!shellContext.availableRoles.includes("tenant")) {
    redirect("/unauthorized");
  }

  return (
    <RolePortalFrame
      availableRoles={shellContext.availableRoles}
      defaultRole="tenant"
      organizations={shellContext.organizations}
      defaultOrganizationId={shellContext.defaultOrganizationId}
      title="Tenant Portal"
      subtitle="Tenant-facing shell foundation for requests and updates."
      roleBadgeLabel="Tenant"
      navigation={TENANT_PORTAL_NAVIGATION}
    >
      {children}
    </RolePortalFrame>
  );
}
