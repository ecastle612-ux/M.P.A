import { redirect } from "next/navigation";
import { Breadcrumbs } from "../../../../components/shell/breadcrumbs";
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
    <main className="mpa-page flex-1 space-y-5">
      <Breadcrumbs
        items={[
          { href: "/dashboard", label: "Dashboard" },
          { href: "/vendors", label: "Vendors" },
          { label: "Create" }
        ]}
      />
      <VendorForm mode="create" />
    </main>
  );
}
