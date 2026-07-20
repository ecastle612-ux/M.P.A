import { createAuthServerComponentClient } from "../auth/server";
import type { Database, Json } from "@mpa/supabase";
import { getVaultDocumentsForEntity } from "../vault/server";
import type {
  CorrectFacilityRecordInput,
  FacilityHistoryFilters,
  FacilityLifecycleStatus,
  FacilityRecord,
  FacilityRecordListItem,
  FacilityRecordStatus,
  ServiceProviderType
} from "./contracts";
import { timelineTitleForCategory } from "./contracts";
import { appendFacilityTimelineEvent } from "./timeline";

export { listFacilityTimelineEvents, appendFacilityTimelineEvent } from "./timeline";

type SupabaseClientType = Awaited<ReturnType<typeof createAuthServerComponentClient>>;

type FacilityRecordRow = {
  id: string;
  organization_id: string;
  property_id: string;
  unit_id: string | null;
  building_id: string | null;
  asset_id: string | null;
  work_order_id: string;
  legacy_vendor_id: string | null;
  service_provider_display_name: string | null;
  service_provider_type: ServiceProviderType;
  assigned_staff_user_id: string | null;
  issue: string;
  resolution: string;
  completed_at: string;
  warranty_placeholder: string | null;
  invoice_placeholder: string | null;
  lifecycle_status: FacilityLifecycleStatus;
  status: FacilityRecordStatus;
  correction_of_id: string | null;
  correction_reason: string | null;
  corrected_by: string | null;
  corrected_at: string | null;
  photo_document_ids: string[] | null;
  document_ids: string[] | null;
  metadata: Json | null;
  created_by: string;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
};

type FacilityRecordRelationRow = FacilityRecordRow & {
  properties: { name: string } | null;
  units: { unit_number: string } | null;
  maintenance_work_orders: { work_order_number: string } | null;
  facility_assets: { asset_code: string; name: string } | null;
};

type WorkOrderSnapshot = {
  id: string;
  organization_id: string;
  property_id: string;
  unit_id: string | null;
  title: string;
  description: string | null;
  category: string;
  vendor_id: string | null;
  assigned_to_user_id: string | null;
  completed_at: string | null;
  internal_notes: string | null;
  photo_placeholder: string | null;
  document_placeholder: string | null;
};

const FACILITY_RECORD_SELECT =
  "id, organization_id, property_id, unit_id, building_id, asset_id, work_order_id, legacy_vendor_id, service_provider_display_name, service_provider_type, assigned_staff_user_id, issue, resolution, completed_at, warranty_placeholder, invoice_placeholder, lifecycle_status, status, correction_of_id, correction_reason, corrected_by, corrected_at, photo_document_ids, document_ids, metadata, created_by, updated_by, created_at, updated_at, properties(name), units(unit_number), maintenance_work_orders(work_order_number), facility_assets(asset_code, name)";

async function resolveClient(client?: SupabaseClientType): Promise<SupabaseClientType> {
  return client ?? (await createAuthServerComponentClient());
}

function toMetadata(value: Json | null): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function toFacilityRecord(row: FacilityRecordRow): FacilityRecord {
  return {
    id: row.id,
    organizationId: row.organization_id,
    propertyId: row.property_id,
    unitId: row.unit_id,
    buildingId: row.building_id,
    assetId: row.asset_id,
    workOrderId: row.work_order_id,
    legacyVendorId: row.legacy_vendor_id,
    serviceProviderDisplayName: row.service_provider_display_name,
    serviceProviderType: row.service_provider_type,
    assignedStaffUserId: row.assigned_staff_user_id,
    issue: row.issue,
    resolution: row.resolution,
    completedAt: row.completed_at,
    warrantyPlaceholder: row.warranty_placeholder,
    invoicePlaceholder: row.invoice_placeholder,
    lifecycleStatus: row.lifecycle_status,
    status: row.status,
    correctionOfId: row.correction_of_id,
    correctionReason: row.correction_reason,
    correctedBy: row.corrected_by,
    correctedAt: row.corrected_at,
    photoDocumentIds: row.photo_document_ids ?? [],
    documentIds: row.document_ids ?? [],
    metadata: toMetadata(row.metadata),
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function toFacilityRecordListItem(row: FacilityRecordRelationRow): FacilityRecordListItem {
  return {
    ...toFacilityRecord(row),
    propertyName: row.properties?.name ?? null,
    unitNumber: row.units?.unit_number ?? null,
    workOrderNumber: row.maintenance_work_orders?.work_order_number ?? null,
    assetCode: row.facility_assets?.asset_code ?? null,
    assetName: row.facility_assets?.name ?? null
  };
}

function escapeIlike(value: string): string {
  return value.replace(/[%_,]/g, "\\$&");
}

async function resolveVendorDisplayName(
  organizationId: string,
  vendorId: string | null,
  client: SupabaseClientType
): Promise<string | null> {
  if (!vendorId) return null;
  const { data, error } = await client
    .from("vendors")
    .select("business_name")
    .eq("organization_id", organizationId)
    .eq("id", vendorId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as { business_name: string } | null)?.business_name ?? null;
}

async function resolveVaultReferences(
  organizationId: string,
  workOrderId: string,
  client: SupabaseClientType
): Promise<{ photoDocumentIds: string[]; documentIds: string[] }> {
  const docs = await getVaultDocumentsForEntity(organizationId, "maintenance", workOrderId, client);
  const photoDocumentIds: string[] = [];
  const documentIds: string[] = [];
  for (const doc of docs) {
    const type = doc.documentType.toLowerCase();
    const title = doc.title.toLowerCase();
    if (type.includes("photo") || type.includes("image") || title.includes("photo")) {
      photoDocumentIds.push(doc.id);
    } else {
      documentIds.push(doc.id);
    }
  }
  return { photoDocumentIds, documentIds };
}

async function appendRepairTimelineEvent(params: {
  organizationId: string;
  userId: string;
  record: FacilityRecord;
  category: string;
  eventType: "facility.repair_completed" | "facility.record_corrected" | "facility.service_visit";
  sourceEntityId?: string;
  client: SupabaseClientType;
}): Promise<void> {
  const title =
    params.eventType === "facility.record_corrected"
      ? "Repair Corrected"
      : params.eventType === "facility.service_visit"
        ? "Service Visit Completed"
        : timelineTitleForCategory(params.category, params.record.issue);
  const summary =
    params.eventType === "facility.record_corrected"
      ? `Administrative correction applied to repair history for ${params.record.issue}`
      : `${params.record.issue}${
          params.record.serviceProviderDisplayName
            ? ` · ${params.record.serviceProviderDisplayName}`
            : ""
        }`;

  await appendFacilityTimelineEvent(
    params.organizationId,
    {
      propertyId: params.record.propertyId,
      unitId: params.record.unitId,
      buildingId: params.record.buildingId,
      eventType: params.eventType,
      occurredAt: params.record.completedAt,
      title,
      summary,
      actorUserId: params.userId,
      performedByLabel: params.record.serviceProviderDisplayName ?? "Internal staff",
      serviceProviderDisplayName: params.record.serviceProviderDisplayName,
      sourceEntityType: "facility_record",
      sourceEntityId: params.sourceEntityId ?? params.record.id,
      facilityRecordId: params.record.id,
      workOrderId: params.record.workOrderId,
      legacyVendorId: params.record.legacyVendorId,
      href: `/facility/records/${params.record.id}`,
      documentIds: [...params.record.photoDocumentIds, ...params.record.documentIds],
      payload: {
        issue: params.record.issue,
        resolution: params.record.resolution,
        category: params.category
      }
    },
    params.client
  );
}

export async function getFacilityRecordForOrganization(
  organizationId: string,
  recordId: string,
  client?: SupabaseClientType
): Promise<FacilityRecordListItem | null> {
  const supabase = await resolveClient(client);
  const { data, error } = await supabase
    .from("facility_records")
    .select(FACILITY_RECORD_SELECT)
    .eq("organization_id", organizationId)
    .eq("id", recordId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  return toFacilityRecordListItem(data as unknown as FacilityRecordRelationRow);
}

export async function getFacilityRecordByWorkOrderId(
  organizationId: string,
  workOrderId: string,
  client?: SupabaseClientType
): Promise<FacilityRecordListItem | null> {
  const supabase = await resolveClient(client);
  const { data, error } = await supabase
    .from("facility_records")
    .select(FACILITY_RECORD_SELECT)
    .eq("organization_id", organizationId)
    .eq("work_order_id", workOrderId)
    .eq("status", "active")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  return toFacilityRecordListItem(data as unknown as FacilityRecordRelationRow);
}

export async function listFacilityRecords(
  organizationId: string,
  filters: FacilityHistoryFilters = {},
  client?: SupabaseClientType
): Promise<FacilityRecordListItem[]> {
  const supabase = await resolveClient(client);
  let query = supabase
    .from("facility_records")
    .select(FACILITY_RECORD_SELECT)
    .eq("organization_id", organizationId)
    .order("completed_at", { ascending: false })
    .limit(Math.min(Math.max(filters.limit ?? 50, 1), 200));

  if (!filters.includeSuperseded) {
    query = query.eq("status", "active");
  }
  if (filters.propertyId) query = query.eq("property_id", filters.propertyId);
  if (filters.unitId) query = query.eq("unit_id", filters.unitId);
  if (filters.assetId) query = query.eq("asset_id", filters.assetId);
  if (filters.vendorId) query = query.eq("legacy_vendor_id", filters.vendorId);
  if (filters.completedFrom) query = query.gte("completed_at", filters.completedFrom);
  if (filters.completedTo) query = query.lte("completed_at", filters.completedTo);

  const trimmed = filters.search?.trim();
  if (trimmed) {
    const escaped = escapeIlike(trimmed);
    query = query.or(
      `issue.ilike.%${escaped}%,resolution.ilike.%${escaped}%,service_provider_display_name.ilike.%${escaped}%`
    );
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return ((data ?? []) as unknown as FacilityRecordRelationRow[]).map(toFacilityRecordListItem);
}

/**
 * When a Work Order is reopened (leaves completed), keep the Facility Record
 * and mark lifecycle provisional so the next completion refreshes the same row.
 */
export async function markFacilityRecordProvisionalOnReopen(
  organizationId: string,
  workOrderId: string,
  userId: string,
  client?: SupabaseClientType
): Promise<void> {
  const supabase = await resolveClient(client);
  const { error } = await supabase
    .from("facility_records")
    .update({
      lifecycle_status: "provisional",
      updated_by: userId
    } satisfies Database["public"]["Tables"]["facility_records"]["Update"])
    .eq("organization_id", organizationId)
    .eq("work_order_id", workOrderId)
    .eq("status", "active");

  if (error) throw new Error(error.message);
}

/**
 * Idempotent: exactly one active Facility Record per completed Work Order.
 * First completion inserts; reopen + re-complete updates the same row.
 */
export async function upsertFacilityRecordOnWorkOrderCompleted(
  organizationId: string,
  workOrderId: string,
  userId: string,
  client?: SupabaseClientType
): Promise<FacilityRecord> {
  const supabase = await resolveClient(client);

  const { data: workOrder, error: workOrderError } = await supabase
    .from("maintenance_work_orders")
    .select(
      "id, organization_id, property_id, unit_id, title, description, category, vendor_id, assigned_to_user_id, completed_at, internal_notes, photo_placeholder, document_placeholder"
    )
    .eq("organization_id", organizationId)
    .eq("id", workOrderId)
    .is("deleted_at", null)
    .maybeSingle();

  if (workOrderError) throw new Error(workOrderError.message);
  if (!workOrder) throw new Error("Work order not found");

  const wo = workOrder as WorkOrderSnapshot;
  const completedAt = wo.completed_at ?? new Date().toISOString();
  const vendorName = await resolveVendorDisplayName(organizationId, wo.vendor_id, supabase);
  const vaultRefs = await resolveVaultReferences(organizationId, workOrderId, supabase);

  const issue = wo.title.trim() || "Repair";
  const resolutionParts = [wo.internal_notes?.trim(), wo.description?.trim()].filter(Boolean);
  const resolution = resolutionParts.join("\n\n") || "Work order completed.";
  const serviceProviderType: ServiceProviderType = wo.vendor_id
    ? "vendor"
    : wo.assigned_to_user_id
      ? "internal_staff"
      : "unassigned";

  const existing = await getFacilityRecordByWorkOrderId(organizationId, workOrderId, supabase);

  if (existing) {
    const { data, error } = await supabase
      .from("facility_records")
      .update({
        property_id: wo.property_id,
        unit_id: wo.unit_id,
        legacy_vendor_id: wo.vendor_id,
        service_provider_display_name: vendorName,
        service_provider_type: serviceProviderType,
        assigned_staff_user_id: wo.assigned_to_user_id,
        issue,
        resolution,
        completed_at: completedAt,
        warranty_placeholder: existing.warrantyPlaceholder,
        invoice_placeholder: existing.invoicePlaceholder ?? wo.document_placeholder,
        lifecycle_status: "finalized",
        photo_document_ids: vaultRefs.photoDocumentIds,
        document_ids: vaultRefs.documentIds,
        updated_by: userId,
        metadata: {
          ...existing.metadata,
          category: wo.category,
          photoPlaceholder: wo.photo_placeholder,
          documentPlaceholder: wo.document_placeholder,
          refreshedAt: new Date().toISOString()
        } as Json
      } satisfies Database["public"]["Tables"]["facility_records"]["Update"])
      .eq("organization_id", organizationId)
      .eq("id", existing.id)
      .eq("status", "active")
      .select(FACILITY_RECORD_SELECT)
      .single();

    if (error || !data) throw new Error(error?.message ?? "Facility record update failed");
    const record = toFacilityRecordListItem(data as unknown as FacilityRecordRelationRow);
    // Re-completion after reopen: append a distinct service-visit event (idempotent key).
    await appendRepairTimelineEvent({
      organizationId,
      userId,
      record,
      category: wo.category,
      eventType: "facility.service_visit",
      sourceEntityId: `${record.id}:${record.completedAt}`,
      client: supabase
    });
    return record;
  }

  const { data, error } = await supabase
    .from("facility_records")
    .insert({
      organization_id: organizationId,
      property_id: wo.property_id,
      unit_id: wo.unit_id,
      building_id: null,
      work_order_id: workOrderId,
      legacy_vendor_id: wo.vendor_id,
      service_provider_display_name: vendorName,
      service_provider_type: serviceProviderType,
      assigned_staff_user_id: wo.assigned_to_user_id,
      issue,
      resolution,
      completed_at: completedAt,
      warranty_placeholder: null,
      invoice_placeholder: wo.document_placeholder,
      lifecycle_status: "finalized",
      status: "active",
      photo_document_ids: vaultRefs.photoDocumentIds,
      document_ids: vaultRefs.documentIds,
      metadata: {
        category: wo.category,
        photoPlaceholder: wo.photo_placeholder,
        documentPlaceholder: wo.document_placeholder
      } as Json,
      created_by: userId,
      updated_by: userId
    })
    .select(FACILITY_RECORD_SELECT)
    .single();

  if (error || !data) throw new Error(error?.message ?? "Facility record creation failed");
  const record = toFacilityRecordListItem(data as unknown as FacilityRecordRelationRow);
  await appendRepairTimelineEvent({
    organizationId,
    userId,
    record,
    category: wo.category,
    eventType: "facility.repair_completed",
    client: supabase
  });
  return record;
}

/**
 * Administrative correction: supersede prior active record and mint a corrected active row.
 * Audited via correction_reason / corrected_by / corrected_at and a timeline event.
 */
export async function correctFacilityRecord(
  organizationId: string,
  recordId: string,
  userId: string,
  input: CorrectFacilityRecordInput,
  client?: SupabaseClientType
): Promise<FacilityRecordListItem> {
  const supabase = await resolveClient(client);
  const existing = await getFacilityRecordForOrganization(organizationId, recordId, supabase);
  if (!existing) throw new Error("Facility record not found");
  if (existing.status !== "active") throw new Error("Only active facility records can be corrected");

  const { error: supersedeError } = await supabase
    .from("facility_records")
    .update({
      status: "superseded_by_correction",
      updated_by: userId
    } satisfies Database["public"]["Tables"]["facility_records"]["Update"])
    .eq("organization_id", organizationId)
    .eq("id", existing.id);

  if (supersedeError) throw new Error(supersedeError.message);

  const { data, error } = await supabase
    .from("facility_records")
    .insert({
      organization_id: organizationId,
      property_id: existing.propertyId,
      unit_id: existing.unitId,
      building_id: existing.buildingId,
      asset_id: existing.assetId,
      work_order_id: existing.workOrderId,
      legacy_vendor_id:
        input.legacyVendorId !== undefined ? input.legacyVendorId : existing.legacyVendorId,
      service_provider_display_name:
        input.serviceProviderDisplayName !== undefined
          ? input.serviceProviderDisplayName
          : existing.serviceProviderDisplayName,
      service_provider_type: input.serviceProviderType ?? existing.serviceProviderType,
      assigned_staff_user_id: existing.assignedStaffUserId,
      issue: input.issue?.trim() || existing.issue,
      resolution: input.resolution?.trim() || existing.resolution,
      completed_at: input.completedAt || existing.completedAt,
      warranty_placeholder:
        input.warrantyPlaceholder !== undefined
          ? input.warrantyPlaceholder
          : existing.warrantyPlaceholder,
      invoice_placeholder:
        input.invoicePlaceholder !== undefined
          ? input.invoicePlaceholder
          : existing.invoicePlaceholder,
      lifecycle_status: "finalized",
      status: "active",
      correction_of_id: existing.id,
      correction_reason: input.reason,
      corrected_by: userId,
      corrected_at: new Date().toISOString(),
      photo_document_ids: existing.photoDocumentIds,
      document_ids: existing.documentIds,
      metadata: {
        ...existing.metadata,
        correctedFromId: existing.id
      } as Json,
      created_by: userId,
      updated_by: userId
    })
    .select(FACILITY_RECORD_SELECT)
    .single();

  if (error || !data) throw new Error(error?.message ?? "Facility record correction failed");
  const record = toFacilityRecordListItem(data as unknown as FacilityRecordRelationRow);

  const category =
    typeof existing.metadata["category"] === "string" ? existing.metadata["category"] : "general";
  await appendRepairTimelineEvent({
    organizationId,
    userId,
    record,
    category,
    eventType: "facility.record_corrected",
    client: supabase
  });

  return record;
}
