import type { SupabaseClient } from "@supabase/supabase-js";
import {
  buildOwnerPortfolioAssistantSummary,
  buildOwnerPortfolioGreeting,
  buildOwnerPortfolioReadyAssistantCopy,
  formatMoney
} from "@mpa/shared";
import { emitPropertyEvent, writePropertyAudit } from "./events-audit";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = SupabaseClient<any>;

export async function getOwnerPortfolioReadiness(supabase: Db, organizationId: string) {
  const { count, error } = await supabase
    .from("event_domain_events")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .eq("event_type", "owner_portfolio.reviewed");
  if (error) {
    throw new Error(error.message);
  }
  const reviewCount = count ?? 0;
  return {
    reviewCount,
    ownerPortfolioReady: reviewCount > 0
  };
}

export async function markOwnerPortfolioReviewed(
  supabase: Db,
  organizationId: string,
  actorId: string,
  dailyOpsReady: boolean
) {
  if (!dailyOpsReady) {
    return { marked: false };
  }
  const existing = await getOwnerPortfolioReadiness(supabase, organizationId);
  if (existing.ownerPortfolioReady) {
    return { marked: false, ...existing };
  }

  await emitPropertyEvent({
    supabase,
    organizationId,
    actorId,
    eventType: "owner_portfolio.reviewed",
    aggregateType: "organizations",
    aggregateId: organizationId,
    payload: { source: "owner_portfolio_home" }
  });
  await writePropertyAudit({
    supabase,
    organizationId,
    actorId,
    action: "owner_portfolio.reviewed",
    entityType: "organizations",
    entityId: organizationId,
    payload: { source: "owner_portfolio_home" }
  });

  return { marked: true, ownerPortfolioReady: true, reviewCount: 1 };
}

export async function buildOwnerPortfolioHome(
  supabase: Db,
  organizationId: string,
  actor: { userId: string; displayName?: string | null },
  options?: { markReviewed?: boolean; dailyOpsReady?: boolean }
) {
  const {
    getOwnerFinancialSummary,
    getRecentFinancialActivity,
    ownerSummaryWithAssistant
  } = await import("../finance/reporting-service");

  const [summaryRaw, recentActivity, { data: openWorkOrders }, { data: activeLeases }, { data: recentEvents }] =
    await Promise.all([
      getOwnerFinancialSummary(supabase, organizationId),
      getRecentFinancialActivity(supabase, organizationId, 12),
      supabase
        .from("maintenance_work_orders")
        .select("id, title, status, priority, property_id, assignee_type, vendor_vendors(name)")
        .eq("organization_id", organizationId)
        .in("status", ["submitted", "triaged", "assigned", "in_progress", "completed"])
        .order("submitted_at", { ascending: false })
        .limit(12),
      supabase
        .from("lease_agreements")
        .select("id, status, rent_amount, property_id, pm_residents(display_name), property_properties(name)")
        .eq("organization_id", organizationId)
        .eq("status", "active")
        .order("activated_at", { ascending: false })
        .limit(20),
      supabase
        .from("event_domain_events")
        .select("id, event_type, created_at, payload, aggregate_id")
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false })
        .limit(12)
    ]);

  const summary = ownerSummaryWithAssistant(summaryRaw);
  const workOrders = openWorkOrders ?? [];
  const leases = activeLeases ?? [];
  const payments = recentActivity.filter((item) => item.kind === "payment");
  const vendorActivity = recentActivity.filter(
    (item) => item.kind === "vendor_invoice" || item.kind === "vendor_payment"
  );

  if (options?.markReviewed && options.dailyOpsReady !== false) {
    await markOwnerPortfolioReviewed(
      supabase,
      organizationId,
      actor.userId,
      options.dailyOpsReady ?? true
    );
  }

  const readiness = await getOwnerPortfolioReadiness(supabase, organizationId);

  const assistantSummary = buildOwnerPortfolioAssistantSummary({
    propertyCount: summary.properties.length,
    unitsOccupied: summary.occupancy.unitsOccupied,
    unitsTotal: summary.occupancy.unitsTotal,
    occupancyRate: summary.occupancy.occupancyRate,
    currentMonthIncome: summary.currentMonthIncome,
    outstandingRent: summary.outstandingRent,
    vendorPayments: summary.vendorPayments,
    openMaintenanceCount: workOrders.length,
    activeLeaseCount: leases.length,
    recentPaymentCount: payments.length
  });

  return {
    greeting: buildOwnerPortfolioGreeting({ displayName: actor.displayName ?? null }),
    successCopy: buildOwnerPortfolioReadyAssistantCopy(),
    assistantSummary,
    ownerPortfolioReady: readiness.ownerPortfolioReady,
    portfolioSummary: {
      monthLabel: summary.monthLabel,
      propertyCount: summary.properties.length,
      currentMonthIncome: summary.currentMonthIncome,
      currentMonthExpenses: summary.currentMonthExpenses,
      outstandingRent: summary.outstandingRent,
      vendorPayments: summary.vendorPayments,
      netOperationalCash: summary.netOperationalCash,
      occupancy: summary.occupancy,
      activeLeaseCount: leases.length,
      openMaintenanceCount: workOrders.length
    },
    properties: summary.properties.map((property) => ({
      propertyId: property.propertyId,
      propertyName: property.propertyName,
      rentCollectedThisMonth: property.rentCollectedThisMonth,
      outstandingRent: property.outstandingRent,
      vendorPaidThisMonth: property.vendorPaidThisMonth,
      netOperationalCash: property.netOperationalCash,
      occupancyRate: property.occupancyRate,
      unitsOccupied: property.unitsOccupied,
      unitsTotal: property.unitsTotal,
      alerts: property.alerts,
      href: `/portal/owner/properties/${property.propertyId}`
    })),
    outstandingRent: {
      total: summary.outstandingRent,
      label:
        summary.outstandingRent > 0
          ? `${formatMoney(summary.outstandingRent)} outstanding across the portfolio`
          : "No outstanding rent"
    },
    recentPayments: payments.slice(0, 8).map((item) => ({
      id: item.id,
      title: item.title,
      detail: item.detail,
      amount: item.amount,
      occurredAt: item.occurredAt,
      propertyId: item.propertyId ?? null
    })),
    openMaintenance: workOrders.slice(0, 8).map((row) => {
      const vendor = row.vendor_vendors as { name?: string } | Array<{ name?: string }> | null;
      const vendorName = (Array.isArray(vendor) ? vendor[0]?.name : vendor?.name) ?? null;
      return {
        id: row.id as string,
        title: row.title as string,
        status: row.status as string,
        priority: row.priority as string,
        vendorName,
        propertyId: row.property_id as string | null,
        href: row.property_id
          ? `/portal/owner/properties/${row.property_id}`
          : "/portal/owner"
      };
    }),
    vendorActivity: vendorActivity.slice(0, 8).map((item) => ({
      id: item.id,
      title: item.title,
      detail: item.detail,
      amount: item.amount,
      occurredAt: item.occurredAt,
      propertyId: item.propertyId ?? null
    })),
    activeLeases: leases.slice(0, 8).map((lease) => {
      const resident = Array.isArray(lease.pm_residents)
        ? lease.pm_residents[0]
        : lease.pm_residents;
      const property = Array.isArray(lease.property_properties)
        ? lease.property_properties[0]
        : lease.property_properties;
      return {
        id: lease.id as string,
        status: lease.status as string,
        rentAmount: Number(lease.rent_amount),
        residentName: (resident as { display_name?: string } | null)?.display_name ?? "Resident",
        propertyName: (property as { name?: string } | null)?.name ?? "Property",
        propertyId: lease.property_id as string,
        href: `/portal/owner/properties/${lease.property_id}`
      };
    }),
    recentDocuments: await (async () => {
      try {
        const { listDocuments } = await import("../documents/document-service");
        const docs = await listDocuments(supabase, organizationId);
        return {
          available: docs.length > 0,
          items: docs.slice(0, 6).map((doc) => ({
            id: doc.id,
            title: doc.title,
            detail: `${doc.entityType} · ${doc.category}`,
            href: "/shared/documents"
          })),
          honesty:
            docs.length > 0
              ? null
              : "No portfolio documents yet. Lease agreements and uploads appear here from the shared Documents library."
        };
      } catch {
        return {
          available: false,
          items: [] as Array<{ id: string; title: string; detail?: string; href?: string }>,
          honesty:
            "Documents are temporarily unavailable. Open the shared Documents library when ready."
        };
      }
    })(),
    recentTimeline: (recentEvents ?? []).slice(0, 10).map((event) => ({
      id: event.id as string,
      title: String(event.event_type),
      detail:
        typeof (event.payload as { title?: string } | null)?.title === "string"
          ? (event.payload as { title: string }).title
          : typeof (event.payload as { name?: string } | null)?.name === "string"
            ? (event.payload as { name: string }).name
            : "Portfolio activity",
      occurredAt: event.created_at as string
    })),
    financeAlerts: summary.alerts,
    financeAssistantRecommendation: summary.assistantRecommendation
  };
}

export async function buildOwnerPropertyDrillDown(
  supabase: Db,
  organizationId: string,
  propertyId: string
) {
  const { getPropertyCommandCenter } = await import("./property-service");
  const { getPropertyFinancialSnapshot, getRecentFinancialActivity } = await import(
    "../finance/reporting-service"
  );

  const [commandCenter, snapshot, recentActivity] = await Promise.all([
    getPropertyCommandCenter(supabase, organizationId, propertyId),
    getPropertyFinancialSnapshot(supabase, organizationId, propertyId),
    getRecentFinancialActivity(supabase, organizationId, 20)
  ]);

  if (!commandCenter) {
    return null;
  }

  return {
    property: commandCenter.property,
    occupancy: {
      unitsOccupied: commandCenter.property.unitsOccupied,
      unitsTotal: commandCenter.property.unitCount,
      unitsAvailable: commandCenter.property.unitsAvailable,
      residentsAssigned: commandCenter.property.residentsAssigned
    },
    residents: commandCenter.residents,
    activeLeases: commandCenter.activeLeases,
    financialSnapshot: snapshot,
    maintenance: commandCenter.maintenance,
    recentActivity: recentActivity.filter((item) => item.propertyId === propertyId).slice(0, 8),
    timeline: commandCenter.timeline,
    assistantRecommendation:
      snapshot.outstandingRent > 0
        ? `${formatMoney(snapshot.outstandingRent)} outstanding on this property. Review occupancy and open maintenance next.`
        : commandCenter.maintenance && commandCenter.maintenance.openCount > 0
          ? `${commandCenter.maintenance.openCount} open maintenance item(s) on this property.`
          : "This property looks operationally steady. Review the timeline for recent activity.",
    documentsHonesty:
      "Property documents appear in Documents when uploaded or indexed from leases. Operational records below reuse Property Command Center and Financial Operations."
  };
}
