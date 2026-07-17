import { redirect } from "next/navigation";
import { CreatePageLayout } from "../../../../components/presentation/create-page-layout";
import { CreateFormContextRail } from "../../../../components/presentation/create-form-context-rail";
import { TenantForm } from "../../../../components/tenant/tenant-form";
import { WorkflowSuccessPanel } from "../../../../components/presentation/workflow-success-panel";
import { createAuthServerComponentClient } from "../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../lib/organization/server";
import { getPropertiesForOrganization } from "../../../../lib/property/server";
import { getUnitsForOrganization } from "../../../../lib/unit/server";
import { buildUnitCreatedOnTenantFormSuccess } from "../../../../lib/workflow/shared/success-configs";

export default async function NewTenantPage({
  searchParams
}: {
  searchParams: Promise<{ propertyId?: string; unitId?: string; from?: string }>;
}) {
  const { propertyId, unitId, from } = await searchParams;
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
  if (!evaluatePermission(authorization, "tenant:create")) {
    redirect("/unauthorized");
  }

  const [properties, units] = await Promise.all([
    getPropertiesForOrganization(organizationId),
    getUnitsForOrganization(organizationId)
  ]);
  const propertyOptions = properties.map((property) => ({ id: property.id, name: property.name }));
  const unitOptions = units.map((unit) => ({
    id: unit.id,
    propertyId: unit.propertyId,
    unitNumber: unit.unitNumber,
    unitLabel: unit.unitLabel
  }));

  const selectedProperty = propertyId ? properties.find((property) => property.id === propertyId) : null;
  const selectedUnit = unitId ? units.find((unit) => unit.id === unitId) : null;
  const unitCreatedSuccess = from === "unit-created" ? buildUnitCreatedOnTenantFormSuccess() : null;

  const relatedLinks = [
    ...(selectedProperty ? [{ label: selectedProperty.name, href: `/properties/${selectedProperty.id}` }] : []),
    ...(selectedUnit ? [{ label: `Unit ${selectedUnit.unitNumber}`, href: `/units/${selectedUnit.id}` }] : []),
    { label: "Tenants list", href: "/tenants" }
  ];

  return (
    <CreatePageLayout
      breadcrumbs={[
        { href: "/dashboard", label: "Dashboard" },
        { href: "/tenants", label: "Tenants" },
        { label: "Create" }
      ]}
      banner={
        unitCreatedSuccess ? (
          <WorkflowSuccessPanel {...unitCreatedSuccess} primaryAction={unitCreatedSuccess.primaryAction} />
        ) : null
      }
      form={
        <div id="tenant-form">
          <TenantForm
            mode="create"
            properties={propertyOptions}
            units={unitOptions}
            initialPropertyId={propertyId ?? null}
            initialUnitId={unitId ?? null}
          />
        </div>
      }
      contextRail={
        <CreateFormContextRail
          module="tenant"
          setupSteps={[
            { id: "property", label: "Property ready", complete: Boolean(propertyId) },
            { id: "units", label: "Unit selected", complete: Boolean(unitId) },
            { id: "tenant", label: "Create tenant", complete: false },
            { id: "lease", label: "Create lease", complete: false }
          ]}
          relatedLinks={relatedLinks}
        />
      }
    />
  );
}
