import type { SupabaseClient } from "@supabase/supabase-js";
import {
  assembleReportingSnapshot,
  type AuthorizedReportShape,
  type RawReportingFacts,
  type ReportArea,
  type ReportingFilters,
  type ReportingSnapshot
} from "@mpa/shared";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = SupabaseClient<any>;

async function safeSelect<T>(promise: PromiseLike<{ data: T | null; error: { message: string } | null }>): Promise<T | null> {
  try {
    const { data, error } = await promise;
    if (error) return null;
    return data;
  } catch {
    return null;
  }
}

const emptyFacts = (): RawReportingFacts => ({
  properties: [],
  units: [],
  leases: [],
  residents: [],
  workOrders: [],
  documents: [],
  finance: null,
  subscription: null,
  vendors: [],
  applications: []
});

export async function buildOrganizationReportingSnapshot(
  supabase: Db,
  organizationId: string,
  options: {
    roles: readonly string[];
    filters?: ReportingFilters;
    shape: AuthorizedReportShape;
    isPlatformOperator?: boolean;
  }
): Promise<ReportingSnapshot> {
  const filters = options.filters ?? {};
  const shape = options.shape;
  const persona = shape.persona ?? "facility_manager";

  const orgPromise = safeSelect(
    supabase.from("organizations").select("id, name").eq("id", organizationId).maybeSingle()
  );
  const subscriptionPromise = safeSelect(
    supabase
      .from("organization_subscriptions")
      .select("status, sku_code, billing_cycle")
      .eq("organization_id", organizationId)
      .maybeSingle()
  );
  const setupPromise = safeSelect(
    supabase
      .from("organization_setup_state")
      .select("completed_at, product_confirmed")
      .eq("organization_id", organizationId)
      .maybeSingle()
  );
  const documentsPromise = safeSelect(
    supabase
      .from("document_documents")
      .select("id, title, status, category, created_at, entity_type")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false })
      .limit(200)
  );
  const vendorsPromise = safeSelect(
    supabase
      .from("vendor_vendors")
      .select("id, name, status")
      .eq("organization_id", organizationId)
      .limit(100)
  );

  let workOrdersQuery = supabase
    .from("maintenance_work_orders")
    .select("id, title, status, priority, assignee_type, property_id, submitted_at, completed_at, work_surface")
    .eq("organization_id", organizationId)
    .order("submitted_at", { ascending: false })
    .limit(100);
  if (shape.workSurface === "residential" || shape.workSurface === "facility") {
    workOrdersQuery = workOrdersQuery.eq("work_surface", shape.workSurface);
  }

  const workOrdersPromise = safeSelect(workOrdersQuery);

  const propertiesPromise = shape.loadPropertyFacts
    ? safeSelect(
        supabase
          .from("property_properties")
          .select("id, name, status")
          .eq("organization_id", organizationId)
          .order("name", { ascending: true })
          .limit(200)
      )
    : Promise.resolve(null);
  const unitsPromise = shape.loadPropertyFacts
    ? safeSelect(
        supabase
          .from("property_units")
          .select("id, property_id, status")
          .eq("organization_id", organizationId)
          .limit(500)
      )
    : Promise.resolve(null);
  const leasesPromise = shape.loadPropertyFacts
    ? safeSelect(
        supabase
          .from("lease_agreements")
          .select("id, status, start_date, end_date, pm_residents!resident_id(display_name), property_properties(name)")
          .eq("organization_id", organizationId)
          .order("end_date", { ascending: true })
          .limit(100)
      )
    : Promise.resolve(null);
  const applicationsPromise = shape.loadPropertyFacts
    ? safeSelect(
        supabase
          .from("lease_applications")
          .select("id, status, submitted_at, decided_at, property_id")
          .eq("organization_id", organizationId)
          .order("created_at", { ascending: false })
          .limit(200)
      )
    : Promise.resolve(null);
  const residentsPromise = shape.loadResidentFacts
    ? safeSelect(
        supabase
          .from("pm_residents")
          .select("id, display_name, portal_status, status")
          .eq("organization_id", organizationId)
          .limit(200)
      )
    : Promise.resolve(null);
  const financePromise = shape.loadFinance
    ? import("../finance/reporting-service")
        .then((mod) => mod.getCommandCenterReport(supabase, organizationId))
        .catch(() => null)
    : Promise.resolve(null);

  const [
    orgRow,
    properties,
    units,
    leases,
    residents,
    workOrders,
    documents,
    vendors,
    subscription,
    setupState,
    financeReport,
    applications
  ] = await Promise.all([
    orgPromise,
    propertiesPromise,
    unitsPromise,
    leasesPromise,
    residentsPromise,
    workOrdersPromise,
    documentsPromise,
    vendorsPromise,
    subscriptionPromise,
    setupPromise,
    financePromise,
    applicationsPromise
  ]);

  let propertyList = (properties ?? []) as Array<{ id: string; name: string; status?: string | null }>;
  if (filters.propertyId) {
    propertyList = propertyList.filter((p) => p.id === filters.propertyId);
  }

  const propertyIds = new Set(propertyList.map((p) => p.id));

  let unitList = ((units ?? []) as Array<{ id: string; property_id: string | null; status?: string | null }>).map(
    (u) => ({ id: u.id, propertyId: u.property_id, status: u.status })
  );
  if (filters.propertyId) {
    unitList = unitList.filter((u) => u.propertyId === filters.propertyId);
  }

  type LeaseRow = {
    id: string;
    status: string;
    start_date: string | null;
    end_date: string | null;
    pm_residents?: { display_name?: string | null } | { display_name?: string | null }[] | null;
    property_properties?: { name?: string | null } | { name?: string | null }[] | null;
  };

  const leaseList = ((leases ?? []) as LeaseRow[]).map((lease) => {
    const resident = Array.isArray(lease.pm_residents) ? lease.pm_residents[0] : lease.pm_residents;
    const property = Array.isArray(lease.property_properties)
      ? lease.property_properties[0]
      : lease.property_properties;
    return {
      id: lease.id,
      status: lease.status,
      startDate: lease.start_date,
      endDate: lease.end_date,
      residentName: resident?.display_name ?? null,
      propertyName: property?.name ?? null
    };
  });

  let woList = (
    (workOrders ?? []) as Array<{
      id: string;
      title: string;
      status: string;
      priority: string;
      assignee_type?: string | null;
      property_id?: string | null;
      submitted_at?: string | null;
      completed_at?: string | null;
    }>
  ).map((w) => ({
    id: w.id,
    title: w.title,
    status: w.status,
    priority: w.priority,
    assigneeType: w.assignee_type,
    propertyId: w.property_id,
    submittedAt: w.submitted_at,
    completedAt: w.completed_at
  }));

  if (filters.propertyId) {
    woList = woList.filter((w) => w.propertyId === filters.propertyId);
  }
  if (filters.status) {
    woList = woList.filter((w) => w.status === filters.status);
  }
  if (filters.dateFrom) {
    woList = woList.filter((w) => !w.submittedAt || w.submittedAt >= filters.dateFrom!);
  }
  if (filters.dateTo) {
    woList = woList.filter((w) => !w.submittedAt || w.submittedAt <= `${filters.dateTo}T23:59:59`);
  }

  let docList = (
    (documents ?? []) as Array<{
      id: string;
      title: string;
      status: string;
      category: string;
      created_at: string;
      entity_type?: string | null;
    }>
  ).map((d) => ({
    id: d.id,
    title: d.title,
    status: d.status,
    category: d.category,
    createdAt: d.created_at,
    entityType: d.entity_type
  }));
  if (filters.category) {
    docList = docList.filter((d) => d.category === filters.category);
  }
  if (filters.status) {
    docList = docList.filter((d) => d.status === filters.status);
  }

  const sub = subscription as {
    status?: string | null;
    sku_code?: string | null;
    billing_cycle?: string | null;
  } | null;
  const setup = setupState as { completed_at?: string | null; product_confirmed?: boolean | null } | null;

  const facts: RawReportingFacts = {
    ...emptyFacts(),
    properties: propertyList,
    units: unitList.map((u) => {
      const row: RawReportingFacts["units"][number] = { id: u.id, propertyId: u.propertyId };
      if (u.status !== undefined) row.status = u.status;
      return row;
    }),
    leases: leaseList,
    residents: ((residents ?? []) as Array<{
      id: string;
      display_name: string;
      portal_status?: string | null;
      status?: string | null;
    }>).map((r) => {
      const row: RawReportingFacts["residents"][number] = {
        id: r.id,
        displayName: r.display_name
      };
      if (r.portal_status !== undefined) row.portalStatus = r.portal_status;
      if (r.status !== undefined) row.status = r.status;
      return row;
    }),
    workOrders: woList.map((w) => {
      const row: RawReportingFacts["workOrders"][number] = {
        id: w.id,
        title: w.title,
        status: w.status,
        priority: w.priority
      };
      if (w.assigneeType !== undefined) row.assigneeType = w.assigneeType;
      if (w.propertyId !== undefined) row.propertyId = w.propertyId;
      if (w.submittedAt !== undefined) row.submittedAt = w.submittedAt;
      if (w.completedAt !== undefined) row.completedAt = w.completedAt;
      return row;
    }),
    documents: docList.map((d) => {
      const row: RawReportingFacts["documents"][number] = {
        id: d.id,
        title: d.title,
        status: d.status,
        category: d.category,
        createdAt: d.createdAt
      };
      if (d.entityType !== undefined) row.entityType = d.entityType;
      return row;
    }),
    finance: financeReport
      ? {
          expectedRentThisMonth: financeReport.financialSnapshot.expectedRentThisMonth,
          rentCollectedThisMonth: financeReport.financialSnapshot.rentCollectedThisMonth,
          outstandingRent: financeReport.financialSnapshot.outstandingRent,
          outstandingBalance: financeReport.financialSnapshot.outstandingBalance,
          delinquencyCount: financeReport.financialSnapshot.delinquencyCount,
          totalDelinquency: financeReport.financialSnapshot.totalDelinquency,
          vendorPayablesOpen: financeReport.financialSnapshot.vendorPayablesOpen,
          vendorPaidThisMonth: financeReport.financialSnapshot.vendorPaidThisMonth,
          netOperationalCash: financeReport.financialSnapshot.netOperationalCash,
          occupancyRate:
            financeReport.properties.length > 0
              ? financeReport.properties.reduce((sum, p) => sum + p.occupancyRate, 0) /
                financeReport.properties.length
              : 0,
          unitsTotal: financeReport.properties.reduce((sum, p) => sum + p.unitsTotal, 0),
          unitsOccupied: financeReport.properties.reduce((sum, p) => sum + p.unitsOccupied, 0)
        }
      : null,
    subscription:
      shape.areas.includes("commercial") && sub
        ? {
            status: sub.status ?? null,
            productSku: sub.sku_code ?? null,
            billingCycle: sub.billing_cycle ?? null,
            setupComplete: Boolean(setup?.completed_at)
          }
        : null,
    vendors: ((vendors ?? []) as Array<{ id: string; name: string; status?: string | null }>).map((v) => {
      const row: RawReportingFacts["vendors"][number] = { id: v.id, name: v.name };
      if (v.status !== undefined) row.status = v.status;
      return row;
    }),
    applications: (
      (applications ?? []) as Array<{
        id: string;
        status: string;
        submitted_at?: string | null;
        decided_at?: string | null;
        property_id?: string | null;
      }>
    ).map((a) => ({
      id: a.id,
      status: a.status,
      submittedAt: a.submitted_at ?? null,
      decidedAt: a.decided_at ?? null,
      propertyId: a.property_id ?? null
    }))
  };

  void propertyIds;

  const snapshot = assembleReportingSnapshot({
    organizationId,
    organizationName: (orgRow as { name?: string } | null)?.name ?? null,
    persona,
    facts,
    allowedAreas: shape.areas
  });

  if (filters.area && filters.area !== "all") {
    const area = filters.area as ReportArea;
    if (!shape.areas.includes(area)) {
      return snapshot;
    }
    return {
      ...snapshot,
      insights: snapshot.insights.filter((i) => i.area === area),
      areas: snapshot.areas.filter((a) => a.area === area)
    };
  }

  return snapshot;
}
