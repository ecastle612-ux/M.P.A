import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createAuthServerComponentClient } from "../../../../lib/auth/server";
import { resolveAuthenticatedShellContext } from "../../../../lib/auth/get-shell-context";
import { RolePortalFrame } from "../../../../components/portal/role-portal-frame";
import { VENDOR_PORTAL_NAVIGATION } from "../../../../components/portal/navigation";

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
  if (!shellContext.availableRoles.includes("vendor")) {
    redirect("/unauthorized");
  }

  return (
    <RolePortalFrame
      availableRoles={shellContext.availableRoles}
      defaultRole="vendor"
      organizations={shellContext.organizations}
      defaultOrganizationId={shellContext.defaultOrganizationId}
      title="Vendor Portal"
      subtitle="Vendor-facing shell foundation for assignment and completion updates."
      roleBadgeLabel="Vendor"
      navigation={VENDOR_PORTAL_NAVIGATION}
    >
      {children}
    </RolePortalFrame>
  );
}
