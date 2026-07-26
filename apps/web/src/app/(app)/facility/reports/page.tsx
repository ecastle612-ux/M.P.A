import { redirect } from "next/navigation";
import { Card } from "@mpa/ui";
import { AppPage } from "../../../../components/presentation/app-page";
import { FacilityReportsPanel } from "../../../../components/facility/facility-reports-panel";
import { createAuthServerComponentClient } from "../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../lib/organization/server";
import { getPropertiesForOrganization } from "../../../../lib/property/server";

export default async function FacilityReportsPage() {
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
          { label: "Reports" }
        ]}
      >
        <Card>
          <h1 className="text-xl font-semibold">No active organization</h1>
        </Card>
      </AppPage>
    );
  }

  const authorization = await resolveAuthorizationContext(user, organizationId);
  if (!evaluatePermission(authorization, "facility:report:read")) {
    redirect("/unauthorized");
  }

  const properties = await getPropertiesForOrganization(organizationId, supabase, { limit: 200 });

  return (
    <AppPage
      wide
      breadcrumbs={[
        { href: "/dashboard", label: "Dashboard" },
        { href: "/facility", label: "Facility" },
        { label: "Reports" }
      ]}
    >
      <FacilityReportsPanel
        properties={properties.map((property) => ({ id: property.id, name: property.name }))}
      />
    </AppPage>
  );
}
