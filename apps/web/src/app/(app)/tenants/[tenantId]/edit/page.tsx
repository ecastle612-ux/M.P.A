import { redirect } from "next/navigation";
import { CreatePageLayout } from "../../../../../components/presentation/create-page-layout";
import { CreateFormContextRail } from "../../../../../components/presentation/create-form-context-rail";
import { TenantForm } from "../../../../../components/tenant/tenant-form";
import { createAuthServerComponentClient } from "../../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../../lib/organization/server";
import { getPropertiesForOrganization } from "../../../../../lib/property/server";
import { getTenantForOrganization } from "../../../../../lib/tenant/server";
import { getUnitsForOrganization } from "../../../../../lib/unit/server";

export default async function EditTenantPage({ params }: { params: Promise<{ tenantId: string }> }) {
  const { tenantId } = await params;
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
  if (!evaluatePermission(authorization, "tenant:update")) {
    redirect("/unauthorized");
  }

  const [tenant, properties, units] = await Promise.all([
    getTenantForOrganization(organizationId, tenantId),
    getPropertiesForOrganization(organizationId),
    getUnitsForOrganization(organizationId)
  ]);
  if (!tenant) {
    redirect("/tenants");
  }
  const displayName = tenant.preferredName || `${tenant.firstName} ${tenant.lastName}`;
  const propertyOptions = properties.map((property) => ({ id: property.id, name: property.name }));
  const unitOptions = units.map((unit) => ({
    id: unit.id,
    propertyId: unit.propertyId,
    unitNumber: unit.unitNumber,
    unitLabel: unit.unitLabel
  }));

  return (
    <CreatePageLayout
      breadcrumbs={[
        { href: "/dashboard", label: "Dashboard" },
        { href: "/tenants", label: "Tenants" },
        { href: `/tenants/${tenant.id}`, label: displayName },
        { label: "Edit" }
      ]}
      form={<TenantForm mode="edit" tenant={tenant} properties={propertyOptions} units={unitOptions} />}
      contextRail={
        <CreateFormContextRail
          module="tenant"
          relatedLinks={[
            { label: displayName, href: `/tenants/${tenant.id}` },
            ...(tenant.propertyId ? [{ label: "Property", href: `/properties/${tenant.propertyId}` }] : []),
            ...(tenant.unitId ? [{ label: `Unit ${tenant.unitNumber}`, href: `/units/${tenant.unitId}` }] : [])
          ]}
        />
      }
    />
  );
}
