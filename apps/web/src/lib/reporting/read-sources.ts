/**
 * Read-only accounting data access for FIN-001.
 * Must never call financial mutation APIs.
 */
import { getExpensesForOrganization, getPaymentsForOrganization, getRentChargesForOrganization } from "../financial/server";
import type { ExpenseRecord, PaymentRecord, RentChargeRecord } from "../financial/contracts";
import { getLeasesForOrganization } from "../lease/server";
import type { LeaseListItem } from "../lease/server";
import { getWorkOrdersForOrganization, type WorkOrderListItem } from "../maintenance/server";
import { getPropertiesForOrganization, getPropertyForOrganization } from "../property/server";
import type { PropertyRecord } from "../property/contracts";
import { getUnitsForOrganization } from "../unit/server";
import type { UnitListItem } from "../unit/server";
import { createAuthServerComponentClient } from "../auth/server";
import { getOrganizationsForUser } from "../organization/server";
import type { ReportPeriod, RecognitionBasis } from "./contracts";

export type ReportingSnapshot = {
  organizationName: string;
  property: PropertyRecord;
  managerName: string;
  charges: RentChargeRecord[];
  payments: PaymentRecord[];
  expenses: ExpenseRecord[];
  units: UnitListItem[];
  leases: LeaseListItem[];
  workOrders: WorkOrderListItem[];
  awaitingReconciliationCount: number;
  periodCharges: RentChargeRecord[];
  periodPayments: PaymentRecord[];
  periodExpenses: ExpenseRecord[];
  periodWorkOrders: WorkOrderListItem[];
  recognitionBasis: RecognitionBasis;
};

// Route-handler and RSC clients are structurally compatible for our reads.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DbClient = Awaited<ReturnType<typeof createAuthServerComponentClient>> | any;

function inPeriod(date: string, period: ReportPeriod): boolean {
  return date >= period.startDate && date <= period.endDate;
}

function chargeInPeriod(charge: RentChargeRecord, period: ReportPeriod): boolean {
  if (charge.periodStart && charge.periodEnd) {
    return charge.periodStart <= period.endDate && charge.periodEnd >= period.startDate;
  }
  return inPeriod(charge.dueDate, period);
}

export async function loadReportingSnapshot(input: {
  organizationId: string;
  userId: string;
  propertyId: string;
  period: ReportPeriod;
  recognitionBasis: RecognitionBasis;
  client?: DbClient;
}): Promise<ReportingSnapshot> {
  const supabase = input.client ?? (await createAuthServerComponentClient());
  const property = await getPropertyForOrganization(input.organizationId, input.propertyId, supabase);
  if (!property) {
    throw new Error("PROPERTY_NOT_FOUND");
  }

  const orgs = await getOrganizationsForUser(input.userId);
  const organizationName = orgs.find((org) => org.id === input.organizationId)?.name ?? "Organization";

  const [{ data: profile }, charges, payments, expenses, units, leases, workOrders, awaitingReconciliationCount] =
    await Promise.all([
      supabase.from("user_profiles").select("display_name").eq("user_id", input.userId).maybeSingle(),
      getRentChargesForOrganization(input.organizationId, { propertyId: input.propertyId, limit: 2000 }, supabase),
      getPaymentsForOrganization(input.organizationId, { propertyId: input.propertyId, limit: 2000 }, supabase),
      getExpensesForOrganization(input.organizationId, { propertyId: input.propertyId, limit: 2000 }, supabase),
      getUnitsForOrganization(input.organizationId, input.propertyId, supabase, { limit: 2000 }),
      getLeasesForOrganization(input.organizationId, { propertyId: input.propertyId, limit: 2000 }, supabase),
      getWorkOrdersForOrganization(
        input.organizationId,
        { propertyId: input.propertyId, status: "all", limit: 2000 },
        supabase
      ),
      countAwaitingReconciliation(input.organizationId, input.propertyId, supabase)
    ]);

  const profileRow = profile as { display_name?: string | null } | null;
  const managerName = profileRow?.display_name?.trim() || "—";

  const periodCharges = charges.filter((charge) => chargeInPeriod(charge, input.period));
  const periodPayments = payments.filter(
    (payment) =>
      inPeriod(payment.paymentDate, input.period) &&
      (payment.status === "completed" || payment.status === "awaiting_reconciliation")
  );
  const periodExpenses = expenses.filter((expense) => inPeriod(expense.expenseDate, input.period));
  const periodWorkOrders = workOrders.filter((workOrder) => workOrderInPeriod(workOrder, input.period));

  return {
    organizationName,
    property,
    managerName,
    charges,
    payments,
    expenses,
    units,
    leases,
    workOrders,
    awaitingReconciliationCount,
    periodCharges,
    periodPayments,
    periodExpenses,
    periodWorkOrders,
    recognitionBasis: input.recognitionBasis
  };
}

function workOrderInPeriod(workOrder: WorkOrderListItem, period: ReportPeriod): boolean {
  const createdDay = workOrder.createdAt.slice(0, 10);
  if (inPeriod(createdDay, period)) return true;
  if (workOrder.completedAt) {
    const completedDay = workOrder.completedAt.slice(0, 10);
    if (inPeriod(completedDay, period)) return true;
  }
  // Still-open work orders remain relevant to the period summary.
  if (workOrder.status !== "completed" && workOrder.status !== "cancelled") {
    return createdDay <= period.endDate;
  }
  return false;
}

export async function listPropertiesForReporting(
  organizationId: string,
  client?: DbClient
): Promise<Array<{ id: string; name: string }>> {
  const properties = await getPropertiesForOrganization(organizationId, client);
  return properties
    .filter((property) => !property.deletedAt && property.status !== "archived")
    .map((property) => ({ id: property.id, name: property.name }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

async function countAwaitingReconciliation(
  organizationId: string,
  propertyId: string,
  client: DbClient
): Promise<number> {
  const { count, error } = await client
    .from("payments")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .eq("property_id", propertyId)
    .eq("status", "awaiting_reconciliation")
    .is("deleted_at", null);

  if (error) {
    // Billing attempts table may also track this; payments status is sufficient for Phase 1.
    return 0;
  }
  return count ?? 0;
}

export function formatPropertyAddress(property: PropertyRecord): string {
  const line2 = property.addressLine2 ? `, ${property.addressLine2}` : "";
  return `${property.addressLine1}${line2}, ${property.city}, ${property.stateRegion} ${property.postalCode}`;
}

export function maxUpdatedAt(isoDates: Array<string | null | undefined>): string {
  let max = "";
  for (const value of isoDates) {
    if (value && value > max) max = value;
  }
  return max || "0";
}
