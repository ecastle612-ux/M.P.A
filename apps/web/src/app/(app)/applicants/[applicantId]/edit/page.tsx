import { redirect } from "next/navigation";
import { CreatePageLayout } from "../../../../../components/presentation/create-page-layout";
import { ApplicantForm } from "../../../../../components/applicant/applicant-form";
import { createAuthServerComponentClient } from "../../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../../lib/organization/server";
import { getApplicantForOrganization } from "../../../../../lib/applicant/server";
import { getPropertiesForOrganization } from "../../../../../lib/property/server";
import { getUnitsForOrganization } from "../../../../../lib/unit/server";

export default async function EditApplicantPage({ params }: { params: Promise<{ applicantId: string }> }) {
  const { applicantId } = await params;
  const supabase = await createAuthServerComponentClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const organizationId = await resolveActiveOrganizationIdForUser(user.id);
  if (!organizationId) redirect("/dashboard");

  const authorization = await resolveAuthorizationContext(user, organizationId);
  if (!evaluatePermission(authorization, "applicant:update")) redirect("/unauthorized");

  const [applicant, properties, units] = await Promise.all([
    getApplicantForOrganization(organizationId, applicantId),
    getPropertiesForOrganization(organizationId),
    getUnitsForOrganization(organizationId)
  ]);
  if (!applicant) redirect("/applicants");

  return (
    <CreatePageLayout
      breadcrumbs={[
        { href: "/dashboard", label: "Dashboard" },
        { href: "/applicants", label: "Applicants" },
        { href: `/applicants/${applicantId}`, label: applicant.applicationNumber },
        { label: "Edit" }
      ]}
      form={
        <ApplicantForm
          mode="edit"
          applicant={applicant}
          properties={properties.map((p) => ({ id: p.id, name: p.name }))}
          units={units.map((u) => ({ id: u.id, propertyId: u.propertyId, unitNumber: u.unitNumber, unitLabel: u.unitLabel }))}
        />
      }
      contextRail={
        <div className="rounded-[var(--mpa-radius-xl)] border border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-surface)] p-5 text-sm text-[var(--mpa-color-text-secondary)]">
          Update applicant profile details. Use status actions on the detail page to advance the workflow.
        </div>
      }
    />
  );
}
