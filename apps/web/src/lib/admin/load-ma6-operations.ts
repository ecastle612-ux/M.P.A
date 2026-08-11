import { createAuthServerClient } from "../auth/server";
import { serverEnv } from "../env/server-env";
import {
  buildOrgOpsRows,
  detectOperationalAnomalies,
  filterNotifications,
  filterWorkOrders,
  MA6_WO_SELECT,
  mapNotificationRow,
  mapWorkOrderRow,
  paginateRows,
  paginationMeta,
  parseOpsFilters,
  summarizeOperationsOverview,
  type Ma6Anomaly,
  type Ma6NotificationRow,
  type Ma6OpsFilters,
  type Ma6OrgOpsRow,
  type Ma6Pagination,
  type Ma6PropertyRow,
  type Ma6UnitRow,
  type Ma6VendorRow,
  type Ma6WorkOrderRow
} from "./ma6-operations";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = { from: (table: string) => any };

async function tryServiceRole(): Promise<AnyClient | null> {
  try {
    if (process.env["VITEST"]) return null;
    if (!serverEnv.SUPABASE_SERVICE_ROLE_KEY) return null;
    const { createServiceRoleClient } = await import("../supabase/service-role");
    return createServiceRoleClient() as unknown as AnyClient;
  } catch {
    return null;
  }
}

const FETCH_CAP = 500;

async function loadOrgNames(client: AnyClient): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  try {
    const { data } = await client.from("organizations").select("id, name").limit(2000);
    for (const o of (data ?? []) as Array<{ id: string; name: string }>) {
      map.set(o.id, o.name);
    }
  } catch {
    // optional
  }
  return map;
}

export type Ma6OperationsSnapshot = {
  overview: ReturnType<typeof summarizeOperationsOverview>;
  organizations: Ma6OrgOpsRow[];
  workOrders: Ma6WorkOrderRow[];
  properties: Ma6PropertyRow[];
  units: Ma6UnitRow[];
  vendors: Ma6VendorRow[];
  notifications: Ma6NotificationRow[];
  anomalies: Ma6Anomaly[];
  filters: Ma6OpsFilters;
  pagination: Ma6Pagination;
  degraded: string[];
  limitations: string[];
};

export async function loadMa6OperationsSnapshot(
  searchParams: URLSearchParams | Record<string, string | string[] | undefined> = {},
  view: "overview" | "work-orders" | "properties" | "vendors" | "notifications" = "overview"
): Promise<Ma6OperationsSnapshot> {
  const degraded: string[] = [];
  const limitations = [
    "Overdue uses authoritative due_at < now when due_at is set — no invented age SLA thresholds.",
    "Counts are from bounded recent samples (cap 500) — refine filters for large fleets.",
    "MA-4 remains authoritative for commercial unit capacity."
  ];
  const filters = parseOpsFilters(searchParams);
  const service = await tryServiceRole();
  const client = (service ?? ((await createAuthServerClient()) as unknown as AnyClient)) as AnyClient;
  if (!service) degraded.push("Service role unavailable — operations may be incomplete under RLS");

  const orgNames = await loadOrgNames(client);
  const organizations = [...orgNames.entries()].map(([id, name]) => ({ id, name }));

  // Properties
  const properties: Ma6PropertyRow[] = [];
  const propertyNameById = new Map<string, string>();
  const propertyCountByOrg = new Map<string, number>();
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let q: any = client
      .from("property_properties")
      .select("id, organization_id, name, status")
      .order("updated_at", { ascending: false })
      .limit(FETCH_CAP);
    if (filters.organizationId) q = q.eq("organization_id", filters.organizationId);
    if (filters.propertyId) q = q.eq("id", filters.propertyId);
    const { data, error } = await q;
    if (error) degraded.push(`Properties: ${error.message}`);
    else {
      for (const r of (data ?? []) as Array<Record<string, unknown>>) {
        const orgId = String(r["organization_id"]);
        const id = String(r["id"]);
        propertyNameById.set(id, String(r["name"] ?? ""));
        propertyCountByOrg.set(orgId, (propertyCountByOrg.get(orgId) ?? 0) + 1);
        properties.push({
          id,
          organizationId: orgId,
          organizationName: orgNames.get(orgId) ?? null,
          name: String(r["name"] ?? ""),
          status: String(r["status"] ?? ""),
          unitCount: 0
        });
      }
    }
  } catch (e) {
    degraded.push(e instanceof Error ? e.message : "Properties load failed");
  }

  // Units
  const units: Ma6UnitRow[] = [];
  const unitCountByOrg = new Map<string, number>();
  const unitCountByProperty = new Map<string, number>();
  const unitLabelById = new Map<string, string>();
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let q: any = client
      .from("property_units")
      .select("id, organization_id, property_id, unit_label, status")
      .order("updated_at", { ascending: false })
      .limit(FETCH_CAP);
    if (filters.organizationId) q = q.eq("organization_id", filters.organizationId);
    if (filters.propertyId) q = q.eq("property_id", filters.propertyId);
    const { data, error } = await q;
    if (error) degraded.push(`Units: ${error.message}`);
    else {
      for (const r of (data ?? []) as Array<Record<string, unknown>>) {
        const orgId = String(r["organization_id"]);
        const propertyId = String(r["property_id"]);
        const id = String(r["id"]);
        const label = String(r["unit_label"] ?? "");
        unitLabelById.set(id, label);
        unitCountByOrg.set(orgId, (unitCountByOrg.get(orgId) ?? 0) + 1);
        unitCountByProperty.set(propertyId, (unitCountByProperty.get(propertyId) ?? 0) + 1);
        units.push({
          id,
          organizationId: orgId,
          organizationName: orgNames.get(orgId) ?? null,
          propertyId,
          propertyName: propertyNameById.get(propertyId) ?? null,
          unitLabel: label,
          status: String(r["status"] ?? "")
        });
      }
    }
  } catch (e) {
    degraded.push(e instanceof Error ? e.message : "Units load failed");
  }
  for (const p of properties) {
    p.unitCount = unitCountByProperty.get(p.id) ?? 0;
  }

  // Vendors
  const vendorsRaw: Array<Record<string, unknown>> = [];
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let q: any = client
      .from("vendor_vendors")
      .select("id, organization_id, name, email, phone, status")
      .order("updated_at", { ascending: false })
      .limit(FETCH_CAP);
    if (filters.organizationId) q = q.eq("organization_id", filters.organizationId);
    if (filters.status) q = q.eq("status", filters.status);
    const { data, error } = await q;
    if (error) degraded.push(`Vendors: ${error.message}`);
    else vendorsRaw.push(...((data ?? []) as Array<Record<string, unknown>>));
  } catch (e) {
    degraded.push(e instanceof Error ? e.message : "Vendors load failed");
  }
  const vendorNameById = new Map<string, string>();
  const vendorCountByOrg = new Map<string, number>();
  for (const r of vendorsRaw) {
    vendorNameById.set(String(r["id"]), String(r["name"] ?? ""));
    const orgId = String(r["organization_id"]);
    vendorCountByOrg.set(orgId, (vendorCountByOrg.get(orgId) ?? 0) + 1);
  }

  // Work orders
  let workOrders: Ma6WorkOrderRow[] = [];
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let q: any = client
      .from("maintenance_work_orders")
      .select(MA6_WO_SELECT)
      .order("updated_at", { ascending: false })
      .limit(FETCH_CAP);
    if (filters.organizationId) q = q.eq("organization_id", filters.organizationId);
    if (filters.status) q = q.eq("status", filters.status);
    if (filters.priority) q = q.eq("priority", filters.priority);
    if (filters.propertyId) q = q.eq("property_id", filters.propertyId);
    if (filters.vendorId) q = q.eq("vendor_id", filters.vendorId);
    if (filters.workSurface) q = q.eq("work_surface", filters.workSurface);
    if (filters.since) q = q.gte("created_at", filters.since);
    const { data, error } = await q;
    if (error) degraded.push(`Work orders: ${error.message}`);
    else {
      workOrders = ((data ?? []) as Array<Record<string, unknown>>).map((r) =>
        mapWorkOrderRow({
          id: String(r["id"]),
          organization_id: String(r["organization_id"]),
          organization_name: orgNames.get(String(r["organization_id"])) ?? null,
          property_id: typeof r["property_id"] === "string" ? r["property_id"] : null,
          property_name:
            typeof r["property_id"] === "string"
              ? propertyNameById.get(r["property_id"]) ?? null
              : null,
          unit_id: typeof r["unit_id"] === "string" ? r["unit_id"] : null,
          unit_label:
            typeof r["unit_id"] === "string" ? unitLabelById.get(r["unit_id"]) ?? null : null,
          title: String(r["title"] ?? ""),
          status: String(r["status"] ?? ""),
          priority: String(r["priority"] ?? "normal"),
          assignee_type: typeof r["assignee_type"] === "string" ? r["assignee_type"] : null,
          technician_user_id:
            typeof r["technician_user_id"] === "string" ? r["technician_user_id"] : null,
          vendor_id: typeof r["vendor_id"] === "string" ? r["vendor_id"] : null,
          vendor_name:
            typeof r["vendor_id"] === "string" ? vendorNameById.get(r["vendor_id"]) ?? null : null,
          work_surface: typeof r["work_surface"] === "string" ? r["work_surface"] : null,
          created_at: String(r["created_at"] ?? ""),
          updated_at: String(r["updated_at"] ?? ""),
          due_at: typeof r["due_at"] === "string" ? r["due_at"] : null,
          completed_at: typeof r["completed_at"] === "string" ? r["completed_at"] : null,
          cancelled_at: typeof r["cancelled_at"] === "string" ? r["cancelled_at"] : null
        })
      );
    }
  } catch (e) {
    degraded.push(e instanceof Error ? e.message : "Work orders load failed");
  }

  const outstandingByVendor = new Map<string, number>();
  for (const wo of workOrders) {
    if (wo.vendorId && !["completed", "closed", "cancelled"].includes(wo.status)) {
      outstandingByVendor.set(wo.vendorId, (outstandingByVendor.get(wo.vendorId) ?? 0) + 1);
    }
  }
  const vendors: Ma6VendorRow[] = vendorsRaw.map((r) => {
    const id = String(r["id"]);
    const orgId = String(r["organization_id"]);
    const status = String(r["status"] ?? "");
    const outstanding = outstandingByVendor.get(id) ?? 0;
    return {
      id,
      organizationId: orgId,
      organizationName: orgNames.get(orgId) ?? null,
      name: String(r["name"] ?? ""),
      status,
      email: typeof r["email"] === "string" ? r["email"] : null,
      phone: typeof r["phone"] === "string" ? r["phone"] : null,
      outstandingWorkOrders: outstanding,
      health: status === "inactive" && outstanding > 0 ? "attention" : status ? "healthy" : "unknown"
    };
  });

  // Notifications
  let notifications: Ma6NotificationRow[] = [];
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let q: any = client
      .from("maintenance_notifications")
      .select(
        "id, organization_id, notification_key, title, channel, email_delivery_status, email_delivery_error, work_order_id, created_at, email_attempted_at"
      )
      .order("created_at", { ascending: false })
      .limit(FETCH_CAP);
    if (filters.organizationId) q = q.eq("organization_id", filters.organizationId);
    if (filters.channel) q = q.eq("channel", filters.channel);
    if (filters.status) q = q.eq("email_delivery_status", filters.status);
    if (filters.since) q = q.gte("created_at", filters.since);
    const { data, error } = await q;
    if (error) degraded.push(`Notifications: ${error.message}`);
    else {
      notifications = ((data ?? []) as Array<Record<string, unknown>>).map((r) =>
        mapNotificationRow({
          id: String(r["id"]),
          organization_id: String(r["organization_id"]),
          organization_name: orgNames.get(String(r["organization_id"])) ?? null,
          notification_key:
            typeof r["notification_key"] === "string" ? r["notification_key"] : null,
          title: String(r["title"] ?? ""),
          channel: typeof r["channel"] === "string" ? r["channel"] : null,
          email_delivery_status:
            typeof r["email_delivery_status"] === "string" ? r["email_delivery_status"] : null,
          email_delivery_error:
            typeof r["email_delivery_error"] === "string" ? r["email_delivery_error"] : null,
          work_order_id: typeof r["work_order_id"] === "string" ? r["work_order_id"] : null,
          created_at: String(r["created_at"] ?? ""),
          email_attempted_at:
            typeof r["email_attempted_at"] === "string" ? r["email_attempted_at"] : null
        })
      );
    }
  } catch (e) {
    degraded.push(e instanceof Error ? e.message : "Notifications load failed");
  }

  const filteredWo = filterWorkOrders(workOrders, filters);
  const filteredNotif = filterNotifications(notifications, filters);
  const anomalies = detectOperationalAnomalies({
    workOrders: filteredWo,
    notifications: filteredNotif
  });

  const notificationFailuresByOrg = new Map<string, number>();
  for (const n of notifications) {
    if (n.emailDeliveryStatus !== "failed") continue;
    notificationFailuresByOrg.set(
      n.organizationId,
      (notificationFailuresByOrg.get(n.organizationId) ?? 0) + 1
    );
  }

  const orgRows = buildOrgOpsRows({
    organizations: filters.organizationId
      ? organizations.filter((o) => o.id === filters.organizationId)
      : organizations.slice(0, 200),
    propertyCountByOrg,
    unitCountByOrg,
    workOrders,
    vendorCountByOrg,
    notificationFailuresByOrg,
    anomalies
  });

  const overview = summarizeOperationsOverview({
    propertyCount: properties.length,
    unitCount: units.length,
    workOrders,
    vendors,
    notifications,
    orgRows,
    degraded: degraded.length > 0
  });

  let pageRows: unknown[] = orgRows;
  if (view === "work-orders") pageRows = filteredWo;
  else if (view === "properties") pageRows = properties;
  else if (view === "vendors") {
    pageRows = vendors.filter((v) => {
      if (filters.q) {
        const hay = `${v.name} ${v.organizationId} ${v.organizationName ?? ""}`.toLowerCase();
        if (!hay.includes(filters.q.toLowerCase())) return false;
      }
      return true;
    });
  } else if (view === "notifications") pageRows = filteredNotif;
  else pageRows = orgRows.filter((o) => o.health === "attention" || o.openWorkOrders > 0 || o.propertyCount > 0);

  const pagination = paginationMeta(pageRows.length, filters.page, filters.pageSize);
  const paged = paginateRows(pageRows, filters.page, filters.pageSize);

  return {
    overview,
    organizations: view === "overview" ? (paged as Ma6OrgOpsRow[]) : orgRows.slice(0, 100),
    workOrders: view === "work-orders" ? (paged as Ma6WorkOrderRow[]) : filteredWo.slice(0, 50),
    properties: view === "properties" ? (paged as Ma6PropertyRow[]) : properties.slice(0, 50),
    units: units.slice(0, view === "properties" ? 200 : 50),
    vendors: view === "vendors" ? (paged as Ma6VendorRow[]) : vendors.slice(0, 50),
    notifications:
      view === "notifications" ? (paged as Ma6NotificationRow[]) : filteredNotif.slice(0, 50),
    anomalies: anomalies.slice(0, 100),
    filters,
    pagination,
    degraded,
    limitations
  };
}

export type Ma6WorkOrderAuditEvent = {
  id: string;
  createdAt: string;
  action: string;
  entityType: string;
  actorId: string | null;
};

export async function loadMa6WorkOrderDetail(workOrderId: string): Promise<{
  workOrder: Ma6WorkOrderRow | null;
  notifications: Ma6NotificationRow[];
  auditEvents: Ma6WorkOrderAuditEvent[];
  degraded: string[];
}> {
  const service = await tryServiceRole();
  const client = (service ?? ((await createAuthServerClient()) as unknown as AnyClient)) as AnyClient;
  const degraded: string[] = [];
  if (!service) degraded.push("Service role unavailable — detail may be incomplete under RLS");

  const orgNames = await loadOrgNames(client);
  let exact: Ma6WorkOrderRow | null = null;

  try {
    const { data, error } = await client
      .from("maintenance_work_orders")
      .select(MA6_WO_SELECT)
      .eq("id", workOrderId)
      .maybeSingle();
    if (error) degraded.push(error.message);
    else if (data) {
      const r = data as Record<string, unknown>;
      let propertyName: string | null = null;
      let unitLabel: string | null = null;
      let vendorName: string | null = null;
      const propertyId = typeof r["property_id"] === "string" ? r["property_id"] : null;
      const unitId = typeof r["unit_id"] === "string" ? r["unit_id"] : null;
      const vendorId = typeof r["vendor_id"] === "string" ? r["vendor_id"] : null;
      if (propertyId) {
        try {
          const { data: p } = await client
            .from("property_properties")
            .select("name")
            .eq("id", propertyId)
            .maybeSingle();
          if (p && typeof (p as { name?: unknown }).name === "string") {
            propertyName = (p as { name: string }).name;
          }
        } catch {
          // optional enrichment
        }
      }
      if (unitId) {
        try {
          const { data: u } = await client
            .from("property_units")
            .select("unit_label")
            .eq("id", unitId)
            .maybeSingle();
          if (u && typeof (u as { unit_label?: unknown }).unit_label === "string") {
            unitLabel = (u as { unit_label: string }).unit_label;
          }
        } catch {
          // optional enrichment
        }
      }
      if (vendorId) {
        try {
          const { data: v } = await client
            .from("vendor_vendors")
            .select("name")
            .eq("id", vendorId)
            .maybeSingle();
          if (v && typeof (v as { name?: unknown }).name === "string") {
            vendorName = (v as { name: string }).name;
          }
        } catch {
          // optional enrichment
        }
      }
      exact = mapWorkOrderRow({
        id: String(r["id"]),
        organization_id: String(r["organization_id"]),
        organization_name: orgNames.get(String(r["organization_id"])) ?? null,
        property_id: propertyId,
        property_name: propertyName,
        unit_id: unitId,
        unit_label: unitLabel,
        title: String(r["title"] ?? ""),
        status: String(r["status"] ?? ""),
        priority: String(r["priority"] ?? "normal"),
        assignee_type: typeof r["assignee_type"] === "string" ? r["assignee_type"] : null,
        technician_user_id:
          typeof r["technician_user_id"] === "string" ? r["technician_user_id"] : null,
        vendor_id: vendorId,
        vendor_name: vendorName,
        work_surface: typeof r["work_surface"] === "string" ? r["work_surface"] : null,
        created_at: String(r["created_at"] ?? ""),
        updated_at: String(r["updated_at"] ?? ""),
        due_at: typeof r["due_at"] === "string" ? r["due_at"] : null,
        completed_at: typeof r["completed_at"] === "string" ? r["completed_at"] : null,
        cancelled_at: typeof r["cancelled_at"] === "string" ? r["cancelled_at"] : null
      });
    }
  } catch (e) {
    degraded.push(e instanceof Error ? e.message : "Work order detail failed");
  }

  const notifications: Ma6NotificationRow[] = [];
  try {
    const { data, error } = await client
      .from("maintenance_notifications")
      .select(
        "id, organization_id, notification_key, title, channel, email_delivery_status, email_delivery_error, work_order_id, created_at, email_attempted_at"
      )
      .eq("work_order_id", workOrderId)
      .order("created_at", { ascending: false })
      .limit(30);
    if (error) degraded.push(`Notifications: ${error.message}`);
    else {
      for (const r of (data ?? []) as Array<Record<string, unknown>>) {
        notifications.push(
          mapNotificationRow({
            id: String(r["id"]),
            organization_id: String(r["organization_id"]),
            organization_name: orgNames.get(String(r["organization_id"])) ?? null,
            notification_key:
              typeof r["notification_key"] === "string" ? r["notification_key"] : null,
            title: String(r["title"] ?? ""),
            channel: typeof r["channel"] === "string" ? r["channel"] : null,
            email_delivery_status:
              typeof r["email_delivery_status"] === "string" ? r["email_delivery_status"] : null,
            email_delivery_error:
              typeof r["email_delivery_error"] === "string" ? r["email_delivery_error"] : null,
            work_order_id: typeof r["work_order_id"] === "string" ? r["work_order_id"] : null,
            created_at: String(r["created_at"] ?? ""),
            email_attempted_at:
              typeof r["email_attempted_at"] === "string" ? r["email_attempted_at"] : null
          })
        );
      }
    }
  } catch (e) {
    degraded.push(e instanceof Error ? e.message : "Related notifications load failed");
  }

  const auditEvents: Ma6WorkOrderAuditEvent[] = [];
  try {
    const { data, error } = await client
      .from("audit_events")
      .select("id, created_at, actor_id, action, entity_type, entity_id")
      .eq("entity_id", workOrderId)
      .order("created_at", { ascending: false })
      .limit(40);
    if (error) degraded.push(`Audit: ${error.message}`);
    else {
      for (const r of (data ?? []) as Array<Record<string, unknown>>) {
        auditEvents.push({
          id: String(r["id"]),
          createdAt: String(r["created_at"] ?? ""),
          action: String(r["action"] ?? ""),
          entityType: String(r["entity_type"] ?? "unknown"),
          actorId: typeof r["actor_id"] === "string" ? r["actor_id"] : null
        });
      }
    }
  } catch (e) {
    degraded.push(e instanceof Error ? e.message : "Related audit load failed");
  }

  return { workOrder: exact, notifications, auditEvents, degraded };
}
