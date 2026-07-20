import Link from "next/link";
import { redirect } from "next/navigation";
import { Card } from "@mpa/ui";
import { AppPage } from "../../../../../components/presentation/app-page";
import { createAuthServerComponentClient } from "../../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../../lib/organization/server";
import { getWorkOrdersForOrganization } from "../../../../../lib/maintenance/server";
import { toMaintenanceStatusLabel } from "../../../../../lib/maintenance/contracts";
import { resolveLinkedTenantForUser } from "../../../../../lib/resident/resolve-tenant";

export default async function TenantMaintenancePage() {
  const supabase = await createAuthServerComponentClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const organizationId = await resolveActiveOrganizationIdForUser(user.id);
  if (!organizationId) redirect("/portal/tenant");

  const authorization = await resolveAuthorizationContext(user, organizationId);
  if (!evaluatePermission(authorization, "maintenance:read")) redirect("/unauthorized");

  const tenant = await resolveLinkedTenantForUser(organizationId, user.id, user.email, supabase);
  const items = tenant
    ? await getWorkOrdersForOrganization(organizationId, { tenantId: tenant.id, limit: 50 }, supabase)
    : [];
  const canCreate = evaluatePermission(authorization, "maintenance:create");

  return (
    <AppPage
      breadcrumbs={[
        { href: "/portal/tenant", label: "Tenant home" },
        { label: "Maintenance" }
      ]}
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-[var(--mpa-color-text-primary)]">Maintenance</h1>
            <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
              Track requests for your home and submit new issues.
            </p>
          </div>
          {canCreate ? (
            <Link
              href="/portal/tenant/maintenance/new"
              className="inline-flex h-9 items-center rounded-[var(--mpa-radius-md)] bg-[var(--mpa-color-brand-primary)] px-4 text-sm font-medium text-[var(--mpa-color-text-inverse)]"
            >
              New request
            </Link>
          ) : null}
        </div>

        {!tenant ? (
          <Card>
            <p className="text-sm text-[var(--mpa-color-text-secondary)]">
              No resident profile is linked to this account yet. Contact your property manager.
            </p>
          </Card>
        ) : items.length === 0 ? (
          <Card>
            <p className="text-sm text-[var(--mpa-color-text-secondary)]">No maintenance requests yet.</p>
            {canCreate ? (
              <div className="mt-3">
                <Link
                  href="/portal/tenant/maintenance/new"
                  className="text-sm font-medium text-[var(--mpa-color-brand-primary)] underline"
                >
                  Submit your first request
                </Link>
              </div>
            ) : null}
          </Card>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <Link
                key={item.id}
                href={`/portal/tenant/maintenance/${item.id}`}
                className="block rounded-lg border border-[var(--mpa-color-border-default)] p-4 hover:bg-[var(--mpa-color-bg-surface-muted)]"
              >
                <p className="text-sm font-medium text-[var(--mpa-color-text-primary)]">{item.title}</p>
                <p className="mt-1 text-xs text-[var(--mpa-color-text-secondary)]">
                  {item.workOrderNumber} · {toMaintenanceStatusLabel(item.status)}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppPage>
  );
}
