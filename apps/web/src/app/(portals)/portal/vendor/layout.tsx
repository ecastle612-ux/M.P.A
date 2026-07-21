import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createAuthServerComponentClient } from "../../../../lib/auth/server";
import { resolveAuthenticatedShellContext } from "../../../../lib/auth/get-shell-context";
import { RolePortalFrame } from "../../../../components/portal/role-portal-frame";
import { VENDOR_PORTAL_NAVIGATION } from "../../../../components/portal/navigation";
import {
  canAccessPortalAsMasterAdmin,
  getMasterAdminBannerModel,
  resolveEffectiveRolesForSession
} from "../../../../lib/master-admin/session";
import { MasterAdminModeBanner } from "../../../../components/master-admin/master-admin-mode-banner";

export default async function VendorPortalLayout({ children }: { children: ReactNode }) {
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

  const hasRole = shellContext.availableRoles.includes("vendor");
  const masterAccess = await canAccessPortalAsMasterAdmin(
    user,
    shellContext.defaultOrganizationId,
    "vendor"
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
      defaultRole="vendor"
      organizations={shellContext.organizations}
      defaultOrganizationId={shellContext.defaultOrganizationId}
      title="Vendor Portal"
      subtitle="Vendor-facing shell foundation for assignment and completion updates."
      roleBadgeLabel="Vendor"
      navigation={VENDOR_PORTAL_NAVIGATION}
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
