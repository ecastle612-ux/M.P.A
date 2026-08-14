import type { SupabaseClient } from "@supabase/supabase-js";
import {
  isLowStock,
  suggestedReorderQuantity,
  type FacilityAssetReportType,
  type FacilityInventoryReportType
} from "@mpa/shared";
import { writeMaintenanceAudit } from "../maintenance/events-audit";
import { listFacilityAssets } from "./asset-service";
import { listFacilityStockItems } from "./inventory-service";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = SupabaseClient<any>;

export async function buildFacilityAssetReport(
  supabase: Db,
  organizationId: string,
  reportType: FacilityAssetReportType
) {
  const assets = await listFacilityAssets(supabase, organizationId);
  if (reportType === "asset_list") {
    return {
      title: "Asset list",
      rows: assets.map((asset) => ({
        id: asset.id,
        name: asset.name,
        assetCode: asset.asset_code,
        type: asset.asset_type,
        status: asset.status,
        site: asset.property_properties?.name ?? "",
        floor: asset.floor_label ?? "",
        room: asset.room_label ?? "",
        vendor: asset.vendor_vendors?.name ?? ""
      }))
    };
  }
  if (reportType === "asset_status") {
    const counts = new Map<string, number>();
    for (const asset of assets) {
      counts.set(asset.status, (counts.get(asset.status) ?? 0) + 1);
    }
    return {
      title: "Asset status",
      rows: [...counts.entries()].map(([status, count]) => ({ status, count }))
    };
  }

  const { data: history, error } = await supabase
    .from("maintenance_work_orders")
    .select("id, title, status, facility_asset_id, created_at, completed_at")
    .eq("organization_id", organizationId)
    .eq("work_surface", "facility")
    .not("facility_asset_id", "is", null)
    .in("status", ["completed", "closed", "cancelled"]);
  if (error) throw new Error(error.message);
  const byId = new Map(assets.map((asset) => [asset.id, asset]));

  if (reportType === "repair_history") {
    return {
      title: "Repair history",
      rows: (history ?? []).map((row) => ({
        workOrderId: row.id,
        title: row.title,
        status: row.status,
        assetName: byId.get(row.facility_asset_id as string)?.name ?? "",
        createdAt: row.created_at,
        completedAt: row.completed_at
      }))
    };
  }

  const frequency = new Map<string, number>();
  for (const row of history ?? []) {
    const id = row.facility_asset_id as string;
    frequency.set(id, (frequency.get(id) ?? 0) + 1);
  }
  return {
    title: "Repair frequency",
    rows: [...frequency.entries()]
      .map(([assetId, count]) => ({
        assetId,
        assetName: byId.get(assetId)?.name ?? "",
        completedWorkOrders: count
      }))
      .sort((a, b) => b.completedWorkOrders - a.completedWorkOrders)
  };
}

export async function buildFacilityInventoryReport(
  supabase: Db,
  organizationId: string,
  reportType: FacilityInventoryReportType
) {
  const items = await listFacilityStockItems(supabase, organizationId);
  if (reportType === "current_stock") {
    return {
      title: "Current stock",
      rows: items.map((item) => ({
        id: item.id,
        name: item.name,
        category: item.category,
        quantityOnHand: item.quantity_on_hand,
        unit: item.unit_of_measure,
        storage: item.storage_location_label,
        site: item.property_properties?.name ?? ""
      }))
    };
  }
  if (reportType === "low_stock" || reportType === "reorder") {
    const low = items.filter((item) =>
      isLowStock({
        quantityOnHand: item.quantity_on_hand,
        reorderLevel: item.reorder_level,
        minThreshold: item.min_threshold
      })
    );
    return {
      title: reportType === "low_stock" ? "Low inventory" : "Reorder report",
      rows: low.map((item) => ({
        id: item.id,
        name: item.name,
        quantityOnHand: item.quantity_on_hand,
        reorderLevel: item.reorder_level,
        minThreshold: item.min_threshold,
        suggestedQuantity: suggestedReorderQuantity({
          quantityOnHand: item.quantity_on_hand,
          reorderLevel: item.reorder_level,
          minThreshold: item.min_threshold
        }),
        vendor: item.vendor_vendors?.name ?? "",
        unit: item.unit_of_measure
      }))
    };
  }

  const { data, error } = await supabase
    .from("facility_stock_movements")
    .select("id, stock_item_id, movement_type, quantity, quantity_after, work_order_id, created_at")
    .eq("organization_id", organizationId)
    .eq("movement_type", "usage")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  const byId = new Map(items.map((item) => [item.id, item]));
  return {
    title: "Usage history",
    rows: (data ?? []).map((row) => ({
      id: row.id,
      itemName: byId.get(row.stock_item_id as string)?.name ?? "",
      quantity: row.quantity,
      quantityAfter: row.quantity_after,
      workOrderId: row.work_order_id,
      createdAt: row.created_at
    }))
  };
}

export function reportToCsv(title: string, rows: Array<Record<string, unknown>>): string {
  if (rows.length === 0) {
    return `${title}\n(no rows)\n`;
  }
  const headers = Object.keys(rows[0]!);
  const escape = (value: unknown) => {
    const text = value == null ? "" : String(value);
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  return [headers.join(","), ...rows.map((row) => headers.map((key) => escape(row[key])).join(","))].join(
    "\n"
  );
}

export async function auditFacilityReportExport(input: {
  supabase: Db;
  organizationId: string;
  actorUserId: string;
  reportType: string;
  format: string;
  rowCount: number;
}) {
  await writeMaintenanceAudit({
    supabase: input.supabase,
    organizationId: input.organizationId,
    actorId: input.actorUserId,
    action: "facility_report.exported",
    entityType: "facility_reports",
    payload: {
      reportType: input.reportType,
      format: input.format,
      rowCount: input.rowCount
    }
  });
}
