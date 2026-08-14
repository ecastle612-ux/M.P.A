import { hasEntitlement, type EntitlementKey } from "../commercial/entitlements";
import type { TableConnectionSource, TableWorkSurface } from "./tables";

export const CONNECTION_WRITEBACK_FIELDS = [
  "asset lifecycle",
  "inventory quantity",
  "stock movements",
  "work-order status",
  "assignments",
  "operational source records"
] as const;

export function connectionRequiredEntitlement(
  source: TableConnectionSource,
  surface?: TableWorkSurface | null
): EntitlementKey {
  switch (source) {
    case "facility_assets":
      return "facility.assets";
    case "facility_stock":
      return "facility.inventory";
    case "work_orders":
      return surface === "facility" ? "facility.operations" : "pm.maintenance";
    default: {
      const _never: never = source;
      return _never;
    }
  }
}

export function canAccessConnection(
  entitlements: readonly string[],
  source: TableConnectionSource,
  surface?: TableWorkSurface | null
): boolean {
  if (source === "work_orders" && !surface) {
    return false;
  }
  if (source === "facility_assets" || source === "facility_stock") {
    if (surface === "residential") return false;
  }
  return hasEntitlement(entitlements, connectionRequiredEntitlement(source, surface));
}

export function documentsEntitlementIsNotEnough(
  entitlements: readonly string[],
  source: TableConnectionSource,
  surface?: TableWorkSurface | null
): boolean {
  return hasEntitlement(entitlements, "platform.documents") && !canAccessConnection(entitlements, source, surface);
}

export function rejectWriteback(action: string): never {
  throw new Error(
    `Connected tables are read-only. ${action} cannot mutate ${CONNECTION_WRITEBACK_FIELDS.join(", ")}.`
  );
}

export function defaultConnectionColumns(source: TableConnectionSource): Array<{
  name: string;
  dataType: "text" | "number" | "date" | "select" | "boolean";
  key: string;
}> {
  switch (source) {
    case "facility_assets":
      return [
        { name: "Name", dataType: "text", key: "name" },
        { name: "Code", dataType: "text", key: "asset_code" },
        { name: "Type", dataType: "text", key: "asset_type" },
        { name: "Status", dataType: "text", key: "status" },
        { name: "Site", dataType: "text", key: "site" },
        { name: "Location", dataType: "text", key: "location" }
      ];
    case "facility_stock":
      return [
        { name: "Name", dataType: "text", key: "name" },
        { name: "SKU", dataType: "text", key: "sku" },
        { name: "On hand", dataType: "number", key: "quantity_on_hand" },
        { name: "Reorder point", dataType: "number", key: "reorder_point" },
        { name: "Site", dataType: "text", key: "site" }
      ];
    case "work_orders":
      return [
        { name: "Title", dataType: "text", key: "title" },
        { name: "Status", dataType: "text", key: "status" },
        { name: "Surface", dataType: "text", key: "work_surface" },
        { name: "Priority", dataType: "text", key: "priority" },
        { name: "Submitted", dataType: "date", key: "submitted_at" }
      ];
    default: {
      const _never: never = source;
      return _never;
    }
  }
}
