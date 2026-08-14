import type { SupabaseClient } from "@supabase/supabase-js";
import {
  canAccessConnection,
  defaultConnectionColumns,
  documentsEntitlementIsNotEnough,
  hasWorkspaceManagerRole,
  rejectWriteback,
  type TableConnectionSource,
  type TableWorkSurface
} from "@mpa/shared";
import { listFacilityAssets } from "../facility/asset-service";
import { listFacilityStockItems } from "../facility/inventory-service";
import { listWorkOrders } from "../maintenance/maintenance-service";
import { writePropertyAudit } from "../property/events-audit";
import { getWorkspaceTable, replaceWorkspaceTableRows, type WorkspaceTableDetail } from "./table-service";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = SupabaseClient<any>;

export function assertConnectionAccess(
  entitlements: readonly string[],
  source: TableConnectionSource,
  surface: TableWorkSurface | null
) {
  if (documentsEntitlementIsNotEnough(entitlements, source, surface)) {
    throw new Error("platform.documents is not permission to read this operational source");
  }
  if (!canAccessConnection(entitlements, source, surface)) {
    throw new Error("Forbidden source connection");
  }
}

function locationLabel(asset: {
  building_label: string | null;
  floor_label: string | null;
  room_label: string | null;
  location_note: string | null;
}) {
  return [asset.building_label, asset.floor_label, asset.room_label, asset.location_note]
    .filter(Boolean)
    .join(" / ");
}

export async function loadConnectionProjection(
  supabase: Db,
  organizationId: string,
  entitlements: readonly string[],
  roles: readonly string[],
  actorId: string,
  source: TableConnectionSource,
  surface: TableWorkSurface | null
): Promise<Array<{ cells: Record<string, string | number | null>; sourceEntityType: string; sourceEntityId: string }>> {
  assertConnectionAccess(entitlements, source, surface);
  const keys = defaultConnectionColumns(source);

  if (source === "facility_assets") {
    const technicianOnly = roles.includes("maintenance_technician") && !hasWorkspaceManagerRole(roles);
    const assets = await listFacilityAssets(supabase, organizationId, {
      ...(technicianOnly ? { technicianUserId: actorId } : {})
    });
    return assets.map((asset) => ({
      sourceEntityType: "facility_asset",
      sourceEntityId: asset.id,
      cells: {
        [keys[0]!.key]: asset.name,
        [keys[1]!.key]: asset.asset_code,
        [keys[2]!.key]: asset.asset_type,
        [keys[3]!.key]: asset.status,
        [keys[4]!.key]: asset.property_properties?.name ?? "",
        [keys[5]!.key]: locationLabel(asset)
      }
    }));
  }

  if (source === "facility_stock") {
    if (roles.includes("maintenance_technician") && !hasWorkspaceManagerRole(roles)) {
      return [];
    }
    const items = await listFacilityStockItems(supabase, organizationId);
    return items.map((item) => ({
      sourceEntityType: "facility_stock_item",
      sourceEntityId: item.id,
      cells: {
        [keys[0]!.key]: item.name,
        [keys[1]!.key]: item.sku_code ?? "",
        [keys[2]!.key]: item.quantity_on_hand,
        [keys[3]!.key]: item.reorder_level ?? item.min_threshold ?? null,
        [keys[4]!.key]: item.property_properties?.name ?? ""
      }
    }));
  }

  if (!surface) {
    throw new Error("Work order connections require a surface");
  }
  const orders = await listWorkOrders(supabase, organizationId, { surface });
  return orders.map((order) => ({
    sourceEntityType: "maintenance_work_order",
    sourceEntityId: order.id,
    cells: {
      [keys[0]!.key]: order.title,
      [keys[1]!.key]: order.status,
      [keys[2]!.key]: order.work_surface,
      [keys[3]!.key]: order.priority,
      [keys[4]!.key]: order.submitted_at.slice(0, 10)
    }
  }));
}

export async function hydrateConnectedTable(
  supabase: Db,
  organizationId: string,
  entitlements: readonly string[],
  roles: readonly string[],
  actorId: string,
  detail: WorkspaceTableDetail
): Promise<WorkspaceTableDetail> {
  if (!detail.table.connectionSource) return detail;
  const projection = await loadConnectionProjection(
    supabase,
    organizationId,
    entitlements,
    roles,
    actorId,
    detail.table.connectionSource,
    detail.table.connectionSurface
  );
  const keyByName = new Map(
    defaultConnectionColumns(detail.table.connectionSource).map((column) => [column.name, column.key])
  );
  const rows = projection.map((item, position) => ({
    id: `live:${item.sourceEntityId}`,
    position,
    sourceEntityType: item.sourceEntityType,
    sourceEntityId: item.sourceEntityId,
    cells: Object.fromEntries(
      detail.columns.map((column) => {
        const key = keyByName.get(column.name);
        return [column.id, key ? item.cells[key] ?? null : null];
      })
    )
  }));
  return { ...detail, rows };
}

export async function snapshotConnectedTable(
  supabase: Db,
  organizationId: string,
  actorId: string,
  entitlements: readonly string[],
  roles: readonly string[],
  tableId: string
) {
  const detail = await getWorkspaceTable(supabase, organizationId, tableId);
  if (!detail) throw new Error("Table not found");
  if (!detail.table.connectionSource) {
    throw new Error("Only connected tables can snapshot source data");
  }
  const live = await hydrateConnectedTable(supabase, organizationId, entitlements, roles, actorId, detail);
  const persisted = await replaceWorkspaceTableRows(
    supabase,
    organizationId,
    tableId,
    live.rows.map((row) => ({
      cells: row.cells,
      sourceEntityType: row.sourceEntityType,
      sourceEntityId: row.sourceEntityId
    }))
  );
  await supabase
    .from("workspace_tables")
    .update({ snapshot_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("organization_id", organizationId)
    .eq("id", tableId);
  await writePropertyAudit({
    supabase,
    organizationId,
    actorId,
    action: "table.updated",
    entityType: "workspace_tables",
    entityId: tableId,
    payload: { snapshot: true, rowCount: persisted.length, source: detail.table.connectionSource }
  });
  return { ...live, rows: persisted };
}

export function assertNoWritebackPath(): never {
  rejectWriteback("Source mutation");
}
