import { redirect } from "next/navigation";
import { Breadcrumbs } from "../../../../../components/shell/breadcrumbs";
import { WorkOrderForm } from "../../../../../components/maintenance/work-order-form";
import { createAuthServerComponentClient } from "../../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../../lib/organization/server";
import { getPropertiesForOrganization } from "../../../../../lib/property/server";
import { getUnitsForOrganization } from "../../../../../lib/unit/server";
import { getTenantsForOrganization } from "../../../../../lib/tenant/server";
import { getAssigneesForOrganization, getWorkOrderForOrganization } from "../../../../../lib/maintenance/server";

export default async function EditWorkOrderPage({ params }: { params: Promise<{ workOrderId: string }> }) {
  const { workOrderId } = await params;
  const supabase = await createAuthServerComponentClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const organizationId = await resolveActiveOrganizationIdForUser(user.id);
  if (!organizationId) {
    redirect("/dashboard");
  }

  const authorization = await resolveAuthorizationContext(user, organizationId);
  const canUpdate = evaluatePermission(authorization, "maintenance:update");
  const canAssign = evaluatePermission(authorization, "maintenance:assign");
  if (!canUpdate && !canAssign) {
    redirect("/unauthorized");
  }

  const workOrder = await getWorkOrderForOrganization(organizationId, workOrderId, supabase);
  if (!workOrder) {
    redirect("/maintenance");
  }

  const [properties, units, tenants, assignees] = await Promise.all([
    getPropertiesForOrganization(organizationId),
    getUnitsForOrganization(organizationId),
    getTenantsForOrganization(organizationId),
    getAssigneesForOrganization(organizationId, supabase)
  ]);

  return (
    <main className="mpa-page flex-1 space-y-5">
      <Breadcrumbs
        items={[
          { href: "/dashboard", label: "Dashboard" },
          { href: "/maintenance", label: "Maintenance" },
          { href: `/maintenance/${workOrderId}`, label: workOrder.workOrderNumber },
          { label: "Edit" }
        ]}
      />
      <WorkOrderForm
        mode="edit"
        workOrder={workOrder}
        properties={properties.map((property) => ({ id: property.id, name: property.name }))}
        units={units.map((unit) => ({ id: unit.id, propertyId: unit.propertyId, unitNumber: unit.unitNumber }))}
        tenants={tenants.map((tenant) => ({
          id: tenant.id,
          propertyId: tenant.propertyId,
          unitId: tenant.unitId,
          name: tenant.preferredName || `${tenant.firstName} ${tenant.lastName}`
        }))}
        assignees={assignees}
      />
    </main>
  );
}
