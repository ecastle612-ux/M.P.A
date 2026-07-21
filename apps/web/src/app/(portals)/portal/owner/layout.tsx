import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createAuthServerComponentClient } from "../../../../lib/auth/server";
import { resolveAuthenticatedShellContext } from "../../../../lib/auth/get-shell-context";
import { OWNER_PORTAL_NAVIGATION } from "../../../../components/portal/navigation";
import { RolePortalFrame } from "../../../../components/portal/role-portal-frame";
import {
  canAccessPortalAsMasterAdmin,
  getMasterAdminBannerModel,
  resolveEffectiveRolesForSession
} from "../../../../lib/master-admin/session";
import { MasterAdminModeBanner } from "../../../../components/master-admin/master-admin-mode-banner";

export default async function OwnerPortalLayout({ children }: { children: ReactNode }) {
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

  const hasRole = shellContext.availableRoles.includes("property_owner");
  const masterAccess = await canAccessPortalAsMasterAdmin(
    user,
    shellContext.defaultOrganizationId,
    "property_owner"
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
      defaultRole="property_owner"
      organizations={shellContext.organizations}
      defaultOrganizationId={shellContext.defaultOrganizationId}
      title="Property Owner Portal"
      subtitle="Owner portfolio and reporting views."
      roleBadgeLabel="Owner"
      navigation={OWNER_PORTAL_NAVIGATION}
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
