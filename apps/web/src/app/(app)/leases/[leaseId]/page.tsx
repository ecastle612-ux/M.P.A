import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge, Button, Card } from "@mpa/ui";
import { Breadcrumbs } from "../../../../components/shell/breadcrumbs";
import { LeaseDocumentsPanel } from "../../../../components/lease/lease-documents-panel";
import { LeaseLifecyclePanel } from "../../../../components/lease/lease-lifecycle-panel";
import { createAuthServerComponentClient } from "../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../lib/organization/server";
import {
  toLeaseRenewalStatusLabel,
  toLeaseStatusLabel,
  toLeaseTypeLabel
} from "../../../../lib/lease/contracts";
import { getLeaseForOrganization } from "../../../../lib/lease/server";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

export default async function LeaseDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ leaseId: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const { leaseId } = await params;
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
  if (!evaluatePermission(authorization, "lease:read")) {
    redirect("/unauthorized");
  }

  const lease = await getLeaseForOrganization(organizationId, leaseId, supabase);
  if (!lease) {
    redirect("/leases");
  }

  const canUpdate = evaluatePermission(authorization, "lease:update");
  const canEdit = canUpdate && (lease.status === "draft" || lease.status === "signed");
  const canReadProperty = evaluatePermission(authorization, "property:read");
  const canReadUnit = evaluatePermission(authorization, "unit:read");
  const canReadTenant = evaluatePermission(authorization, "tenant:read");

  return (
    <main className="mpa-page flex-1 space-y-5">
      <Breadcrumbs
        items={[
          { href: "/dashboard", label: "Dashboard" },
          { href: "/leases", label: "Leases" },
          { label: lease.leaseNumber }
        ]}
      />

      {from === "lease-created" ? (
        <Card className="border-[var(--mpa-color-brand-primary)] bg-[var(--mpa-color-bg-surface-muted)]">
          <p className="text-sm text-[var(--mpa-color-text-primary)]">
            Lease saved. Use lifecycle actions to sign and activate when ready.
          </p>
        </Card>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-[2fr_1fr]">
        <Card className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="font-display text-2xl font-semibold text-[var(--mpa-color-text-primary)]">
                {lease.leaseNumber}
              </h1>
              <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
                {toLeaseTypeLabel(lease.leaseType)} · {lease.propertyName ?? "Unknown property"}
                {lease.unitNumber ? ` · Unit ${lease.unitNumber}` : ""}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge
                variant={
                  lease.status === "active"
                    ? "success"
                    : lease.status === "expired" || lease.status === "terminated"
                      ? "warning"
                      : "info"
                }
              >
                {toLeaseStatusLabel(lease.status)}
              </Badge>
              <Badge variant={lease.renewalStatus === "renewed" ? "success" : lease.renewalStatus !== "none" ? "warning" : "info"}>
                {toLeaseRenewalStatusLabel(lease.renewalStatus)}
              </Badge>
              {lease.archivedAt ? <Badge variant="warning">Archived</Badge> : null}
            </div>
          </div>

          <div className="grid gap-2 text-sm text-[var(--mpa-color-text-secondary)] md:grid-cols-2">
            <p>
              Property:{" "}
              {canReadProperty && lease.propertyId ? (
                <Link href={`/properties/${lease.propertyId}`} className="text-[var(--mpa-color-brand-primary)] hover:underline">
                  {lease.propertyName ?? lease.propertyId}
                </Link>
              ) : (
                (lease.propertyName ?? "—")
              )}
            </p>
            <p>
              Unit:{" "}
              {canReadUnit && lease.unitId ? (
                <Link href={`/units/${lease.unitId}`} className="text-[var(--mpa-color-brand-primary)] hover:underline">
                  {lease.unitNumber ?? lease.unitId}
                </Link>
              ) : (
                (lease.unitNumber ?? "—")
              )}
            </p>
            <p>
              Tenant:{" "}
              {canReadTenant && lease.primaryTenantId ? (
                <Link
                  href={`/tenants/${lease.primaryTenantId}`}
                  className="text-[var(--mpa-color-brand-primary)] hover:underline"
                >
                  {lease.tenantName ?? lease.primaryTenantId}
                </Link>
              ) : (
                (lease.tenantName ?? "—")
              )}
            </p>
            <p>Co-tenant: {lease.coTenantPlaceholder ?? "—"}</p>
            <p>Start date: {lease.startDate}</p>
            <p>End date: {lease.endDate}</p>
            <p>Move-in: {lease.moveInDate ?? "—"}</p>
            <p>Move-out: {lease.moveOutDate ?? "—"}</p>
            <p>Rent: {formatCurrency(lease.rentAmount)}</p>
            <p>Security deposit: {formatCurrency(lease.securityDeposit)}</p>
            <p>Late fee: {lease.lateFeePlaceholder ?? "—"}</p>
            <p>Renewal option: {lease.renewalOption ? "Yes" : "No"}</p>
            <p>Notice period: {lease.noticePeriodDays !== null ? `${lease.noticePeriodDays} days` : "—"}</p>
            <p>Signed: {lease.signedAt ? new Date(lease.signedAt).toLocaleString() : "—"}</p>
            <p>Activated: {lease.activatedAt ? new Date(lease.activatedAt).toLocaleString() : "—"}</p>
          </div>

          <div>
            <h2 className="text-sm font-medium text-[var(--mpa-color-text-primary)]">Internal notes</h2>
            <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
              {lease.internalNotes ?? "No internal notes."}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {canEdit ? (
              <Link href={`/leases/${lease.id}/edit`}>
                <Button>Edit Lease</Button>
              </Link>
            ) : null}
            <Link href="/leases">
              <Button variant="ghost">Back to Leases</Button>
            </Link>
          </div>
        </Card>

        <div className="space-y-4">
          <LeaseLifecyclePanel
            leaseId={lease.id}
            status={lease.status}
            renewalStatus={lease.renewalStatus}
            events={lease.events}
            canUpdate={canUpdate}
          />
          <LeaseDocumentsPanel documents={lease.documents} />
        </div>
      </section>
    </main>
  );
}
