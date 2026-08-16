import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createAuthServerClient } from "../../../../lib/auth/server";
import { resolveAuthenticatedShellContext } from "../../../../lib/auth/get-shell-context";
import { TENANT_PORTAL_NAVIGATION } from "../../../../components/portal/navigation";
import { RolePortalFrame } from "../../../../components/portal/role-portal-frame";
import {
  loadTenantPortalContext,
  tenantPortalSubtitle
} from "../../../../lib/tenant-lifecycle/portal-context";

export default async function TenantPortalLayout({ children }: { children: ReactNode }) {
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
  if (!shellContext.availableRoles.includes("tenant")) {
    redirect("/unauthorized");
  }

  const occupancy = await loadTenantPortalContext(
    supabase,
    shellContext.defaultOrganizationId,
    user.id
  );
  const title =
    occupancy.mode === "moved_out"
      ? "Past residence"
      : occupancy.mode === "future"
        ? "Upcoming home"
        : "My Home";

  return (
    <RolePortalFrame
      availableRoles={shellContext.availableRoles}
      defaultRole="tenant"
      organizations={shellContext.organizations}
      defaultOrganizationId={shellContext.defaultOrganizationId}
      title={title}
      subtitle={tenantPortalSubtitle(occupancy.mode)}
      roleBadgeLabel={occupancy.mode === "active" ? "Resident" : occupancy.mode === "moved_out" ? "Former resident" : "Resident"}
      navigation={TENANT_PORTAL_NAVIGATION}
      experience="resident"
      showNotifications
      notificationsInboxHref="/portal/tenant/messages"
      notificationsInboxLabel="Open messages"
    >
      {children}
    </RolePortalFrame>
  );
}
