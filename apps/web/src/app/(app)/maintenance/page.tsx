import { redirect } from "next/navigation";
import { Card } from "@mpa/ui";
import { Breadcrumbs } from "../../../components/shell/breadcrumbs";
import { WorkOrdersTable } from "../../../components/maintenance/work-orders-table";
import { createAuthServerComponentClient } from "../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../lib/organization/server";
import { getWorkOrdersForOrganization } from "../../../lib/maintenance/server";

export default async function MaintenancePage() {
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
      <main className="mpa-page flex-1 space-y-5">
        <Breadcrumbs items={[{ href: "/dashboard", label: "Dashboard" }, { label: "Maintenance" }]} />
        <Card>
          <h1 className="text-xl font-semibold text-[var(--mpa-color-text-primary)]">No active organization</h1>
          <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
            Select or create an organization before managing maintenance.
          </p>
        </Card>
      </main>
    );
  }

  const authorization = await resolveAuthorizationContext(user, organizationId);
  if (!evaluatePermission(authorization, "maintenance:read")) {
    redirect("/unauthorized");
  }

  const items = await getWorkOrdersForOrganization(organizationId, { status: "all" }, supabase);
  const permissions = {
    canCreate: evaluatePermission(authorization, "maintenance:create"),
    canUpdate: evaluatePermission(authorization, "maintenance:update"),
    canAssign: evaluatePermission(authorization, "maintenance:assign"),
    canArchive: evaluatePermission(authorization, "maintenance:archive"),
    canDelete: evaluatePermission(authorization, "maintenance:delete")
  };

  return (
    <main className="mpa-page flex-1 space-y-5">
      <Breadcrumbs items={[{ href: "/dashboard", label: "Dashboard" }, { label: "Maintenance" }]} />
      <WorkOrdersTable initialItems={items} permissions={permissions} />
    </main>
  );
}
