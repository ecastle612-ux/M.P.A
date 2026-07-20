import { redirect } from "next/navigation";
import { AppPage } from "../../../../components/presentation/app-page";
import { TransferUnitWizard } from "../../../../components/resident-lifecycle/transfer-unit-wizard";
import { createAuthServerComponentClient } from "../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../lib/organization/server";
import { getTenantsForOrganization } from "../../../../lib/tenant/server";
import { getPropertiesForOrganization } from "../../../../lib/property/server";
import { getUnitsForOrganization } from "../../../../lib/unit/server";

export default async function ResidentTransferPage() {
  const supabase = await createAuthServerComponentClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const organizationId = await resolveActiveOrganizationIdForUser(user.id);
  if (!organizationId) redirect("/setup");

  const authorization = await resolveAuthorizationContext(user, organizationId);
  if (!evaluatePermission(authorization, "tenant:update") && !evaluatePermission(authorization, "lease:update")) {
    redirect("/unauthorized");
  }

  const [tenants, properties, units] = await Promise.all([
    getTenantsForOrganization(organizationId),
    getPropertiesForOrganization(organizationId),
    getUnitsForOrganization(organizationId)
  ]);

  return (
    <AppPage
      wide
      breadcrumbs={[
        { href: "/dashboard", label: "Dashboard" },
        { href: "/tenants", label: "Tenants" },
        { label: "Transfer unit" }
      ]}
    >
      <TransferUnitWizard
        tenants={tenants}
        properties={properties.map((property) => ({ id: property.id, name: property.name }))}
        units={units.map((unit) => ({
          id: unit.id,
          propertyId: unit.propertyId,
          unitNumber: unit.unitNumber,
          unitLabel: unit.unitLabel,
          occupancyStatus: unit.occupancyStatus
        }))}
        canOverrideOccupied={evaluatePermission(authorization, "lease:update")}
      />
    </AppPage>
  );
}
