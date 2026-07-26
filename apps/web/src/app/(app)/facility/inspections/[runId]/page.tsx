import { redirect } from "next/navigation";
import { AppPage } from "../../../../../components/presentation/app-page";
import { InspectionRunPanel } from "../../../../../components/facility/inspection-run-panel";
import { createAuthServerComponentClient } from "../../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../../lib/organization/server";
import { getInspectionRun } from "../../../../../lib/facility/inspection-server";

export default async function FacilityInspectionDetailPage({
  params
}: {
  params: Promise<{ runId: string }>;
}) {
  const { runId } = await params;
  const supabase = await createAuthServerComponentClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const organizationId = await resolveActiveOrganizationIdForUser(user.id);
  if (!organizationId) redirect("/dashboard");

  const authorization = await resolveAuthorizationContext(user, organizationId);
  if (!evaluatePermission(authorization, "facility:inspection:read")) {
    redirect("/unauthorized");
  }

  const run = await getInspectionRun(organizationId, runId, supabase);
  if (!run) redirect("/facility/inspections");

  return (
    <AppPage
      wide
      breadcrumbs={[
        { href: "/facility", label: "Facility" },
        { href: "/facility/inspections", label: "Inspections" },
        { label: run.title }
      ]}
    >
      <InspectionRunPanel
        initialRun={run}
        canWrite={evaluatePermission(authorization, "facility:inspection:write")}
      />
    </AppPage>
  );
}
