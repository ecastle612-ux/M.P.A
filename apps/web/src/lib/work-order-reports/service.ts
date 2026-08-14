import type { SupabaseClient } from "@supabase/supabase-js";
import {
  aggregateWorkOrderReportMetrics,
  WORK_ORDER_REPORT_CSV_ROW_CAP,
  WORK_ORDER_REPORT_SURFACE_LABELS,
  type WorkOrderReportExportRow,
  type WorkOrderReportFilters,
  type WorkOrderReportSnapshot,
  type WorkOrderStatus,
  type WorkOrderPriority,
  type WorkSurface
} from "@mpa/shared";
import { emitMaintenanceEvent, writeMaintenanceAudit } from "../maintenance/events-audit";
import { listTechnicians, listVendors } from "../maintenance/maintenance-service";
import { listPortfolioProperties } from "../property/property-catalog";
import { toIsoDayEnd, toIsoDayStart } from "./parse-filters";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = SupabaseClient<any>;

type RawWorkOrder = {
  id: string;
  organization_id: string;
  property_id: string;
  unit_id: string | null;
  requested_by_user_id: string | null;
  title: string;
  description: string;
  category: string;
  priority: WorkOrderPriority;
  status: WorkOrderStatus;
  work_surface: WorkSurface;
  facility_asset_label: string | null;
  assignee_type: "unassigned" | "technician" | "vendor";
  technician_user_id: string | null;
  vendor_id: string | null;
  created_at: string;
  completed_at: string | null;
  property_properties?: { id: string; name: string } | null;
  property_units?: { id: string; unit_label: string } | null;
};

function locationFor(row: RawWorkOrder): string {
  const parts = [
    row.property_properties?.name,
    row.property_units?.unit_label ? `Unit ${row.property_units.unit_label}` : null,
    row.facility_asset_label
  ].filter(Boolean);
  return parts.join(" · ") || "—";
}

function matchesLocation(row: RawWorkOrder, location: string | undefined): boolean {
  if (!location) {
    return true;
  }
  const needle = location.toLowerCase();
  const haystack = [
    row.property_properties?.name,
    row.property_units?.unit_label,
    row.facility_asset_label,
    row.title,
    row.description
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(needle);
}

function matchesVendorFilter(row: RawWorkOrder, filters: WorkOrderReportFilters): boolean {
  if (filters.vendorIds.length === 0 && !filters.includeUnassignedVendor) {
    return true;
  }
  const vendorMatch = row.vendor_id ? filters.vendorIds.includes(row.vendor_id) : false;
  const unassignedMatch =
    filters.includeUnassignedVendor &&
    (row.assignee_type === "unassigned" || !row.vendor_id);
  return vendorMatch || unassignedMatch;
}

export async function buildWorkOrderReportSnapshot(input: {
  supabase: Db;
  organizationId: string;
  actorUserId: string;
  surface: WorkSurface;
  filters: WorkOrderReportFilters;
}): Promise<{
  snapshot: WorkOrderReportSnapshot;
  filterOptions: {
    properties: Array<{ id: string; name: string }>;
    vendors: Array<{ id: string; name: string }>;
    users: Array<{ userId: string; displayName: string }>;
  };
}> {
  const { supabase, organizationId, actorUserId, surface, filters } = input;

  const [{ data: org }, properties, vendors, technicians] = await Promise.all([
    supabase.from("organizations").select("id, name, slug").eq("id", organizationId).maybeSingle(),
    listPortfolioProperties(supabase, organizationId),
    listVendors(supabase, organizationId),
    listTechnicians(supabase, organizationId)
  ]);

  if (!org) {
    throw new Error("Organization not found");
  }

  let query = supabase
    .from("maintenance_work_orders")
    .select(
      `
      id, organization_id, property_id, unit_id, requested_by_user_id,
      title, description, category, priority, status, work_surface,
      facility_asset_label, assignee_type, technician_user_id, vendor_id,
      created_at, completed_at,
      property_properties ( id, name ),
      property_units ( id, unit_label )
    `
    )
    .eq("organization_id", organizationId)
    .eq("work_surface", surface)
    .order("created_at", { ascending: false })
    .limit(WORK_ORDER_REPORT_CSV_ROW_CAP + 1);

  const dateField = filters.dateMode === "completed" ? "completed_at" : "created_at";
  query = query.gte(dateField, toIsoDayStart(filters.dateFrom)).lte(dateField, toIsoDayEnd(filters.dateTo));

  if (filters.propertyIds.length > 0) {
    query = query.in("property_id", filters.propertyIds);
  }
  if (filters.statuses.length > 0) {
    query = query.in("status", filters.statuses);
  }
  if (filters.priorities.length > 0) {
    query = query.in("priority", filters.priorities);
  }
  if (filters.categories.length > 0) {
    query = query.in("category", filters.categories);
  }
  if (filters.userIds.length > 0) {
    query = query.in("technician_user_id", filters.userIds);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(error.message);
  }

  let rows = ((data ?? []) as RawWorkOrder[]).filter(
    (row) => matchesLocation(row, filters.location) && matchesVendorFilter(row, filters)
  );

  // Defense in depth: never leak other surfaces even if DB filter fails.
  rows = rows.filter((row) => row.work_surface === surface && row.organization_id === organizationId);

  const truncated = rows.length > WORK_ORDER_REPORT_CSV_ROW_CAP;
  const totalMatched = truncated ? rows.length : rows.length;
  if (truncated) {
    rows = rows.slice(0, WORK_ORDER_REPORT_CSV_ROW_CAP);
  }

  const workOrderIds = rows.map((row) => row.id);
  const mediaIds = new Set<string>();
  if (workOrderIds.length > 0) {
    const { data: mediaRows } = await supabase
      .from("media_attachments")
      .select("related_entity_id")
      .eq("organization_id", organizationId)
      .eq("related_entity_type", "maintenance")
      .eq("status", "ready")
      .is("deleted_at", null)
      .in("related_entity_id", workOrderIds);
    for (const media of mediaRows ?? []) {
      if (media.related_entity_id) {
        mediaIds.add(media.related_entity_id as string);
      }
    }
  }

  const completionNotes = new Map<string, string>();
  if (workOrderIds.length > 0) {
    const { data: updates } = await supabase
      .from("maintenance_work_order_updates")
      .select("work_order_id, body, status_to, created_at")
      .eq("organization_id", organizationId)
      .in("work_order_id", workOrderIds)
      .in("status_to", ["completed", "closed"])
      .order("created_at", { ascending: false });
    for (const update of updates ?? []) {
      const id = update.work_order_id as string;
      if (!completionNotes.has(id) && typeof update.body === "string") {
        completionNotes.set(id, update.body);
      }
    }
  }

  const userIds = new Set<string>();
  for (const row of rows) {
    if (row.requested_by_user_id) userIds.add(row.requested_by_user_id);
    if (row.technician_user_id) userIds.add(row.technician_user_id);
  }
  userIds.add(actorUserId);

  const { data: profiles } = userIds.size
    ? await supabase
        .from("user_profiles")
        .select("user_id, display_name, contact_email")
        .in("user_id", [...userIds])
    : { data: [] };

  const profileName = new Map<string, string>();
  for (const profile of profiles ?? []) {
    const name =
      (profile.display_name as string | null)?.trim() ||
      (profile.contact_email as string | null)?.trim() ||
      "Unknown";
    profileName.set(profile.user_id as string, name);
  }

  const vendorName = new Map((vendors ?? []).map((vendor) => [vendor.id as string, vendor.name as string]));
  const techName = new Map(technicians.map((tech) => [tech.userId, tech.displayName]));

  const exportRows: WorkOrderReportExportRow[] = rows.map((row) => ({
    workOrderId: row.id,
    createdDate: row.created_at,
    requestedBy: row.requested_by_user_id
      ? profileName.get(row.requested_by_user_id) ?? "Unknown"
      : "Unknown",
    location: locationFor(row),
    category: row.category,
    priority: row.priority,
    description: row.description.slice(0, 2000),
    assignedVendor:
      row.assignee_type === "vendor" && row.vendor_id
        ? vendorName.get(row.vendor_id) ?? "Vendor"
        : "",
    assignedUser: row.technician_user_id
      ? techName.get(row.technician_user_id) ?? profileName.get(row.technician_user_id) ?? "Technician"
      : "",
    status: row.status,
    completedDate: row.completed_at ?? "",
    completionNotes: completionNotes.get(row.id) ?? "",
    mediaAttached: mediaIds.has(row.id) ? "Yes" : "No"
  }));

  const metrics = aggregateWorkOrderReportMetrics(
    rows.map((row) => ({
      id: row.id,
      status: row.status,
      category: row.category,
      priority: row.priority,
      createdAt: row.created_at,
      completedAt: row.completed_at,
      vendorName: row.vendor_id ? vendorName.get(row.vendor_id) ?? null : null,
      assigneeType: row.assignee_type
    }))
  );

  const snapshot: WorkOrderReportSnapshot = {
    organizationId,
    organizationName: (org.name as string) ?? "Organization",
    organizationSlug: (org.slug as string) ?? "organization",
    surface,
    surfaceLabel: WORK_ORDER_REPORT_SURFACE_LABELS[surface],
    generatedAt: new Date().toISOString(),
    generatedByUserId: actorUserId,
    generatedByDisplayName: profileName.get(actorUserId) ?? "Staff",
    filters,
    metrics,
    rows: exportRows,
    truncated,
    totalMatched: truncated ? WORK_ORDER_REPORT_CSV_ROW_CAP + 1 : exportRows.length
  };

  return {
    snapshot,
    filterOptions: {
      properties: (properties ?? []).map((property) => ({
        id: property.id as string,
        name: property.name as string
      })),
      vendors: (vendors ?? []).map((vendor) => ({
        id: vendor.id as string,
        name: vendor.name as string
      })),
      users: technicians.map((tech) => ({
        userId: tech.userId,
        displayName: tech.displayName
      }))
    }
  };
}

export async function auditWorkOrderReportExport(input: {
  supabase: Db;
  organizationId: string;
  actorUserId: string;
  surface: WorkSurface;
  format: "csv" | "pdf";
  snapshot: WorkOrderReportSnapshot;
}) {
  const payload = {
    surface: input.surface,
    format: input.format,
    rowCount: input.snapshot.rows.length,
    totalMatched: input.snapshot.totalMatched,
    truncated: input.snapshot.truncated,
    filters: input.snapshot.filters
  };

  try {
    await writeMaintenanceAudit({
      supabase: input.supabase,
      organizationId: input.organizationId,
      actorId: input.actorUserId,
      action: "work_order_report.exported",
      entityType: "work_order_report",
      entityId: null,
      payload
    });
  } catch {
    // Soft-fail: export still succeeds; authz already enforced.
  }

  try {
    await emitMaintenanceEvent({
      supabase: input.supabase,
      organizationId: input.organizationId,
      actorId: input.actorUserId,
      eventType: "work_order_report.exported",
      aggregateType: "work_order_report",
      aggregateId: input.organizationId,
      payload
    });
  } catch {
    // Soft-fail domain event emission.
  }
}
