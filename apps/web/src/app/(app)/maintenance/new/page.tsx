import { redirect } from "next/navigation";
import { CreatePageLayout } from "../../../../components/presentation/create-page-layout";
import { CreateFormContextRail } from "../../../../components/presentation/create-form-context-rail";
import { WorkOrderForm } from "../../../../components/maintenance/work-order-form";
import { OperationalMemoryHint } from "../../../../components/workflow/operational-memory-hint";
import { createAuthServerComponentClient } from "../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../lib/organization/server";
import { getPropertiesForOrganization } from "../../../../lib/property/server";
import { getUnitsForOrganization } from "../../../../lib/unit/server";
import { getTenantsForOrganization } from "../../../../lib/tenant/server";
import { getAssigneesForOrganization, getWorkOrdersForOrganization } from "../../../../lib/maintenance/server";

export default async function NewWorkOrderPage({
  searchParams
}: {
  searchParams: Promise<{ propertyId?: string; unitId?: string; tenantId?: string; title?: string }>;
}) {
  const { propertyId, unitId, tenantId, title } = await searchParams;
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
  if (!evaluatePermission(authorization, "maintenance:create")) {
    redirect("/unauthorized");
  }

  const [properties, units, tenants, assignees, recentOrders] = await Promise.all([
    getPropertiesForOrganization(organizationId),
    getUnitsForOrganization(organizationId),
    getTenantsForOrganization(organizationId),
    getAssigneesForOrganization(organizationId, supabase),
    propertyId
      ? getWorkOrdersForOrganization(
          organizationId,
          {
            propertyId,
            ...(unitId ? { unitId } : {}),
            limit: 5,
            sortBy: "updated_at"
          },
          supabase
        )
      : Promise.resolve([])
  ]);

  const selectedProperty = propertyId ? properties.find((property) => property.id === propertyId) : null;
  const memoryItems = recentOrders.map((order) => ({
    id: order.id,
    label: order.workOrderNumber,
    href: `/maintenance/${order.id}`,
    meta: `${order.title}${order.unitNumber ? ` · Unit ${order.unitNumber}` : ""}`
  }));

  return (
    <CreatePageLayout
      breadcrumbs={[
        { href: "/dashboard", label: "Dashboard" },
        { href: "/maintenance", label: "Maintenance" },
        { label: "Create" }
      ]}
      form={
        <div className="space-y-4">
          <OperationalMemoryHint
            title="Previous repairs"
            description="Recent work at this property/unit — reuse vendor and category context when relevant."
            items={memoryItems}
          />
          <WorkOrderForm
            mode="create"
            organizationId={organizationId}
            properties={properties.map((property) => ({ id: property.id, name: property.name }))}
            units={units.map((unit) => ({ id: unit.id, propertyId: unit.propertyId, unitNumber: unit.unitNumber }))}
            tenants={tenants.map((tenant) => ({
              id: tenant.id,
              propertyId: tenant.propertyId,
              unitId: tenant.unitId,
              name: tenant.preferredName || `${tenant.firstName} ${tenant.lastName}`
            }))}
            assignees={assignees}
            initialPropertyId={propertyId ?? null}
            initialUnitId={unitId ?? null}
            initialTenantId={tenantId ?? null}
            initialTitle={title ?? null}
          />
        </div>
      }
      contextRail={
        <CreateFormContextRail
          module="maintenance"
          setupSteps={[
            { id: "property", label: "Property selected", complete: Boolean(propertyId) },
            { id: "units", label: "Unit linked", complete: Boolean(unitId) },
            { id: "tenant", label: "Tenant linked", complete: Boolean(tenantId) },
            { id: "lease", label: "Submit work order", complete: false }
          ]}
          relatedLinks={[
            ...(selectedProperty
              ? [{ label: selectedProperty.name, href: `/properties/${selectedProperty.id}` }]
              : []),
            { label: "Maintenance queue", href: "/maintenance" }
          ]}
        />
      }
    />
  );
}
