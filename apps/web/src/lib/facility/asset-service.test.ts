import { beforeEach, describe, expect, it, vi } from "vitest";

const audit = vi.fn<(payload?: unknown) => Promise<void>>(async () => undefined);

vi.mock("../maintenance/events-audit", () => ({
  writeMaintenanceAudit: (input: unknown) => audit(input)
}));

type Row = Record<string, unknown>;

const db: Record<string, Row[]> = {
  facility_assets: [],
  property_properties: [],
  vendor_vendors: [],
  maintenance_work_orders: []
};

let insertError: { code?: string; message: string } | null = null;

function matches(row: Row, filters: Array<{ col: string; value: unknown; mode: "eq" | "is" | "in" | "notNull" }>) {
  return filters.every((filter) => {
    if (filter.mode === "eq") return row[filter.col] === filter.value;
    if (filter.mode === "is") return row[filter.col] === filter.value;
    if (filter.mode === "in") return (filter.value as unknown[]).includes(row[filter.col]);
    return row[filter.col] != null;
  });
}

function makeClient() {
  return {
    from(table: string) {
      const filters: Array<{ col: string; value: unknown; mode: "eq" | "is" | "in" | "notNull" }> = [];
      let insertPayload: Row | null = null;
      let patch: Row | null = null;
      const api = {
        select: () => api,
        insert: (payload: Row) => {
          insertPayload = { id: "asset_1", deleted_at: null, status: "active", ...payload };
          return api;
        },
        update: (payload: Row) => {
          patch = payload;
          return api;
        },
        eq: (col: string, value: unknown) => {
          filters.push({ col, value, mode: "eq" });
          return api;
        },
        is: (col: string, value: unknown) => {
          filters.push({ col, value, mode: "is" });
          return api;
        },
        in: (col: string, values: unknown[]) => {
          filters.push({ col, value: values, mode: "in" });
          return api;
        },
        not: (col: string, op: string) => {
          if (op === "is") filters.push({ col, value: null, mode: "notNull" });
          return api;
        },
        order: () => api,
        maybeSingle: async () => {
          const row = (db[table] ?? []).find((item) => matches(item, filters)) ?? null;
          return { data: row, error: null };
        },
        single: async () => {
          if (insertPayload) {
            if (insertError) {
              const error = insertError;
              insertPayload = null;
              return { data: null, error };
            }
            (db[table] ?? []).push(insertPayload);
            const created = insertPayload;
            insertPayload = null;
            return { data: created, error: null };
          }
          const row = (db[table] ?? []).find((item) => matches(item, filters));
          if (patch && row) {
            Object.assign(row, patch);
            patch = null;
            return { data: row, error: null };
          }
          return { data: row ?? null, error: row ? null : { message: "missing" } };
        },
        then(
          resolve: (value: unknown) => void,
          reject?: (reason?: unknown) => void
        ) {
          return Promise.resolve({
            data: (db[table] ?? []).filter((item) => matches(item, filters)),
            error: null
          }).then(resolve, reject);
        }
      };
      return api;
    }
  };
}

import {
  createFacilityAsset,
  FacilityConflictError,
  listAssetWorkHistory,
  listFacilityAssets,
  updateFacilityAsset
} from "./asset-service";

describe("FAC-003 asset service", () => {
  beforeEach(() => {
    audit.mockClear();
    insertError = null;
    db["facility_assets"] = [];
    db["property_properties"] = [{ id: "11111111-1111-4111-8111-111111111111", organization_id: "org_1" }];
    db["vendor_vendors"] = [];
    db["maintenance_work_orders"] = [];
  });

  it("creates an asset via insert().select() and writes facility_asset.created", async () => {
    const asset = await createFacilityAsset(makeClient() as never, "org_1", "user_1", {
      name: "Rooftop AHU-2",
      assetType: "hvac",
      assetCode: "AHU-2",
      propertyPropertyId: "11111111-1111-4111-8111-111111111111",
      locationScope: "property"
    });
    expect(asset.id).toBe("asset_1");
    expect(asset.name).toBe("Rooftop AHU-2");
    expect(asset.asset_code).toBe("AHU-2");
    expect(audit).toHaveBeenCalledWith(
      expect.objectContaining({ action: "facility_asset.created", entityType: "facility_assets" })
    );
  });

  it("maps duplicate asset_code unique violations to FacilityConflictError", async () => {
    insertError = {
      code: "23505",
      message: 'duplicate key value violates unique constraint "facility_assets_org_code_uidx"'
    };
    await expect(
      createFacilityAsset(makeClient() as never, "org_1", "user_1", {
        name: "Rooftop AHU-2",
        assetType: "hvac",
        assetCode: "AHU-2",
        propertyPropertyId: "11111111-1111-4111-8111-111111111111",
        locationScope: "property"
      })
    ).rejects.toBeInstanceOf(FacilityConflictError);
  });

  it("hides soft-deleted assets from list and get", async () => {
    db["facility_assets"] = [
      {
        id: "asset_live",
        organization_id: "org_1",
        name: "Live",
        deleted_at: null,
        status: "active"
      },
      {
        id: "asset_gone",
        organization_id: "org_1",
        name: "Gone",
        deleted_at: "2026-08-14T00:00:00.000Z",
        status: "retired"
      }
    ];
    const rows = await listFacilityAssets(makeClient() as never, "org_1");
    expect(rows.map((row) => row.id)).toEqual(["asset_live"]);
  });

  it("writes lifecycle_changed when status changes", async () => {
    db["facility_assets"] = [
      {
        id: "asset_1",
        organization_id: "org_1",
        name: "AHU-2",
        asset_code: "AHU-2",
        asset_type: "hvac",
        status: "active",
        location_scope: "property",
        deleted_at: null
      }
    ];
    await updateFacilityAsset(makeClient() as never, "org_1", "user_1", "asset_1", {
      status: "maintenance"
    });
    expect(audit).toHaveBeenCalledWith(
      expect.objectContaining({ action: "facility_asset.lifecycle_changed" })
    );
  });

  it("lists only assets on assigned facility work orders for technicians", async () => {
    db["facility_assets"] = [
      { id: "asset_1", organization_id: "org_1", name: "Assigned", deleted_at: null, status: "active" },
      { id: "asset_2", organization_id: "org_1", name: "Hidden", deleted_at: null, status: "active" }
    ];
    db["maintenance_work_orders"] = [
      {
        facility_asset_id: "asset_1",
        organization_id: "org_1",
        work_surface: "facility",
        technician_user_id: "tech_1"
      }
    ];
    const rows = await listFacilityAssets(makeClient() as never, "org_1", {
      technicianUserId: "tech_1"
    });
    expect(rows.map((row) => row.id)).toEqual(["asset_1"]);
  });

  it("lists completed facility work orders as asset history", async () => {
    db["maintenance_work_orders"] = [
      {
        id: "wo_1",
        organization_id: "org_1",
        facility_asset_id: "asset_1",
        work_surface: "facility",
        status: "completed",
        title: "Filter change",
        created_at: "2026-08-01T00:00:00.000Z"
      },
      {
        id: "wo_2",
        organization_id: "org_1",
        facility_asset_id: "asset_1",
        work_surface: "facility",
        status: "submitted",
        title: "Open job",
        created_at: "2026-08-02T00:00:00.000Z"
      }
    ];
    const history = await listAssetWorkHistory(makeClient() as never, "org_1", "asset_1");
    expect(history).toHaveLength(1);
    expect(history[0]?.title).toBe("Filter change");
  });
});
