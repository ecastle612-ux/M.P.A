import { redirect } from "next/navigation";
import { AppPage } from "../../../components/presentation/app-page";
import { MigrationUniversalDashboard } from "../../../components/migration/migration-universal-dashboard";
import { createAuthServerComponentClient } from "../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../lib/auth/authorization";
import {
  getOrganizationsForUser,
  resolveActiveOrganizationIdForUser
} from "../../../lib/organization/server";
import { getMigrationJobsForOrganization } from "../../../lib/migration/server";
import { getCustomerSwitchingSnapshot } from "../../../lib/migration/switching";
import { buildMigrationUniversalDashboardViewModel } from "../../../lib/migration/ux016-view-model";
import {
  formatHumanGreetingName,
  formatHumanOrganizationName
} from "../../../lib/format/display-labels";
import { getUserDisplayNameForGreeting } from "../../../lib/profile/server-fetch";

/** STD-001 compliance remediation — Migration ops on Universal Dashboard Framework. */
export default async function MigrationPage() {
  const supabase = await createAuthServerComponentClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const organizationId = await resolveActiveOrganizationIdForUser(user.id);
  if (!organizationId) redirect("/setup");

  const authorization = await resolveAuthorizationContext(user, organizationId);
  if (!evaluatePermission(authorization, "migration:read")) redirect("/unauthorized");

  const [jobs, switching, organizations, profileDisplayName] = await Promise.all([
    getMigrationJobsForOrganization(organizationId, supabase),
    getCustomerSwitchingSnapshot(organizationId, supabase),
    getOrganizationsForUser(user.id),
    getUserDisplayNameForGreeting(user.id, user.email ?? null)
  ]);

  const organizationName = organizations.find((organization) => organization.id === organizationId)?.name ?? null;
  const canCreate = evaluatePermission(authorization, "migration:create");
  const canUpdate = evaluatePermission(authorization, "migration:update");

  const model = buildMigrationUniversalDashboardViewModel({
    jobs,
    metrics: switching.metrics,
    canCreate,
    userName: formatHumanGreetingName(profileDisplayName, user.email ?? null),
    organizationName: organizationName ? formatHumanOrganizationName(organizationName) : null
  });

  return (
    <AppPage wide breadcrumbs={[{ href: "/dashboard", label: "Dashboard" }, { label: "Migration Center" }]}>
      <MigrationUniversalDashboard
        model={model}
        switching={switching}
        jobs={jobs}
        metrics={switching.metrics}
        canCreate={canCreate}
        canUpdate={canUpdate}
      />
    </AppPage>
  );
}
