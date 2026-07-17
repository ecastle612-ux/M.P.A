import { redirect } from "next/navigation";
import { CreatePageLayout } from "../../../../components/presentation/create-page-layout";
import { CreateFormContextRail } from "../../../../components/presentation/create-form-context-rail";
import { VendorForm } from "../../../../components/vendor/vendor-form";
import { createAuthServerComponentClient } from "../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../lib/organization/server";

export default async function NewVendorPage() {
  const supabase = await createAuthServerComponentClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const organizationId = await resolveActiveOrganizationIdForUser(user.id);
  if (!organizationId) {
    redirect("/dashboard");
  }

  const authorization = await resolveAuthorizationContext(user, organizationId);
  if (!evaluatePermission(authorization, "vendor:create")) {
    redirect("/unauthorized");
  }

  return (
    <CreatePageLayout
      breadcrumbs={[
        { href: "/dashboard", label: "Dashboard" },
        { href: "/vendors", label: "Vendors" },
        { label: "Create" }
      ]}
      form={<VendorForm mode="create" />}
      contextRail={
        <CreateFormContextRail
          module="vendor"
          relatedLinks={[{ label: "Vendors list", href: "/vendors" }, { label: "Maintenance", href: "/maintenance" }]}
        />
      }
    />
  );
}
