import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createAuthServerComponentClient } from "../../../../lib/auth/server";
import { resolveAuthenticatedShellContext } from "../../../../lib/auth/get-shell-context";
import { RolePortalFrame } from "../../../../components/portal/role-portal-frame";
import { MANAGER_PORTAL_NAVIGATION } from "../../../../components/portal/navigation";

export default async function ManagerPortalLayout({ children }: { children: ReactNode }) {
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
  if (!shellContext.availableRoles.includes("property_manager")) {
    redirect("/unauthorized");
  }

  return (
    <RolePortalFrame
      availableRoles={shellContext.availableRoles}
      defaultRole="property_manager"
      organizations={shellContext.organizations}
      defaultOrganizationId={shellContext.defaultOrganizationId}
      title="Property Manager Portal"
      subtitle="Day-to-day management runs in the main Operations workspace. This dedicated portal shell will expand in a later release."
      roleBadgeLabel="Manager"
      navigation={MANAGER_PORTAL_NAVIGATION}
    >
      {children}
    </RolePortalFrame>
  );
}
