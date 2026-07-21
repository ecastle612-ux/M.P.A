import Link from "next/link";
import { AppPage } from "../../../../components/presentation/app-page";
import { FutureReleaseNotice } from "../../../../components/experience/future-release-notice";
import { MasterAdminPortalDemoPanel } from "../../../../components/master-admin/master-admin-portal-demo-panel";
import { Button } from "@mpa/ui";
import { createAuthServerComponentClient } from "../../../../lib/auth/server";
import { getActiveMasterAdminSession } from "../../../../lib/master-admin/session";

export default async function ManagerPortalPage() {
  const supabase = await createAuthServerComponentClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  const session = user ? await getActiveMasterAdminSession(user.id) : null;
  const inPortalTest = session?.mode === "portal_test" && session.portal === "manager";

  if (inPortalTest) {
    return (
      <AppPage breadcrumbs={[{ href: "/portal", label: "Portals" }, { label: "Manager" }]}>
        <div className="space-y-4">
          <MasterAdminPortalDemoPanel portal="manager" />
          <Link href="/dashboard">
            <Button type="button">Open Operations Center</Button>
          </Link>
        </div>
      </AppPage>
    );
  }

  return (
    <AppPage breadcrumbs={[{ href: "/portal", label: "Portals" }, { label: "Manager" }]}>
      <FutureReleaseNotice
        title="Manager Portal"
        description="A dedicated Manager Portal will become available during a future release. Property managers should use the Operations Center for day-to-day work."
        primaryHref="/dashboard"
        primaryLabel="Open Operations Center"
      />
    </AppPage>
  );
}
