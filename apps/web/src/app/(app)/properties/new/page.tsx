import { redirect } from "next/navigation";
import { CreatePageLayout } from "../../../../components/presentation/create-page-layout";
import { CreateFormContextRail } from "../../../../components/presentation/create-form-context-rail";
import { PropertyForm } from "../../../../components/property/property-form";
import { createAuthServerComponentClient } from "../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../lib/organization/server";

export default async function NewPropertyPage() {
  const supabase = await createAuthServerComponentClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }
  const organizationId = await resolveActiveOrganizationIdForUser(user.id);
  if (!organizationId) {
    redirect("/setup");
  }
  const authorization = await resolveAuthorizationContext(user, organizationId);
  if (!evaluatePermission(authorization, "property:create")) {
    redirect("/unauthorized");
  }

  return (
    <CreatePageLayout
      breadcrumbs={[
        { href: "/dashboard", label: "Dashboard" },
        { href: "/properties", label: "Properties" },
        { label: "Create" }
      ]}
      form={<PropertyForm mode="create" />}
      contextRail={
        <CreateFormContextRail
          module="property"
          setupSteps={[
            { id: "property", label: "Create property", complete: false },
            { id: "units", label: "Add units", complete: false },
            { id: "tenant", label: "Create tenant", complete: false },
            { id: "lease", label: "Create lease", complete: false }
          ]}
          relatedLinks={[{ label: "Properties list", href: "/properties" }]}
        />
      }
    />
  );
}
