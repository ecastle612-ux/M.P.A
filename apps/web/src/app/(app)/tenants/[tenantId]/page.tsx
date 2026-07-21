import Link from "next/link";
import { redirect } from "next/navigation";
import { Avatar, Badge, Card, DetailHero, DetailMetric } from "@mpa/ui";
import { AiPageContextBridge, buildAiPageContext } from "../../../../components/ai/ai-page-context";
import { DetailPageLayout } from "../../../../components/presentation/detail-page-layout";
import { DiscloseSection } from "../../../../components/presentation/disclose-section";
import { EntityActionToolbelt } from "../../../../components/presentation/entity-action-toolbelt";
import { EntityRelationshipChain } from "../../../../components/presentation/entity-relationship-chain";
import { TenantContextRail } from "../../../../components/presentation/context-rails/tenant-context-rail";
import { WorkflowSuccessBanner } from "../../../../components/workflow/workflow-success-banner";
import { createAuthServerComponentClient } from "../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../lib/organization/server";
import { toTenantStatusLabel } from "../../../../lib/tenant/contracts";
import { getTenantForOrganization } from "../../../../lib/tenant/server";
import { getPortfolioCounts } from "../../../../lib/workflow/server/portfolio-counts";
import { buildTenantCreatedSuccess } from "../../../../lib/workflow/shared/success-configs";

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
  const canReadFinancials = evaluatePermission(authorization, "financial:read");
  const canCreateFinancial = evaluatePermission(authorization, "financial:create");
  const canCreateMaintenance = evaluatePermission(authorization, "maintenance:create");
  const canReadCommunications = evaluatePermission(authorization, "communication:read");
  const canReadLeases = evaluatePermission(authorization, "lease:read");
  const displayName = tenant.preferredName || `${tenant.firstName} ${tenant.lastName}`;

  const portfolioCounts = from === "tenant-created" ? await getPortfolioCounts(organizationId) : null;
  const tenantSuccess =
    from === "tenant-created" && portfolioCounts
      ? buildTenantCreatedSuccess({ id: tenantId, displayName }, portfolioCounts)
      : null;

  const [
    { data: leaseRows, error: leaseError },
    { data: chargeRows, error: chargeError },
    { data: paymentRows, error: paymentError },
    { data: maintenanceRows, error: maintenanceError },
    { count: communicationsCount, error: communicationsError }
  ] = await Promise.all([
    supabase
      .from("leases")
      .select("id, lease_number, status, rent_amount, end_date")
      .eq("organization_id", organizationId)
      .eq("primary_tenant_id", tenantId)
      .is("deleted_at", null)
      .order("updated_at", { ascending: false })
      .limit(1),
    canReadFinancials
      ? supabase
          .from("rent_charges")
          .select("outstanding_balance")
          .eq("organization_id", organizationId)
          .eq("tenant_id", tenantId)
          .is("deleted_at", null)
          .gt("outstanding_balance", 0)
      : Promise.resolve({ data: [], error: null }),
    canReadFinancials
      ? supabase
          .from("payments")
          .select("id, amount, payment_date, rent_charges(charge_number)")
          .eq("organization_id", organizationId)
          .eq("tenant_id", tenantId)
          .eq("status", "completed")
          .is("deleted_at", null)
          .order("payment_date", { ascending: false })
          .limit(5)
      : Promise.resolve({ data: [], error: null }),
    supabase
      .from("maintenance_work_orders")
      .select("id, work_order_number, title, status")
      .eq("organization_id", organizationId)
      .eq("tenant_id", tenantId)
      .is("deleted_at", null)
      .not("status", "in", '("completed","cancelled")')
      .order("updated_at", { ascending: false })
      .limit(5),
    tenant.propertyId
      ? supabase
          .from("announcements")
          .select("id", { count: "exact", head: true })
          .eq("organization_id", organizationId)
          .eq("property_id", tenant.propertyId)
          .is("deleted_at", null)
      : Promise.resolve({ count: 0, error: null })
  ]);

  if (leaseError || chargeError || paymentError || maintenanceError || communicationsError) {
    throw new Error("Unable to load tenant context.");
  }

  const leaseRow = (leaseRows ?? [])[0] as
    | { id: string; lease_number: string; status: string; rent_amount: number; end_date: string }
    | undefined;
  const outstandingBalance = ((chargeRows ?? []) as Array<{ outstanding_balance: number }>).reduce(
    (sum, row) => sum + Number(row.outstanding_balance ?? 0),
    0
  );
  const recentPayments = (
    (paymentRows ?? []) as Array<{
      id: string;
      amount: number;
      payment_date: string;
      rent_charges: { charge_number: string } | null;
    }>
  ).map((row) => ({
    id: row.id,
    amount: Number(row.amount),
    paymentDate: row.payment_date,
    chargeNumber: row.rent_charges?.charge_number ?? null
  }));
  const openMaintenance = (
    (maintenanceRows ?? []) as Array<{ id: string; work_order_number: string; title: string; status: string }>
  ).map((row) => ({
    id: row.id,
    workOrderNumber: row.work_order_number,
    title: row.title,
    status: row.status
  }));

  const timeline = [
    tenant.updatedAt
      ? {
          id: "tenant-updated",
          label: "Profile updated",
          detail: toTenantStatusLabel(tenant.status),
          at: new Date(tenant.updatedAt).toLocaleString()
        }
      : null,
    leaseRow
      ? {
          id: "lease-linked",
          label: leaseRow.lease_number,
          detail: `Lease ${leaseRow.status}`,
          at: leaseRow.end_date
        }
      : null
  ].filter(Boolean) as Array<{ id: string; label: string; detail: string; at: string }>;

  const recommendedAction = !leaseRow
    ? "Create a lease to connect this tenant to rent collection."
    : outstandingBalance > 0
      ? "Follow up on outstanding balance with a payment reminder."
      : openMaintenance.length > 0
        ? "Review open maintenance requests linked to this tenant."
        : "Tenant is in good standing — consider a renewal outreach.";

  const toolbeltPrimary = [
    canReadCommunications
      ? {
          id: "message",
          label: "Message",
          href: "/communications",
          variant: "secondary" as const
        }
      : null,
    canCreateFinancial || canReadFinancials
      ? {
          id: "collect-rent",
          label: "Collect Rent",
          href: canCreateFinancial
            ? `/financials/payments/new?tenantId=${encodeURIComponent(tenantId)}`
            : `/financials/charges?tenantId=${encodeURIComponent(tenantId)}`,
          variant: "primary" as const
        }
      : null,
    canCreateMaintenance
      ? {
          id: "maintenance",
          label: "Maintenance",
          href: `/maintenance/new?tenantId=${encodeURIComponent(tenantId)}${
            tenant.propertyId ? `&propertyId=${encodeURIComponent(tenant.propertyId)}` : ""
          }${tenant.unitId ? `&unitId=${encodeURIComponent(tenant.unitId)}` : ""}`,
          variant: "secondary" as const
        }
      : null,
    canReadLeases
      ? {
          id: "lease",
          label: "Lease",
          href: leaseRow ? `/leases/${leaseRow.id}` : "/leases/new?tenantId=" + encodeURIComponent(tenantId),
          variant: "secondary" as const
        }
      : null
  ].filter(Boolean) as Array<{
    id: string;
    label: string;
    href: string;
    variant: "primary" | "secondary" | "ghost";
  }>;

  const toolbeltMore = [
    canUpdateTenant ? { id: "edit", label: "Edit resident", href: `/tenants/${tenant.id}/edit` } : null,
    { id: "back", label: "Back to residents", href: "/tenants" }
  ].filter(Boolean) as Array<{ id: string; label: string; href: string }>;

  return (
    <>
      <AiPageContextBridge
        {...buildAiPageContext({
          entityType: "resident",
          entityId: tenantId,
          entityLabel: displayName
        })}
      />
      <DetailPageLayout
      breadcrumbs={[
        { href: "/dashboard", label: "Dashboard" },
        { href: "/tenants", label: "Tenants" },
        { label: displayName }
      ]}
      banner={
        tenantSuccess ? <WorkflowSuccessBanner dismissPath={`/tenants/${tenantId}`} {...tenantSuccess} /> : null
      }
      relationshipChain={
        <EntityRelationshipChain
          links={[
            { href: "/tenants", label: "Tenants" },
            ...(tenant.propertyId && tenant.propertyName
              ? [{ href: `/properties/${tenant.propertyId}`, label: tenant.propertyName }]
              : []),
            ...(tenant.unitId && tenant.unitNumber
              ? [{ href: `/units/${tenant.unitId}`, label: `Unit ${tenant.unitNumber}` }]
              : []),
            { label: displayName }
          ]}
        />
      }
      hero={
        <DetailHero
          title={displayName}
          subtitle={`Legal name: ${tenant.firstName} ${tenant.lastName}`}
          attention={recommendedAction}
          badges={
            <Badge
              variant={tenant.status === "active" ? "success" : tenant.status === "archived" ? "warning" : "info"}
            >
              {toTenantStatusLabel(tenant.status)}
            </Badge>
          }
          metrics={
            <>
              <DetailMetric label="Email" value={tenant.email} />
              <DetailMetric label="Phone" value={tenant.phone ?? "—"} />
              <DetailMetric label="Move-in" value={tenant.moveInDate ?? "—"} />
              <DetailMetric label="Move-out" value={tenant.moveOutDate ?? "—"} />
              <DetailMetric label="Property" value={tenant.propertyName ?? "Not assigned"} />
            </>
          }
        />
      }
      toolbelt={<EntityActionToolbelt actions={toolbeltPrimary} moreActions={toolbeltMore} />}
      main={
        <>
        <Card variant="elevated" className="space-y-4">
          <div className="flex items-center gap-3">
            <Avatar
              src={tenant.avatarUrl ?? undefined}
              fallback={`${tenant.firstName[0] ?? "T"}${tenant.lastName[0] ?? ""}`}
            />
            <div>
              <h2 className="mpa-section-title">Contact & assignment</h2>
              <p className="text-sm text-[var(--mpa-color-text-secondary)]">Profile and placement details</p>
            </div>
          </div>

          <div className="grid gap-2 text-sm text-[var(--mpa-color-text-secondary)] md:grid-cols-2 lg:grid-cols-3">
            <p>Date of Birth: {tenant.dateOfBirth ?? "—"}</p>
            <p>Status: {toTenantStatusLabel(tenant.status)}</p>
          </div>

          <div className="grid gap-3 rounded-[var(--mpa-radius-lg)] border border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-surface-muted)]/40 p-4 md:grid-cols-2">
            <div>
              <p className="mpa-section-label">Assigned property</p>
              {tenant.propertyId && tenant.propertyName && canReadProperty ? (
                <Link
                  href={`/properties/${tenant.propertyId}`}
                  className="mt-1 block text-sm font-medium text-[var(--mpa-color-brand-primary)] hover:underline"
                >
                  {tenant.propertyName}
                </Link>
              ) : (
                <p className="mt-1 text-sm font-medium text-[var(--mpa-color-text-primary)]">
                  {tenant.propertyName ?? "Not assigned"}
                </p>
              )}
            </div>
            <div>
              <p className="mpa-section-label">Assigned unit</p>
              {tenant.unitId && tenant.unitNumber && canReadUnit ? (
                <Link
                  href={`/units/${tenant.unitId}`}
                  className="mt-1 block text-sm font-medium text-[var(--mpa-color-brand-primary)] hover:underline"
                >
                  Unit {tenant.unitNumber}
                </Link>
              ) : (
                <p className="mt-1 text-sm font-medium text-[var(--mpa-color-text-primary)]">
                  {tenant.unitNumber ? `Unit ${tenant.unitNumber}` : "Not assigned"}
                </p>
              )}
            </div>
          </div>
        </Card>

        <DiscloseSection title="Notes & documents" description="Emergency contact, notes, and document placeholders.">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-[var(--mpa-color-text-primary)]">Emergency contact</h3>
              <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
                {tenant.emergencyContactName ?? "No emergency contact"}{" "}
                {tenant.emergencyContactPhone ? `(${tenant.emergencyContactPhone})` : ""}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-[var(--mpa-color-text-primary)]">Notes</h3>
              <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
                {tenant.notes ? tenant.notes : "No notes added."}
              </p>
            </div>
            <div className="rounded-[var(--mpa-radius-lg)] border border-dashed border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface-muted)] p-3">
              <p className="mpa-section-label">Document notes</p>
              <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
                {tenant.documentsPlaceholder?.trim()
                  ? tenant.documentsPlaceholder
                  : "No document notes yet. Organization files are available in Settings → Documents."}
              </p>
            </div>
          </div>
        </DiscloseSection>
        </>
      }
      contextRail={
        <TenantContextRail
          tenantId={tenantId}
          propertyId={tenant.propertyId}
          propertyName={tenant.propertyName}
          unitId={tenant.unitId}
          unitNumber={tenant.unitNumber}
          canReadProperty={canReadProperty}
          canReadUnit={canReadUnit}
          lease={
            leaseRow
              ? {
                  id: leaseRow.id,
                  leaseNumber: leaseRow.lease_number,
                  status: leaseRow.status,
                  rentAmount: Number(leaseRow.rent_amount),
                  endDate: leaseRow.end_date
                }
              : null
          }
          outstandingBalance={outstandingBalance}
          recentPayments={recentPayments}
          openMaintenance={openMaintenance}
          communicationsCount={communicationsCount ?? 0}
          timeline={timeline}
          recommendedAction={recommendedAction}
        />
      }
    />
    </>
  );
}
