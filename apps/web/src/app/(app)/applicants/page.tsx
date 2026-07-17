import { redirect } from "next/navigation";
import { Card } from "@mpa/ui";
import { AppPage } from "../../../components/presentation/app-page";
import { ApplicantsTable } from "../../../components/applicant/applicants-table";
import { createAuthServerComponentClient } from "../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../lib/organization/server";
import { getApplicantsForOrganization } from "../../../lib/applicant/server";

export default async function ApplicantsPage() {
  const supabase = await createAuthServerComponentClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const organizationId = await resolveActiveOrganizationIdForUser(user.id);
  if (!organizationId) {
    return (
      <AppPage wide breadcrumbs={[{ href: "/dashboard", label: "Dashboard" }, { label: "Applicants" }]}>
        <Card>
          <h1 className="text-xl font-semibold text-[var(--mpa-color-text-primary)]">No active organization</h1>
          <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
            Select or create an organization before managing applicants.
          </p>
        </Card>
      </AppPage>
    );
  }

  const authorization = await resolveAuthorizationContext(user, organizationId);
  if (!evaluatePermission(authorization, "applicant:read")) redirect("/unauthorized");

  const items = await getApplicantsForOrganization(organizationId);
  const permissions = {
    canCreate: evaluatePermission(authorization, "applicant:create"),
    canUpdate: evaluatePermission(authorization, "applicant:update"),
    canArchive: evaluatePermission(authorization, "applicant:archive"),
    canDelete: evaluatePermission(authorization, "applicant:delete")
  };

  return (
    <AppPage wide breadcrumbs={[{ href: "/dashboard", label: "Dashboard" }, { label: "Applicants" }]}>
      <ApplicantsTable initialItems={items} permissions={permissions} />
    </AppPage>
  );
}
