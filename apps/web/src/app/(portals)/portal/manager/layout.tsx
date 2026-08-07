import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createAuthServerClient } from "../../../../lib/auth/server";
import { resolveAuthenticatedShellContext } from "../../../../lib/auth/get-shell-context";
import { RolePortalFrame } from "../../../../components/portal/role-portal-frame";
import { MANAGER_PORTAL_NAVIGATION } from "../../../../components/portal/navigation";

export default async function ManagerPortalLayout({ children }: { children: ReactNode }) {
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
  const isManager =
    shellContext.availableRoles.includes("property_manager") ||
    shellContext.availableRoles.includes("organization_admin");
  if (!isManager) {
    redirect("/unauthorized?reason=role");
  }

  return (
    <RolePortalFrame
      availableRoles={shellContext.availableRoles}
      defaultRole={
        shellContext.availableRoles.includes("organization_admin")
          ? "organization_admin"
          : "property_manager"
      }
      organizations={shellContext.organizations}
      defaultOrganizationId={shellContext.defaultOrganizationId}
      title="Property Manager Portal"
      subtitle="Quick access to setup, billing, and your workspace."
      roleBadgeLabel="Manager"
      navigation={MANAGER_PORTAL_NAVIGATION}
    >
      {children}
    </RolePortalFrame>
  );
}
