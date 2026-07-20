import { redirect } from "next/navigation";
import { AppPage } from "../../../../components/presentation/app-page";
import { MoveInWizard } from "../../../../components/resident-lifecycle/move-in-wizard";
import { createAuthServerComponentClient } from "../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../lib/organization/server";
import { getApplicantsForOrganization } from "../../../../lib/applicant/server";
import { getPropertiesForOrganization } from "../../../../lib/property/server";
import { getUnitsForOrganization } from "../../../../lib/unit/server";

export default async function ResidentMoveInPage({
  searchParams
}: {
  searchParams: Promise<{ propertyId?: string; unitId?: string; applicantId?: string }>;
}) {
  const {
    propertyId: initialPropertyId,
    unitId: initialUnitId,
    applicantId: initialApplicantId
  } = await searchParams;
  const supabase = await createAuthServerComponentClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const organizationId = await resolveActiveOrganizationIdForUser(user.id);
  if (!organizationId) redirect("/setup");

  const authorization = await resolveAuthorizationContext(user, organizationId);
  if (!evaluatePermission(authorization, "tenant:create") && !evaluatePermission(authorization, "tenant:update")) {
    redirect("/unauthorized");
  }

  const [applicants, properties, units] = await Promise.all([
    getApplicantsForOrganization(organizationId),
    getPropertiesForOrganization(organizationId),
    getUnitsForOrganization(organizationId)
  ]);

  return (
    <AppPage
      wide
      breadcrumbs={[
        { href: "/dashboard", label: "Dashboard" },
        { href: "/tenants", label: "Tenants" },
        { label: "Move in" }
      ]}
    >
      <MoveInWizard
        applicants={applicants}
        properties={properties.map((property) => ({ id: property.id, name: property.name }))}
        units={units.map((unit) => ({
          id: unit.id,
          propertyId: unit.propertyId,
          unitNumber: unit.unitNumber,
          unitLabel: unit.unitLabel,
          occupancyStatus: unit.occupancyStatus,
          rentAmount: unit.rentAmount,
          depositAmount: unit.depositAmount
        }))}
        canOverrideOccupied={evaluatePermission(authorization, "lease:update")}
        {...(initialPropertyId ? { initialPropertyId } : {})}
        {...(initialUnitId ? { initialUnitId } : {})}
        {...(initialApplicantId ? { initialApplicantId } : {})}
      />
    </AppPage>
  );
}
