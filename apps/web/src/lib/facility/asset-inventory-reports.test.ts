import { describe, expect, it, vi } from "vitest";

vi.mock("./asset-service", () => ({
  listFacilityAssets: async () => [
    {
      id: "asset_1",
      name: "AHU-2",
      asset_code: "AHU-2",
      asset_type: "hvac",
      status: "active",
      floor_label: "Roof",
      room_label: "Penthouse",
      property_properties: { name: "Clinic" },
      vendor_vendors: { name: "Harborline" }
    },
    {
      id: "asset_2",
      name: "Boiler",
      asset_code: "BLR-1",
      asset_type: "plumbing",
      status: "maintenance",
      floor_label: null,
      room_label: null,
      property_properties: { name: "Clinic" },
      vendor_vendors: null
    }
  ]
}));

vi.mock("./inventory-service", () => ({
  listFacilityStockItems: async () => [
    {
      id: "item_1",
      name: "Filter",
      category: "filters",
      quantity_on_hand: 2,
      unit_of_measure: "each",
      storage_location_label: "Cage",
      reorder_level: 6,
      min_threshold: 1,
      property_properties: { name: "Clinic" },
      vendor_vendors: { name: "Harborline" }
    }
  ]
}));

const audit = vi.fn<(payload?: unknown) => Promise<void>>(async () => undefined);
vi.mock("../maintenance/events-audit", () => ({
  writeMaintenanceAudit: (input: unknown) => audit(input)
}));

import {
  auditFacilityReportExport,
  buildFacilityAssetReport,
  buildFacilityInventoryReport,
  reportToCsv
} from "./asset-inventory-reports";

const supabase = {
  from: (table: string) => {
    const result =
      table === "maintenance_work_orders"
        ? [
            {
              id: "wo_1",
              title: "Filter change",
              status: "completed",
              facility_asset_id: "asset_1",
              created_at: "2026-08-01T00:00:00.000Z",
              completed_at: "2026-08-02T00:00:00.000Z"
            }
          ]
        : table === "facility_stock_movements"
          ? [
              {
                id: "mov_1",
                stock_item_id: "item_1",
                quantity: -2,
                quantity_after: 2,
                work_order_id: "wo_1",
                created_at: "2026-08-02T00:00:00.000Z"
              }
            ]
          : [];
    const api = {
      select: () => api,
      eq: () => api,
      not: () => api,
      in: () => api,
      order: () => api,
      then(
        resolve: (value: unknown) => void,
        reject?: (reason?: unknown) => void
      ) {
        return Promise.resolve({ data: result, error: null }).then(resolve, reject);
      }
    };
    return api;
  }
};

describe("FAC-003 FAC-002 report types", () => {
  it("builds asset list, status, history, and frequency", async () => {
    const list = await buildFacilityAssetReport(supabase as never, "org_1", "asset_list");
    expect(list.rows).toHaveLength(2);
    const status = await buildFacilityAssetReport(supabase as never, "org_1", "asset_status");
    expect(status.rows).toEqual(
      expect.arrayContaining([
        { status: "active", count: 1 },
        { status: "maintenance", count: 1 }
      ])
    );
    const history = await buildFacilityAssetReport(supabase as never, "org_1", "repair_history");
    expect(history.rows[0]).toEqual(expect.objectContaining({ assetName: "AHU-2" }));
    const frequency = await buildFacilityAssetReport(supabase as never, "org_1", "repair_frequency");
    expect(frequency.rows[0]).toEqual(
      expect.objectContaining({ assetName: "AHU-2", completedWorkOrders: 1 })
    );
  });

  it("builds current, low, usage, and reorder inventory reports", async () => {
    const current = await buildFacilityInventoryReport(supabase as never, "org_1", "current_stock");
    expect(current.rows[0]).toEqual(expect.objectContaining({ name: "Filter", quantityOnHand: 2 }));
    const low = await buildFacilityInventoryReport(supabase as never, "org_1", "low_stock");
    expect(low.rows).toHaveLength(1);
    const reorder = await buildFacilityInventoryReport(supabase as never, "org_1", "reorder");
    expect(reorder.rows[0]).toEqual(expect.objectContaining({ suggestedQuantity: 4 }));
    const usage = await buildFacilityInventoryReport(supabase as never, "org_1", "usage");
    expect(usage.rows[0]).toEqual(expect.objectContaining({ itemName: "Filter" }));
  });

  it("exports CSV and audits facility_report.exported", async () => {
    const csv = reportToCsv("Asset list", [{ name: "AHU-2", status: "active" }]);
    expect(csv).toContain("name,status");
    expect(csv).toContain("AHU-2");
    await auditFacilityReportExport({
      supabase: {} as never,
      organizationId: "org_1",
      actorUserId: "user_1",
      reportType: "asset_list",
      format: "csv",
      rowCount: 1
    });
    expect(audit).toHaveBeenCalledWith(
      expect.objectContaining({ action: "facility_report.exported" })
    );
  });
});
