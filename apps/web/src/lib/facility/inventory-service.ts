import type { SupabaseClient } from "@supabase/supabase-js";
import {
  deriveStockHealth,
  type AdjustInventoryInput,
  type CreateInventoryLocationInput,
  type CreatePartCategoryInput,
  type CreatePartInput,
  type IssueInventoryInput,
  type ReceiveInventoryInput,
  type ReturnInventoryInput,
  type StockHealthStatus,
  type UpdateStockThresholdsInput
} from "@mpa/shared";
import { emitFacilityEvent, writeFacilityAudit, writeFacilityNotification } from "./events-audit";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = SupabaseClient<any>;

const SELECT_PART = `
  *,
  facility_part_categories ( id, name )
`;

const SELECT_STOCK = `
  *,
  facility_parts ( id, sku, name, uom, critical_part, manufacturer ),
  facility_inventory_locations (
    id, name, site_id,
    facility_sites ( id, name )
  )
`;

export type PartRow = {
  id: string;
  organization_id: string;
  category_id: string | null;
  sku: string;
  name: string;
  uom: string;
  manufacturer: string | null;
  supplier_name: string | null;
  supplier_reference: string | null;
  critical_part: boolean;
  reorder_threshold_default: number;
  minimum_stock_default: number;
  notes: string | null;
  status: string;
  facility_part_categories?: { id: string; name: string } | null;
  compatibleAssetIds?: string[];
  compatibleSystemIds?: string[];
  compatibleAssets?: Array<{ id: string; name: string }>;
  compatibleSystems?: Array<{ id: string; name: string }>;
};

export type InventoryLocationRow = {
  id: string;
  organization_id: string;
  site_id: string;
  facility_location_id: string | null;
  name: string;
  status: string;
  facility_sites?: { id: string; name: string } | null;
};

export type StockRow = {
  id: string;
  organization_id: string;
  part_id: string;
  inventory_location_id: string;
  quantity_on_hand: number;
  reorder_threshold: number;
  minimum_stock: number;
  facility_parts?: {
    id: string;
    sku: string;
    name: string;
    uom: string;
    critical_part: boolean;
    manufacturer: string | null;
  } | null;
  facility_inventory_locations?: {
    id: string;
    name: string;
    site_id: string;
    facility_sites?: { id: string; name: string } | null;
  } | null;
};

export type MovementRow = {
  id: string;
  organization_id: string;
  part_id: string;
  inventory_location_id: string;
  movement_type: string;
  quantity: number;
  quantity_delta: number;
  reason: string;
  work_order_id: string | null;
  actor_user_id: string | null;
  created_at: string;
};

async function recordInventory(
  supabase: Db,
  args: {
    organizationId: string;
    actorId: string | null;
    eventType: string;
    aggregateType: string;
    aggregateId: string;
    payload?: Record<string, unknown>;
  }
) {
  const payload = args.payload ?? {};
  await emitFacilityEvent({
    supabase,
    organizationId: args.organizationId,
    actorId: args.actorId,
    eventType: args.eventType,
    aggregateType: args.aggregateType,
    aggregateId: args.aggregateId,
    payload
  });
  await writeFacilityAudit({
    supabase,
    organizationId: args.organizationId,
    actorId: args.actorId,
    action: args.eventType,
    entityType: args.aggregateType,
    entityId: args.aggregateId,
    payload
  });
}

async function notifyManagers(
  supabase: Db,
  organizationId: string,
  args: {
    siteId: string | null;
    key: string;
    title: string;
    body: string;
    href: string;
  }
) {
  const { data: memberships } = await supabase
    .from("organization_memberships")
    .select("user_id, roles")
    .eq("organization_id", organizationId)
    .eq("status", "active");
  const managerIds = (memberships ?? [])
    .filter(
      (row) =>
        Array.isArray(row.roles) &&
        (row.roles.includes("organization_admin") || row.roles.includes("property_manager"))
    )
    .map((row) => row.user_id as string);
  await Promise.all(
    managerIds.map((userId) =>
      writeFacilityNotification({
        supabase,
        organizationId,
        userId,
        siteId: args.siteId,
        notificationKey: args.key,
        title: args.title,
        body: args.body,
        href: args.href
      })
    )
  );
}

function toNumber(value: unknown): number {
  return typeof value === "number" ? value : Number(value ?? 0);
}

export function stockHealthFor(row: StockRow): StockHealthStatus {
  return deriveStockHealth(
    toNumber(row.quantity_on_hand),
    toNumber(row.reorder_threshold),
    toNumber(row.minimum_stock)
  );
}

export async function listPartCategories(supabase: Db, organizationId: string) {
  const { data, error } = await supabase
    .from("facility_part_categories")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("status", "active")
    .order("name", { ascending: true });
  if (error) {
    throw new Error(error.message);
  }
  return data ?? [];
}

export async function createPartCategory(
  supabase: Db,
  organizationId: string,
  input: CreatePartCategoryInput
) {
  const { data, error } = await supabase
    .from("facility_part_categories")
    .insert({
      organization_id: organizationId,
      name: input.name,
      status: "active"
    })
    .select("*")
    .single();
  if (error) {
    throw new Error(error.message);
  }
  return data;
}

export async function listParts(supabase: Db, organizationId: string) {
  const { data, error } = await supabase
    .from("facility_parts")
    .select(SELECT_PART)
    .eq("organization_id", organizationId)
    .order("name", { ascending: true });
  if (error) {
    throw new Error(error.message);
  }
  return (data ?? []) as PartRow[];
}

async function loadPartCompatibility(supabase: Db, organizationId: string, partId: string) {
  const [{ data: assetLinks }, { data: systemLinks }] = await Promise.all([
    supabase
      .from("facility_part_asset_compat")
      .select("asset_id")
      .eq("organization_id", organizationId)
      .eq("part_id", partId),
    supabase
      .from("facility_part_system_compat")
      .select("system_id")
      .eq("organization_id", organizationId)
      .eq("part_id", partId)
  ]);
  const assetIds = (assetLinks ?? []).map((row) => row.asset_id as string);
  const systemIds = (systemLinks ?? []).map((row) => row.system_id as string);
  const [assets, systems] = await Promise.all([
    assetIds.length
      ? supabase
          .from("facility_assets")
          .select("id, name")
          .eq("organization_id", organizationId)
          .in("id", assetIds)
      : Promise.resolve({ data: [] as Array<{ id: string; name: string }> }),
    systemIds.length
      ? supabase
          .from("facility_systems")
          .select("id, name")
          .eq("organization_id", organizationId)
          .in("id", systemIds)
      : Promise.resolve({ data: [] as Array<{ id: string; name: string }> })
  ]);
  return {
    compatibleAssetIds: assetIds,
    compatibleSystemIds: systemIds,
    compatibleAssets: (assets.data ?? []) as Array<{ id: string; name: string }>,
    compatibleSystems: (systems.data ?? []) as Array<{ id: string; name: string }>
  };
}

export async function getPart(supabase: Db, organizationId: string, partId: string) {
  const { data, error } = await supabase
    .from("facility_parts")
    .select(SELECT_PART)
    .eq("organization_id", organizationId)
    .eq("id", partId)
    .maybeSingle();
  if (error) {
    throw new Error(error.message);
  }
  if (!data) {
    return null;
  }
  const compat = await loadPartCompatibility(supabase, organizationId, partId);
  return { ...(data as PartRow), ...compat };
}

export async function createPart(
  supabase: Db,
  organizationId: string,
  actorUserId: string,
  input: CreatePartInput
) {
  const { data, error } = await supabase
    .from("facility_parts")
    .insert({
      organization_id: organizationId,
      category_id: input.categoryId ?? null,
      sku: input.sku,
      name: input.name,
      uom: input.uom,
      manufacturer: input.manufacturer ?? null,
      supplier_name: input.supplierName ?? null,
      supplier_reference: input.supplierReference ?? null,
      critical_part: input.criticalPart,
      reorder_threshold_default: input.reorderThresholdDefault,
      minimum_stock_default: input.minimumStockDefault,
      notes: input.notes ?? null,
      status: "active"
    })
    .select(SELECT_PART)
    .single();
  if (error) {
    throw new Error(error.message);
  }
  const part = data as PartRow;

  if (input.compatibleAssetIds.length > 0) {
    const { error: compatError } = await supabase.from("facility_part_asset_compat").insert(
      input.compatibleAssetIds.map((assetId) => ({
        organization_id: organizationId,
        part_id: part.id,
        asset_id: assetId
      }))
    );
    if (compatError) {
      throw new Error(compatError.message);
    }
  }
  if (input.compatibleSystemIds.length > 0) {
    const { error: compatError } = await supabase.from("facility_part_system_compat").insert(
      input.compatibleSystemIds.map((systemId) => ({
        organization_id: organizationId,
        part_id: part.id,
        system_id: systemId
      }))
    );
    if (compatError) {
      throw new Error(compatError.message);
    }
  }

  await recordInventory(supabase, {
    organizationId,
    actorId: actorUserId,
    eventType: "facility.part.created",
    aggregateType: "facility_parts",
    aggregateId: part.id,
    payload: {
      sku: part.sku,
      name: part.name,
      critical_part: part.critical_part,
      compatibleAssetIds: input.compatibleAssetIds,
      compatibleSystemIds: input.compatibleSystemIds
    }
  });

  return (await getPart(supabase, organizationId, part.id)) as PartRow;
}

export async function listInventoryLocations(supabase: Db, organizationId: string) {
  const { data, error } = await supabase
    .from("facility_inventory_locations")
    .select("*, facility_sites ( id, name )")
    .eq("organization_id", organizationId)
    .order("name", { ascending: true });
  if (error) {
    throw new Error(error.message);
  }
  return (data ?? []) as InventoryLocationRow[];
}

export async function createInventoryLocation(
  supabase: Db,
  organizationId: string,
  actorUserId: string,
  input: CreateInventoryLocationInput
) {
  const { data: site, error: siteError } = await supabase
    .from("facility_sites")
    .select("id, status")
    .eq("organization_id", organizationId)
    .eq("id", input.siteId)
    .maybeSingle();
  if (siteError) {
    throw new Error(siteError.message);
  }
  if (!site || site.status !== "active") {
    throw new Error("Active facility site required for storeroom locations");
  }

  const { data, error } = await supabase
    .from("facility_inventory_locations")
    .insert({
      organization_id: organizationId,
      site_id: input.siteId,
      facility_location_id: input.facilityLocationId ?? null,
      name: input.name,
      status: "active"
    })
    .select("*, facility_sites ( id, name )")
    .single();
  if (error) {
    throw new Error(error.message);
  }

  const location = data as InventoryLocationRow;
  await recordInventory(supabase, {
    organizationId,
    actorId: actorUserId,
    eventType: "facility.inventory.location_created",
    aggregateType: "facility_inventory_locations",
    aggregateId: location.id,
    payload: { name: location.name, site_id: location.site_id }
  });
  return location;
}

export async function listInventoryStock(supabase: Db, organizationId: string) {
  const { data, error } = await supabase
    .from("facility_inventory_stock")
    .select(SELECT_STOCK)
    .eq("organization_id", organizationId)
    .order("updated_at", { ascending: false });
  if (error) {
    throw new Error(error.message);
  }
  return (data ?? []) as StockRow[];
}

export async function listPartMovements(
  supabase: Db,
  organizationId: string,
  options?: { partId?: string; stockLocationId?: string; limit?: number }
) {
  let query = supabase
    .from("facility_part_movements")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(options?.limit ?? 50);
  if (options?.partId) {
    query = query.eq("part_id", options.partId);
  }
  if (options?.stockLocationId) {
    query = query.eq("inventory_location_id", options.stockLocationId);
  }
  const { data, error } = await query;
  if (error) {
    throw new Error(error.message);
  }
  return (data ?? []) as MovementRow[];
}

async function ensureStockRow(
  supabase: Db,
  organizationId: string,
  partId: string,
  inventoryLocationId: string
) {
  const { data: existing } = await supabase
    .from("facility_inventory_stock")
    .select(SELECT_STOCK)
    .eq("organization_id", organizationId)
    .eq("part_id", partId)
    .eq("inventory_location_id", inventoryLocationId)
    .maybeSingle();
  if (existing) {
    return existing as StockRow;
  }

  const part = await getPart(supabase, organizationId, partId);
  if (!part) {
    throw new Error("Part not found");
  }
  const { data: location } = await supabase
    .from("facility_inventory_locations")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("id", inventoryLocationId)
    .maybeSingle();
  if (!location) {
    throw new Error("Inventory location not found");
  }

  const { data, error } = await supabase
    .from("facility_inventory_stock")
    .insert({
      organization_id: organizationId,
      part_id: partId,
      inventory_location_id: inventoryLocationId,
      quantity_on_hand: 0,
      reorder_threshold: part.reorder_threshold_default,
      minimum_stock: part.minimum_stock_default
    })
    .select(SELECT_STOCK)
    .single();
  if (error) {
    throw new Error(error.message);
  }
  return data as StockRow;
}

async function applyStockDelta(
  supabase: Db,
  organizationId: string,
  actorUserId: string,
  args: {
    partId: string;
    inventoryLocationId: string;
    movementType: "receive" | "issue" | "adjust" | "return";
    quantity: number;
    quantityDelta: number;
    reason: string;
    workOrderId?: string | null;
    eventType: string;
  }
) {
  if (args.movementType === "issue") {
    if (!args.workOrderId) {
      throw new Error("Issue requires a shared work order (E5-2)");
    }
    const { data: wo, error: woError } = await supabase
      .from("maintenance_work_orders")
      .select("id, product_context, site_id, asset_id, system_id, title, status")
      .eq("organization_id", organizationId)
      .eq("id", args.workOrderId)
      .maybeSingle();
    if (woError) {
      throw new Error(woError.message);
    }
    if (!wo) {
      throw new Error("Work order not found");
    }
    if (wo.product_context !== "facility") {
      throw new Error("Inventory can only be issued to facility work orders");
    }
  }

  const stock = await ensureStockRow(
    supabase,
    organizationId,
    args.partId,
    args.inventoryLocationId
  );
  const current = toNumber(stock.quantity_on_hand);
  const next = current + args.quantityDelta;
  if (next < 0) {
    throw new Error("Insufficient quantity on hand");
  }

  const { data: updated, error } = await supabase
    .from("facility_inventory_stock")
    .update({
      quantity_on_hand: next,
      updated_at: new Date().toISOString()
    })
    .eq("id", stock.id)
    .eq("organization_id", organizationId)
    .select(SELECT_STOCK)
    .single();
  if (error) {
    throw new Error(error.message);
  }

  const { data: movement, error: movementError } = await supabase
    .from("facility_part_movements")
    .insert({
      organization_id: organizationId,
      part_id: args.partId,
      inventory_location_id: args.inventoryLocationId,
      movement_type: args.movementType,
      quantity: args.quantity,
      quantity_delta: args.quantityDelta,
      reason: args.reason,
      work_order_id: args.workOrderId ?? null,
      actor_user_id: actorUserId
    })
    .select("*")
    .single();
  if (movementError) {
    throw new Error(movementError.message);
  }

  const stockRow = updated as StockRow;
  const health = stockHealthFor(stockRow);
  const siteId = stockRow.facility_inventory_locations?.site_id ?? null;
  const partName = stockRow.facility_parts?.name ?? "Part";
  const locationName = stockRow.facility_inventory_locations?.name ?? "Location";

  const payload = {
    part_id: args.partId,
    inventory_location_id: args.inventoryLocationId,
    stock_id: stockRow.id,
    movement_type: args.movementType,
    quantity: args.quantity,
    quantity_delta: args.quantityDelta,
    quantity_on_hand: next,
    work_order_id: args.workOrderId ?? null,
    reason: args.reason,
    health,
    name: partName
  };

  await recordInventory(supabase, {
    organizationId,
    actorId: actorUserId,
    eventType: args.eventType,
    aggregateType: "facility_parts",
    aggregateId: args.partId,
    payload
  });
  await emitFacilityEvent({
    supabase,
    organizationId,
    actorId: actorUserId,
    eventType: args.eventType,
    aggregateType: "facility_inventory_stock",
    aggregateId: stockRow.id,
    payload
  });
  if (args.workOrderId) {
    await emitFacilityEvent({
      supabase,
      organizationId,
      actorId: actorUserId,
      eventType: args.eventType,
      aggregateType: "maintenance_work_orders",
      aggregateId: args.workOrderId,
      payload: { ...payload, partName, locationName }
    });
  }

  if (health === "stockout") {
    await recordInventory(supabase, {
      organizationId,
      actorId: actorUserId,
      eventType: "facility.inventory.stockout",
      aggregateType: "facility_inventory_stock",
      aggregateId: stockRow.id,
      payload
    });
    await notifyManagers(supabase, organizationId, {
      siteId,
      key: "facility.inventory.stockout",
      title: `Stockout: ${partName}`,
      body: `${locationName} is at ${next}`,
      href: `/facility/inventory?stockId=${stockRow.id}`
    });
  } else if (health === "low" && stockRow.facility_parts?.critical_part) {
    await recordInventory(supabase, {
      organizationId,
      actorId: actorUserId,
      eventType: "facility.inventory.low_stock",
      aggregateType: "facility_inventory_stock",
      aggregateId: stockRow.id,
      payload
    });
    await notifyManagers(supabase, organizationId, {
      siteId,
      key: "facility.inventory.low_stock",
      title: `Low stock: ${partName}`,
      body: `${locationName} is at ${next}`,
      href: `/facility/inventory?stockId=${stockRow.id}`
    });
  }

  return { stock: stockRow, movement: movement as MovementRow, health };
}

export async function updateStockThresholds(
  supabase: Db,
  organizationId: string,
  actorUserId: string,
  input: UpdateStockThresholdsInput
) {
  const { data: existing, error: existingError } = await supabase
    .from("facility_inventory_stock")
    .select(SELECT_STOCK)
    .eq("organization_id", organizationId)
    .eq("id", input.stockId)
    .maybeSingle();
  if (existingError) {
    throw new Error(existingError.message);
  }
  if (!existing) {
    throw new Error("Stock line not found");
  }

  const { data, error } = await supabase
    .from("facility_inventory_stock")
    .update({
      reorder_threshold: input.reorderThreshold,
      minimum_stock: input.minimumStock,
      updated_at: new Date().toISOString()
    })
    .eq("id", input.stockId)
    .eq("organization_id", organizationId)
    .select(SELECT_STOCK)
    .single();
  if (error) {
    throw new Error(error.message);
  }

  const stock = data as StockRow;
  const health = stockHealthFor(stock);
  await recordInventory(supabase, {
    organizationId,
    actorId: actorUserId,
    eventType: "facility.inventory.thresholds_updated",
    aggregateType: "facility_inventory_stock",
    aggregateId: stock.id,
    payload: {
      stock_id: stock.id,
      part_id: stock.part_id,
      inventory_location_id: stock.inventory_location_id,
      reorder_threshold: input.reorderThreshold,
      minimum_stock: input.minimumStock,
      quantity_on_hand: toNumber(stock.quantity_on_hand),
      health,
      name: stock.facility_parts?.name ?? "Part"
    }
  });
  return { stock, health };
}

export async function receiveInventory(
  supabase: Db,
  organizationId: string,
  actorUserId: string,
  input: ReceiveInventoryInput
) {
  return applyStockDelta(supabase, organizationId, actorUserId, {
    partId: input.partId,
    inventoryLocationId: input.inventoryLocationId,
    movementType: "receive",
    quantity: input.quantity,
    quantityDelta: input.quantity,
    reason: input.reason,
    eventType: "facility.part.received"
  });
}

export async function adjustInventory(
  supabase: Db,
  organizationId: string,
  actorUserId: string,
  input: AdjustInventoryInput
) {
  return applyStockDelta(supabase, organizationId, actorUserId, {
    partId: input.partId,
    inventoryLocationId: input.inventoryLocationId,
    movementType: "adjust",
    quantity: Math.abs(input.quantityDelta),
    quantityDelta: input.quantityDelta,
    reason: input.reason,
    eventType: "facility.inventory.adjusted"
  });
}

export async function issueInventory(
  supabase: Db,
  organizationId: string,
  actorUserId: string,
  input: IssueInventoryInput
) {
  return applyStockDelta(supabase, organizationId, actorUserId, {
    partId: input.partId,
    inventoryLocationId: input.inventoryLocationId,
    movementType: "issue",
    quantity: input.quantity,
    quantityDelta: -input.quantity,
    reason: input.reason,
    workOrderId: input.workOrderId,
    eventType: "facility.part.issued"
  });
}

export async function returnInventory(
  supabase: Db,
  organizationId: string,
  actorUserId: string,
  input: ReturnInventoryInput
) {
  return applyStockDelta(supabase, organizationId, actorUserId, {
    partId: input.partId,
    inventoryLocationId: input.inventoryLocationId,
    movementType: "return",
    quantity: input.quantity,
    quantityDelta: input.quantity,
    reason: input.reason,
    workOrderId: input.workOrderId ?? null,
    eventType: "facility.part.returned"
  });
}

export async function searchParts(supabase: Db, organizationId: string, query: string) {
  const q = query.trim();
  if (q.length < 2) {
    return [];
  }
  const { data, error } = await supabase
    .from("facility_parts")
    .select("id, sku, name, status")
    .eq("organization_id", organizationId)
    .or(`sku.ilike.%${q}%,name.ilike.%${q}%,manufacturer.ilike.%${q}%`)
    .order("name", { ascending: true })
    .limit(20);
  if (error) {
    throw new Error(error.message);
  }
  return (data ?? []).map((row) => ({
    id: row.id as string,
    label: `${row.sku as string} · ${row.name as string}`,
    href: `/facility/parts?partId=${row.id as string}`,
    group: "Parts"
  }));
}

export async function searchInventory(supabase: Db, organizationId: string, query: string) {
  const q = query.trim();
  if (q.length < 2) {
    return [];
  }
  const [locations, stock] = await Promise.all([
    supabase
      .from("facility_inventory_locations")
      .select("id, name")
      .eq("organization_id", organizationId)
      .ilike("name", `%${q}%`)
      .limit(10),
    listInventoryStock(supabase, organizationId)
  ]);
  if (locations.error) {
    throw new Error(locations.error.message);
  }
  const locationResults = (locations.data ?? []).map((row) => ({
    id: row.id as string,
    label: row.name as string,
    href: `/facility/inventory?locationId=${row.id as string}`,
    group: "Inventory"
  }));
  const stockResults = stock
    .filter((row) => {
      const name = row.facility_parts?.name?.toLowerCase() ?? "";
      const sku = row.facility_parts?.sku?.toLowerCase() ?? "";
      const loc = row.facility_inventory_locations?.name?.toLowerCase() ?? "";
      const needle = q.toLowerCase();
      return name.includes(needle) || sku.includes(needle) || loc.includes(needle);
    })
    .slice(0, 15)
    .map((row) => ({
      id: row.id,
      label: `${row.facility_parts?.sku ?? "Part"} · ${row.facility_parts?.name ?? ""} @ ${
        row.facility_inventory_locations?.name ?? "Location"
      }`,
      href: `/facility/inventory?stockId=${row.id}`,
      group: "Inventory"
    }));
  return [...locationResults, ...stockResults];
}

export function summarizeInventory(stock: readonly StockRow[]) {
  const withHealth = stock.map((row) => ({ row, health: stockHealthFor(row) }));
  const stockouts = withHealth.filter((item) => item.health === "stockout");
  const lows = withHealth.filter((item) => item.health === "low");
  return {
    stockLineCount: stock.length,
    stockoutCount: stockouts.length,
    lowCount: lows.length,
    firstStockoutId: stockouts[0]?.row.id ?? lows[0]?.row.id ?? null
  };
}

export function buildInventoryAssistant(summary: {
  stockoutCount: number;
  lowCount: number;
  stockLineCount: number;
  partCount?: number;
}) {
  if (summary.stockoutCount > 0) {
    return "Receive inventory for stocked-out or critically low parts.";
  }
  if (summary.lowCount > 0) {
    return "Review low-stock lines and receive replenishment before work is blocked.";
  }
  if ((summary.partCount ?? 0) <= 0) {
    return "Create your first part in the catalog, then receive stock into a storeroom.";
  }
  if (summary.stockLineCount <= 0) {
    return "Receive parts into a storeroom location to establish on-hand quantities.";
  }
  return "Facility inventory is ready. Keep storeroom counts accurate and issue parts to work orders.";
}
