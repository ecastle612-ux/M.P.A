import { redirect } from "next/navigation";
import { Card } from "@mpa/ui";
import { AppPage } from "../../../../components/presentation/app-page";
import { OwnerUniversalDashboard } from "../../../../components/portal/owner-universal-dashboard";
import { MasterAdminPortalDemoPanel } from "../../../../components/master-admin/master-admin-portal-demo-panel";
import { createAuthServerComponentClient } from "../../../../lib/auth/server";
import { resolveActiveOrganizationIdForUser } from "../../../../lib/organization/server";
import { getActiveMasterAdminSession } from "../../../../lib/master-admin/session";
import {
  loadOwnerPortalDashboard,
  type OwnerPortalDashboardModel
} from "../../../../lib/owner-portal/dashboard";
import { buildOwnerDashboardViewModel } from "../../../../lib/dashboard/ux016-role-builders";
import { getTimeGreeting } from "../../../../lib/format/display-labels";

export default async function OwnerPortalPage() {
  const supabase = await createAuthServerComponentClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const organizationId = await resolveActiveOrganizationIdForUser(user.id);
  if (!organizationId) redirect("/dashboard");

  const session = await getActiveMasterAdminSession(user.id);
  const inPortalTest = session?.mode === "portal_test" && session.portal === "owner";

  let model: OwnerPortalDashboardModel | null = null;
  let loadError: string | null = null;

  try {
    model = await loadOwnerPortalDashboard({ user, organizationId, supabase });
  } catch (error) {
    loadError = error instanceof Error ? error.message : "Owner dashboard failed to load.";
  }

  if (!model) {
    return (
      <AppPage breadcrumbs={[{ href: "/portal", label: "Portals" }, { label: "Owner" }]}>
        <Card variant="elevated" className="space-y-2 p-5">
          <h1 className="font-display text-xl font-semibold text-[var(--mpa-color-text-primary)]">
            Dashboard unavailable
          </h1>
          <p className="text-sm text-[var(--mpa-color-text-secondary)]">
            We couldn’t load your owner dashboard right now. Retry in a moment, or contact your property
            manager if this continues.
          </p>
          {loadError ? (
            <p className="text-xs text-[var(--mpa-color-text-secondary)]">{loadError}</p>
          ) : null}
        </Card>
      </AppPage>
    );
  }

  const viewModel = buildOwnerDashboardViewModel({
    timeGreeting: getTimeGreeting(),
    dateLabel: new Intl.DateTimeFormat(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric"
    }).format(new Date()),
    model
  });

  return (
    <AppPage breadcrumbs={[{ href: "/portal", label: "Portals" }, { label: "Owner" }]}>
      <OwnerUniversalDashboard
        model={viewModel}
        demoPanel={inPortalTest ? <MasterAdminPortalDemoPanel portal="owner" /> : null}
      />
    </AppPage>
  );
}
