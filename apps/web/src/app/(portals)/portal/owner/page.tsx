import { AppPage } from "../../../../components/presentation/app-page";
import { FutureReleaseNotice } from "../../../../components/experience/future-release-notice";
import { MasterAdminPortalDemoPanel } from "../../../../components/master-admin/master-admin-portal-demo-panel";
import { createAuthServerComponentClient } from "../../../../lib/auth/server";
import { getActiveMasterAdminSession } from "../../../../lib/master-admin/session";

export default async function OwnerPortalPage() {
  const supabase = await createAuthServerComponentClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  const session = user ? await getActiveMasterAdminSession(user.id) : null;
  const inPortalTest = session?.mode === "portal_test" && session.portal === "owner";

  if (inPortalTest) {
    return (
      <AppPage breadcrumbs={[{ href: "/portal", label: "Portals" }, { label: "Owner" }]}>
        <MasterAdminPortalDemoPanel portal="owner" />
      </AppPage>
    );
  }

  return (
    <AppPage breadcrumbs={[{ href: "/portal", label: "Portals" }, { label: "Owner" }]}>
      <FutureReleaseNotice
        title="Owner Portal"
        description="The Owner Portal will become available during a future release. Property owners can use shared reporting and statements from the main workspace when granted access."
        primaryHref="/portal"
        primaryLabel="Back to Portals"
      />
    </AppPage>
  );
}
