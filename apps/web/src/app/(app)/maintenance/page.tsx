import { redirect } from "next/navigation";
import { Card } from "@mpa/ui";
import { AppPage } from "../../../components/presentation/app-page";
import { WorkOrdersTable } from "../../../components/maintenance/work-orders-table";
import { createAuthServerComponentClient } from "../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../lib/organization/server";
import { getWorkOrdersForOrganization } from "../../../lib/maintenance/server";
import { getVendorsForOrganization } from "../../../lib/vendor/server";

export default async function MaintenancePage({
  searchParams
}: {
  searchParams: Promise<{ status?: string; priority?: string }>;
}) {
  const { status: statusParam, priority: priorityParam } = await searchParams;
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
  const [items, vendors] = await Promise.all([
    getWorkOrdersForOrganization(organizationId, { status: "all" }, supabase),
    canAssignVendor ? getVendorsForOrganization(organizationId, { status: "active" }, supabase) : Promise.resolve([])
  ]);

  const permissions = {
    canCreate: evaluatePermission(authorization, "maintenance:create"),
    canUpdate: evaluatePermission(authorization, "maintenance:update"),
    canAssign: evaluatePermission(authorization, "maintenance:assign"),
    canArchive: evaluatePermission(authorization, "maintenance:archive"),
    canDelete: evaluatePermission(authorization, "maintenance:delete"),
    canAssignVendor
  };

  return (
    <AppPage wide breadcrumbs={[{ href: "/dashboard", label: "Dashboard" }, { label: "Maintenance" }]}>
      <WorkOrdersTable
        initialItems={items}
        permissions={permissions}
        vendors={vendors.map((vendor) => ({ id: vendor.id, businessName: vendor.businessName }))}
        {...(statusParam ? { initialStatusFilter: statusParam } : {})}
        {...(priorityParam ? { initialPriorityFilter: priorityParam } : {})}
      />
    </AppPage>
  );
}
