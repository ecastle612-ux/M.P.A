import { beforeEach, describe, expect, it, vi } from "vitest";

const { createFacilityWorkOrder } = vi.hoisted(() => ({
  createFacilityWorkOrder: vi.fn()
}));

vi.mock("../maintenance/maintenance-service", () => ({
  createFacilityWorkOrder
}));

import { generateDuePreventiveWork, generateDueWorkForPlan } from "./pm-generation-service";
import type { FacilityPmPlanRow } from "./pm-plan-service";

type Row = Record<string, unknown>;
type Tables = {
  facility_pm_plans: Row[];
  facility_pm_occurrences: Row[];
  facility_assets: Row[];
  property_properties: Row[];
  maintenance_work_orders: Row[];
};

const db: Tables = {
  facility_pm_plans: [],
  facility_pm_occurrences: [],
  facility_assets: [],
  property_properties: [],
  maintenance_work_orders: []
};

const ORG = "11111111-1111-4111-8111-111111111111";
const OTHER_ORG = "22222222-2222-4222-8222-222222222222";
const ASSET = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const PROPERTY = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const TEMPLATE = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
const PLAN = "ffffffff-ffff-4fff-8fff-ffffffffffff";
const BAD_PLAN = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

let occurrenceInserts = 0;

function matches(row: Row, filters: Array<{ col: string; value: unknown; mode: "eq" | "is" }>) {
  return filters.every((filter) => {
    if (filter.mode === "is") return row[filter.col] === filter.value;
    return row[filter.col] === filter.value;
  });
}

function makeClient() {
  const store = db as unknown as Record<string, Row[]>;
  return {
    from(table: string) {
      const filters: Array<{ col: string; value: unknown; mode: "eq" | "is" }> = [];
      let insertPayload: Row | null = null;
      let patch: Row | null = null;
      const api = {
        select: () => api,
        insert: (payload: Row) => {
          insertPayload = { id: `occ_${occurrenceInserts + 1}`, work_order_id: null, ...payload };
          return api;
        },
        update: (payload: Row) => {
          patch = payload;
          return api;
        },
        lte: () => api,
        eq: (col: string, value: unknown) => {
          filters.push({ col, value, mode: "eq" });
          return api;
        },
        is: (col: string, value: unknown) => {
          filters.push({ col, value, mode: "is" });
          return api;
        },
        order: () => api,
        maybeSingle: async () => {
          const row = (store[table] ?? []).find((item) => matches(item, filters)) ?? null;
          return { data: row, error: null };
        },
        single: async () => {
          if (insertPayload) {
            if (table === "facility_pm_occurrences") {
              occurrenceInserts += 1;
              const duplicate = (store[table] ?? []).find(
                (row) =>
                  row["plan_id"] === insertPayload?.["plan_id"] &&
                  row["occurrence_due_on"] === insertPayload?.["occurrence_due_on"]
              );
              if (duplicate) {
                insertPayload = null;
                return { data: null, error: { code: "23505", message: "duplicate key" } };
              }
            }
            (store[table] ?? []).push(insertPayload);
            const created = insertPayload;
            insertPayload = null;
            return { data: created, error: null };
          }
          const row = (store[table] ?? []).find((item) => matches(item, filters));
          if (patch && row) {
            Object.assign(row, patch);
            patch = null;
            return { data: row, error: null };
          }
          if (patch) {
            const first = (store[table] ?? []).find((item) => matches(item, filters));
            if (first) Object.assign(first, patch);
            patch = null;
            return { data: first ?? null, error: null };
          }
          return { data: row ?? null, error: row ? null : { message: "missing" } };
        },
        then(resolve: (value: unknown) => void, reject?: (reason?: unknown) => void) {
          if (patch) {
            for (const row of store[table] ?? []) {
              if (matches(row, filters)) Object.assign(row, patch);
            }
            patch = null;
          }
          return Promise.resolve({
            data: (store[table] ?? []).filter((item) => matches(item, filters)),
            error: null
          }).then(resolve, reject);
        }
      };
      return api;
    }
  };
}

function assetPlan(overrides: Partial<FacilityPmPlanRow> = {}): FacilityPmPlanRow {
  return {
    id: PLAN,
    organization_id: ORG,
    name: "Quarterly chair inspection",
    description: "Inspect arm, wheels, upholstery",
    status: "active",
    target_kind: "asset",
    facility_asset_id: ASSET,
    property_id: PROPERTY,
    floor_label: null,
    department_label: null,
    room_label: null,
    priority: "normal",
    category: "preventive",
    recurrence_kind: "quarterly",
    interval_n: 1,
    next_due_on: "2026-11-16",
    due_time: "09:30",
    generate_days_before: 7,
    anchor_day_of_month: 16,
    template_id: TEMPLATE,
    last_generated_due_on: null,
    missed_occurrence_count: 0,
    created_at: "2026-08-01T00:00:00.000Z",
    updated_at: "2026-08-01T00:00:00.000Z",
    ...overrides
  };
}

describe("FO-EFF Slice 5 — PM generation idempotency", () => {
  beforeEach(() => {
    occurrenceInserts = 0;
    createFacilityWorkOrder.mockReset();
    createFacilityWorkOrder.mockResolvedValue({ id: "wo_1" });
    db.facility_pm_plans = [assetPlan()];
    db.facility_pm_occurrences = [];
    db.maintenance_work_orders = [];
    db.facility_assets = [
      {
        id: ASSET,
        organization_id: ORG,
        name: "UAT Exam Chair 14",
        property_property_id: PROPERTY,
        floor_label: "3",
        department_label: "Cardiology",
        room_label: "312",
        building_label: "North",
        deleted_at: null
      }
    ];
    db.property_properties = [{ id: PROPERTY, organization_id: ORG, name: "North Clinic" }];
  });

  it("creates exactly one canonical facility work order in the lead window", async () => {
    const result = await generateDueWorkForPlan(makeClient() as never, ORG, assetPlan(), "2026-11-09");
    expect(result.skipped).toBe(false);
    expect(result.workOrderId).toBe("wo_1");
    expect(createFacilityWorkOrder).toHaveBeenCalledTimes(1);
    const [, , , input, options] = createFacilityWorkOrder.mock.calls[0] as unknown[];
    expect(input).toMatchObject({
      title: "Quarterly chair inspection",
      facilityAssetId: ASSET,
      templateId: TEMPLATE,
      dueAt: "2026-11-16T09:30:00.000Z"
    });
    expect(options).toMatchObject({
      originSource: "preventive",
      pmPlanId: PLAN,
      pmOccurrenceDueOn: "2026-11-16",
      intakeChannel: "internal"
    });
    expect(db.facility_pm_occurrences).toHaveLength(1);
    expect(db.facility_pm_plans[0]?.["next_due_on"]).toBe("2027-02-16");
  });

  it("does not create a second work order on retry", async () => {
    const client = makeClient();
    await generateDueWorkForPlan(client as never, ORG, assetPlan(), "2026-11-09");
    const retry = await generateDueWorkForPlan(
      client as never,
      ORG,
      { ...assetPlan(), next_due_on: "2026-11-16" },
      "2026-11-09"
    );
    expect(createFacilityWorkOrder).toHaveBeenCalledTimes(1);
    expect(retry.skipped).toBe(true);
    expect(retry.workOrderId).toBe("wo_1");
    expect(db.facility_pm_occurrences).toHaveLength(1);
  });

  it("treats a concurrent unique violation as the same work order", async () => {
    db.facility_pm_occurrences = [
      {
        id: "occ_existing",
        organization_id: ORG,
        plan_id: PLAN,
        occurrence_due_on: "2026-11-16",
        work_order_id: "wo_existing"
      }
    ];
    const result = await generateDueWorkForPlan(makeClient() as never, ORG, assetPlan(), "2026-11-09");
    expect(createFacilityWorkOrder).not.toHaveBeenCalled();
    expect(result.workOrderId).toBe("wo_existing");
    expect(result.skipped).toBe(true);
  });

  it("skips paused plans and does not cancel already generated work", async () => {
    const result = await generateDueWorkForPlan(
      makeClient() as never,
      ORG,
      assetPlan({ status: "paused" }),
      "2026-11-09"
    );
    expect(result.skipped).toBe(true);
    expect(createFacilityWorkOrder).not.toHaveBeenCalled();
  });

  it("does not generate outside the lead window", async () => {
    const result = await generateDueWorkForPlan(makeClient() as never, ORG, assetPlan(), "2026-11-08");
    expect(result.skipped).toBe(true);
    expect(createFacilityWorkOrder).not.toHaveBeenCalled();
  });

  it("rejects a forged asset that does not belong to the organization", async () => {
    db.facility_assets = [
      {
        id: ASSET,
        organization_id: OTHER_ORG,
        name: "Foreign chair",
        property_property_id: PROPERTY,
        deleted_at: null
      }
    ];
    await expect(generateDueWorkForPlan(makeClient() as never, ORG, assetPlan(), "2026-11-09")).rejects.toThrow(
      /missing a building|not found/i
    );
    expect(createFacilityWorkOrder).not.toHaveBeenCalled();
  });

  it("isolates one bad plan so other organizations still generate", async () => {
    db.facility_pm_plans = [
      assetPlan({ id: BAD_PLAN, name: "Broken plan", facility_asset_id: "99999999-9999-4999-8999-999999999999" }),
      assetPlan()
    ];
    const result = await generateDuePreventiveWork(makeClient() as never, {
      now: new Date("2026-11-09T12:00:00.000Z")
    });
    expect(result.failed).toBe(1);
    expect(result.generated).toBe(1);
    expect(result.workOrderIds).toEqual(["wo_1"]);
    expect(result.errors[0]?.planId).toBe(BAD_PLAN);
  });

  it("records missed occurrences without inventing historical work orders", async () => {
    const overdue = assetPlan({
      next_due_on: "2026-01-16",
      recurrence_kind: "monthly",
      interval_n: 1,
      anchor_day_of_month: 16
    });
    db.facility_pm_plans = [overdue];
    await generateDueWorkForPlan(makeClient() as never, ORG, overdue, "2026-04-10");
    expect(createFacilityWorkOrder).toHaveBeenCalledTimes(1);
    expect(db.facility_pm_occurrences).toHaveLength(1);
    expect(db.facility_pm_occurrences[0]?.["occurrence_due_on"]).toBe("2026-01-16");
    expect(db.facility_pm_plans[0]?.["next_due_on"]).toBe("2026-04-16");
    expect(Number(db.facility_pm_plans[0]?.["missed_occurrence_count"])).toBe(2);
  });
});
