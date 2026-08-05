import { AppPage } from "../../../../components/presentation/app-page";
import { FutureReleaseNotice } from "../../../../components/experience/future-release-notice";
import { MasterAdminPortalDemoPanel } from "../../../../components/master-admin/master-admin-portal-demo-panel";
import { createAuthServerComponentClient } from "../../../../lib/auth/server";
import { getActiveMasterAdminSession } from "../../../../lib/master-admin/session";

export default async function ManagerPortalPage() {
  const supabase = await createAuthServerComponentClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  const session = user ? await getActiveMasterAdminSession(user.id) : null;
  const inPortalTest = session?.mode === "portal_test" && session.portal === "manager";

  // MAC-002 — Test Mode is simulation only: no live Operations Center escape hatch.
  if (inPortalTest) {
    return (
      <AppPage
        breadcrumbs={[
          { href: "/master-admin", label: "Mission Control" },
          { label: "Manager Test Mode" }
        ]}
      >
        <div className="space-y-4">
          <MasterAdminPortalDemoPanel portal="manager" />
          <p className="text-sm text-[var(--mpa-color-text-secondary)]">
            Simulated demo surface. Exit Test Mode from the banner before opening live Operations
            workspaces.
          </p>
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
