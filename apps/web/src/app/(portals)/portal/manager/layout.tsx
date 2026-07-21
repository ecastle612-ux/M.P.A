import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createAuthServerComponentClient } from "../../../../lib/auth/server";
import { resolveAuthenticatedShellContext } from "../../../../lib/auth/get-shell-context";
import { RolePortalFrame } from "../../../../components/portal/role-portal-frame";
import { MANAGER_PORTAL_NAVIGATION } from "../../../../components/portal/navigation";
import {
  canAccessPortalAsMasterAdmin,
  getMasterAdminBannerModel,
  resolveEffectiveRolesForSession
} from "../../../../lib/master-admin/session";
import { MasterAdminModeBanner } from "../../../../components/master-admin/master-admin-mode-banner";

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

  const hasRole = shellContext.availableRoles.includes("property_manager");
  const masterAccess = await canAccessPortalAsMasterAdmin(
    user,
    shellContext.defaultOrganizationId,
    "property_manager"
  );
  if (!hasRole && !masterAccess.allowed) {
    redirect("/unauthorized");
  }

  const effectiveRoles =
    masterAccess.session != null
      ? await resolveEffectiveRolesForSession(masterAccess.session)
      : shellContext.availableRoles;
  const banner = await getMasterAdminBannerModel(user);

  return (
    <RolePortalFrame
      availableRoles={effectiveRoles.length ? effectiveRoles : shellContext.availableRoles}
      defaultRole="property_manager"
      organizations={shellContext.organizations}
      defaultOrganizationId={shellContext.defaultOrganizationId}
      title="Property Manager Portal"
      subtitle="Day-to-day management runs in the main Operations workspace."
      roleBadgeLabel="Manager"
      navigation={MANAGER_PORTAL_NAVIGATION}
      masterAdminBanner={
        banner ? (
          <MasterAdminModeBanner
            session={banner.session}
            authenticatedName={banner.authenticatedName}
          />
        ) : null
      }
    >
      {children}
    </RolePortalFrame>
  );
}
