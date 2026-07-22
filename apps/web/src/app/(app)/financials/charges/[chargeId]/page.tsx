import { redirect } from "next/navigation";
import { Badge, Card } from "@mpa/ui";
import { DetailPageLayout } from "../../../../../components/presentation/detail-page-layout";
import { EntityRelationshipChain } from "../../../../../components/presentation/entity-relationship-chain";
import { FinancialChargeContextRail } from "../../../../../components/presentation/context-rails/financial-context-rail";
import { RecordPaymentForm } from "../../../../../components/financial/record-payment-form";
import { EntityActionToolbelt } from "../../../../../components/presentation/entity-action-toolbelt";
import { WorkflowContinuityChips } from "../../../../../components/workflow/workflow-continuity-chips";
import { WorkflowSuccessBanner } from "../../../../../components/workflow/workflow-success-banner";
import { createAuthServerComponentClient } from "../../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../../lib/organization/server";
import { fetchAuthedApi } from "../../../../../lib/financial/server-fetch";
import { formatCurrency, toChargeStatusLabel, type ChargeType } from "../../../../../lib/financial/contracts";
import type { RentChargeListItem } from "../../../../../lib/financial/server";
import { getPortfolioCounts } from "../../../../../lib/workflow/server/portfolio-counts";
import { buildChargeCreatedSuccess, buildPaymentRecordedSuccess } from "../../../../../lib/workflow/shared/success-configs";

function chargeTypeLabel(type: ChargeType): string {
  const labels: Record<ChargeType, string> = {
    monthly_rent: "Monthly rent",
    custom: "Custom",
    security_deposit: "Security deposit",
    late_fee: "Late fee",
    adjustment: "Adjustment",
    credit: "Credit",
    other: "Other"
  };
  return labels[type];
}

export default async function RentChargeDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ chargeId: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const { chargeId } = await params;
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
  if (!evaluatePermission(authorization, "financial:read")) {
    redirect("/unauthorized");
  }

  const result = await fetchAuthedApi<{ charge: RentChargeListItem }>(`/api/rent-charges/${chargeId}`);
  if (!result.ok || !result.data.charge) {
    redirect("/financials/charges");
  }

  const charge = result.data.charge;
  const canCreate = evaluatePermission(authorization, "financial:create");
  const canReadTenant = evaluatePermission(authorization, "tenant:read");
  const canReadProperty = evaluatePermission(authorization, "property:read");
  const canMessage =
    evaluatePermission(authorization, "message:read") || evaluatePermission(authorization, "message:create");
  const canCreateMaintenance = evaluatePermission(authorization, "maintenance:create");
  const canReadLease = evaluatePermission(authorization, "lease:read");

  const [{ data: paymentRows }, { data: expenseRows }] = await Promise.all([
    supabase
      .from("payments")
      .select("id, amount, payment_date")
      .eq("organization_id", organizationId)
      .eq("charge_id", chargeId)
      .eq("status", "completed")
      .is("deleted_at", null)
      .order("payment_date", { ascending: false })
      .limit(5),
    charge.propertyId
      ? supabase
          .from("expenses")
          .select("id, amount, description, expense_date")
          .eq("organization_id", organizationId)
          .eq("property_id", charge.propertyId)
          .is("deleted_at", null)
          .order("expense_date", { ascending: false })
          .limit(4)
      : Promise.resolve({ data: [] })
  ]);

  const recentPayments = (
    (paymentRows ?? []) as Array<{ id: string; amount: number; payment_date: string }>
  ).map((row) => ({
    id: row.id,
    amount: Number(row.amount),
    paymentDate: row.payment_date
  }));

  const relatedExpenses = (
    (expenseRows ?? []) as Array<{ id: string; amount: number; description: string; expense_date: string }>
  ).map((row) => ({
    id: row.id,
    amount: Number(row.amount),
    description: row.description,
    expenseDate: row.expense_date
  }));

  const portfolioCounts = from === "payment-recorded" ? await getPortfolioCounts(organizationId) : null;
  const chargeSuccess =
    from === "charge-created"
      ? buildChargeCreatedSuccess({
          id: charge.id,
          chargeNumber: charge.chargeNumber,
          leaseId: charge.leaseId,
          propertyId: charge.propertyId
        })
      : null;
  const paymentSuccess =
    from === "payment-recorded" && portfolioCounts ? buildPaymentRecordedSuccess(portfolioCounts) : null;

  return (
    <DetailPageLayout
      breadcrumbs={[
        { href: "/dashboard", label: "Dashboard" },
        { href: "/financials", label: "Financials" },
        { href: "/financials/charges", label: "Rent Charges" },
        { label: charge.chargeNumber }
      ]}
      banner={
        <>
          {chargeSuccess ? (
            <WorkflowSuccessBanner dismissPath={`/financials/charges/${chargeId}`} {...chargeSuccess} />
          ) : null}
          {paymentSuccess ? (
            <WorkflowSuccessBanner dismissPath={`/financials/charges/${chargeId}`} {...paymentSuccess} />
          ) : null}
        </>
      }
      relationshipChain={
        <EntityRelationshipChain
          links={[
            { href: "/financials", label: "Financials" },
            { href: "/financials/charges", label: "Rent Charges" },
            ...(charge.propertyId && charge.propertyName
              ? [{ href: `/properties/${charge.propertyId}`, label: charge.propertyName }]
              : []),
            { label: charge.chargeNumber }
          ]}
        />
      }
      hero={
        <Card variant="elevated" className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="font-display text-2xl font-semibold text-[var(--mpa-color-text-primary)]">
                {charge.chargeNumber}
              </h1>
              <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
                {chargeTypeLabel(charge.chargeType)} · {charge.description}
              </p>
            </div>
            <Badge
              variant={charge.status === "paid" ? "success" : charge.status === "overdue" ? "warning" : "info"}
            >
              {toChargeStatusLabel(charge.status)}
            </Badge>
          </div>
          <div className="grid gap-2 text-sm text-[var(--mpa-color-text-secondary)] sm:grid-cols-2 lg:grid-cols-4">
            <p>Amount: {formatCurrency(charge.amount)}</p>
            <p>Paid: {formatCurrency(charge.amountPaid)}</p>
            <p>Outstanding: {formatCurrency(charge.outstandingBalance)}</p>
            <p>Due: {new Date(charge.dueDate).toLocaleDateString()}</p>
          </div>
        </Card>
      }
      toolbelt={
        <EntityActionToolbelt
          actions={[
            ...(canCreate
              ? [
                  {
                    id: "record-payment",
                    label: "Record Payment",
                    href: "#payment",
                    variant: "primary" as const
                  }
                ]
              : []),
            ...(canReadTenant && charge.tenantId
              ? [
                  {
                    id: "return-resident",
                    label: charge.tenantName ? `Return to ${charge.tenantName}` : "Return to Resident",
                    href: `/tenants/${charge.tenantId}`,
                    variant: "secondary" as const
                  }
                ]
              : []),
            ...(canReadProperty && charge.propertyId
              ? [
                  {
                    id: "return-property",
                    label: "Return to Property",
                    href: `/properties/${charge.propertyId}`,
                    variant: "secondary" as const
                  }
                ]
              : []),
            ...(canMessage && charge.tenantId
              ? [
                  {
                    id: "message",
                    label: "Send Message",
                    href: `/communications/resident/${encodeURIComponent(charge.tenantId)}`,
                    variant: "secondary" as const
                  }
                ]
              : [])
          ]}
          moreActions={[
            ...(canReadLease && charge.leaseId
              ? [{ id: "lease", label: "Open Lease", href: `/leases/${charge.leaseId}` }]
              : []),
            ...(canCreateMaintenance && charge.propertyId
              ? [
                  {
                    id: "maintenance",
                    label: "Create Maintenance",
                    href: `/maintenance/new?propertyId=${encodeURIComponent(charge.propertyId)}${
                      charge.unitId ? `&unitId=${encodeURIComponent(charge.unitId)}` : ""
                    }${charge.tenantId ? `&tenantId=${encodeURIComponent(charge.tenantId)}` : ""}`
                  }
                ]
              : []),
            { id: "charges", label: "All charges", href: "/financials/charges" }
          ]}
        />
      }
      main={
        <>
          <WorkflowContinuityChips
            chips={[
              ...(canReadTenant && charge.tenantId
                ? [
                    {
                      id: "resident",
                      label: charge.tenantName ? `Return to ${charge.tenantName}` : "Return to Resident",
                      href: `/tenants/${charge.tenantId}`,
                      variant: "primary" as const
                    }
                  ]
                : []),
              ...(canReadProperty && charge.propertyId
                ? [
                    {
                      id: "property",
                      label: "Return to Property",
                      href: `/properties/${charge.propertyId}`
                    }
                  ]
                : []),
              ...(canMessage && charge.tenantId
                ? [
                    {
                      id: "message",
                      label: "Send Message",
                      href: `/communications/resident/${encodeURIComponent(charge.tenantId)}`
                    }
                  ]
                : []),
              ...(canReadLease && charge.leaseId
                ? [{ id: "lease", label: "Open Lease", href: `/leases/${charge.leaseId}` }]
                : []),
              ...(canCreateMaintenance && charge.propertyId
                ? [
                    {
                      id: "maintenance",
                      label: "Create Maintenance",
                      href: `/maintenance/new?propertyId=${encodeURIComponent(charge.propertyId)}${
                        charge.unitId ? `&unitId=${encodeURIComponent(charge.unitId)}` : ""
                      }${charge.tenantId ? `&tenantId=${encodeURIComponent(charge.tenantId)}` : ""}`
                    }
                  ]
                : [])
            ]}
          />
          <Card variant="elevated" className="space-y-4">
            <h2 className="mpa-section-title">Charge details</h2>
            <div className="grid gap-2 text-sm text-[var(--mpa-color-text-secondary)] md:grid-cols-2 lg:grid-cols-3">
              <p>Property: {charge.propertyName ?? "—"}</p>
              <p>Unit: {charge.unitNumber ?? "—"}</p>
              <p>Tenant: {charge.tenantName ?? "—"}</p>
              <p>Late status: {charge.lateStatus.replaceAll("_", " ")}</p>
              <p>
                Period:{" "}
                {charge.periodStart && charge.periodEnd
                  ? `${new Date(charge.periodStart).toLocaleDateString()} – ${new Date(charge.periodEnd).toLocaleDateString()}`
                  : "—"}
              </p>
              <p>Lease: {charge.leaseId ?? "—"}</p>
            </div>
            {canCreate ? (
              <div id="payment">
                <RecordPaymentForm charge={charge} />
              </div>
            ) : null}
          </Card>
        </>
      }
      contextRail={
        <FinancialChargeContextRail
          charge={charge}
          recentPayments={recentPayments}
          relatedExpenses={relatedExpenses}
          ownerStatementStatus={null}
          leaseHref={charge.leaseId ? `/leases/${charge.leaseId}` : null}
        />
      }
    />
  );
}
