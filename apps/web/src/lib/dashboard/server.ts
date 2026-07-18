import { createAuthServerComponentClient } from "../auth/server";
import { getApplicantDashboardMetrics, type ApplicantDashboardMetrics } from "../applicant/server";
import { getLeaseDashboardMetrics } from "../lease/server";
import { getMaintenanceDashboardMetrics } from "../maintenance/server";
import { getVendorDashboardMetrics } from "../vendor/server";
import { getCommunicationDashboardMetrics, type CommunicationDashboardMetrics } from "../communication/server";
import { getMessagingDashboardMetrics } from "../messaging/server";
import { getFinancialDashboardMetrics, getFinancialActivityForOrganization, type FinancialDashboardMetrics } from "../financial/server";
import { getMigrationDashboardMetrics, type MigrationDashboardMetrics } from "../migration/server";

export type DashboardTask = {
  id: string;
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  href: string;
  actionLabel: string;
};

export type DashboardActivity = {
  id: string;
  type: "property" | "unit" | "tenant" | "maintenance" | "lease" | "communication" | "financial" | "applicant";
  title: string;
  subtitle: string | null;
  timestamp: string;
  status: string;
  action: "created" | "updated" | "event";
  href: string;
};

export type DashboardMaintenanceSummary = {
  openWorkOrders: number;
  highPriorityWorkOrders: number;
  overdueWorkOrders: number;
  recentlyCompleted: number;
  openWorkOrderSample: Array<{
    id: string;
    workOrderNumber: string;
    title: string;
    priority: string;
    status: string;
    propertyName: string | null;
    href: string;
  }>;
  highPrioritySample: Array<{
    id: string;
    workOrderNumber: string;
    title: string;
    priority: string;
    status: string;
    href: string;
  }>;
  overdueSample: Array<{
    id: string;
    workOrderNumber: string;
    title: string;
    dueDate: string | null;
    href: string;
  }>;
  completedSample: Array<{
    id: string;
    workOrderNumber: string;
    title: string;
    completedAt: string | null;
    href: string;
  }>;
};

export type DashboardLeaseSummary = {
  activeLeases: number;
  upcomingExpirations: number;
  upcomingRenewals: number;
  upcomingMoveIns: number;
  upcomingMoveOuts: number;
  expiredLeases: number;
  renewalNeeded: number;
  expirationSample: Array<{
    id: string;
    leaseNumber: string;
    tenantName: string | null;
    propertyName: string | null;
    endDate: string;
    href: string;
  }>;
  renewalSample: Array<{
    id: string;
    leaseNumber: string;
    tenantName: string | null;
    renewalStatus: string;
    href: string;
  }>;
  moveInSample: Array<{
    id: string;
    leaseNumber: string;
    tenantName: string | null;
    moveInDate: string | null;
    href: string;
  }>;
  moveOutSample: Array<{
    id: string;
    leaseNumber: string;
    tenantName: string | null;
    moveOutDate: string | null;
    href: string;
  }>;
};

export type DashboardFinancialSummary = {
  rentDueToday: number;
  lateRentCount: number;
  outstandingBalancesTotal: number;
  ownerStatementsDraft: number;
  ownerStatementsGenerated: number;
  recentPaymentSample: Array<{
    id: string;
    paymentNumber: string;
    amount: number;
    paymentDate: string;
    href: string;
  }>;
  recentExpenseSample: Array<{
    id: string;
    expenseNumber: string;
    description: string;
    amount: number;
    expenseDate: string;
    href: string;
  }>;
};

export type DashboardApplicantSummary = ApplicantDashboardMetrics;

export type DashboardSnapshot = {
  propertiesTotal: number;
  unitsTotal: number;
  occupiedUnits: number;
  vacanciesTotal: number;
  vacantReadyUnits: number;
  tenantsTotal: number;
  activeTenants: number;
  recentMoveIns: number;
  recentTenantsCreated: number;
  propertiesWithoutUnits: number;
  occupancyRate: number;
  expiringLeasesTotal: number;
  renewalNeededTotal: number;
  recentActivity: DashboardActivity[];
  operationalTasks: DashboardTask[];
  maintenance: DashboardMaintenanceSummary | null;
  vendors: DashboardVendorSummary | null;
  leases: DashboardLeaseSummary | null;
  communications: CommunicationDashboardMetrics | null;
  financial: DashboardFinancialSummary | null;
  applicants: DashboardApplicantSummary | null;
  migration: MigrationDashboardMetrics | null;
};

export type DashboardVendorSummary = {
  openAssignments: number;
  awaitingResponse: number;
  inProgress: number;
  completedToday: number;
  preferredVendorCount: number;
  averageRating: number | null;
  assignmentSamples: Array<{
    id: string;
    vendorBusinessName: string;
    workOrderNumber: string;
    workOrderTitle: string;
    assignmentStatus: string;
    href: string;
  }>;
};

type SupabaseClientType = Awaited<ReturnType<typeof createAuthServerComponentClient>>;

const RECENT_TENANT_WINDOW_DAYS = 7;
const RECENT_MOVE_IN_WINDOW_DAYS = 30;

export async function getDashboardSnapshot(
  organizationId: string,
  client?: SupabaseClientType,
  userId?: string
): Promise<DashboardSnapshot> {
  const supabase = await resolveClient(client);
  const now = Date.now();
  const recentTenantSince = new Date(now - RECENT_TENANT_WINDOW_DAYS * 86_400_000).toISOString();
  const recentMoveInSince = new Date(now - RECENT_MOVE_IN_WINDOW_DAYS * 86_400_000).toISOString();

  const [
    { count: propertiesTotal, error: propertiesCountError },
    { count: unitsTotalCount, error: unitsTotalError },
    { count: activeUnitsCount, error: activeUnitsError },
    { count: occupiedUnitsCount, error: occupiedUnitsError },
    { count: vacantReadyCount, error: vacantReadyError },
    { count: tenantsTotalCount, error: tenantsTotalError },
    { count: activeTenantsCount, error: activeTenantsError },
    { count: recentTenantsCreatedCount, error: recentTenantsError },
    { count: recentMoveInsCount, error: recentMoveInsError },
    { data: propertyRows, error: propertyRowsError },
    { data: unitPropertyRows, error: unitPropertyRowsError }
  ] = await Promise.all([
    supabase
      .from("properties")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .is("deleted_at", null),
    supabase
      .from("units")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .is("deleted_at", null),
    supabase
      .from("units")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .is("deleted_at", null)
      .eq("status", "active"),
    supabase
      .from("units")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .is("deleted_at", null)
      .eq("status", "active")
      .eq("occupancy_status", "occupied"),
    supabase
      .from("units")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .is("deleted_at", null)
      .eq("status", "active")
      .eq("occupancy_status", "vacant_ready"),
    supabase
      .from("tenants")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .is("deleted_at", null),
    supabase
      .from("tenants")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .is("deleted_at", null)
      .eq("status", "active"),
    supabase
      .from("tenants")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .is("deleted_at", null)
      .gte("created_at", recentTenantSince),
    supabase
      .from("tenants")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .is("deleted_at", null)
      .not("move_in_date", "is", null)
      .gte("move_in_date", recentMoveInSince.slice(0, 10)),
    supabase
      .from("properties")
      .select("id")
      .eq("organization_id", organizationId)
      .is("deleted_at", null),
    supabase.from("units").select("property_id").eq("organization_id", organizationId).is("deleted_at", null)
  ]);

  assertNoError(propertiesCountError);
  assertNoError(unitsTotalError);
  assertNoError(activeUnitsError);
  assertNoError(occupiedUnitsError);
  assertNoError(vacantReadyError);
  assertNoError(tenantsTotalError);
  assertNoError(activeTenantsError);
  assertNoError(recentTenantsError);
  assertNoError(recentMoveInsError);
  assertNoError(propertyRowsError);
  assertNoError(unitPropertyRowsError);

  const propertiesWithUnits = new Set(
    ((unitPropertyRows ?? []) as Array<{ property_id: string }>).map((row) => row.property_id)
  );
  const propertiesWithoutUnits = ((propertyRows ?? []) as Array<{ id: string }>).filter(
    (property) => !propertiesWithUnits.has(property.id)
  ).length;

  const unitsTotal = unitsTotalCount ?? 0;
  const activeUnits = activeUnitsCount ?? 0;
  const vacantReadyUnits = vacantReadyCount ?? 0;
  const tenantsTotal = tenantsTotalCount ?? 0;
  const activeTenants = activeTenantsCount ?? 0;
  const recentTenantsCreated = recentTenantsCreatedCount ?? 0;
  const recentMoveIns = recentMoveInsCount ?? 0;

  const [recentActivity, vacantUnitSample, maintenanceMetrics, vendorMetrics, leaseMetrics, communicationMetrics, messagingMetrics, financialMetrics, financialActivityRows, applicantMetrics, migrationMetrics] =
    await Promise.all([
    getRecentActivity(organizationId, supabase),
    getVacantUnitSample(organizationId, supabase),
    getMaintenanceDashboardMetrics(organizationId, supabase).catch(() => null),
    getVendorDashboardMetrics(organizationId, supabase).catch(() => null),
    getLeaseDashboardMetrics(organizationId, supabase).catch(() => null),
    getCommunicationDashboardMetrics(organizationId, supabase).catch(() => null),
    userId ? getMessagingDashboardMetrics(organizationId, userId, supabase).catch(() => null) : Promise.resolve(null),
    getFinancialDashboardMetrics(organizationId, supabase).catch(() => null),
    getFinancialActivityForOrganization(organizationId, { limit: 6 }, supabase).catch(() => []),
    getApplicantDashboardMetrics(organizationId, supabase).catch(() => null),
    getMigrationDashboardMetrics(organizationId, supabase).catch(() => null)
  ]);

  const mergedCommunications: CommunicationDashboardMetrics | null = communicationMetrics
    ? {
        ...communicationMetrics,
        unreadMessages: messagingMetrics?.unreadMessages ?? 0,
        awaitingResidentReply: messagingMetrics?.awaitingResidentReply ?? 0,
        vendorReplies: messagingMetrics?.vendorReplies ?? 0,
        emergencyUnread: messagingMetrics?.emergencyUnread ?? 0,
        pendingConversations: messagingMetrics?.pendingConversations ?? 0,
        recentThreads: messagingMetrics?.recentThreads ?? []
      }
    : null;

  const occupiedUnits = leaseMetrics?.activeLeases ?? occupiedUnitsCount ?? 0;
  const vacanciesTotal = Math.max(activeUnits - occupiedUnits, 0);
  const occupancyRate = activeUnits === 0 ? 0 : occupiedUnits / activeUnits;

  const operationalTasks = buildTasks({
    propertiesTotal: propertiesTotal ?? 0,
    unitsTotal,
    tenantsTotal,
    vacanciesTotal,
    vacantReadyUnits,
    propertiesWithoutUnits,
    recentTenantsCreated,
    occupancyRate,
    vacantUnitSample,
    lateRentCount: financialMetrics?.lateRentCount ?? 0,
    approvedApplicantsReady: applicantMetrics?.recentlyApproved ?? 0,
    approvedApplicantSample: (applicantMetrics?.recentlyApprovedSample ?? []).map((item) => ({
      id: item.id,
      name: item.applicantName
    })),
    leasesAwaitingSignature: applicantMetrics?.awaitingSignatures ?? 0,
    maintenanceMetrics,
    vendorMetrics,
    leaseMetrics
  });

  const maintenanceActivity = maintenanceMetrics
    ? maintenanceMetrics.recentActivity.map(
        (event): DashboardActivity => ({
          id: `maintenance-event:${event.id}`,
          type: "maintenance",
          title: event.summary,
          subtitle: null,
          timestamp: event.createdAt,
          status: event.eventType,
          action: "event",
          href: `/maintenance/${event.workOrderId}`
        })
      )
    : [];

  const leaseActivity = leaseMetrics
    ? leaseMetrics.recentEvents.map(
        (event): DashboardActivity => ({
          id: `lease-event:${event.id}`,
          type: "lease",
          title: event.summary,
          subtitle: null,
          timestamp: event.createdAt,
          status: event.eventType,
          action: "event",
          href: `/leases/${event.leaseId}`
        })
      )
    : [];

  const communicationActivity = mergedCommunications
    ? mergedCommunications.recentActivity.map(
        (event): DashboardActivity => ({
          id: `communication:${event.id}`,
          type: "communication",
          title: event.title,
          subtitle: event.status,
          timestamp: event.timestamp,
          status: event.status,
          action: "event",
          href: event.href
        })
      )
    : [];

  const financialActivity = financialActivityRows.map(
    (event): DashboardActivity => ({
      id: `financial:${event.id}`,
      type: "financial",
      title: event.summary,
      subtitle: event.activityType.replaceAll("_", " "),
      timestamp: event.createdAt,
      status: event.activityType,
      action: "event",
      href: financialActivityHref(event.entityType, event.entityId)
    })
  );

  const applicantActivity = applicantMetrics
    ? applicantMetrics.recentEvents.map(
        (event): DashboardActivity => ({
          id: `applicant-event:${event.id}`,
          type: "applicant",
          title: event.summary,
          subtitle: event.applicationNumber,
          timestamp: event.createdAt,
          status: event.eventType,
          action: "event",
          href: event.href
        })
      )
    : [];

  const migrationActivity = migrationMetrics
    ? migrationMetrics.recentActivity.map(
        (event): DashboardActivity => ({
          id: `migration-event:${event.id}`,
          type: "property",
          title: event.summary,
          subtitle: event.jobNumber,
          timestamp: event.createdAt,
          status: event.eventType,
          action: "event",
          href: event.href
        })
      )
    : [];

  const mergedActivity = [...recentActivity, ...maintenanceActivity, ...leaseActivity, ...communicationActivity, ...financialActivity, ...applicantActivity, ...migrationActivity]
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    .slice(0, 12);

  return {
    propertiesTotal: propertiesTotal ?? 0,
    unitsTotal,
    occupiedUnits,
    vacanciesTotal,
    vacantReadyUnits,
    tenantsTotal,
    activeTenants,
    recentMoveIns,
    recentTenantsCreated,
    propertiesWithoutUnits,
    occupancyRate,
    expiringLeasesTotal: leaseMetrics?.upcomingExpirations ?? 0,
    renewalNeededTotal: leaseMetrics?.renewalNeeded ?? 0,
    recentActivity: mergedActivity,
    operationalTasks,
    maintenance: maintenanceMetrics
      ? {
          openWorkOrders: maintenanceMetrics.openWorkOrders,
          highPriorityWorkOrders: maintenanceMetrics.highPriorityWorkOrders,
          overdueWorkOrders: maintenanceMetrics.overdueWorkOrders,
          recentlyCompleted: maintenanceMetrics.recentlyCompleted,
          openWorkOrderSample: maintenanceMetrics.openWorkOrderSample.map((item) => ({
            id: item.id,
            workOrderNumber: item.workOrderNumber,
            title: item.title,
            priority: item.priority,
            status: item.status,
            propertyName: item.propertyName,
            href: `/maintenance/${item.id}`
          })),
          highPrioritySample: maintenanceMetrics.highPrioritySample.map((item) => ({
            id: item.id,
            workOrderNumber: item.workOrderNumber,
            title: item.title,
            priority: item.priority,
            status: item.status,
            href: `/maintenance/${item.id}`
          })),
          overdueSample: maintenanceMetrics.overdueSample.map((item) => ({
            id: item.id,
            workOrderNumber: item.workOrderNumber,
            title: item.title,
            dueDate: item.dueDate,
            href: `/maintenance/${item.id}`
          })),
          completedSample: maintenanceMetrics.completedSample.map((item) => ({
            id: item.id,
            workOrderNumber: item.workOrderNumber,
            title: item.title,
            completedAt: item.completedAt,
            href: `/maintenance/${item.id}`
          }))
        }
      : null,
    vendors: vendorMetrics
      ? {
          openAssignments: vendorMetrics.openAssignments,
          awaitingResponse: vendorMetrics.awaitingResponse,
          inProgress: vendorMetrics.inProgress,
          completedToday: vendorMetrics.completedToday,
          preferredVendorCount: vendorMetrics.preferredVendorCount,
          averageRating: vendorMetrics.averageRating,
          assignmentSamples: vendorMetrics.assignmentSamples.map((item) => ({
            id: item.id,
            vendorBusinessName: item.vendorBusinessName,
            workOrderNumber: item.workOrderNumber,
            workOrderTitle: item.workOrderTitle,
            assignmentStatus: item.assignmentStatus,
            href: `/maintenance/${item.workOrderId}`
          }))
        }
      : null,
    leases: leaseMetrics
      ? {
          activeLeases: leaseMetrics.activeLeases,
          upcomingExpirations: leaseMetrics.upcomingExpirations,
          upcomingRenewals: leaseMetrics.upcomingRenewals,
          upcomingMoveIns: leaseMetrics.upcomingMoveIns,
          upcomingMoveOuts: leaseMetrics.upcomingMoveOuts,
          expiredLeases: leaseMetrics.expiredLeases,
          renewalNeeded: leaseMetrics.renewalNeeded,
          expirationSample: leaseMetrics.expirationSample.map((item) => ({
            id: item.id,
            leaseNumber: item.leaseNumber,
            tenantName: item.tenantName,
            propertyName: item.propertyName,
            endDate: item.endDate,
            href: `/leases/${item.id}`
          })),
          renewalSample: leaseMetrics.renewalSample.map((item) => ({
            id: item.id,
            leaseNumber: item.leaseNumber,
            tenantName: item.tenantName,
            renewalStatus: item.renewalStatus,
            href: `/leases/${item.id}`
          })),
          moveInSample: leaseMetrics.moveInSample.map((item) => ({
            id: item.id,
            leaseNumber: item.leaseNumber,
            tenantName: item.tenantName,
            moveInDate: item.moveInDate,
            href: `/leases/${item.id}`
          })),
          moveOutSample: leaseMetrics.moveOutSample.map((item) => ({
            id: item.id,
            leaseNumber: item.leaseNumber,
            tenantName: item.tenantName,
            moveOutDate: item.moveOutDate,
            href: `/leases/${item.id}`
          }))
        }
      : null,
    communications: mergedCommunications,
    financial: financialMetrics ? toDashboardFinancialSummary(financialMetrics) : null,
    applicants: applicantMetrics,
    migration: migrationMetrics
  };
}

function financialActivityHref(entityType: string, entityId: string): string {
  if (entityType === "rent_charge") return `/financials/charges/${entityId}`;
  if (entityType === "payment") return `/financials/charges`;
  if (entityType === "expense") return `/financials/expenses`;
  if (entityType === "owner_statement") return `/financials/owner-statements/${entityId}`;
  return "/financials";
}

function toDashboardFinancialSummary(metrics: FinancialDashboardMetrics): DashboardFinancialSummary {
  return {
    rentDueToday: metrics.rentDueToday,
    lateRentCount: metrics.lateRentCount,
    outstandingBalancesTotal: metrics.outstandingBalancesTotal,
    ownerStatementsDraft: metrics.ownerStatementStatusCounts.draft,
    ownerStatementsGenerated: metrics.ownerStatementStatusCounts.generated + metrics.ownerStatementStatusCounts.sent,
    recentPaymentSample: metrics.recentPayments.map((payment) => ({
      id: payment.id,
      paymentNumber: payment.paymentNumber,
      amount: payment.amount,
      paymentDate: payment.paymentDate,
      href: payment.rentChargeId ? `/financials/charges/${payment.rentChargeId}` : "/financials/charges"
    })),
    recentExpenseSample: metrics.recentExpenses.map((expense) => ({
      id: expense.id,
      expenseNumber: expense.expenseNumber,
      description: expense.description,
      amount: expense.amount,
      expenseDate: expense.expenseDate,
      href: `/financials/expenses`
    }))
  };
}

async function getVacantUnitSample(
  organizationId: string,
  client: SupabaseClientType
): Promise<Array<{ id: string; unitNumber: string; propertyId: string }>> {
  const { data, error } = await client
    .from("units")
    .select("id, unit_number, property_id")
    .eq("organization_id", organizationId)
    .is("deleted_at", null)
    .eq("status", "active")
    .in("occupancy_status", ["vacant_ready", "vacant_not_ready"])
    .order("updated_at", { ascending: false })
    .limit(1);

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as Array<{ id: string; unit_number: string; property_id: string }>).map((unit) => ({
    id: unit.id,
    unitNumber: unit.unit_number,
    propertyId: unit.property_id
  }));
}

async function getRecentActivity(
  organizationId: string,
  client: SupabaseClientType
): Promise<DashboardActivity[]> {
  const [
    { data: properties, error: propertiesError },
    { data: units, error: unitsError },
    { data: tenants, error: tenantsError }
  ] = await Promise.all([
    supabaseActivityQuery(client, "properties", organizationId),
    supabaseActivityQuery(client, "units", organizationId),
    supabaseActivityQuery(client, "tenants", organizationId)
  ]);

  assertNoError(propertiesError);
  assertNoError(unitsError);
  assertNoError(tenantsError);

  const propertyActivity = (
    (properties ?? []) as Array<{
      id: string;
      name: string;
      created_at: string;
      updated_at: string;
      status: string;
    }>
  ).map(
    (property): DashboardActivity => ({
      id: `property:${property.id}`,
      type: "property",
      title: property.name,
      subtitle: "Property record",
      timestamp: property.updated_at,
      status: property.status,
      action: isCreatedEvent(property.created_at, property.updated_at) ? "created" : "updated",
      href: `/properties/${property.id}`
    })
  );

  const unitActivity = (
    (units ?? []) as Array<{
      id: string;
      unit_number: string;
      created_at: string;
      updated_at: string;
      status: string;
      properties: { name: string } | null;
    }>
  ).map(
    (unit): DashboardActivity => ({
      id: `unit:${unit.id}`,
      type: "unit",
      title: `Unit ${unit.unit_number}`,
      subtitle: unit.properties?.name ?? null,
      timestamp: unit.updated_at,
      status: unit.status,
      action: isCreatedEvent(unit.created_at, unit.updated_at) ? "created" : "updated",
      href: `/units/${unit.id}`
    })
  );

  const tenantActivity = (
    (tenants ?? []) as Array<{
      id: string;
      first_name: string;
      last_name: string;
      preferred_name: string | null;
      created_at: string;
      updated_at: string;
      status: string;
      properties: { name: string } | null;
    }>
  ).map(
    (tenant): DashboardActivity => ({
      id: `tenant:${tenant.id}`,
      type: "tenant",
      title: tenant.preferred_name || `${tenant.first_name} ${tenant.last_name}`,
      subtitle: tenant.properties?.name ?? null,
      timestamp: tenant.updated_at,
      status: tenant.status,
      action: isCreatedEvent(tenant.created_at, tenant.updated_at) ? "created" : "updated",
      href: `/tenants/${tenant.id}`
    })
  );

  return [...propertyActivity, ...unitActivity, ...tenantActivity]
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    .slice(0, 12);
}

async function supabaseActivityQuery(
  client: SupabaseClientType,
  table: "properties" | "units" | "tenants",
  organizationId: string
) {
  if (table === "properties") {
    return client
      .from("properties")
      .select("id, name, created_at, updated_at, status")
      .eq("organization_id", organizationId)
      .is("deleted_at", null)
      .order("updated_at", { ascending: false })
      .limit(6);
  }

  if (table === "units") {
    return client
      .from("units")
      .select("id, unit_number, created_at, updated_at, status, properties(name)")
      .eq("organization_id", organizationId)
      .is("deleted_at", null)
      .order("updated_at", { ascending: false })
      .limit(6);
  }

  return client
    .from("tenants")
    .select("id, first_name, last_name, preferred_name, created_at, updated_at, status, properties(name)")
    .eq("organization_id", organizationId)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false })
    .limit(6);
}

export function buildTasks({
  propertiesTotal,
  unitsTotal,
  tenantsTotal,
  vacanciesTotal,
  vacantReadyUnits,
  propertiesWithoutUnits,
  recentTenantsCreated,
  occupancyRate,
  vacantUnitSample,
  lateRentCount = 0,
  approvedApplicantsReady = 0,
  approvedApplicantSample = [],
  leasesAwaitingSignature = 0,
  maintenanceMetrics,
  vendorMetrics,
  leaseMetrics
}: {
  propertiesTotal: number;
  unitsTotal: number;
  tenantsTotal: number;
  vacanciesTotal: number;
  vacantReadyUnits: number;
  propertiesWithoutUnits: number;
  recentTenantsCreated: number;
  occupancyRate: number;
  vacantUnitSample: Array<{ id: string; unitNumber: string; propertyId?: string }>;
  lateRentCount?: number;
  approvedApplicantsReady?: number;
  approvedApplicantSample?: Array<{ id: string; name: string }>;
  leasesAwaitingSignature?: number;
  maintenanceMetrics?: Awaited<ReturnType<typeof getMaintenanceDashboardMetrics>> | null;
  vendorMetrics?: Awaited<ReturnType<typeof getVendorDashboardMetrics>> | null;
  leaseMetrics?: Awaited<ReturnType<typeof getLeaseDashboardMetrics>> | null;
}): DashboardTask[] {
  const tasks: DashboardTask[] = [];

  if (propertiesTotal === 0) {
    tasks.push({
      id: "create-first-property",
      title: "Create your first property",
      description: "Start your portfolio foundation by adding your first managed property.",
      priority: "high",
      href: "/properties/new",
      actionLabel: "Resolve · Create property"
    });
  }

  if (propertiesTotal > 0 && unitsTotal === 0) {
    tasks.push({
      id: "create-first-unit",
      title: "Add your first unit",
      description: "Define at least one unit to begin occupancy tracking and operational reporting.",
      priority: "high",
      href: "/units/new",
      actionLabel: "Resolve · Create unit"
    });
  }

  if (propertiesWithoutUnits > 0) {
    tasks.push({
      id: "properties-without-units",
      title:
        propertiesWithoutUnits === 1
          ? "1 property has no units"
          : `${propertiesWithoutUnits} properties have no units`,
      description: "Add units so occupancy and tenant assignment can be tracked per property.",
      priority: "high",
      href: "/properties",
      actionLabel: "Resolve · Review properties"
    });
  }

  if (lateRentCount > 0) {
    tasks.push({
      id: "record-late-rent",
      title: lateRentCount === 1 ? "1 late rent balance needs collection" : `${lateRentCount} late rent balances need collection`,
      description: "Record a payment against an open charge without hunting the charges list.",
      priority: "high",
      href: "/financials/payments/new",
      actionLabel: "Resolve · Record payment"
    });
  }

  if (approvedApplicantsReady > 0) {
    const sample = approvedApplicantSample[0];
    tasks.push({
      id: "approved-applicants-ready",
      title:
        approvedApplicantsReady === 1
          ? "1 approved applicant is ready for Move in"
          : `${approvedApplicantsReady} approved applicants are ready for Move in`,
      description: "Continue the one recommended path — Move in wizard, not separate lease creation.",
      priority: "high",
      href: sample
        ? `/residents/move-in?applicantId=${encodeURIComponent(sample.id)}`
        : "/residents/move-in",
      actionLabel: sample
        ? `Resolve · Continue Move in (${sample.name})`
        : "Resolve · Continue to Move In"
    });
  }

  if (leasesAwaitingSignature > 0) {
    tasks.push({
      id: "leases-awaiting-signature",
      title:
        leasesAwaitingSignature === 1
          ? "1 lease is waiting on signature"
          : `${leasesAwaitingSignature} leases are waiting on signature`,
      description: "Continue signing from draft leases — do not restart onboarding.",
      priority: "high",
      href: "/leases?status=draft",
      actionLabel: "Resolve · Continue signing"
    });
  }

  if (unitsTotal > 0 && tenantsTotal === 0) {
    tasks.push({
      id: "create-first-tenant",
      title: "Start your first move-in",
      description: "Use guided Move in to place a resident in a unit — the primary onboarding path.",
      priority: "high",
      href: "/residents/move-in",
      actionLabel: "Resolve · Start move-in"
    });
  }

  if (vacantReadyUnits > 0) {
    const sample = vacantUnitSample[0];
    const moveInHref = sample
      ? sample.propertyId
        ? `/residents/move-in?propertyId=${encodeURIComponent(sample.propertyId)}&unitId=${encodeURIComponent(sample.id)}`
        : `/residents/move-in?unitId=${encodeURIComponent(sample.id)}`
      : "/residents/move-in";
    tasks.push({
      id: "vacant-ready-units",
      title:
        vacantReadyUnits === 1
          ? "1 move-in ready unit needs a resident"
          : `${vacantReadyUnits} move-in ready units need residents`,
      description: "Start guided Move in for vacant-ready units to improve occupancy coverage.",
      priority: "high",
      href: moveInHref,
      actionLabel: sample ? `Resolve · Move in Unit ${sample.unitNumber}` : "Resolve · Start move-in"
    });
  } else if (vacanciesTotal > 0) {
    tasks.push({
      id: "review-vacancies",
      title: vacanciesTotal === 1 ? "1 vacant unit needs attention" : `${vacanciesTotal} vacant units need attention`,
      description: "Review unit readiness, then start Move in when a unit is ready.",
      priority: "medium",
      href: "/residents/move-in",
      actionLabel: "Resolve · Start move-in"
    });
  }

  if (recentTenantsCreated > 0) {
    tasks.push({
      id: "review-recent-tenants",
      title:
        recentTenantsCreated === 1
          ? "1 tenant was added recently"
          : `${recentTenantsCreated} tenants were added recently`,
      description: "Confirm unit assignments, contact details, and move-in dates are complete.",
      priority: "medium",
      href: "/tenants",
      actionLabel: "Resolve · Review tenants"
    });
  }

  if (unitsTotal > 0 && occupancyRate < 0.8 && vacanciesTotal === 0) {
    tasks.push({
      id: "improve-occupancy",
      title: "Occupancy is below target",
      description: "Portfolio occupancy is under 80%. Review unit statuses and tenant assignments.",
      priority: "medium",
      href: "/units",
      actionLabel: "Resolve · Review occupancy"
    });
  }

  if (leaseMetrics?.upcomingExpirations && leaseMetrics.upcomingExpirations > 0) {
    const sample = leaseMetrics.expirationSample[0];
    tasks.push({
      id: "leases-expiring-soon",
      title:
        leaseMetrics.upcomingExpirations === 1
          ? "1 lease expiring soon"
          : `${leaseMetrics.upcomingExpirations} leases expiring soon`,
      description: "Review renewal options and tenant notice timelines before expiration.",
      priority: "high",
      href: sample ? `/leases/${sample.id}` : "/leases",
      actionLabel: sample ? `Resolve · Review ${sample.leaseNumber}` : "Resolve · Review leases"
    });
  }

  if (leaseMetrics?.renewalNeeded && leaseMetrics.renewalNeeded > 0) {
    tasks.push({
      id: "leases-renewal-needed",
      title:
        leaseMetrics.renewalNeeded === 1
          ? "1 lease needs renewal attention"
          : `${leaseMetrics.renewalNeeded} leases need renewal attention`,
      description: "Offer renewals or prepare turnover workflows for upcoming expirations.",
      priority: "medium",
      href: "/leases",
      actionLabel: "Resolve · Review renewals"
    });
  }

  if (leaseMetrics?.upcomingMoveIns && leaseMetrics.upcomingMoveIns > 0) {
    const sample = leaseMetrics.moveInSample[0];
    tasks.push({
      id: "leases-upcoming-move-ins",
      title:
        leaseMetrics.upcomingMoveIns === 1
          ? "1 upcoming move-in"
          : `${leaseMetrics.upcomingMoveIns} upcoming move-ins`,
      description: "Confirm lease activation and unit readiness before move-in dates.",
      priority: "medium",
      href: sample ? `/leases/${sample.id}` : "/leases",
      actionLabel: sample ? `Resolve · Review ${sample.leaseNumber}` : "Resolve · Review move-ins"
    });
  }

  if (vendorMetrics?.awaitingResponse && vendorMetrics.awaitingResponse > 0) {
    const sample = vendorMetrics.assignmentSamples.find((item) => item.assignmentStatus === "awaiting_response");
    tasks.push({
      id: "vendors-awaiting-response",
      title:
        vendorMetrics.awaitingResponse === 1
          ? "1 vendor has not responded"
          : `${vendorMetrics.awaitingResponse} vendors have not responded`,
      description: "Follow up on vendor assignments awaiting acceptance.",
      priority: "high",
      href: sample ? `/maintenance/${sample.workOrderId}` : "/maintenance?status=waiting_vendor",
      actionLabel: sample ? `Resolve · Follow up ${sample.workOrderNumber}` : "Resolve · Waiting for vendor"
    });
  }

  if (maintenanceMetrics?.overdueWorkOrders && maintenanceMetrics.overdueWorkOrders > 0) {
    const sample = maintenanceMetrics.overdueSample[0];
    tasks.push({
      id: "overdue-maintenance",
      title:
        maintenanceMetrics.overdueWorkOrders === 1
          ? "1 overdue work order"
          : `${maintenanceMetrics.overdueWorkOrders} overdue work orders`,
      description: "Review due dates and reassign or escalate high-priority maintenance.",
      priority: "high",
      href: sample ? `/maintenance/${sample.id}` : "/maintenance?status=open",
      actionLabel: sample ? `Resolve · Advance ${sample.workOrderNumber}` : "Resolve · Overdue work"
    });
  } else if (maintenanceMetrics?.highPriorityWorkOrders && maintenanceMetrics.highPriorityWorkOrders > 0) {
    const sample = maintenanceMetrics.highPrioritySample[0];
    const needsAssign = sample && (sample.status === "submitted" || sample.status === "triaged");
    tasks.push({
      id: "high-priority-maintenance",
      title:
        maintenanceMetrics.highPriorityWorkOrders === 1
          ? "1 high-priority work order open"
          : `${maintenanceMetrics.highPriorityWorkOrders} high-priority work orders open`,
      description: "Triage emergency and high-priority maintenance — jump straight to the next workflow action.",
      priority: "high",
      href: sample
        ? needsAssign
          ? `/maintenance/${sample.id}#vendor`
          : `/maintenance/${sample.id}`
        : "/maintenance?priority=emergency_high",
      actionLabel: sample
        ? needsAssign
          ? `Resolve · Assign ${sample.workOrderNumber}`
          : `Resolve · Advance ${sample.workOrderNumber}`
        : "Resolve · Emergency work"
    });
  }

  if (tasks.length === 0) {
    tasks.push({
      id: "operations-healthy",
      title: "No urgent operational tasks",
      description: "Your portfolio foundation looks healthy. Monitor activity below for changes.",
      priority: "low",
      href: "/properties",
      actionLabel: "View portfolio"
    });
  }

  return tasks.slice(0, 6);
}

function isCreatedEvent(createdAt: string, updatedAt: string): boolean {
  const created = Date.parse(createdAt);
  const updated = Date.parse(updatedAt);
  if (Number.isNaN(created) || Number.isNaN(updated)) {
    return false;
  }
  return Math.abs(updated - created) < 2000;
}

function assertNoError(error: { message: string } | null): void {
  if (error) {
    throw new Error(error.message);
  }
}

async function resolveClient(client?: SupabaseClientType): Promise<SupabaseClientType> {
  return client ?? (await createAuthServerComponentClient());
}
