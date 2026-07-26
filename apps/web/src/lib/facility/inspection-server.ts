import { createAuthServerComponentClient } from "../auth/server";
import type { Database, Json } from "@mpa/supabase";
import { createWorkOrder } from "../maintenance/server";
import {
  type CompleteInspectionInput,
  type CreateInspectionRunInput,
  type FacilityInspectionItem,
  type FacilityInspectionRun,
  type FacilityInspectionRunDetail,
  type FacilityInspectionRunListItem,
  type FacilityInspectionTemplate,
  type InspectionItemResult,
  type InspectionStatus,
  type InspectionTemplateItemDef,
  type ListInspectionRunsOptions,
  type UpdateInspectionItemInput
} from "./inspection-contracts";
import { upsertFacilityRecordOnInspectionCompleted } from "./server";

type SupabaseClientType = Awaited<ReturnType<typeof createAuthServerComponentClient>>;

type TemplateRow = {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  items: Json;
  active: boolean;
  metadata: Json | null;
  created_by: string;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

type RunRow = {
  id: string;
  organization_id: string;
  property_id: string;
  unit_id: string | null;
  template_id: string | null;
  title: string;
  status: InspectionStatus;
  assigned_to_user_id: string | null;
  due_on: string | null;
  started_at: string | null;
  completed_at: string | null;
  notes: string | null;
  metadata: Json | null;
  created_by: string;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

type ItemRow = {
  id: string;
  organization_id: string;
  run_id: string;
  sort_order: number;
  label: string;
  result: InspectionItemResult | null;
  notes: string | null;
  photo_media_asset_ids: string[] | null;
  metadata: Json | null;
  created_at: string;
  updated_at: string;
};

const RUN_SELECT =
  "id, organization_id, property_id, unit_id, template_id, title, status, assigned_to_user_id, due_on, started_at, completed_at, notes, metadata, created_by, updated_by, created_at, updated_at, deleted_at";

const ITEM_SELECT =
  "id, organization_id, run_id, sort_order, label, result, notes, photo_media_asset_ids, metadata, created_at, updated_at";

async function resolveClient(client?: SupabaseClientType): Promise<SupabaseClientType> {
  return client ?? (await createAuthServerComponentClient());
}

function toMetadata(value: Json | null): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function parseTemplateItems(value: Json): InspectionTemplateItemDef[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) return null;
      const label = (entry as Record<string, unknown>)["label"];
      if (typeof label !== "string" || !label.trim()) return null;
      return { label: label.trim() };
    })
    .filter((entry): entry is InspectionTemplateItemDef => Boolean(entry));
}

function toTemplate(row: TemplateRow): FacilityInspectionTemplate {
  return {
    id: row.id,
    organizationId: row.organization_id,
    name: row.name,
    description: row.description,
    items: parseTemplateItems(row.items),
    active: row.active,
    metadata: toMetadata(row.metadata),
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at
  };
}

function toRun(row: RunRow): FacilityInspectionRun {
  return {
    id: row.id,
    organizationId: row.organization_id,
    propertyId: row.property_id,
    unitId: row.unit_id,
    templateId: row.template_id,
    title: row.title,
    status: row.status,
    assignedToUserId: row.assigned_to_user_id,
    dueOn: row.due_on,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    notes: row.notes,
    metadata: toMetadata(row.metadata),
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at
  };
}

function toItem(row: ItemRow): FacilityInspectionItem {
  return {
    id: row.id,
    organizationId: row.organization_id,
    runId: row.run_id,
    sortOrder: row.sort_order,
    label: row.label,
    result: row.result,
    notes: row.notes,
    photoMediaAssetIds: row.photo_media_asset_ids ?? [],
    metadata: toMetadata(row.metadata),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

async function propertyUnitMaps(
  organizationId: string,
  propertyIds: string[],
  unitIds: string[],
  client: SupabaseClientType
): Promise<{ properties: Map<string, string>; units: Map<string, string> }> {
  const properties = new Map<string, string>();
  const units = new Map<string, string>();
  const uniqueProperties = [...new Set(propertyIds.filter(Boolean))];
  const uniqueUnits = [...new Set(unitIds.filter(Boolean))];

  if (uniqueProperties.length > 0) {
    const { data } = await client
      .from("properties")
      .select("id, name")
      .eq("organization_id", organizationId)
      .in("id", uniqueProperties);
    for (const row of data ?? []) {
      properties.set(row.id as string, row.name as string);
    }
  }
  if (uniqueUnits.length > 0) {
    const { data } = await client
      .from("units")
      .select("id, unit_number")
      .eq("organization_id", organizationId)
      .in("id", uniqueUnits);
    for (const row of data ?? []) {
      units.set(row.id as string, row.unit_number as string);
    }
  }
  return { properties, units };
}

async function itemStatsForRuns(
  organizationId: string,
  runIds: string[],
  client: SupabaseClientType
): Promise<Map<string, { itemCount: number; failCount: number }>> {
  const stats = new Map<string, { itemCount: number; failCount: number }>();
  if (runIds.length === 0) return stats;
  const { data, error } = await client
    .from("facility_inspection_items")
    .select("run_id, result")
    .eq("organization_id", organizationId)
    .in("run_id", runIds);
  if (error) throw new Error(error.message);
  for (const row of data ?? []) {
    const runId = row.run_id as string;
    const current = stats.get(runId) ?? { itemCount: 0, failCount: 0 };
    current.itemCount += 1;
    if (row.result === "fail") current.failCount += 1;
    stats.set(runId, current);
  }
  return stats;
}

export async function listInspectionTemplates(
  organizationId: string,
  client?: SupabaseClientType
): Promise<FacilityInspectionTemplate[]> {
  const supabase = await resolveClient(client);
  const { data, error } = await supabase
    .from("facility_inspection_templates")
    .select(
      "id, organization_id, name, description, items, active, metadata, created_by, updated_by, created_at, updated_at, deleted_at"
    )
    .eq("organization_id", organizationId)
    .eq("active", true)
    .is("deleted_at", null)
    .order("name", { ascending: true });
  if (error) throw new Error(error.message);
  return ((data ?? []) as TemplateRow[]).map(toTemplate);
}

export async function listInspectionRuns(
  organizationId: string,
  options: ListInspectionRunsOptions = {},
  client?: SupabaseClientType
): Promise<FacilityInspectionRunListItem[]> {
  const supabase = await resolveClient(client);
  let query = supabase
    .from("facility_inspection_runs")
    .select(RUN_SELECT)
    .eq("organization_id", organizationId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(options.limit ?? 100);

  if (options.propertyId) query = query.eq("property_id", options.propertyId);
  if (options.status) query = query.eq("status", options.status);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as RunRow[];
  const { properties, units } = await propertyUnitMaps(
    organizationId,
    rows.map((row) => row.property_id),
    rows.map((row) => row.unit_id).filter((id): id is string => Boolean(id)),
    supabase
  );
  const stats = await itemStatsForRuns(
    organizationId,
    rows.map((row) => row.id),
    supabase
  );

  return rows.map((row) => {
    const runStats = stats.get(row.id) ?? { itemCount: 0, failCount: 0 };
    return {
      ...toRun(row),
      propertyName: properties.get(row.property_id) ?? null,
      unitNumber: row.unit_id ? units.get(row.unit_id) ?? null : null,
      itemCount: runStats.itemCount,
      failCount: runStats.failCount
    };
  });
}

export async function getInspectionRun(
  organizationId: string,
  runId: string,
  client?: SupabaseClientType
): Promise<FacilityInspectionRunDetail | null> {
  const supabase = await resolveClient(client);
  const { data, error } = await supabase
    .from("facility_inspection_runs")
    .select(RUN_SELECT)
    .eq("organization_id", organizationId)
    .eq("id", runId)
    .is("deleted_at", null)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;

  const row = data as RunRow;
  const { data: itemData, error: itemError } = await supabase
    .from("facility_inspection_items")
    .select(ITEM_SELECT)
    .eq("organization_id", organizationId)
    .eq("run_id", runId)
    .order("sort_order", { ascending: true });
  if (itemError) throw new Error(itemError.message);

  const items = ((itemData ?? []) as ItemRow[]).map(toItem);
  const { properties, units } = await propertyUnitMaps(
    organizationId,
    [row.property_id],
    row.unit_id ? [row.unit_id] : [],
    supabase
  );

  return {
    ...toRun(row),
    propertyName: properties.get(row.property_id) ?? null,
    unitNumber: row.unit_id ? units.get(row.unit_id) ?? null : null,
    itemCount: items.length,
    failCount: items.filter((item) => item.result === "fail").length,
    items
  };
}

export async function createInspectionRun(
  organizationId: string,
  userId: string,
  input: CreateInspectionRunInput,
  client?: SupabaseClientType
): Promise<FacilityInspectionRunDetail> {
  const supabase = await resolveClient(client);

  let labels: string[] = input.itemLabels ?? [];
  if (input.templateId) {
    const { data: template, error } = await supabase
      .from("facility_inspection_templates")
      .select("id, items, active, deleted_at")
      .eq("organization_id", organizationId)
      .eq("id", input.templateId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!template || template.deleted_at || !template.active) {
      throw new Error("Inspection template not found");
    }
    const templateLabels = parseTemplateItems(template.items as Json).map((item) => item.label);
    labels = [...templateLabels, ...labels];
  }

  if (labels.length === 0) {
    labels = ["General findings"];
  }

  const { data, error } = await supabase
    .from("facility_inspection_runs")
    .insert({
      organization_id: organizationId,
      property_id: input.propertyId,
      unit_id: input.unitId ?? null,
      template_id: input.templateId ?? null,
      title: input.title.trim(),
      status: "draft",
      assigned_to_user_id: input.assignedToUserId ?? userId,
      due_on: input.dueOn ?? null,
      notes: input.notes ?? null,
      created_by: userId,
      updated_by: userId
    })
    .select(RUN_SELECT)
    .single();
  if (error || !data) throw new Error(error?.message ?? "Inspection create failed");

  const run = data as RunRow;
  const itemRows = labels.map((label, index) => ({
    organization_id: organizationId,
    run_id: run.id,
    sort_order: index,
    label
  }));
  const { error: itemsError } = await supabase.from("facility_inspection_items").insert(itemRows);
  if (itemsError) throw new Error(itemsError.message);

  const detail = await getInspectionRun(organizationId, run.id, supabase);
  if (!detail) throw new Error("Inspection enrichment failed");
  return detail;
}

export async function startInspectionRun(
  organizationId: string,
  runId: string,
  userId: string,
  client?: SupabaseClientType
): Promise<FacilityInspectionRunDetail> {
  const supabase = await resolveClient(client);
  const existing = await getInspectionRun(organizationId, runId, supabase);
  if (!existing) throw new Error("Inspection not found");
  if (existing.status === "completed" || existing.status === "canceled") {
    throw new Error("Completed or canceled inspections cannot be started");
  }
  if (existing.status === "in_progress") return existing;

  const { error } = await supabase
    .from("facility_inspection_runs")
    .update({
      status: "in_progress",
      started_at: existing.startedAt ?? new Date().toISOString(),
      updated_by: userId
    })
    .eq("organization_id", organizationId)
    .eq("id", runId);
  if (error) throw new Error(error.message);

  const detail = await getInspectionRun(organizationId, runId, supabase);
  if (!detail) throw new Error("Inspection not found");
  return detail;
}

export async function updateInspectionItem(
  organizationId: string,
  runId: string,
  userId: string,
  input: UpdateInspectionItemInput,
  client?: SupabaseClientType
): Promise<FacilityInspectionItem> {
  const supabase = await resolveClient(client);
  const run = await getInspectionRun(organizationId, runId, supabase);
  if (!run) throw new Error("Inspection not found");
  if (run.status === "completed" || run.status === "canceled") {
    throw new Error("Cannot update items on a closed inspection");
  }

  if (run.status === "draft") {
    await startInspectionRun(organizationId, runId, userId, supabase);
  }

  const patch: Database["public"]["Tables"]["facility_inspection_items"]["Update"] = {};
  if (input.result !== undefined) patch.result = input.result;
  if (input.notes !== undefined) patch.notes = input.notes;
  if (input.photoMediaAssetIds !== undefined) {
    patch.photo_media_asset_ids = input.photoMediaAssetIds;
  }
  if (Object.keys(patch).length === 0) {
    const existing = run.items.find((item) => item.id === input.itemId);
    if (!existing) throw new Error("Inspection item not found");
    return existing;
  }

  const { data, error } = await supabase
    .from("facility_inspection_items")
    .update(patch)
    .eq("organization_id", organizationId)
    .eq("run_id", runId)
    .eq("id", input.itemId)
    .select(ITEM_SELECT)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Inspection item not found");
  return toItem(data as ItemRow);
}

export async function addInspectionItem(
  organizationId: string,
  runId: string,
  userId: string,
  label: string,
  client?: SupabaseClientType
): Promise<FacilityInspectionItem> {
  const supabase = await resolveClient(client);
  const run = await getInspectionRun(organizationId, runId, supabase);
  if (!run) throw new Error("Inspection not found");
  if (run.status === "completed" || run.status === "canceled") {
    throw new Error("Cannot add items to a closed inspection");
  }

  const nextOrder = run.items.reduce((max, item) => Math.max(max, item.sortOrder), -1) + 1;
  const { data, error } = await supabase
    .from("facility_inspection_items")
    .insert({
      organization_id: organizationId,
      run_id: runId,
      sort_order: nextOrder,
      label: label.trim()
    })
    .select(ITEM_SELECT)
    .single();
  if (error || !data) throw new Error(error?.message ?? "Could not add inspection item");

  await supabase
    .from("facility_inspection_runs")
    .update({ updated_by: userId })
    .eq("id", runId)
    .eq("organization_id", organizationId);

  return toItem(data as ItemRow);
}

export async function completeInspectionRun(
  organizationId: string,
  runId: string,
  userId: string,
  input: CompleteInspectionInput = {},
  client?: SupabaseClientType
): Promise<{
  run: FacilityInspectionRunDetail;
  facilityRecordId: string;
  followUpWorkOrderId: string | null;
}> {
  const supabase = await resolveClient(client);
  const existing = await getInspectionRun(organizationId, runId, supabase);
  if (!existing) throw new Error("Inspection not found");
  if (existing.status === "completed") {
    throw new Error("Inspection already completed");
  }
  if (existing.status === "canceled") {
    throw new Error("Canceled inspections cannot be completed");
  }

  const completedAt = new Date().toISOString();
  const { error } = await supabase
    .from("facility_inspection_runs")
    .update({
      status: "completed",
      completed_at: completedAt,
      started_at: existing.startedAt ?? completedAt,
      notes: input.notes !== undefined ? input.notes : existing.notes,
      updated_by: userId
    })
    .eq("organization_id", organizationId)
    .eq("id", runId);
  if (error) throw new Error(error.message);

  const record = await upsertFacilityRecordOnInspectionCompleted(
    organizationId,
    runId,
    userId,
    supabase
  );

  let followUpWorkOrderId: string | null = null;
  const failed = existing.items.filter((item) => item.result === "fail");
  if (input.createFollowUpWorkOrder === true && failed.length > 0) {
    const lines = failed.map((item) => `• ${item.label}${item.notes ? ` — ${item.notes}` : ""}`);
    const workOrder = await createWorkOrder(
      organizationId,
      userId,
      {
        propertyId: existing.propertyId,
        unitId: existing.unitId,
        tenantId: null,
        title: `Follow-up: ${existing.title}`,
        description: `Follow-up work from failed inspection items:\n${lines.join("\n")}`,
        category: "general",
        priority: "medium",
        status: "submitted",
        dueDate: null,
        assignedToUserId: existing.assignedToUserId,
        internalNotes: null,
        tenantNotes: null,
        photoPlaceholder: null,
        documentPlaceholder: null,
        recurringMaintenancePlaceholder: null,
        preventiveMaintenancePlaceholder: null,
        metadata: {
          source: "facility_inspection",
          inspectionRunId: existing.id,
          failedItemIds: failed.map((item) => item.id)
        }
      },
      supabase
    );
    followUpWorkOrderId = workOrder.id;
  }

  const run = await getInspectionRun(organizationId, runId, supabase);
  if (!run) throw new Error("Inspection not found after complete");
  return { run, facilityRecordId: record.id, followUpWorkOrderId };
}
