import type { User } from "@supabase/supabase-js";
import { evaluatePermission, resolveAuthorizationContext } from "../auth/authorization";
import type { createAuthServerComponentClient } from "../auth/server";
import { formatCurrency } from "../financial/contracts";
import {
  getExpensesForOrganization,
  getOwnerStatementsForOrganization,
  getPaymentsForOrganization,
  getPropertyFinancialSummary,
  type PropertyFinancialSummary
} from "../financial/server";
import { listFacilityTimelineEvents } from "../facility/timeline";
import { getLeasesForOrganization } from "../lease/server";
import { toLeaseStatusLabel } from "../lease/contracts";
import { getWorkOrdersForOrganization } from "../maintenance/server";
import {
  toPropertyStatusLabel,
  toPropertyTypeLabel,
  type PropertyStatus,
  type PropertyType
} from "../property/contracts";
import type { PropertyListItem } from "../property/server";
import {
  isPropertyInOwnerScope,
  resolveOwnerPropertyScope,
  type OwnerPropertyScope
} from "./access";
import { loadOwnerDocumentsExperience } from "./documents-experience";
import type { OwnerDocumentListItem } from "./documents-shared";
import { loadOwnerMessagingExperience } from "./messaging-experience";

type SupabaseClient = Awaited<ReturnType<typeof createAuthServerComponentClient>>;

export type OwnerPropertyListCard = {
  id: string;
  name: string;
  address: string;
  status: PropertyStatus;
  statusLabel: string;
  propertyType: PropertyType;
  propertyTypeLabel: string;
  unitCount: number;
  occupiedUnits: number;
  occupancyPercent: number | null;
  monthlyRevenue: number | null;
  monthlyRevenueLabel: string | null;
  openMaintenanceCount: number | null;
};

export type OwnerPropertyResidentRow = {
  id: string;
  residentName: string;
  unitLabel: string;
  leaseStart: string;
  leaseEnd: string;
  leaseStatusLabel: string;
};

export type OwnerPropertyActivityItem = {
  id: string;
  kind: "maintenance" | "message" | "inspection" | "financial";
  title: string;
  subtitle: string;
  at: string;
  href?: string;
};

export type OwnerPropertyFinancialStrip = {
  currentBalanceLabel: string;
  monthlyCollectionsLabel: string;
  monthlyExpensesLabel: string;
  outstandingBalanceLabel: string;
  latestStatement: {
    id: string;
    label: string;
    href: string;
  } | null;
};

export type OwnerPropertyDetailModel = {
  propertyId: string;
  name: string;
  address: string;
  propertyTypeLabel: string;
  statusLabel: string;
  occupancyPercent: number | null;
  unitCount: number;
  occupiedUnits: number;
  ownershipEntityName: string | null;
  financial: OwnerPropertyFinancialStrip | null;
  financialUnavailable: string | null;
  residents: OwnerPropertyResidentRow[];
  residentsUnavailable: string | null;
  documents: OwnerDocumentListItem[];
  documentsUnavailable: string | null;
  activity: OwnerPropertyActivityItem[];
  activityNotes: string[];
};

async function safeLoad<T>(loader: () => Promise<T>): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  try {
    return { ok: true, data: await loader() };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Unable to load data."
    };
  }
}

export function formatOwnerPropertyAddress(property: {
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  stateRegion: string;
  postalCode: string;
}): string {
  const line = [property.addressLine1, property.addressLine2].filter(Boolean).join(", ");
  const cityLine = [property.city, property.stateRegion, property.postalCode].filter(Boolean).join(", ");
  return [line, cityLine].filter(Boolean).join(" · ") || "Address unavailable";
}

function occupancyPercent(property: PropertyListItem): number | null {
  if (property.unitCount <= 0) return null;
  return Math.round((property.occupiedUnits / property.unitCount) * 100);
}

function toFinancialStrip(
  summary: PropertyFinancialSummary,
  latestStatement: { id: string; statementPeriodStart: string; statementPeriodEnd: string } | null
): OwnerPropertyFinancialStrip {
  return {
    currentBalanceLabel: formatCurrency(summary.noi),
    monthlyCollectionsLabel: formatCurrency(summary.monthlyIncome),
    monthlyExpensesLabel: formatCurrency(summary.monthlyExpenses),
    outstandingBalanceLabel: formatCurrency(summary.outstandingBalance),
    latestStatement: latestStatement
      ? {
          id: latestStatement.id,
          label: `${latestStatement.statementPeriodStart} → ${latestStatement.statementPeriodEnd}`,
          href: "/portal/owner/financials#statements"
        }
      : null
  };
}

/**
 * OWNER-001 Phase 3 — properties list cards for owner-authorized properties only.
 */
export async function loadOwnerPropertiesList(input: {
  user: User;
  organizationId: string;
  supabase: SupabaseClient;
}): Promise<{ properties: OwnerPropertyListCard[]; scope: OwnerPropertyScope }> {
  const { user, organizationId, supabase } = input;
  const authorization = await resolveAuthorizationContext(user, organizationId);
  if (!evaluatePermission(authorization, "property:read")) {
    throw new Error("Property access is not enabled for this account.");
  }

  const scope = await resolveOwnerPropertyScope({ organizationId, user, supabase });
  const canReadFinancials = evaluatePermission(authorization, "financial:read");
  const canReadMaintenance = evaluatePermission(authorization, "maintenance:read");

  const summaryByPropertyId = new Map<string, number>();
  if (canReadFinancials && scope.propertyIds.length > 0) {
    const capped = scope.propertyIds.slice(0, 20);
    const summariesResult = await safeLoad(() =>
      Promise.all(capped.map((propertyId) => getPropertyFinancialSummary(organizationId, propertyId, supabase)))
    );
    if (summariesResult.ok) {
      for (const summary of summariesResult.data) {
        summaryByPropertyId.set(summary.propertyId, summary.monthlyIncome);
      }
    }
  }

  const openCountByPropertyId = new Map<string, number>();
  if (canReadMaintenance && scope.propertyIds.length > 0) {
    const cappedIds = scope.propertyIds.slice(0, 20);
    const openResults = await Promise.all(
      cappedIds.map(async (propertyId) => {
        const result = await safeLoad(() =>
          getWorkOrdersForOrganization(
            organizationId,
            { propertyId, status: "open", limit: 100 },
            supabase
          )
        );
        return { propertyId, result };
      })
    );
    for (const { propertyId, result } of openResults) {
      if (result.ok) {
        openCountByPropertyId.set(propertyId, result.data.length);
      }
    }
  }

  const properties: OwnerPropertyListCard[] = scope.properties.map((property) => {
    const percent = occupancyPercent(property);
    const monthlyRevenue = canReadFinancials ? (summaryByPropertyId.get(property.id) ?? null) : null;
    return {
      id: property.id,
      name: property.name,
      address: formatOwnerPropertyAddress(property),
      status: property.status,
      statusLabel: toPropertyStatusLabel(property.status),
      propertyType: property.propertyType,
      propertyTypeLabel: toPropertyTypeLabel(property.propertyType),
      unitCount: property.unitCount,
      occupiedUnits: property.occupiedUnits,
      occupancyPercent: percent,
      monthlyRevenue,
      monthlyRevenueLabel: monthlyRevenue === null ? null : formatCurrency(monthlyRevenue),
      openMaintenanceCount: canReadMaintenance ? (openCountByPropertyId.get(property.id) ?? 0) : null
    };
  });

  return { properties, scope };
}

/**
 * OWNER-001 Phase 3 — property detail. Callers must redirect to unauthorized when null.
 */
export async function loadOwnerPropertyDetail(input: {
  user: User;
  organizationId: string;
  propertyId: string;
  supabase: SupabaseClient;
}): Promise<OwnerPropertyDetailModel | null> {
  const { user, organizationId, propertyId, supabase } = input;
  const authorization = await resolveAuthorizationContext(user, organizationId);
  if (!evaluatePermission(authorization, "property:read")) {
    return null;
  }

  const scope = await resolveOwnerPropertyScope({ organizationId, user, supabase });
  if (!isPropertyInOwnerScope(propertyId, scope)) {
    return null;
  }

  const property = scope.properties.find((item) => item.id === propertyId);
  if (!property) {
    return null;
  }

  const canReadFinancials = evaluatePermission(authorization, "financial:read");
  const canReadLeases = evaluatePermission(authorization, "lease:read");
  const canReadDocuments = evaluatePermission(authorization, "document:read");
  const canReadMaintenance = evaluatePermission(authorization, "maintenance:read");
  const canReadMessages = evaluatePermission(authorization, "message:read");

  let financial: OwnerPropertyFinancialStrip | null = null;
  let financialUnavailable: string | null = null;
  if (!canReadFinancials) {
    financialUnavailable = "Financial access is not enabled for this account.";
  } else {
    const [summaryResult, statementsResult] = await Promise.all([
      safeLoad(() => getPropertyFinancialSummary(organizationId, propertyId, supabase)),
      safeLoad(() =>
        getOwnerStatementsForOrganization(organizationId, { propertyId, limit: 5 }, supabase)
      )
    ]);
    if (!summaryResult.ok) {
      financialUnavailable = summaryResult.error;
    } else {
      const latest = statementsResult.ok ? (statementsResult.data[0] ?? null) : null;
      financial = toFinancialStrip(summaryResult.data, latest);
    }
  }

  let residents: OwnerPropertyResidentRow[] = [];
  let residentsUnavailable: string | null = null;
  if (!canReadLeases) {
    residentsUnavailable = "Lease access is not enabled for this account.";
  } else {
    const leasesResult = await safeLoad(() =>
      getLeasesForOrganization(
        organizationId,
        { propertyId, limit: 50, sortBy: "end_date", sortOrder: "desc" },
        supabase
      )
    );
    if (!leasesResult.ok) {
      residentsUnavailable = leasesResult.error;
    } else {
      // Safe projection only — no DOB, SSN, phone, email, payment methods, or screening.
      residents = leasesResult.data.map((lease) => ({
        id: lease.id,
        residentName: lease.tenantName?.trim() || "Resident",
        unitLabel: lease.unitNumber?.trim() || "Unit unavailable",
        leaseStart: lease.startDate,
        leaseEnd: lease.endDate,
        leaseStatusLabel: toLeaseStatusLabel(lease.status)
      }));
    }
  }

  let documents: OwnerDocumentListItem[] = [];
  let documentsUnavailable: string | null = null;
  if (!canReadDocuments) {
    documentsUnavailable = "Document access is not enabled for this account.";
  } else {
    const docsResult = await safeLoad(() =>
      loadOwnerDocumentsExperience({ organizationId, user, supabase, propertyId })
    );
    if (!docsResult.ok) {
      documentsUnavailable = docsResult.error;
    } else {
      documents = docsResult.data.documents;
    }
  }

  const activity: OwnerPropertyActivityItem[] = [];
  const activityNotes: string[] = [];

  if (canReadMaintenance) {
    const maintenanceResult = await safeLoad(() =>
      getWorkOrdersForOrganization(
        organizationId,
        { propertyId, limit: 8, sortBy: "updated_at", sortOrder: "desc" },
        supabase
      )
    );
    if (maintenanceResult.ok) {
      for (const item of maintenanceResult.data) {
        activity.push({
          id: `wo-${item.id}`,
          kind: "maintenance",
          title: item.title || item.workOrderNumber,
          subtitle: `Maintenance · ${item.status}`,
          at: item.updatedAt
        });
      }
    } else {
      activityNotes.push("Recent maintenance could not be loaded.");
    }
  }

  if (canReadMessages) {
    const threadsResult = await safeLoad(() =>
      loadOwnerMessagingExperience({ organizationId, user, supabase })
    );
    if (threadsResult.ok) {
      for (const thread of threadsResult.data.conversations.filter((item) => item.propertyId === propertyId).slice(0, 8)) {
        activity.push({
          id: `msg-${thread.id}`,
          kind: "message",
          title: thread.subject,
          subtitle: "Message",
          at: thread.lastActivityAt || new Date(0).toISOString(),
          href: `/portal/owner/messages?thread=${encodeURIComponent(thread.id)}`
        });
      }
    } else {
      activityNotes.push("Recent messages could not be loaded.");
    }
  }

  const inspectionsResult = await safeLoad(() =>
    listFacilityTimelineEvents(
      organizationId,
      { propertyId, filter: "inspections", limit: 8 },
      supabase
    )
  );
  if (inspectionsResult.ok) {
    for (const event of inspectionsResult.data) {
      activity.push({
        id: `insp-${event.id}`,
        kind: "inspection",
        title: event.title || "Inspection",
        subtitle: "Inspection",
        at: event.occurredAt
      });
    }
  } else {
    activityNotes.push("Inspection timeline is unavailable for this property.");
  }

  if (canReadFinancials) {
    const [paymentsResult, expensesResult] = await Promise.all([
      safeLoad(() =>
        getPaymentsForOrganization(organizationId, { propertyId, limit: 8 }, supabase)
      ),
      safeLoad(() =>
        getExpensesForOrganization(organizationId, { propertyId, limit: 8 }, supabase)
      )
    ]);
    if (paymentsResult.ok) {
      for (const payment of paymentsResult.data) {
        activity.push({
          id: `pay-${payment.id}`,
          kind: "financial",
          title: payment.paymentNumber || "Payment",
          subtitle: `Collection · ${formatCurrency(payment.amount)}`,
          at: payment.paymentDate
        });
      }
    } else {
      activityNotes.push("Recent collections could not be loaded.");
    }
    if (expensesResult.ok) {
      for (const expense of expensesResult.data) {
        activity.push({
          id: `exp-${expense.id}`,
          kind: "financial",
          title: expense.description || expense.expenseNumber,
          subtitle: `Expense · ${formatCurrency(expense.amount)}`,
          at: expense.expenseDate
        });
      }
    } else {
      activityNotes.push("Recent expenses could not be loaded.");
    }
  }

  activity.sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0));

  const percent = occupancyPercent(property);

  return {
    propertyId: property.id,
    name: property.name,
    address: formatOwnerPropertyAddress(property),
    propertyTypeLabel: toPropertyTypeLabel(property.propertyType),
    statusLabel: toPropertyStatusLabel(property.status),
    occupancyPercent: percent,
    unitCount: property.unitCount,
    occupiedUnits: property.occupiedUnits,
    ownershipEntityName: property.ownershipEntityName,
    financial,
    financialUnavailable,
    residents,
    residentsUnavailable,
    documents,
    documentsUnavailable,
    activity: activity.slice(0, 20),
    activityNotes
  };
}
