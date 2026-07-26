import { createAuthServerComponentClient } from "../auth/server";
import type { Database, Json } from "@mpa/supabase";
import type {
  CreateWorkOrderMaterialInput,
  UpdateWorkOrderMaterialInput,
  WorkOrderMaterial
} from "./materials-contracts";

type SupabaseClientType = Awaited<ReturnType<typeof createAuthServerComponentClient>>;

type MaterialRow = {
  id: string;
  organization_id: string;
  work_order_id: string;
  name: string;
  quantity: number | string;
  inventory_item_id: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

const MATERIAL_SELECT =
  "id, organization_id, work_order_id, name, quantity, inventory_item_id, sort_order, created_at, updated_at";

async function resolveClient(client?: SupabaseClientType): Promise<SupabaseClientType> {
  return client ?? (await createAuthServerComponentClient());
}

function toMaterial(row: MaterialRow): WorkOrderMaterial {
  return {
    id: row.id,
    organizationId: row.organization_id,
    workOrderId: row.work_order_id,
    name: row.name,
    quantity: Number(row.quantity),
    inventoryItemId: row.inventory_item_id,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export async function listWorkOrderMaterials(
  organizationId: string,
  workOrderId: string,
  client?: SupabaseClientType
): Promise<WorkOrderMaterial[]> {
  const supabase = await resolveClient(client);
  const { data, error } = await supabase
    .from("facility_work_order_materials")
    .select(MATERIAL_SELECT)
    .eq("organization_id", organizationId)
    .eq("work_order_id", workOrderId)
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return ((data ?? []) as MaterialRow[]).map(toMaterial);
}

export async function addWorkOrderMaterial(
  organizationId: string,
  workOrderId: string,
  userId: string,
  input: CreateWorkOrderMaterialInput,
  client?: SupabaseClientType
): Promise<WorkOrderMaterial> {
  const supabase = await resolveClient(client);
  const existing = await listWorkOrderMaterials(organizationId, workOrderId, supabase);
  const sortOrder = existing.reduce((max, row) => Math.max(max, row.sortOrder), -1) + 1;

  const { data, error } = await supabase
    .from("facility_work_order_materials")
    .insert({
      organization_id: organizationId,
      work_order_id: workOrderId,
      name: input.name.trim(),
      quantity: input.quantity ?? 1,
      inventory_item_id: input.inventoryItemId ?? null,
      sort_order: sortOrder,
      created_by: userId,
      updated_by: userId
    })
    .select(MATERIAL_SELECT)
    .single();
  if (error || !data) throw new Error(error?.message ?? "Could not add material");
  return toMaterial(data as MaterialRow);
}

export async function updateWorkOrderMaterial(
  organizationId: string,
  workOrderId: string,
  materialId: string,
  userId: string,
  input: UpdateWorkOrderMaterialInput,
  client?: SupabaseClientType
): Promise<WorkOrderMaterial> {
  const supabase = await resolveClient(client);
  const patch: Database["public"]["Tables"]["facility_work_order_materials"]["Update"] = {
    updated_by: userId
  };
  if (input.name !== undefined) patch.name = input.name.trim();
  if (input.quantity !== undefined) patch.quantity = input.quantity;
  if (input.inventoryItemId !== undefined) patch.inventory_item_id = input.inventoryItemId;

  const { data, error } = await supabase
    .from("facility_work_order_materials")
    .update(patch)
    .eq("organization_id", organizationId)
    .eq("work_order_id", workOrderId)
    .eq("id", materialId)
    .select(MATERIAL_SELECT)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Material not found");
  return toMaterial(data as MaterialRow);
}

export async function deleteWorkOrderMaterial(
  organizationId: string,
  workOrderId: string,
  materialId: string,
  client?: SupabaseClientType
): Promise<void> {
  const supabase = await resolveClient(client);
  const { error } = await supabase
    .from("facility_work_order_materials")
    .delete()
    .eq("organization_id", organizationId)
    .eq("work_order_id", workOrderId)
    .eq("id", materialId);
  if (error) throw new Error(error.message);
}

export async function getWorkOrderRecommendations(
  organizationId: string,
  workOrderId: string,
  client?: SupabaseClientType
): Promise<string | null> {
  const supabase = await resolveClient(client);
  const { data, error } = await supabase
    .from("maintenance_work_orders")
    .select("metadata")
    .eq("organization_id", organizationId)
    .eq("id", workOrderId)
    .is("deleted_at", null)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  const metadata = (data.metadata ?? {}) as Record<string, unknown>;
  const notes = metadata["recommendationsNotes"];
  return typeof notes === "string" && notes.trim() ? notes.trim() : null;
}

export async function setWorkOrderRecommendations(
  organizationId: string,
  workOrderId: string,
  userId: string,
  recommendationsNotes: string | null,
  client?: SupabaseClientType
): Promise<string | null> {
  const supabase = await resolveClient(client);
  const { data: existing, error: readError } = await supabase
    .from("maintenance_work_orders")
    .select("metadata")
    .eq("organization_id", organizationId)
    .eq("id", workOrderId)
    .is("deleted_at", null)
    .maybeSingle();
  if (readError) throw new Error(readError.message);
  if (!existing) throw new Error("Work order not found");

  const metadata = {
    ...((existing.metadata as Record<string, unknown> | null) ?? {}),
    recommendationsNotes
  };

  const { error } = await supabase
    .from("maintenance_work_orders")
    .update({
      metadata: metadata as Json,
      updated_by: userId
    })
    .eq("organization_id", organizationId)
    .eq("id", workOrderId);
  if (error) throw new Error(error.message);
  return recommendationsNotes;
}
