import type { SupabaseClient } from "@supabase/supabase-js";
import {
  assertFinanceFeatureEnabled,
  buildCommandCenterAssistantRecommendation,
  buildOwnerAssistantRecommendation,
  buildPropertyAlerts,
  currentMonthBounds,
  formatMoney,
  netOperationalCash,
  occupancyRate,
  remainingBalance,
  roundMoney,
  type OwnerFinancialSummary,
  type PropertyFinancialSnapshot
} from "@mpa/shared";
import { getCollectionsSnapshot } from "./collections-service";
import { emitFinanceEvent, writeFinanceAudit } from "./events-audit";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = SupabaseClient<any>;

type PropertyRow = {
  id: string;
  name: string;
  property_units?: Array<{ id: string; status: string }> | null;
};

async function loadProperties(supabase: Db, organizationId: string, propertyId?: string) {
  let query = supabase
    .from("property_properties")
    .select("id, name, property_units(id, status)")
    .eq("organization_id", organizationId)
    .order("name");
  if (propertyId) {
    query = query.eq("id", propertyId);
  }
  const { data, error } = await query;
  if (error) {
    throw new Error(error.message);
  }
  return (data ?? []) as PropertyRow[];
}

export async function getPropertyFinancialSnapshot(
  supabase: Db,
  organizationId: string,
  propertyId: string
): Promise<PropertyFinancialSnapshot> {
  assertFinanceFeatureEnabled("finance.reports");
  const properties = await loadProperties(supabase, organizationId, propertyId);
  const property = properties[0];
  if (!property) {
    throw new Error("Property not found");
  }
  const [snapshot] = await buildPropertySnapshots(supabase, organizationId, [property]);
  if (!snapshot) {
    throw new Error("Unable to build property snapshot");
  }
  return snapshot;
}

export async function listPropertyFinancialSnapshots(
  supabase: Db,
  organizationId: string
): Promise<PropertyFinancialSnapshot[]> {
  assertFinanceFeatureEnabled("finance.reports");
  const properties = await loadProperties(supabase, organizationId);
  return buildPropertySnapshots(supabase, organizationId, properties);
}

async function buildPropertySnapshots(
  supabase: Db,
  organizationId: string,
  properties: PropertyRow[]
): Promise<PropertyFinancialSnapshot[]> {
  const bounds = currentMonthBounds();
  const today = new Date().toISOString().slice(0, 10);
  const propertyIds = properties.map((property) => property.id);
  if (propertyIds.length === 0) {
    return [];
  }

  const [
    { data: leases },
    { data: openCharges },
    { data: monthRentCharges },
    { data: monthPayments },
    { data: delinquency },
    { data: vendorInvoices },
    { data: vendorPayments },
    { data: upcomingCharges }
  ] = await Promise.all([
    supabase
      .from("lease_agreements")
      .select("id, property_id, rent_amount, status")
      .eq("organization_id", organizationId)
      .in("property_id", propertyIds)
      .eq("status", "active"),
    supabase
      .from("financial_charges")
      .select("id, property_id, amount, amount_paid, status, charge_type, due_at")
      .eq("organization_id", organizationId)
      .in("property_id", propertyIds)
      .in("status", ["open", "partially_paid"]),
    supabase
      .from("financial_charges")
      .select("id, property_id, amount, charge_type, due_at, status")
      .eq("organization_id", organizationId)
      .in("property_id", propertyIds)
      .in("charge_type", ["rent", "recurring_fee"])
      .gte("due_at", bounds.monthStart)
      .lte("due_at", bounds.monthEnd)
      .neq("status", "void"),
    supabase
      .from("financial_payments")
      .select("id, amount, paid_at, status, lease_id")
      .eq("organization_id", organizationId)
      .eq("status", "succeeded")
      .gte("paid_at", bounds.monthStartIso),
    supabase
      .from("financial_delinquency_cases")
      .select("id, property_id, open_balance, status")
      .eq("organization_id", organizationId)
      .in("property_id", propertyIds)
      .neq("status", "resolved"),
    supabase
      .from("financial_vendor_invoices")
      .select("id, property_id, amount, status")
      .eq("organization_id", organizationId)
      .in("property_id", propertyIds)
      .in("status", ["submitted", "in_review", "approved", "scheduled"]),
    supabase
      .from("financial_vendor_payments")
      .select("id, property_id, amount, status, paid_at")
      .eq("organization_id", organizationId)
      .in("property_id", propertyIds)
      .eq("status", "paid")
      .gte("paid_at", bounds.monthStartIso),
    supabase
      .from("financial_charges")
      .select("id, property_id")
      .eq("organization_id", organizationId)
      .in("property_id", propertyIds)
      .in("status", ["open", "partially_paid"])
      .gte("due_at", today)
  ]);

  const leasePropertyById = new Map((leases ?? []).map((lease) => [lease.id, lease.property_id]));

  return properties.map((property) => {
    const units = property.property_units ?? [];
    const unitsTotal = units.length;
    const unitsOccupied = units.filter((unit) => unit.status === "occupied").length;
    const activeLeases = (leases ?? []).filter((lease) => lease.property_id === property.id);
    const expectedFromLeases = roundMoney(
      activeLeases.reduce((sum, lease) => sum + Number(lease.rent_amount), 0)
    );
    const expectedFromCharges = roundMoney(
      (monthRentCharges ?? [])
        .filter((charge) => charge.property_id === property.id)
        .reduce((sum, charge) => sum + Number(charge.amount), 0)
    );
    const expectedRentThisMonth = Math.max(expectedFromLeases, expectedFromCharges);

    const rentCollectedThisMonth = roundMoney(
      (monthPayments ?? [])
        .filter((payment) => leasePropertyById.get(payment.lease_id) === property.id)
        .reduce((sum, payment) => sum + Number(payment.amount), 0)
    );

    const propertyOpenCharges = (openCharges ?? []).filter((charge) => charge.property_id === property.id);
    const outstandingBalance = roundMoney(
      propertyOpenCharges.reduce((sum, charge) => {
        const remaining = remainingBalance({
          amount: Number(charge.amount),
          amount_paid: Number(charge.amount_paid)
        });
        return charge.charge_type === "credit" ? sum - remaining : sum + remaining;
      }, 0)
    );
    const outstandingRent = roundMoney(
      propertyOpenCharges
        .filter((charge) => ["rent", "recurring_fee"].includes(charge.charge_type))
        .reduce(
          (sum, charge) =>
            sum +
            remainingBalance({
              amount: Number(charge.amount),
              amount_paid: Number(charge.amount_paid)
            }),
          0
        )
    );

    const propertyDelinquency = (delinquency ?? []).filter((item) => item.property_id === property.id);
    const totalDelinquency = roundMoney(
      propertyDelinquency.reduce((sum, item) => sum + Number(item.open_balance), 0)
    );
    const vendorPayablesOpen = roundMoney(
      (vendorInvoices ?? [])
        .filter((invoice) => invoice.property_id === property.id)
        .reduce((sum, invoice) => sum + Number(invoice.amount), 0)
    );
    const vendorPaidThisMonth = roundMoney(
      (vendorPayments ?? [])
        .filter((payment) => payment.property_id === property.id)
        .reduce((sum, payment) => sum + Number(payment.amount), 0)
    );
    const upcomingChargesCount = (upcomingCharges ?? []).filter(
      (charge) => charge.property_id === property.id
    ).length;

    const base = {
      propertyId: property.id,
      propertyName: property.name,
      expectedRentThisMonth,
      rentCollectedThisMonth,
      outstandingRent,
      outstandingBalance,
      delinquencyCount: propertyDelinquency.length,
      totalDelinquency,
      vendorPayablesOpen,
      vendorPaidThisMonth,
      netOperationalCash: netOperationalCash(rentCollectedThisMonth, vendorPaidThisMonth),
      unitsTotal: unitsTotal || activeLeases.length,
      unitsOccupied: unitsTotal > 0 ? unitsOccupied : activeLeases.length,
      occupancyRate: occupancyRate(
        unitsTotal > 0 ? unitsOccupied : activeLeases.length,
        unitsTotal > 0 ? unitsTotal : Math.max(activeLeases.length, 1)
      ),
      upcomingChargesCount
    };

    // When there are no units and no leases, occupancy rate should be 0 not 100 from max(1).
    if (unitsTotal === 0 && activeLeases.length === 0) {
      base.unitsTotal = 0;
      base.unitsOccupied = 0;
      base.occupancyRate = 0;
    }

    return {
      ...base,
      alerts: buildPropertyAlerts(base)
    };
  });
}

export async function getOwnerFinancialSummary(
  supabase: Db,
  organizationId: string
): Promise<OwnerFinancialSummary> {
  assertFinanceFeatureEnabled("finance.reports");
  const bounds = currentMonthBounds();
  const properties = await listPropertyFinancialSnapshots(supabase, organizationId);
  const currentMonthIncome = roundMoney(
    properties.reduce((sum, property) => sum + property.rentCollectedThisMonth, 0)
  );
  const currentMonthExpenses = roundMoney(
    properties.reduce((sum, property) => sum + property.vendorPaidThisMonth, 0)
  );
  const outstandingRent = roundMoney(
    properties.reduce((sum, property) => sum + property.outstandingRent, 0)
  );
  const unitsTotal = properties.reduce((sum, property) => sum + property.unitsTotal, 0);
  const unitsOccupied = properties.reduce((sum, property) => sum + property.unitsOccupied, 0);
  const alerts = [
    ...properties.flatMap((property) => property.alerts.slice(0, 1).map((alert) => `${property.propertyName}: ${alert}`))
  ].slice(0, 6);

  return {
    monthLabel: bounds.label,
    currentMonthIncome,
    currentMonthExpenses,
    outstandingRent,
    vendorPayments: currentMonthExpenses,
    netOperationalCash: netOperationalCash(currentMonthIncome, currentMonthExpenses),
    occupancy: {
      unitsTotal,
      unitsOccupied,
      occupancyRate: occupancyRate(unitsOccupied, unitsTotal)
    },
    properties,
    alerts:
      alerts.length > 0
        ? alerts
        : ["Portfolio money looks healthy — no open financial alerts."]
  };
}

export type RecentFinancialActivity = {
  id: string;
  kind: "payment" | "charge" | "vendor_invoice" | "vendor_payment";
  title: string;
  detail: string;
  amount: number;
  occurredAt: string;
  propertyId?: string | null;
  href?: string;
};

export async function getRecentFinancialActivity(
  supabase: Db,
  organizationId: string,
  limit = 12
): Promise<RecentFinancialActivity[]> {
  const [{ data: payments }, { data: charges }, { data: invoices }, { data: vendorPayments }, { data: leases }] =
    await Promise.all([
      supabase
        .from("financial_payments")
        .select("id, amount, paid_at, created_at, status, method, lease_id")
        .eq("organization_id", organizationId)
        .eq("status", "succeeded")
        .order("paid_at", { ascending: false })
        .limit(limit),
      supabase
        .from("financial_charges")
        .select("id, label, amount, due_at, created_at, charge_type, property_id")
        .eq("organization_id", organizationId)
        .neq("status", "void")
        .order("created_at", { ascending: false })
        .limit(limit),
      supabase
        .from("financial_vendor_invoices")
        .select("id, invoice_number, amount, status, submitted_at, property_id, vendor_vendors(name)")
        .eq("organization_id", organizationId)
        .order("submitted_at", { ascending: false })
        .limit(limit),
      supabase
        .from("financial_vendor_payments")
        .select("id, amount, status, paid_at, scheduled_for, created_at, property_id, vendor_vendors(name)")
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false })
        .limit(limit),
      supabase.from("lease_agreements").select("id, property_id").eq("organization_id", organizationId)
    ]);

  const leasePropertyById = new Map((leases ?? []).map((lease) => [lease.id, lease.property_id]));
  const activity: RecentFinancialActivity[] = [];

  for (const payment of payments ?? []) {
    activity.push({
      id: `payment:${payment.id}`,
      kind: "payment",
      title: "Payment received",
      detail: `${payment.method} · ${formatMoney(Number(payment.amount))}`,
      amount: Number(payment.amount),
      occurredAt: payment.paid_at ?? payment.created_at,
      propertyId: leasePropertyById.get(payment.lease_id) ?? null,
      href: "/pm/financial-operations#payments"
    });
  }

  for (const charge of charges ?? []) {
    activity.push({
      id: `charge:${charge.id}`,
      kind: "charge",
      title: charge.label,
      detail: `${charge.charge_type} · due ${charge.due_at}`,
      amount: Number(charge.amount),
      occurredAt: charge.created_at,
      propertyId: charge.property_id,
      href: "/pm/financial-operations#charges"
    });
  }

  for (const invoice of invoices ?? []) {
    const vendor = invoice.vendor_vendors as { name?: string } | Array<{ name?: string }> | null;
    const vendorName = (Array.isArray(vendor) ? vendor[0]?.name : vendor?.name) ?? "Vendor";
    activity.push({
      id: `invoice:${invoice.id}`,
      kind: "vendor_invoice",
      title: `Vendor invoice ${invoice.invoice_number}`,
      detail: `${vendorName} · ${invoice.status}`,
      amount: Number(invoice.amount),
      occurredAt: invoice.submitted_at,
      propertyId: invoice.property_id,
      href: "/pm/financial-operations#vendor-invoices"
    });
  }

  for (const payment of vendorPayments ?? []) {
    const vendor = payment.vendor_vendors as { name?: string } | Array<{ name?: string }> | null;
    const vendorName = (Array.isArray(vendor) ? vendor[0]?.name : vendor?.name) ?? "Vendor";
    activity.push({
      id: `vendor-payment:${payment.id}`,
      kind: "vendor_payment",
      title: payment.status === "paid" ? "Vendor payment recorded" : "Vendor payment scheduled",
      detail: `${vendorName} · ${formatMoney(Number(payment.amount))}`,
      amount: Number(payment.amount),
      occurredAt: payment.paid_at ?? payment.scheduled_for ?? payment.created_at,
      propertyId: payment.property_id,
      href: "/pm/financial-operations#vendor-payments"
    });
  }

  return activity
    .sort((a, b) => Date.parse(b.occurredAt) - Date.parse(a.occurredAt))
    .slice(0, limit);
}

export async function recordSummaryGenerated(
  supabase: Db,
  organizationId: string,
  actorId: string,
  kind: "command_center" | "owner" | "property",
  entityId: string
) {
  const bounds = currentMonthBounds();
  await emitFinanceEvent({
    supabase,
    organizationId,
    actorId,
    eventType: "finance.summary.generated",
    aggregateType: "financial_summary",
    aggregateId: entityId,
    payload: { kind, month: bounds.label }
  });
  await writeFinanceAudit({
    supabase,
    organizationId,
    actorId,
    action: "finance.summary.generated",
    entityType: "financial_summary",
    entityId,
    payload: { kind, month: bounds.label }
  });
}

export async function getCommandCenterReport(supabase: Db, organizationId: string) {
  assertFinanceFeatureEnabled("finance.reports");
  const bounds = currentMonthBounds();
  const [properties, collections, recentActivity] = await Promise.all([
    listPropertyFinancialSnapshots(supabase, organizationId),
    getCollectionsSnapshot(supabase, organizationId),
    getRecentFinancialActivity(supabase, organizationId)
  ]);

  const expectedRentThisMonth = roundMoney(
    properties.reduce((sum, property) => sum + property.expectedRentThisMonth, 0)
  );
  const rentCollectedThisMonth = roundMoney(
    properties.reduce((sum, property) => sum + property.rentCollectedThisMonth, 0)
  );
  const outstandingRent = roundMoney(
    properties.reduce((sum, property) => sum + property.outstandingRent, 0)
  );
  const outstandingBalance = roundMoney(
    properties.reduce((sum, property) => sum + property.outstandingBalance, 0)
  );
  const vendorPayablesOpen = roundMoney(
    properties.reduce((sum, property) => sum + property.vendorPayablesOpen, 0)
  );
  const vendorPaidThisMonth = roundMoney(
    properties.reduce((sum, property) => sum + property.vendorPaidThisMonth, 0)
  );
  const upcomingCharges = properties.reduce((sum, property) => sum + property.upcomingChargesCount, 0);

  const assistantRecommendation = buildCommandCenterAssistantRecommendation({
    expectedRentThisMonth,
    rentCollectedThisMonth,
    outstandingRent,
    delinquencyCount: collections.residentsOverdue.length,
    vendorInvoicesAwaitingApproval: collections.vendorInvoicesAwaitingApproval.length,
    vendorPaymentsDue: collections.vendorPaymentsDue.length
  });

  return {
    monthLabel: bounds.label,
    financialSnapshot: {
      expectedRentThisMonth,
      rentCollectedThisMonth,
      outstandingRent,
      outstandingBalance,
      totalDelinquency: collections.totalDelinquency,
      delinquencyCount: collections.residentsOverdue.length,
      aging: collections.aging,
      vendorPayablesOpen,
      vendorPaidThisMonth,
      vendorInvoicesAwaitingApproval: collections.vendorInvoicesAwaitingApproval.length,
      vendorPaymentsDue: collections.vendorPaymentsDue.length,
      upcomingCharges,
      netOperationalCash: netOperationalCash(rentCollectedThisMonth, vendorPaidThisMonth)
    },
    delinquencySummary: {
      residentsOverdue: collections.residentsOverdue,
      totalDelinquency: collections.totalDelinquency,
      aging: collections.aging,
      activeArrangements: collections.activeArrangements
    },
    vendorPayables: {
      awaitingApproval: collections.vendorInvoicesAwaitingApproval,
      scheduledPayments: collections.vendorPaymentsDue,
      openAmount: vendorPayablesOpen
    },
    properties,
    recentActivity,
    assistantRecommendation,
    alerts: [
      ...collections.alerts,
      ...(outstandingRent > 0
        ? [`${formatMoney(outstandingRent)} rent still outstanding`]
        : ["No outstanding rent"]),
      `Collected ${formatMoney(rentCollectedThisMonth)} of ${formatMoney(expectedRentThisMonth)} expected rent this month`
    ],
    quickActions: [
      { id: "post-rent", label: "Post rent", href: "/pm/financial-operations#charges" },
      { id: "record-payment", label: "Record payment", href: "/pm/financial-operations#payments" },
      { id: "sync-delinquency", label: "Sync delinquency", href: "/pm/financial-operations#delinquency" },
      { id: "assess-late-fees", label: "Assess late fees", href: "/pm/financial-operations#late-fees" },
      { id: "vendor-invoices", label: "Vendor invoices", href: "/pm/financial-operations#vendor-invoices" },
      { id: "owner-summary", label: "Owner summary", href: "/portal/owner/financials" },
      { id: "properties", label: "Property money", href: "/pm/properties" }
    ]
  };
}

export function ownerSummaryWithAssistant(summary: OwnerFinancialSummary) {
  return {
    ...summary,
    assistantRecommendation: buildOwnerAssistantRecommendation(summary)
  };
}
