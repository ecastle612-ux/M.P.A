import { redirect } from "next/navigation";
import { CreatePageLayout } from "../../../../components/presentation/create-page-layout";
import { CreateFormContextRail } from "../../../../components/presentation/create-form-context-rail";
import { ApplicantForm } from "../../../../components/applicant/applicant-form";
import { createAuthServerComponentClient } from "../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../lib/organization/server";
import { getPropertiesForOrganization } from "../../../../lib/property/server";
import { getUnitsForOrganization } from "../../../../lib/unit/server";

export default async function NewApplicantPage({
  searchParams
}: {
  searchParams: Promise<{ propertyId?: string; unitId?: string }>;
}) {
  const { propertyId, unitId } = await searchParams;
  const supabase = await createAuthServerComponentClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const organizationId = await resolveActiveOrganizationIdForUser(user.id);
  if (!organizationId) redirect("/dashboard");

  const authorization = await resolveAuthorizationContext(user, organizationId);
  if (!evaluatePermission(authorization, "applicant:create")) redirect("/unauthorized");

  const [properties, units] = await Promise.all([
    getPropertiesForOrganization(organizationId),
    getUnitsForOrganization(organizationId)
  ]);

  return (
    <CreatePageLayout
      breadcrumbs={[
        { href: "/dashboard", label: "Dashboard" },
        { href: "/applicants", label: "Applicants" },
        { label: "New application" }
      ]}
      form={
        <ApplicantForm
          mode="create"
          properties={properties.map((p) => ({ id: p.id, name: p.name }))}
          units={units.map((u) => ({ id: u.id, propertyId: u.propertyId, unitNumber: u.unitNumber, unitLabel: u.unitLabel }))}
          initialPropertyId={propertyId ?? null}
          initialUnitId={unitId ?? null}
        />
      }
      contextRail={
        <CreateFormContextRail
          module="tenant"
          setupSteps={[
            { id: "property", label: "Property selected", complete: Boolean(propertyId) },
            { id: "unit", label: "Unit selected", complete: Boolean(unitId) },
            { id: "application", label: "Create application", complete: false },
            { id: "screening", label: "Screen & approve", complete: false },
            { id: "resident", label: "Convert to resident", complete: false }
          ]}
          relatedLinks={[{ label: "Applicants list", href: "/applicants" }]}
        />
      }
    />
  );
}
