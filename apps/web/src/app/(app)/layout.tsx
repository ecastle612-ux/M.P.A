import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createAuthServerComponentClient } from "../../lib/auth/server";
import { ApplicationShell } from "../../components/shell/application-shell";
import { resolveAuthenticatedShellContext } from "../../lib/auth/get-shell-context";
import { getSetupStatus } from "../../lib/setup/server";
import { getDeploymentMeta } from "../../lib/launch/deployment-meta";
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

  const [shellContext, setupStatus, banner] = await Promise.all([
    resolveAuthenticatedShellContext(user),
    getSetupStatus(user.id, false, {
      email: user.email ?? null,
      appMetadata: user.app_metadata
    }),
    getMasterAdminBannerModel(user)
  ]);
  const deploymentMeta = getDeploymentMeta();

  const effectiveRoles =
    banner?.session != null
      ? await resolveEffectiveRolesForSession(banner.session)
      : shellContext.availableRoles;
  const defaultRole =
    banner?.session?.mode === "impersonate"
      ? (effectiveRoles[0] ?? shellContext.defaultRole)
      : shellContext.defaultRole;

  return (
    <ApplicationShell
      availableRoles={effectiveRoles.length ? effectiveRoles : shellContext.availableRoles}
      defaultRole={defaultRole}
      organizations={shellContext.organizations}
      defaultOrganizationId={shellContext.defaultOrganizationId}
      isSetupComplete={setupStatus.isComplete}
      deploymentMeta={deploymentMeta}
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
