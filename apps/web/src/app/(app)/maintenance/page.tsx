import { redirect } from "next/navigation";
import { Card } from "@mpa/ui";
import { AppPage } from "../../../components/presentation/app-page";
import { MaintenanceUniversalDashboard } from "../../../components/maintenance/maintenance-universal-dashboard";
import { createAuthServerComponentClient } from "../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../lib/auth/authorization";
import {
  resolveActiveOrganizationIdForUser,
  getOrganizationsForUser
} from "../../../lib/organization/server";
import { getWorkOrdersForOrganization } from "../../../lib/maintenance/server";
import { getVendorsForOrganization } from "../../../lib/vendor/server";
import { buildMaintenanceUniversalDashboardViewModel } from "../../../lib/maintenance/ux016-view-model";
import {
  formatHumanGreetingName,
  formatHumanOrganizationName
} from "../../../lib/format/display-labels";
import { getUserDisplayNameForGreeting } from "../../../lib/profile/server-fetch";

/** STD-001 operational remediation — Maintenance home on Universal Dashboard Framework. */
export default async function MaintenancePage({
  searchParams
}: {
  searchParams: Promise<{ status?: string; priority?: string; q?: string }>;
}) {
  const { status: statusParam, priority: priorityParam, q: queryParam } = await searchParams;
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
      <AppPage wide breadcrumbs={[{ href: "/dashboard", label: "Dashboard" }, { label: "Maintenance" }]}>
        <Card>
          <h1 className="text-xl font-semibold text-[var(--mpa-color-text-primary)]">No active organization</h1>
          <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
            Select or create an organization before managing maintenance.
          </p>
        </Card>
      </AppPage>
    );
  }

  const authorization = await resolveAuthorizationContext(user, organizationId);
  if (!evaluatePermission(authorization, "maintenance:read")) {
    redirect("/unauthorized");
  }

  const canAssignVendor = evaluatePermission(authorization, "vendor:assign");
  const [items, vendors, organizations, profileDisplayName] = await Promise.all([
    getWorkOrdersForOrganization(organizationId, { status: "all" }, supabase),
    canAssignVendor ? getVendorsForOrganization(organizationId, { status: "active" }, supabase) : Promise.resolve([]),
    getOrganizationsForUser(user.id),
    getUserDisplayNameForGreeting(user.id, user.email ?? null)
  ]);

  const permissions = {
    canCreate: evaluatePermission(authorization, "maintenance:create"),
    canUpdate: evaluatePermission(authorization, "maintenance:update"),
    canAssign: evaluatePermission(authorization, "maintenance:assign"),
    canArchive: evaluatePermission(authorization, "maintenance:archive"),
    canDelete: evaluatePermission(authorization, "maintenance:delete"),
    canAssignVendor
  };

  const organizationName = organizations.find((organization) => organization.id === organizationId)?.name ?? null;

  const model = buildMaintenanceUniversalDashboardViewModel({
    items,
    canCreate: permissions.canCreate,
    userName: formatHumanGreetingName(profileDisplayName, user.email ?? null),
    organizationName: organizationName ? formatHumanOrganizationName(organizationName) : null
  });

  return (
    <AppPage wide breadcrumbs={[{ href: "/dashboard", label: "Dashboard" }, { label: "Maintenance" }]}>
      <MaintenanceUniversalDashboard
        model={model}
        initialItems={items}
        permissions={permissions}
        vendors={vendors.map((vendor) => ({ id: vendor.id, businessName: vendor.businessName }))}
        {...(statusParam ? { initialStatusFilter: statusParam } : {})}
        {...(priorityParam ? { initialPriorityFilter: priorityParam } : {})}
        {...(queryParam ? { initialQuery: queryParam } : {})}
      />
    </AppPage>
  );
}
