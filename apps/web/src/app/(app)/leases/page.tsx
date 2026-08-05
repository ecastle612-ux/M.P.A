import { redirect } from "next/navigation";
import { Card } from "@mpa/ui";
import { AppPage } from "../../../components/presentation/app-page";
import { LeasesTable } from "../../../components/lease/leases-table";
import { RoleUniversalDashboard } from "../../../components/dashboard-framework/role-universal-dashboard";
import { createAuthServerComponentClient } from "../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser, getOrganizationsForUser } from "../../../lib/organization/server";
import { getLeasesForOrganization } from "../../../lib/lease/server";
import { getUserDisplayNameForGreeting } from "../../../lib/profile/server-fetch";
import {
  formatHumanGreetingName,
  formatHumanOrganizationName,
  getTimeGreeting
} from "../../../lib/format/display-labels";
import { primaryRoleByPriority } from "@mpa/shared";
import { buildLeasingDashboardViewModel } from "../../../lib/dashboard/ux016-role-builders";

export default async function LeasesPage({
  searchParams
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status: statusParam } = await searchParams;
  const supabase = await createAuthServerComponentClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const organizationId = await resolveActiveOrganizationIdForUser(user.id);
  if (!organizationId) {
    return (
      <AppPage wide breadcrumbs={[{ href: "/dashboard", label: "Dashboard" }, { label: "Leases" }]}>
        <Card>
          <h1 className="text-xl font-semibold text-[var(--mpa-color-text-primary)]">No active organization</h1>
          <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
            Select or create an organization before managing leases.
          </p>
        </Card>
      </AppPage>
    );
  }

  const authorization = await resolveAuthorizationContext(user, organizationId);
  if (!evaluatePermission(authorization, "lease:read")) {
    redirect("/unauthorized");
  }

  const items = await getLeasesForOrganization(organizationId, { status: "all" }, supabase);
  const permissions = {
    canCreate: evaluatePermission(authorization, "lease:create"),
    canUpdate: evaluatePermission(authorization, "lease:update"),
    canArchive: evaluatePermission(authorization, "lease:archive"),
    canDelete: evaluatePermission(authorization, "lease:delete")
  };

  const primaryRole = primaryRoleByPriority(authorization.roles);
  const showLeasingCommandCenter = primaryRole === "leasing_agent";

  let leasingModel = null;
  if (showLeasingCommandCenter) {
    const [organizations, profileDisplayName] = await Promise.all([
      getOrganizationsForUser(user.id),
      getUserDisplayNameForGreeting(user.id, user.email ?? null)
    ]);
    const organizationName = organizations.find((organization) => organization.id === organizationId)?.name ?? null;
    leasingModel = buildLeasingDashboardViewModel({
      timeGreeting: getTimeGreeting(),
      userGreetingName: formatHumanGreetingName(profileDisplayName, user.email ?? null),
      organizationName: organizationName ? formatHumanOrganizationName(organizationName) : null,
      dateLabel: new Intl.DateTimeFormat(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric"
      }).format(new Date()),
      leases: items,
      canCreateLease: permissions.canCreate,
      canCreateApplicant: evaluatePermission(authorization, "applicant:create")
    });
  }

  return (
    <AppPage wide breadcrumbs={[{ href: "/dashboard", label: "Dashboard" }, { label: "Leases" }]}>
      <div className="space-y-6">
        {leasingModel ? <RoleUniversalDashboard model={leasingModel} /> : null}
        <LeasesTable
          initialItems={items}
          permissions={permissions}
          {...(statusParam ? { initialStatusFilter: statusParam } : {})}
        />
      </div>
    </AppPage>
  );
}
