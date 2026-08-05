import { redirect } from "next/navigation";
import { Card } from "@mpa/ui";
import { AppPage } from "../../../../components/presentation/app-page";
import { OwnerUniversalDashboard } from "../../../../components/portal/owner-universal-dashboard";
import { MasterAdminPortalDemoPanel } from "../../../../components/master-admin/master-admin-portal-demo-panel";
import { createAuthServerComponentClient } from "../../../../lib/auth/server";
import { resolveActiveOrganizationIdForUser, getOrganizationsForUser } from "../../../../lib/organization/server";
import { getActiveMasterAdminSession } from "../../../../lib/master-admin/session";
import {
  loadOwnerPortalDashboard,
  type OwnerPortalDashboardModel
} from "../../../../lib/owner-portal/dashboard";
import { buildOwnerUniversalDashboardViewModel } from "../../../../lib/owner-portal/ux016-view-model";
import { formatHumanOrganizationName } from "../../../../lib/format/display-labels";

/** STD-001 operational remediation — Owner home on Universal Dashboard Framework. */
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

  const organizations = await getOrganizationsForUser(user.id);
  const organizationName = organizations.find((organization) => organization.id === organizationId)?.name ?? null;

  const udfModel = buildOwnerUniversalDashboardViewModel({
    model,
    organizationName: organizationName ? formatHumanOrganizationName(organizationName) : null
  });

  return (
    <AppPage breadcrumbs={[{ href: "/portal", label: "Portals" }, { label: "Owner" }]}>
      <OwnerUniversalDashboard
        model={udfModel}
        ownerModel={model}
        demoPanel={inPortalTest ? <MasterAdminPortalDemoPanel portal="owner" /> : null}
      />
    </AppPage>
  );
}
