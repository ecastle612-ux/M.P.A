import { beforeEach, describe, expect, it, vi } from "vitest";

const audit = vi.fn(async (_input?: unknown) => undefined);

vi.mock("../maintenance/events-audit", () => ({
  writeMaintenanceAudit: (input: unknown) => audit(input)
}));

type Row = Record<string, unknown>;

const db: {
  items: Row[];
  movements: Row[];
  materials: Row[];
  properties: Row[];
  rpcError: string | null;
} = {
  items: [],
  movements: [],
  materials: [],
  properties: [],
  rpcError: null
};

function makeClient() {
  return {
    from(table: string) {
      let filters: Array<{ col: string; value: unknown }> = [];
      let insertPayload: Row | null = null;
      const rowsFor = () => {
        if (table === "facility_stock_items") return db.items;
        if (table === "facility_stock_movements") return db.movements;
        if (table === "property_properties") return db.properties;
        if (table === "facility_work_order_materials") return db.materials;
        return [];
      };
      const api = {
        select: () => api,
        insert: (payload: Row) => {
          insertPayload = { id: `${table}_1`, deleted_at: null, quantity_on_hand: 0, ...payload };
          return api;
        },
        eq: (col: string, value: unknown) => {
          filters.push({ col, value });
          return api;
        },
        is: (col: string, value: unknown) => {
          filters.push({ col, value });
          return api;
        },
        order: () => api,
        maybeSingle: async () => {
          const row =
            rowsFor().find((item) => filters.every((filter) => item[filter.col] === filter.value)) ??
            null;
          return { data: row, error: null };
        },
        single: async () => {
          if (insertPayload) {
            rowsFor().push(insertPayload);
            const created = insertPayload;
            insertPayload = null;
            return { data: created, error: null };
          }
          return { data: null, error: { message: "missing" } };
        },
        then(
          resolve: (value: unknown) => void,
          reject?: (reason?: unknown) => void
        ) {
          if (insertPayload) {
            rowsFor().push(insertPayload);
            insertPayload = null;
          }
          const data = rowsFor().filter((item) =>
            filters.every((filter) => item[filter.col] === filter.value)
          );
          return Promise.resolve({ data, error: null }).then(resolve, reject);
        }
      };
      return api;
    },
    rpc: async (
      name: string,
      args: {
        target_stock_item_id: string;
        target_movement_type: string;
        target_quantity: number;
        target_work_order_id?: string | null;
      }
    ) => {
      if (name !== "apply_facility_stock_movement") {
        return { data: null, error: { message: "unknown rpc" } };
      }
      if (db.rpcError) return { data: null, error: { message: db.rpcError } };
      const item = db.items.find((row) => row["id"] === args.target_stock_item_id);
      if (!item) return { data: null, error: { message: "stock item not found" } };
      const type = args.target_movement_type;
      const qty = args.target_quantity;
      const signed =
        type === "receive" ? Math.abs(qty) : type === "adjust" ? qty : -Math.abs(qty);
      const next = Number(item["quantity_on_hand"]) + signed;
      if (next < 0) return { data: null, error: { message: "insufficient stock" } };
      item["quantity_on_hand"] = next;
      const movement = {
        id: `mov_${db.movements.length + 1}`,
        stock_item_id: item["id"],
        movement_type: type,
        quantity: signed,
        quantity_after: next,
        work_order_id: args.target_work_order_id ?? null
      };
      db.movements.push(movement);
      return { data: movement, error: null };
    }
  };
}

import {
  applyFacilityStockMovement,
  createFacilityStockItem,
  decorateStockItem
} from "./inventory-service";

describe("FAC-003 inventory service", () => {
  beforeEach(() => {
    audit.mockClear();
    db.items = [];
    db.movements = [];
    db.materials = [];
    db.properties = [{ id: "11111111-1111-4111-8111-111111111111", organization_id: "org_1" }];
    db.rpcError = null;
  });

  it("creates a stock item at quantity zero and audits", async () => {
    const item = await createFacilityStockItem(makeClient() as never, "org_1", "user_1", {
      name: "MERV-13 filter",
      category: "filters",
      unitOfMeasure: "each",
      propertyPropertyId: "11111111-1111-4111-8111-111111111111",
      storageLocationLabel: "Boiler room cage"
    });
    expect(item.quantity_on_hand).toBe(0);
    expect(audit).toHaveBeenCalledWith(
      expect.objectContaining({ action: "facility_stock.created" })
    );
  });

  it("applies receive and usage movements and writes facility_stock.moved", async () => {
    db.items = [
      {
        id: "item_1",
        organization_id: "org_1",
        name: "Filter",
        quantity_on_hand: 0,
        deleted_at: null
      }
    ];
    const client = makeClient();
    const received = await applyFacilityStockMovement(client as never, "org_1", "user_1", "item_1", {
      movementType: "receive",
      quantity: 10
    });
    expect(received.quantity_after).toBe(10);
    const used = await applyFacilityStockMovement(client as never, "org_1", "user_1", "item_1", {
      movementType: "usage",
      quantity: 2,
      workOrderId: "22222222-2222-4222-8222-222222222222"
    });
    expect(used.quantity_after).toBe(8);
    expect(db.materials).toHaveLength(1);
    expect(audit).toHaveBeenCalledWith(
      expect.objectContaining({ action: "facility_stock.moved" })
    );
  });

  it("fails closed when a movement would go negative", async () => {
    db.items = [
      {
        id: "item_1",
        organization_id: "org_1",
        name: "Filter",
        quantity_on_hand: 1,
        deleted_at: null
      }
    ];
    await expect(
      applyFacilityStockMovement(makeClient() as never, "org_1", "user_1", "item_1", {
        movementType: "issue",
        quantity: 5
      })
    ).rejects.toThrow(/insufficient stock/i);
  });

  it("decorates low stock from reorder_level then min_threshold", () => {
    const decorated = decorateStockItem({
      id: "item_1",
      organization_id: "org_1",
      property_property_id: "site_1",
      name: "Filter",
      category: "filters",
      quantity_on_hand: 2,
      unit_of_measure: "each",
      storage_location_label: "Cage",
      min_threshold: 1,
      reorder_level: 6,
      vendor_id: null,
      sku_code: null,
      status: "active",
      notes: null,
      created_at: "2026-08-14T00:00:00.000Z"
    });
    expect(decorated.low_stock).toBe(true);
    expect(decorated.suggested_reorder_quantity).toBe(4);
  });
});
