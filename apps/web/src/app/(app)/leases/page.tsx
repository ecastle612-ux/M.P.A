import { redirect } from "next/navigation";
import { Card } from "@mpa/ui";
import { AppPage } from "../../../components/presentation/app-page";
import { LeasingUniversalDashboard } from "../../../components/lease/leasing-universal-dashboard";
import { createAuthServerComponentClient } from "../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../lib/auth/authorization";
import {
  resolveActiveOrganizationIdForUser,
  getOrganizationsForUser
} from "../../../lib/organization/server";
import { getLeasesForOrganization } from "../../../lib/lease/server";
import { buildLeasingUniversalDashboardViewModel } from "../../../lib/lease/ux016-view-model";
import {
  formatHumanGreetingName,
  formatHumanOrganizationName
} from "../../../lib/format/display-labels";
import { getUserDisplayNameForGreeting } from "../../../lib/profile/server-fetch";

/** STD-001 operational remediation — Leasing home on Universal Dashboard Framework. */
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

  const [items, organizations, profileDisplayName] = await Promise.all([
    getLeasesForOrganization(organizationId, { status: "all" }, supabase),
    getOrganizationsForUser(user.id),
    getUserDisplayNameForGreeting(user.id, user.email ?? null)
  ]);

  const permissions = {
    canCreate: evaluatePermission(authorization, "lease:create"),
    canUpdate: evaluatePermission(authorization, "lease:update"),
    canArchive: evaluatePermission(authorization, "lease:archive"),
    canDelete: evaluatePermission(authorization, "lease:delete")
  };

  const organizationName = organizations.find((organization) => organization.id === organizationId)?.name ?? null;

  const model = buildLeasingUniversalDashboardViewModel({
    items,
    canCreate: permissions.canCreate,
    userName: formatHumanGreetingName(profileDisplayName, user.email ?? null),
    organizationName: organizationName ? formatHumanOrganizationName(organizationName) : null
  });

  return (
    <AppPage wide breadcrumbs={[{ href: "/dashboard", label: "Dashboard" }, { label: "Leases" }]}>
      <LeasingUniversalDashboard
        model={model}
        initialItems={items}
        permissions={permissions}
        {...(statusParam ? { initialStatusFilter: statusParam } : {})}
      />
    </AppPage>
  );
}
