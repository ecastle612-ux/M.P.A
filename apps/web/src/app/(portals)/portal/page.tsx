import { redirect } from "next/navigation";
import { AppPage } from "../../../components/presentation/app-page";
import { PortalAvailabilityHub } from "../../../components/portal/portal-availability-hub";
import { ApplicationShell } from "../../../components/shell/application-shell";
import { createAuthServerComponentClient } from "../../../lib/auth/server";
import { resolveAuthenticatedShellContext } from "../../../lib/auth/get-shell-context";
import { getSetupStatus } from "../../../lib/setup/server";
import { getDeploymentMeta } from "../../../lib/launch/deployment-meta";
import { assertMasterAdminUser, getMasterAdminBannerModel } from "../../../lib/master-admin/session";
import { MasterAdminModeBanner } from "../../../components/master-admin/master-admin-mode-banner";

export default async function PortalIndexPage() {
  const supabase = await createAuthServerComponentClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [shellContext, setupStatus] = await Promise.all([
    resolveAuthenticatedShellContext(user),
    getSetupStatus(user.id, false, {
      email: user.email ?? null,
      appMetadata: user.app_metadata
    })
  ]);

  if (!shellContext.defaultOrganizationId) {
    redirect("/dashboard");
  }

  const isMasterAdmin = await assertMasterAdminUser(user, shellContext.defaultOrganizationId);
  const banner = await getMasterAdminBannerModel(user);

  return (
    <ApplicationShell
      availableRoles={shellContext.availableRoles}
      defaultRole={shellContext.defaultRole}
      organizations={shellContext.organizations}
      defaultOrganizationId={shellContext.defaultOrganizationId}
      initialPermissions={shellContext.permissions}
      isSetupComplete={setupStatus.isComplete}
      deploymentMeta={getDeploymentMeta()}
      masterAdminBanner={
        banner ? (
          <MasterAdminModeBanner
            session={banner.session}
            authenticatedName={banner.authenticatedName}
          />
        ) : null
      }
    >
      <AppPage breadcrumbs={[{ href: "/dashboard", label: "Operations" }, { label: "Portals" }]}>
        <PortalAvailabilityHub
          availableRoles={shellContext.availableRoles}
          defaultRole={shellContext.defaultRole}
          isMasterAdmin={isMasterAdmin}
        />
      </AppPage>
    </ApplicationShell>
  );
}
