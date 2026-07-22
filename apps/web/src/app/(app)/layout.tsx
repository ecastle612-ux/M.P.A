import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createAuthServerComponentClient } from "../../lib/auth/server";
import { ApplicationShell } from "../../components/shell/application-shell";
import { resolveAuthenticatedShellContext } from "../../lib/auth/get-shell-context";
import { getSetupStatus } from "../../lib/setup/server";
import { getDeploymentMeta } from "../../lib/launch/deployment-meta";
import { userHasMasterAdminCapability } from "../../lib/master-admin/access";
import {
  getMasterAdminBannerModel,
  resolveEffectiveRolesForSession
} from "../../lib/master-admin/session";
import { MasterAdminModeBanner } from "../../components/master-admin/master-admin-mode-banner";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const supabase = await createAuthServerComponentClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [shellContext, setupStatus, banner, cookieStore, isMasterAdmin] = await Promise.all([
    resolveAuthenticatedShellContext(user),
    getSetupStatus(user.id, false, {
      email: user.email ?? null,
      appMetadata: user.app_metadata
    }),
    getMasterAdminBannerModel(user),
    cookies(),
    userHasMasterAdminCapability(user)
  ]);
  const deploymentMeta = getDeploymentMeta();
  const initialSidebarCollapsed = cookieStore.get("mpa_sidebar_collapsed")?.value === "1";

  const effectiveRoles =
    banner?.session != null
      ? await resolveEffectiveRolesForSession(banner.session)
      : shellContext.availableRoles;
  const defaultRole =
    banner?.session?.mode === "impersonate"
      ? (effectiveRoles[0] ?? shellContext.defaultRole)
      : shellContext.defaultRole;

  // Master Admin with no portfolio roles — HQ sidebar only (no Properties/Units/Tenants).
  const masterAdminOnlyShell =
    isMasterAdmin &&
    shellContext.availableRoles.length === 0 &&
    !banner?.session;

  return (
    <ApplicationShell
      availableRoles={effectiveRoles.length ? effectiveRoles : shellContext.availableRoles}
      defaultRole={defaultRole}
      organizations={shellContext.organizations}
      defaultOrganizationId={shellContext.defaultOrganizationId}
      isSetupComplete={setupStatus.isComplete || isMasterAdmin}
      deploymentMeta={deploymentMeta}
      initialSidebarCollapsed={initialSidebarCollapsed}
      initialPermissions={shellContext.permissions}
      masterAdminOnlyShell={masterAdminOnlyShell}
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
    </ApplicationShell>
  );
}
