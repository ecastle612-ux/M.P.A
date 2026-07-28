import type { ReactNode } from "react";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { createAuthServerComponentClient } from "../../lib/auth/server";
import { ApplicationShell } from "../../components/shell/application-shell";
import { ShellProviders } from "../../components/shell/shell-providers";
import { resolveAuthenticatedShellContext } from "../../lib/auth/get-shell-context";
import { getSetupStatus } from "../../lib/setup/server";
import { shouldServerRedirectToSetup } from "../../lib/setup/completion";
import { getDeploymentMeta } from "../../lib/launch/deployment-meta";
import { userHasMasterAdminCapability } from "../../lib/master-admin/access";
import {
  getMasterAdminBannerModel,
  resolveEffectiveRolesForSession
} from "../../lib/master-admin/session";
import { MasterAdminModeBanner } from "../../components/master-admin/master-admin-mode-banner";
import {
  assignedSurfaceHome,
  canAccessOperationsShell
} from "../../lib/auth/ops-shell-access";

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

  // REG-ACL-001 belt-and-suspenders: never render Ops shell for portal-only roles.
  const rolesForGate = effectiveRoles.length ? effectiveRoles : shellContext.availableRoles;
  if (!canAccessOperationsShell(rolesForGate, isMasterAdmin)) {
    redirect(assignedSurfaceHome(rolesForGate, isMasterAdmin));
  }

  const isSetupComplete = setupStatus.isComplete || isMasterAdmin;
  const pathname = (await headers()).get("x-mpa-pathname");
  // Server redirect before shell/dashboard paint — client SetupGate alone flashes /dashboard.
  if (shouldServerRedirectToSetup({ isSetupComplete, pathname })) {
    redirect("/setup");
  }

  // Master Admin with no portfolio roles — HQ sidebar only (no Properties/Units/Tenants).
  const masterAdminOnlyShell =
    isMasterAdmin &&
    shellContext.availableRoles.length === 0 &&
    !banner?.session;

  return (
    <ShellProviders>
      <ApplicationShell
        availableRoles={effectiveRoles.length ? effectiveRoles : shellContext.availableRoles}
        defaultRole={defaultRole}
        organizations={shellContext.organizations}
        defaultOrganizationId={shellContext.defaultOrganizationId}
        isSetupComplete={isSetupComplete}
        deploymentMeta={deploymentMeta}
        initialSidebarCollapsed={initialSidebarCollapsed}
        initialPermissions={shellContext.permissions}
        initialEntitledModules={shellContext.entitledModules}
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
    </ShellProviders>
  );
}
