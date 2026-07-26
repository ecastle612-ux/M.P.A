import { redirect } from "next/navigation";
import { Card } from "@mpa/ui";
import { AppPage } from "../../../../components/presentation/app-page";
import { PmScheduleList } from "../../../../components/facility/pm-schedule-list";
import { createAuthServerComponentClient } from "../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../lib/organization/server";
import { listPmSchedules } from "../../../../lib/facility/pm-server";

export default async function FacilityPmPage() {
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
          { href: "/facility", label: "Facility" },
          { label: "Preventive" }
        ]}
      >
        <Card>
          <h1 className="text-xl font-semibold text-[var(--mpa-color-text-primary)]">No active organization</h1>
        </Card>
      </AppPage>
    );
  }

  const authorization = await resolveAuthorizationContext(user, organizationId);
  if (!evaluatePermission(authorization, "facility:pm:read")) {
    redirect("/unauthorized");
  }

  const items = await listPmSchedules(organizationId, {}, supabase);

  return (
    <AppPage
      wide
      breadcrumbs={[
        { href: "/facility", label: "Facility" },
        { label: "Preventive" }
      ]}
    >
      <PmScheduleList
        items={items}
        canWrite={evaluatePermission(authorization, "facility:pm:write")}
      />
    </AppPage>
  );
}
