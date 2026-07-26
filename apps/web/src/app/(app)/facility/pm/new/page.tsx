import { redirect } from "next/navigation";
import { Card } from "@mpa/ui";
import { AppPage } from "../../../../../components/presentation/app-page";
import { PmScheduleCreateForm } from "../../../../../components/facility/pm-schedule-create-form";
import { createAuthServerComponentClient } from "../../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../../lib/organization/server";
import { getPropertiesForOrganization } from "../../../../../lib/property/server";

export default async function FacilityPmNewPage() {
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
          { href: "/facility/pm", label: "Preventive" },
          { label: "New" }
        ]}
      >
        <Card>
          <h1 className="text-xl font-semibold text-[var(--mpa-color-text-primary)]">No active organization</h1>
        </Card>
      </AppPage>
    );
  }

  const authorization = await resolveAuthorizationContext(user, organizationId);
  if (!evaluatePermission(authorization, "facility:pm:write")) {
    redirect("/unauthorized");
  }

  const properties = await getPropertiesForOrganization(organizationId, supabase, { limit: 200 });

  return (
    <AppPage
      wide
      breadcrumbs={[
        { href: "/facility/pm", label: "Preventive" },
        { label: "New" }
      ]}
    >
      <PmScheduleCreateForm
        properties={properties.map((property) => ({ id: property.id, name: property.name }))}
      />
    </AppPage>
  );
}
