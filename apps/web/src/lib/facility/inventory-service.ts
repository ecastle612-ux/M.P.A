import type { SupabaseClient } from "@supabase/supabase-js";
import {
  applyFacilityStockMovementInputSchema,
  createFacilityStockItemInputSchema,
  isLowStock,
  suggestedReorderQuantity,
  type ApplyFacilityStockMovementInput,
  type CreateFacilityStockItemInput,
  type FacilityStockCategory,
  type FacilityStockMovementType,
  type FacilityStockUnit
} from "@mpa/shared";
import { writeMaintenanceAudit } from "../maintenance/events-audit";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = SupabaseClient<any>;

export type FacilityStockItemRow = {
  id: string;
  organization_id: string;
  property_property_id: string;
  name: string;
  category: FacilityStockCategory;
  quantity_on_hand: number;
  unit_of_measure: FacilityStockUnit;
  storage_location_label: string;
  min_threshold: number | null;
  reorder_level: number | null;
  vendor_id: string | null;
  sku_code: string | null;
  status: "active" | "inactive";
  notes: string | null;
  created_at: string;
  property_properties?: { id: string; name: string } | null;
  vendor_vendors?: { id: string; name: string } | null;
};

export type FacilityStockMovementRow = {
  id: string;
  stock_item_id: string;
  movement_type: FacilityStockMovementType;
  quantity: number;
  quantity_after: number;
  reason: string | null;
  work_order_id: string | null;
  actor_user_id: string;
  created_at: string;
};

const SELECT_ITEM = `
  id, organization_id, property_property_id, name, category, quantity_on_hand, unit_of_measure,
  storage_location_label, min_threshold, reorder_level, vendor_id, sku_code, status, notes, created_at,
  property_properties ( id, name ),
  vendor_vendors ( id, name )
`;

function asSingle<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function normalizeItem(row: Record<string, unknown>): FacilityStockItemRow {
  return {
    ...(row as FacilityStockItemRow),
    quantity_on_hand: Number(row["quantity_on_hand"] ?? 0),
    min_threshold: row["min_threshold"] == null ? null : Number(row["min_threshold"]),
    reorder_level: row["reorder_level"] == null ? null : Number(row["reorder_level"]),
    property_properties: asSingle(row["property_properties"] as FacilityStockItemRow["property_properties"]),
    vendor_vendors: asSingle(row["vendor_vendors"] as FacilityStockItemRow["vendor_vendors"])
  };
}

export async function listFacilityStockItems(supabase: Db, organizationId: string) {
  const { data, error } = await supabase
    .from("facility_stock_items")
    .select(SELECT_ITEM)
    .eq("organization_id", organizationId)
    .is("deleted_at", null)
    .order("name");
  if (error) throw new Error(error.message);
  return ((data ?? []) as Record<string, unknown>[]).map(normalizeItem);
}

export async function getFacilityStockItem(supabase: Db, organizationId: string, itemId: string) {
  const { data, error } = await supabase
    .from("facility_stock_items")
    .select(SELECT_ITEM)
    .eq("organization_id", organizationId)
    .eq("id", itemId)
    .is("deleted_at", null)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? normalizeItem(data as Record<string, unknown>) : null;
}

export async function createFacilityStockItem(
  supabase: Db,
  organizationId: string,
  actorUserId: string,
  raw: CreateFacilityStockItemInput
) {
  const input = createFacilityStockItemInputSchema.parse(raw);
  const { data: site, error: siteError } = await supabase
    .from("property_properties")
    .select("id")
    .eq("id", input.propertyPropertyId)
    .eq("organization_id", organizationId)
    .maybeSingle();
  if (siteError) throw new Error(siteError.message);
  if (!site) throw new Error("Facility site not found for organization");

  const { data, error } = await supabase
    .from("facility_stock_items")
    .insert({
      organization_id: organizationId,
      property_property_id: input.propertyPropertyId,
      name: input.name,
      category: input.category,
      unit_of_measure: input.unitOfMeasure,
      storage_location_label: input.storageLocationLabel,
      min_threshold: input.minThreshold ?? null,
      reorder_level: input.reorderLevel ?? null,
      vendor_id: input.vendorId ?? null,
      sku_code: input.skuCode ?? null,
      notes: input.notes ?? null,
      quantity_on_hand: 0,
      status: "active",
      created_by: actorUserId,
      updated_by: actorUserId
    })
    .select(SELECT_ITEM)
    .single();
  if (error || !data) throw new Error(error?.message ?? "Failed to create stock item");

  await writeMaintenanceAudit({
    supabase,
    organizationId,
    actorId: actorUserId,
    action: "facility_stock.created",
    entityType: "facility_stock_items",
    entityId: data.id,
    payload: { name: input.name, category: input.category }
  });
  return normalizeItem(data as Record<string, unknown>);
}

export async function applyFacilityStockMovement(
  supabase: Db,
  organizationId: string,
  actorUserId: string,
  itemId: string,
  raw: ApplyFacilityStockMovementInput
) {
  const input = applyFacilityStockMovementInputSchema.parse(raw);
  if (input.movementType === "usage" && !input.workOrderId) {
    throw new Error("Usage requires a work order");
  }
  if (input.movementType === "adjust" && !input.reason) {
    throw new Error("Adjust requires a reason");
  }

  const item = await getFacilityStockItem(supabase, organizationId, itemId);
  if (!item) throw new Error("Stock item not found");

  const { data, error } = await supabase.rpc("apply_facility_stock_movement", {
    target_stock_item_id: itemId,
    target_movement_type: input.movementType,
    target_quantity: input.quantity,
    target_reason: input.reason ?? null,
    target_work_order_id: input.workOrderId ?? null
  });
  if (error || !data) throw new Error(error?.message ?? "Failed to apply stock movement");

  const movement = data as FacilityStockMovementRow;
  if (input.movementType === "usage" && input.workOrderId) {
    await supabase.from("facility_work_order_materials").insert({
      organization_id: organizationId,
      work_order_id: input.workOrderId,
      name: item.name,
      quantity: Math.abs(Number(movement.quantity)),
      stock_item_id: itemId,
      sort_order: 0,
      created_by: actorUserId
    });
  }

  await writeMaintenanceAudit({
    supabase,
    organizationId,
    actorId: actorUserId,
    action: "facility_stock.moved",
    entityType: "facility_stock_movements",
    entityId: movement.id,
    payload: {
      stockItemId: itemId,
      movementType: input.movementType,
      quantity: movement.quantity,
      quantityAfter: movement.quantity_after,
      workOrderId: input.workOrderId ?? null
    }
  });
  return movement;
}

export async function listFacilityStockMovements(
  supabase: Db,
  organizationId: string,
  itemId: string
) {
  const { data, error } = await supabase
    .from("facility_stock_movements")
    .select(
      "id, stock_item_id, movement_type, quantity, quantity_after, reason, work_order_id, actor_user_id, created_at"
    )
    .eq("organization_id", organizationId)
    .eq("stock_item_id", itemId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as FacilityStockMovementRow[];
}

export function decorateStockItem(item: FacilityStockItemRow) {
  return {
    ...item,
    low_stock: isLowStock({
      quantityOnHand: item.quantity_on_hand,
      reorderLevel: item.reorder_level,
      minThreshold: item.min_threshold
    }),
    suggested_reorder_quantity: suggestedReorderQuantity({
      quantityOnHand: item.quantity_on_hand,
      reorderLevel: item.reorder_level,
      minThreshold: item.min_threshold
    })
  };
}
