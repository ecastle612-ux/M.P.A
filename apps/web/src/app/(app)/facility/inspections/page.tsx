import { redirect } from "next/navigation";
import { Card } from "@mpa/ui";
import { AppPage } from "../../../../components/presentation/app-page";
import { InspectionList } from "../../../../components/facility/inspection-list";
import { createAuthServerComponentClient } from "../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../lib/organization/server";
import { listInspectionRuns } from "../../../../lib/facility/inspection-server";
import {
  isInspectionStatus,
  type InspectionStatus
} from "../../../../lib/facility/inspection-contracts";

export default async function FacilityInspectionsPage({
  searchParams
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status: statusParam } = await searchParams;
  const supabase = await createAuthServerComponentClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const organizationId = await resolveActiveOrganizationIdForUser(user.id);
  if (!organizationId) {
    return (
      <AppPage
        wide
        breadcrumbs={[
          { href: "/dashboard", label: "Dashboard" },
          { href: "/facility", label: "Facility" },
          { label: "Inspections" }
        ]}
      >
        <Card>
          <h1 className="text-xl font-semibold text-[var(--mpa-color-text-primary)]">
            No active organization
          </h1>
        </Card>
      </AppPage>
    );
  }

  const authorization = await resolveAuthorizationContext(user, organizationId);
  if (!evaluatePermission(authorization, "facility:inspection:read")) {
    redirect("/unauthorized");
  }

  const status: InspectionStatus | undefined =
    statusParam && isInspectionStatus(statusParam) ? statusParam : undefined;

  const items = await listInspectionRuns(
    organizationId,
    { ...(status ? { status } : {}), limit: 100 },
    supabase
  );

  return (
    <AppPage
      wide
      breadcrumbs={[
        { href: "/dashboard", label: "Dashboard" },
        { href: "/facility", label: "Facility" },
        { label: "Inspections" }
      ]}
    >
      <InspectionList
        items={items}
        canWrite={evaluatePermission(authorization, "facility:inspection:write")}
        {...(statusParam ? { statusFilter: statusParam } : {})}
      />
    </AppPage>
  );
}
