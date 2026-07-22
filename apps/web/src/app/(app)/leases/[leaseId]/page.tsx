import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge, Button, Card, DetailHero, DetailMetric } from "@mpa/ui";
import { AiPageContextBridge } from "../../../../components/ai/ai-page-context";
import { buildAiPageContext } from "../../../../lib/ai/ai-page-context-store";
import { DetailPageLayout } from "../../../../components/presentation/detail-page-layout";
import { EntityRelationshipChain } from "../../../../components/presentation/entity-relationship-chain";
import { LeaseContextRail } from "../../../../components/presentation/context-rails/lease-context-rail";
import { LeaseDocumentsPanel } from "../../../../components/lease/lease-documents-panel";
import { LeaseLifecyclePanel } from "../../../../components/lease/lease-lifecycle-panel";
import { SignaturePackagePanel } from "../../../../components/signature/signature-package-panel";
import { EntityActionToolbelt } from "../../../../components/presentation/entity-action-toolbelt";
import { WorkflowSuccessBanner } from "../../../../components/workflow/workflow-success-banner";
import { createAuthServerComponentClient } from "../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../lib/organization/server";
import {
  toLeaseRenewalStatusLabel,
  toLeaseStatusLabel,
  toLeaseTypeLabel
} from "../../../../lib/lease/contracts";
import { getLeaseForOrganization } from "../../../../lib/lease/server";
import { buildLeaseCreatedSuccess } from "../../../../lib/workflow/shared/success-configs";

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
  const canReadFinancials = evaluatePermission(authorization, "financial:read");
  const canCreateSignature = evaluatePermission(authorization, "signature:create");
  const canSendSignature = evaluatePermission(authorization, "signature:send");
  const canReadSignature = evaluatePermission(authorization, "signature:read");
  const canMessage =
    evaluatePermission(authorization, "message:read") || evaluatePermission(authorization, "message:create");
  const canCreateMaintenance = evaluatePermission(authorization, "maintenance:create");
  const canCreateFinancial = evaluatePermission(authorization, "financial:create");

  const { data: chargeRows, error: chargeError } = canReadFinancials
    ? await supabase
        .from("rent_charges")
        .select("amount_paid, outstanding_balance")
        .eq("organization_id", organizationId)
        .eq("lease_id", leaseId)
        .is("deleted_at", null)
    : { data: [], error: null };

  if (chargeError) {
    throw new Error("Unable to load lease financial snapshot.");
  }

  const amountPaid = ((chargeRows ?? []) as Array<{ amount_paid: number }>).reduce(
    (sum, row) => sum + Number(row.amount_paid ?? 0),
    0
  );
  const outstandingBalance = ((chargeRows ?? []) as Array<{ outstanding_balance: number }>).reduce(
    (sum, row) => sum + Number(row.outstanding_balance ?? 0),
    0
  );

  const leaseSuccess =
    from === "lease-created"
      ? buildLeaseCreatedSuccess({
          id: lease.id,
          leaseNumber: lease.leaseNumber,
          propertyId: lease.propertyId,
          unitId: lease.unitId,
          primaryTenantId: lease.primaryTenantId,
          unitNumber: lease.unitNumber,
          status: lease.status
        })
      : null;

  return (
    <>
      <AiPageContextBridge
        {...buildAiPageContext({
          entityType: "lease",
          entityId: leaseId,
          entityLabel: lease.leaseNumber
        })}
      />
    <DetailPageLayout
      breadcrumbs={[
        { href: "/dashboard", label: "Dashboard" },
        { href: "/leases", label: "Leases" },
        { label: lease.leaseNumber }
      ]}
      banner={leaseSuccess ? <WorkflowSuccessBanner dismissPath={`/leases/${leaseId}`} {...leaseSuccess} /> : null}
      relationshipChain={
        <EntityRelationshipChain
          links={[
            { href: "/leases", label: "Leases" },
            ...(lease.propertyId && lease.propertyName
              ? [{ href: `/properties/${lease.propertyId}`, label: lease.propertyName }]
              : []),
            ...(lease.unitId && lease.unitNumber
              ? [{ href: `/units/${lease.unitId}`, label: `Unit ${lease.unitNumber}` }]
              : []),
            ...(lease.primaryTenantId && lease.tenantName
              ? [{ href: `/tenants/${lease.primaryTenantId}`, label: lease.tenantName }]
              : []),
            { label: lease.leaseNumber }
          ]}
        />
      }
      hero={
        <DetailHero
          title={lease.leaseNumber}
          subtitle={`${toLeaseTypeLabel(lease.leaseType)} · ${lease.propertyName ?? "Unknown property"}${lease.unitNumber ? ` · Unit ${lease.unitNumber}` : ""}`}
          badges={
            <>
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
              <Badge
                variant={
                  lease.renewalStatus === "renewed" ? "success" : lease.renewalStatus !== "none" ? "warning" : "info"
                }
              >
                {toLeaseRenewalStatusLabel(lease.renewalStatus)}
              </Badge>
              {lease.archivedAt ? <Badge variant="warning">Archived</Badge> : null}
            </>
          }
          metrics={
            <>
              <DetailMetric label="Rent" value={formatCurrency(lease.rentAmount)} />
              <DetailMetric label="Security deposit" value={formatCurrency(lease.securityDeposit)} />
              <DetailMetric label="Start date" value={lease.startDate} />
              <DetailMetric label="End date" value={lease.endDate} />
              <DetailMetric label="Tenant" value={lease.tenantName ?? "—"} />
            </>
          }
          actions={
            canEdit ? (
              <Link href={`/leases/${lease.id}/edit`}>
                <Button>Edit Lease</Button>
              </Link>
            ) : null
          }
        />
      }
      toolbelt={
        <EntityActionToolbelt
          actions={[
            ...(canReadTenant && lease.primaryTenantId
              ? [
                  {
                    id: "return-resident",
                    label: lease.tenantName ? `Return to ${lease.tenantName}` : "Return to Resident",
                    href: `/tenants/${lease.primaryTenantId}`,
                    variant: "primary" as const
                  }
                ]
              : []),
            ...(canReadProperty && lease.propertyId
              ? [
                  {
                    id: "return-property",
                    label: "Return to Property",
                    href: `/properties/${lease.propertyId}`,
                    variant: "secondary" as const
                  }
                ]
              : []),
            ...(canCreateFinancial && lease.primaryTenantId
              ? [
                  {
                    id: "collect-rent",
                    label: "Collect Rent",
                    href: `/financials/payments/new?tenantId=${encodeURIComponent(lease.primaryTenantId)}`,
                    variant: "secondary" as const
                  }
                ]
              : []),
            ...(canMessage && lease.primaryTenantId
              ? [
                  {
                    id: "message",
                    label: "Send Message",
                    href: `/communications/resident/${encodeURIComponent(lease.primaryTenantId)}`,
                    variant: "secondary" as const
                  }
                ]
              : [])
          ]}
          moreActions={[
            ...(canCreateMaintenance && lease.propertyId
              ? [
                  {
                    id: "maintenance",
                    label: "Create Maintenance",
                    href: `/maintenance/new?propertyId=${encodeURIComponent(lease.propertyId)}${
                      lease.unitId ? `&unitId=${encodeURIComponent(lease.unitId)}` : ""
                    }${lease.primaryTenantId ? `&tenantId=${encodeURIComponent(lease.primaryTenantId)}` : ""}`
                  }
                ]
              : []),
            { id: "documents", label: "Open Documents", href: "#documents" },
            { id: "leases", label: "All leases", href: "/leases" }
          ]}
        />
      }
      main={
        <>
          <Card variant="elevated" className="space-y-4">
            <h2 className="mpa-section-title">Lease details</h2>
            <div className="grid gap-2 text-sm text-[var(--mpa-color-text-secondary)] md:grid-cols-2 lg:grid-cols-3">
              <p>
                Property:{" "}
                {canReadProperty && lease.propertyId ? (
                  <Link
                    href={`/properties/${lease.propertyId}`}
                    className="text-[var(--mpa-color-brand-primary)] hover:underline"
                  >
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
              <p>Additional residents: {lease.coTenantPlaceholder ?? "—"}</p>
              <p>Move-in: {lease.moveInDate ?? "—"}</p>
              <p>Move-out: {lease.moveOutDate ?? "—"}</p>
              <p>Late fee notes: {lease.lateFeePlaceholder ?? "—"}</p>
              <p>Renewal option: {lease.renewalOption ? "Yes" : "No"}</p>
              <p>Notice period: {lease.noticePeriodDays !== null ? `${lease.noticePeriodDays} days` : "—"}</p>
              <p>Signed: {lease.signedAt ? new Date(lease.signedAt).toLocaleString() : "—"}</p>
              <p>Activated: {lease.activatedAt ? new Date(lease.activatedAt).toLocaleString() : "—"}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-[var(--mpa-color-text-primary)]">Internal notes</h3>
              <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
                {lease.internalNotes ?? "No internal notes."}
              </p>
            </div>
          </Card>

          <div id="lifecycle" className="space-y-5">
            <LeaseLifecyclePanel
              leaseId={lease.id}
              status={lease.status}
              renewalStatus={lease.renewalStatus}
              events={lease.events}
              canUpdate={canUpdate}
            />
            {canReadSignature ? (
              <SignaturePackagePanel
                leaseId={lease.id}
                canCreate={canCreateSignature}
                canSend={canSendSignature}
              />
            ) : null}
            <div id="documents">
              <LeaseDocumentsPanel documents={lease.documents} />
            </div>
          </div>
        </>
      }
      contextRail={
        <LeaseContextRail
          leaseId={lease.id}
          propertyId={lease.propertyId}
          propertyName={lease.propertyName}
          unitId={lease.unitId}
          unitNumber={lease.unitNumber}
          tenantId={lease.primaryTenantId}
          tenantName={lease.tenantName}
          canReadProperty={canReadProperty}
          canReadUnit={canReadUnit}
          canReadTenant={canReadTenant}
          rentAmount={lease.rentAmount}
          securityDeposit={lease.securityDeposit}
          amountPaid={amountPaid}
          outstandingBalance={outstandingBalance}
          endDate={lease.endDate}
          renewalStatus={lease.renewalStatus}
          status={lease.status}
          documents={lease.documents}
          events={lease.events}
        />
      }
    />
    </>
  );
}
