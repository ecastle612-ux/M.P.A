import Link from "next/link";
import { redirect } from "next/navigation";
import { Avatar, Badge, Button, Card } from "@mpa/ui";
import { Breadcrumbs } from "../../../../components/shell/breadcrumbs";
import { createAuthServerComponentClient } from "../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../lib/organization/server";
import { toTenantStatusLabel } from "../../../../lib/tenant/contracts";
import { getTenantForOrganization } from "../../../../lib/tenant/server";

export default async function TenantDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ tenantId: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const { tenantId } = await params;
  const { from } = await searchParams;
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
  const canReadProperty = evaluatePermission(authorization, "property:read");
  const canReadUnit = evaluatePermission(authorization, "unit:read");
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
      {from === "tenant-created" ? (
        <Card className="border-[var(--mpa-color-brand-primary)] bg-[var(--mpa-color-bg-surface-muted)]">
          <p className="text-sm text-[var(--mpa-color-text-primary)]">
            Tenant saved and assignment workflow completed. Review dashboard metrics for updated occupancy visibility.
          </p>
          <div className="mt-2">
            <Link href="/dashboard">
              <Button size="sm" variant="secondary">
                Open Dashboard
              </Button>
            </Link>
          </div>
        </Card>
      ) : null}
      <section className="grid gap-4 xl:grid-cols-[2fr_1fr]">
        <Card className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <Avatar
                src={tenant.avatarUrl ?? undefined}
                fallback={`${tenant.firstName[0] ?? "T"}${tenant.lastName[0] ?? ""}`}
              />
              <div>
                <h1 className="font-display text-2xl font-semibold text-[var(--mpa-color-text-primary)]">{displayName}</h1>
                <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
                  Legal name: {tenant.firstName} {tenant.lastName}
                </p>
              </div>
            </div>
            <Badge
              variant={tenant.status === "active" ? "success" : tenant.status === "archived" ? "warning" : "info"}
            >
              {toTenantStatusLabel(tenant.status)}
            </Badge>
          </div>

          <div className="grid gap-2 text-sm text-[var(--mpa-color-text-secondary)] md:grid-cols-2">
            <p>Email: {tenant.email}</p>
            <p>Phone: {tenant.phone ?? "—"}</p>
            <p>Date of Birth: {tenant.dateOfBirth ?? "—"}</p>
            <p>Move-in Date: {tenant.moveInDate ?? "—"}</p>
            <p>Move-out Date: {tenant.moveOutDate ?? "—"}</p>
            <p>Status: {toTenantStatusLabel(tenant.status)}</p>
          </div>

          <div className="grid gap-3 rounded-md border border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-surface-muted)] p-3 md:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-wide text-[var(--mpa-color-text-muted)]">Assigned property</p>
              {tenant.propertyId && tenant.propertyName && canReadProperty ? (
                <Link href={`/properties/${tenant.propertyId}`} className="mt-1 block text-sm font-medium text-[var(--mpa-color-brand-primary)] hover:underline">
                  {tenant.propertyName}
                </Link>
              ) : (
                <p className="mt-1 text-sm font-medium text-[var(--mpa-color-text-primary)]">{tenant.propertyName ?? "Not assigned"}</p>
              )}
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-[var(--mpa-color-text-muted)]">Assigned unit</p>
              {tenant.unitId && tenant.unitNumber && canReadUnit ? (
                <Link href={`/units/${tenant.unitId}`} className="mt-1 block text-sm font-medium text-[var(--mpa-color-brand-primary)] hover:underline">
                  Unit {tenant.unitNumber}
                </Link>
              ) : (
                <p className="mt-1 text-sm font-medium text-[var(--mpa-color-text-primary)]">
                  {tenant.unitNumber ? `Unit ${tenant.unitNumber}` : "Not assigned"}
                </p>
              )}
            </div>
          </div>

          <div>
            <h2 className="text-sm font-medium text-[var(--mpa-color-text-primary)]">Emergency contact</h2>
            <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
              {tenant.emergencyContactName ?? "No emergency contact"}{" "}
              {tenant.emergencyContactPhone ? `(${tenant.emergencyContactPhone})` : ""}
            </p>
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

        <Card className="space-y-3">
          <h2 className="text-base font-semibold text-[var(--mpa-color-text-primary)]">Tenant details panel</h2>
          <p className="text-sm text-[var(--mpa-color-text-secondary)]">
            Documents workflow is intentionally a Phase 5A placeholder and will be activated during a future documents module.
          </p>
          <div className="rounded-md border border-dashed border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface-muted)] p-3">
            <p className="text-xs uppercase tracking-wide text-[var(--mpa-color-text-muted)]">Documents placeholder</p>
            <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
              {tenant.documentsPlaceholder ?? "No document notes yet."}
            </p>
          </div>
          <div className="rounded-md border border-[var(--mpa-color-border-subtle)] p-3">
            <p className="text-xs uppercase tracking-wide text-[var(--mpa-color-text-muted)]">Workflow intent</p>
            <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
              Keep assignment, move timeline, and communication context visible in one place so managers avoid context switching.
            </p>
          </div>
        </Card>
      </section>
    </main>
  );
}
