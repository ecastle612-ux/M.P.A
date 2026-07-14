import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge, Button, Card } from "@mpa/ui";
import { Breadcrumbs } from "../../../../components/shell/breadcrumbs";
import { createAuthServerComponentClient } from "../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../lib/organization/server";
import { toTenantStatusLabel } from "../../../../lib/tenant/contracts";
import { getTenantForOrganization } from "../../../../lib/tenant/server";

export default async function TenantDetailPage({ params }: { params: Promise<{ tenantId: string }> }) {
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
  if (!evaluatePermission(authorization, "tenant:read")) {
    redirect("/unauthorized");
  }

  const tenant = await getTenantForOrganization(organizationId, tenantId);
  if (!tenant) {
    redirect("/tenants");
  }

  const canUpdateTenant = evaluatePermission(authorization, "tenant:update");
  const displayName = tenant.preferredName || `${tenant.firstName} ${tenant.lastName}`;

  return (
    <main className="mpa-page flex-1 space-y-5">
      <Breadcrumbs
        items={[
          { href: "/dashboard", label: "Dashboard" },
          { href: "/tenants", label: "Tenants" },
          { label: displayName }
        ]}
      />
      <Card className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-semibold text-[var(--mpa-color-text-primary)]">{displayName}</h1>
            <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
              Legal name: {tenant.firstName} {tenant.lastName}
            </p>
          </div>
          <Badge variant={tenant.status === "active" ? "success" : tenant.status === "archived" ? "warning" : "info"}>
            {toTenantStatusLabel(tenant.status)}
          </Badge>
        </div>
        <div className="grid gap-2 text-sm text-[var(--mpa-color-text-secondary)] md:grid-cols-2">
          <p>Email: {tenant.email}</p>
          <p>Phone: {tenant.phone ?? "—"}</p>
          <p>Date of Birth: {tenant.dateOfBirth ?? "—"}</p>
          <p>Emergency Contact: {tenant.emergencyContactName ?? "—"}</p>
          <p>Emergency Phone: {tenant.emergencyContactPhone ?? "—"}</p>
          <p>Status: {toTenantStatusLabel(tenant.status)}</p>
        </div>
        <div>
          <h2 className="text-sm font-medium text-[var(--mpa-color-text-primary)]">Notes</h2>
          <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
            {tenant.notes ? tenant.notes : "No notes added."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canUpdateTenant ? (
            <Link href={`/tenants/${tenant.id}/edit`}>
              <Button>Edit Tenant</Button>
            </Link>
          ) : null}
          <Link href="/tenants">
            <Button variant="ghost">Back to Tenants</Button>
          </Link>
        </div>
      </Card>
    </main>
  );
}
