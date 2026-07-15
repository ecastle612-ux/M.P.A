import { redirect } from "next/navigation";
import { Breadcrumbs } from "../../../../components/shell/breadcrumbs";
import { LeaseForm } from "../../../../components/lease/lease-form";
import { createAuthServerComponentClient } from "../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../lib/organization/server";
import { getPropertiesForOrganization } from "../../../../lib/property/server";
import { getUnitsForOrganization } from "../../../../lib/unit/server";
import { getTenantsForOrganization } from "../../../../lib/tenant/server";

export default async function NewLeasePage({
  searchParams
}: {
  searchParams: Promise<{ propertyId?: string; unitId?: string; tenantId?: string }>;
}) {
  const { propertyId, unitId, tenantId } = await searchParams;
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
  if (!evaluatePermission(authorization, "lease:create")) {
    redirect("/unauthorized");
  }

  const [properties, units, tenants] = await Promise.all([
    getPropertiesForOrganization(organizationId),
    getUnitsForOrganization(organizationId),
    getTenantsForOrganization(organizationId)
  ]);

  return (
    <main className="mpa-page flex-1 space-y-5">
      <Breadcrumbs
        items={[
          { href: "/dashboard", label: "Dashboard" },
          { href: "/leases", label: "Leases" },
          { label: "Create" }
        ]}
      />
      <LeaseForm
        mode="create"
        properties={properties.map((property) => ({ id: property.id, name: property.name }))}
        units={units.map((unit) => ({
          id: unit.id,
          propertyId: unit.propertyId,
          unitNumber: unit.unitNumber,
          unitLabel: unit.unitLabel
        }))}
        tenants={tenants.map((tenant) => ({
          id: tenant.id,
          propertyId: tenant.propertyId,
          unitId: tenant.unitId,
          name: tenant.preferredName || `${tenant.firstName} ${tenant.lastName}`
        }))}
        initialPropertyId={propertyId ?? null}
        initialUnitId={unitId ?? null}
        initialTenantId={tenantId ?? null}
      />
    </main>
  );
}
