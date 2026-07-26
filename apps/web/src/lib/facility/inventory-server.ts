import { createAuthServerComponentClient } from "../auth/server";
import type { Database, Json } from "@mpa/supabase";
import type {
  CreateFacilityInventoryInput,
  FacilityInventoryItem,
  FacilityInventoryListItem,
  FacilityInventoryStatus,
  ListFacilityInventoryOptions,
  UpdateFacilityInventoryInput
} from "./inventory-contracts";
import { isFacilityInventoryStatus } from "./inventory-contracts";

type SupabaseClientType = Awaited<ReturnType<typeof createAuthServerComponentClient>>;
type InventoryUpdate = Database["public"]["Tables"]["facility_inventory_items"]["Update"];

type InventoryRow = {
  id: string;
  organization_id: string;
  name: string;
  status: string;
  category: string | null;
  property_id: string | null;
  assigned_technician_user_id: string | null;
  purchase_date: string | null;
  warranty_ends_on: string | null;
  warranty_notes: string | null;
  serial_number: string | null;
  notes: string | null;
  primary_media_asset_id: string | null;
  metadata: Json | null;
  created_by: string;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

type InventoryRelationRow = InventoryRow & {
  properties: { name: string } | null;
};

const INVENTORY_SELECT =
  "id, organization_id, name, status, category, property_id, assigned_technician_user_id, purchase_date, warranty_ends_on, warranty_notes, serial_number, notes, primary_media_asset_id, metadata, created_by, updated_by, created_at, updated_at, deleted_at, properties(name)";

async function resolveClient(client?: SupabaseClientType): Promise<SupabaseClientType> {
  return client ?? (await createAuthServerComponentClient());
}

function toMetadata(value: Json | null): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function toStatus(value: string): FacilityInventoryStatus {
  return isFacilityInventoryStatus(value) ? value : "available";
}

function toInventoryItem(row: InventoryRow): FacilityInventoryItem {
  return {
    id: row.id,
    organizationId: row.organization_id,
    name: row.name,
    status: toStatus(row.status),
    category: row.category,
    propertyId: row.property_id,
    assignedTechnicianUserId: row.assigned_technician_user_id,
    purchaseDate: row.purchase_date,
    warrantyEndsOn: row.warranty_ends_on,
    warrantyNotes: row.warranty_notes,
    serialNumber: row.serial_number,
    notes: row.notes,
    primaryMediaAssetId: row.primary_media_asset_id,
    metadata: toMetadata(row.metadata),
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at
  };
}

function toListItem(row: InventoryRelationRow): FacilityInventoryListItem {
  return {
    ...toInventoryItem(row),
    propertyName: row.properties?.name ?? null
  };
}

export async function listFacilityInventory(
  organizationId: string,
  options: ListFacilityInventoryOptions = {},
  client?: SupabaseClientType
): Promise<FacilityInventoryListItem[]> {
  const supabase = await resolveClient(client);
  let query = supabase
    .from("facility_inventory_items")
    .select(INVENTORY_SELECT)
    .eq("organization_id", organizationId)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false });

  if (options.status) query = query.eq("status", options.status);
  if (options.propertyId) query = query.eq("property_id", options.propertyId);

  const search = options.search?.trim();
  if (search) {
    const escaped = search.replace(/[%_,]/g, "\\$&");
    query = query.or(
      `name.ilike.%${escaped}%,category.ilike.%${escaped}%,serial_number.ilike.%${escaped}%`
    );
  }

  if (options.limit !== undefined) {
    const from = options.offset ?? 0;
    query = query.range(from, from + options.limit - 1);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return ((data ?? []) as InventoryRelationRow[]).map(toListItem);
}

export async function getFacilityInventoryItem(
  organizationId: string,
  itemId: string,
  client?: SupabaseClientType
): Promise<FacilityInventoryListItem | null> {
  const supabase = await resolveClient(client);
  const { data, error } = await supabase
    .from("facility_inventory_items")
    .select(INVENTORY_SELECT)
    .eq("organization_id", organizationId)
    .eq("id", itemId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;
  return toListItem(data as InventoryRelationRow);
}

export async function createFacilityInventoryItem(
  organizationId: string,
  userId: string,
  input: CreateFacilityInventoryInput,
  client?: SupabaseClientType
): Promise<FacilityInventoryItem> {
  const supabase = await resolveClient(client);
  const { data, error } = await supabase
    .from("facility_inventory_items")
    .insert({
      organization_id: organizationId,
      name: input.name,
      status: input.status ?? "available",
      category: input.category ?? null,
      property_id: input.propertyId ?? null,
      assigned_technician_user_id: input.assignedTechnicianUserId ?? null,
      purchase_date: input.purchaseDate ?? null,
      warranty_ends_on: input.warrantyEndsOn ?? null,
      warranty_notes: input.warrantyNotes ?? null,
      serial_number: input.serialNumber ?? null,
      notes: input.notes ?? null,
      primary_media_asset_id: input.primaryMediaAssetId,
      created_by: userId,
      updated_by: userId
    })
    .select(
      "id, organization_id, name, status, category, property_id, assigned_technician_user_id, purchase_date, warranty_ends_on, warranty_notes, serial_number, notes, primary_media_asset_id, metadata, created_by, updated_by, created_at, updated_at, deleted_at"
    )
    .single();

  if (error) throw new Error(error.message);
  return toInventoryItem(data as InventoryRow);
}

export async function updateFacilityInventoryItem(
  organizationId: string,
  itemId: string,
  userId: string,
  input: UpdateFacilityInventoryInput,
  client?: SupabaseClientType
): Promise<FacilityInventoryItem> {
  const supabase = await resolveClient(client);
  const patch = {
    updated_by: userId,
    ...(input.name !== undefined ? { name: input.name } : {}),
    ...(input.status !== undefined ? { status: input.status } : {}),
    ...(input.category !== undefined ? { category: input.category } : {}),
    ...(input.propertyId !== undefined ? { property_id: input.propertyId } : {}),
    ...(input.assignedTechnicianUserId !== undefined
      ? { assigned_technician_user_id: input.assignedTechnicianUserId }
      : {}),
    ...(input.purchaseDate !== undefined ? { purchase_date: input.purchaseDate } : {}),
    ...(input.warrantyEndsOn !== undefined ? { warranty_ends_on: input.warrantyEndsOn } : {}),
    ...(input.warrantyNotes !== undefined ? { warranty_notes: input.warrantyNotes } : {}),
    ...(input.serialNumber !== undefined ? { serial_number: input.serialNumber } : {}),
    ...(input.notes !== undefined ? { notes: input.notes } : {}),
    ...(input.primaryMediaAssetId !== undefined
      ? { primary_media_asset_id: input.primaryMediaAssetId }
      : {})
  } satisfies InventoryUpdate;

  const { data, error } = await supabase
    .from("facility_inventory_items")
    .update(patch)
    .eq("organization_id", organizationId)
    .eq("id", itemId)
    .is("deleted_at", null)
    .select(
      "id, organization_id, name, status, category, property_id, assigned_technician_user_id, purchase_date, warranty_ends_on, warranty_notes, serial_number, notes, primary_media_asset_id, metadata, created_by, updated_by, created_at, updated_at, deleted_at"
    )
    .single();

  if (error) throw new Error(error.message);
  return toInventoryItem(data as InventoryRow);
}
