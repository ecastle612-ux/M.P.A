import { redirect } from "next/navigation";
import { Card } from "@mpa/ui";
import { AppPage } from "../../../components/presentation/app-page";
import { LeasingCommandCenter } from "../../../components/lease/leasing-command-center";
import { createAuthServerComponentClient } from "../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../lib/organization/server";
import { getApplicantsForOrganization } from "../../../lib/applicant/server";
import { getLeasesForOrganization } from "../../../lib/lease/server";

export default async function LeasesPage({
  searchParams
}: {
  searchParams: Promise<{ status?: string; propertyId?: string }>;
}) {
  const { status: statusParam } = await searchParams;
  void statusParam;
  const supabase = await createAuthServerComponentClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const organizationId = await resolveActiveOrganizationIdForUser(user.id);
  if (!organizationId) {
    return (
      <AppPage wide breadcrumbs={[{ href: "/dashboard", label: "Dashboard" }, { label: "Leases" }]}>
        <Card>
          <h1 className="text-xl font-semibold text-[var(--mpa-color-text-primary)]">No active organization</h1>
          <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
            Select or create an organization before managing leases.
          </p>
        </Card>
      </AppPage>
    );
  }

  const authorization = await resolveAuthorizationContext(user, organizationId);
  if (!evaluatePermission(authorization, "lease:read")) {
    redirect("/unauthorized");
  }

  const canReadApplicants = evaluatePermission(authorization, "applicant:read");
  const [leases, applicants] = await Promise.all([
    getLeasesForOrganization(organizationId, { status: "all" }, supabase),
    canReadApplicants
      ? getApplicantsForOrganization(organizationId, {}, supabase)
      : Promise.resolve([])
  ]);

  const permissions = {
    canCreate: evaluatePermission(authorization, "lease:create"),
    canUpdate: evaluatePermission(authorization, "lease:update"),
    canArchive: evaluatePermission(authorization, "lease:archive"),
    canDelete: evaluatePermission(authorization, "lease:delete"),
    canCreateApplicant: evaluatePermission(authorization, "applicant:create")
  };

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("display_name")
    .eq("user_id", user.id)
    .maybeSingle();

  return (
    <AppPage wide breadcrumbs={[{ href: "/dashboard", label: "Dashboard" }, { label: "Leases" }]}>
      <LeasingCommandCenter
        leases={leases}
        applicants={applicants}
        permissions={permissions}
        userName={(profile?.display_name as string | null) ?? user.email ?? null}
      />
    </AppPage>
  );
}
