import { redirect } from "next/navigation";
import { Breadcrumbs } from "../../../../../components/shell/breadcrumbs";
import { TenantForm } from "../../../../../components/tenant/tenant-form";
import { createAuthServerComponentClient } from "../../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../../lib/organization/server";
import { getTenantForOrganization } from "../../../../../lib/tenant/server";

export default async function EditTenantPage({ params }: { params: Promise<{ tenantId: string }> }) {
  const { tenantId } = await params;
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
  if (!evaluatePermission(authorization, "tenant:update")) {
    redirect("/unauthorized");
  }

  const tenant = await getTenantForOrganization(organizationId, tenantId);
  if (!tenant) {
    redirect("/tenants");
  }

  return (
    <main className="mpa-page flex-1 space-y-5">
      <Breadcrumbs
        items={[
          { href: "/dashboard", label: "Dashboard" },
          { href: "/tenants", label: "Tenants" },
          { href: `/tenants/${tenant.id}`, label: `${tenant.firstName} ${tenant.lastName}` },
          { label: "Edit" }
        ]}
      />
      <TenantForm mode="edit" tenant={tenant} />
    </main>
  );
}
