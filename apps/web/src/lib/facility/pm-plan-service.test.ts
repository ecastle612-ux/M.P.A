import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPmPlan, FacilityPmConflictError, summarizePmPlans, updatePmPlan } from "./pm-plan-service";

type Row = Record<string, unknown>;
type Tables = {
  facility_pm_plans: Row[];
  facility_assets: Row[];
  property_properties: Row[];
  facility_work_templates: Row[];
};

const db: Tables = {
  facility_pm_plans: [],
  facility_assets: [],
  property_properties: [],
  facility_work_templates: []
};

const ORG = "11111111-1111-4111-8111-111111111111";
const OTHER_ORG = "22222222-2222-4222-8222-222222222222";
const ACTOR = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const ASSET = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const PROPERTY = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const TEMPLATE = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
const FORGED_ASSET = "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee";
const PLAN = "ffffffff-ffff-4fff-8fff-ffffffffffff";

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
          insertPayload = {
            id: PLAN,
            status: "active",
            missed_occurrence_count: 0,
            last_generated_due_on: null,
            created_at: "2026-08-18T00:00:00.000Z",
            updated_at: "2026-08-18T00:00:00.000Z",
            ...payload
          };
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
        order: () => api,
        maybeSingle: async () => {
          const row = (store[table] ?? []).find((item) => matches(item, filters)) ?? null;
          return { data: row, error: null };
        },
        single: async () => {
          if (insertPayload) {
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
          return { data: row ?? null, error: row ? null : { message: "missing" } };
        },
        then(resolve: (value: unknown) => void, reject?: (reason?: unknown) => void) {
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

describe("FO-EFF Slice 5 — PM plan service", () => {
  beforeEach(() => {
    db.facility_pm_plans = [];
    db.facility_assets = [
      {
        id: ASSET,
        organization_id: ORG,
        name: "UAT Exam Chair 14",
        property_property_id: PROPERTY,
        floor_label: "3",
        department_label: "Cardiology",
        room_label: "312",
        deleted_at: null
      }
    ];
    db.property_properties = [{ id: PROPERTY, organization_id: ORG, name: "North Clinic" }];
    db.facility_work_templates = [
      { id: TEMPLATE, organization_id: ORG, status: "active", current_version_id: "version-1" }
    ];
  });

  it("creates an asset-targeted plan without re-entering location", async () => {
    const plan = await createPmPlan(makeClient() as never, ORG, ACTOR, {
      name: "Quarterly chair inspection",
      targetKind: "asset",
      facilityAssetId: ASSET,
      recurrenceKind: "quarterly",
      nextDueOn: "2026-11-16",
      generateDaysBefore: 7
    });
    expect(plan.facility_asset_id).toBe(ASSET);
    expect(plan.property_id).toBe(PROPERTY);
    expect(plan.anchor_day_of_month).toBe(16);
    expect(plan.generate_days_before).toBe(7);
    expect(plan.status).toBe("active");
  });

  it("creates a building/location plan without a fake asset", async () => {
    const plan = await createPmPlan(makeClient() as never, ORG, ACTOR, {
      name: "Inspect roof",
      description: "Walk the roof and note leaks",
      targetKind: "location",
      propertyId: PROPERTY,
      floorLabel: "Roof",
      recurrenceKind: "annual",
      nextDueOn: "2026-11-16"
    });
    expect(plan.facility_asset_id).toBeNull();
    expect(plan.property_id).toBe(PROPERTY);
    expect(plan.floor_label).toBe("Roof");
  });

  it("rejects a forged asset from another organization", async () => {
    db.facility_assets.push({
      id: FORGED_ASSET,
      organization_id: OTHER_ORG,
      name: "Foreign chair",
      property_property_id: PROPERTY,
      deleted_at: null
    });
    await expect(
      createPmPlan(makeClient() as never, ORG, ACTOR, {
        name: "Forged chair plan",
        targetKind: "asset",
        facilityAssetId: FORGED_ASSET,
        recurrenceKind: "monthly",
        nextDueOn: "2026-11-16"
      })
    ).rejects.toBeInstanceOf(FacilityPmConflictError);
  });

  it("rejects a forged template id", async () => {
    await expect(
      createPmPlan(makeClient() as never, ORG, ACTOR, {
        name: "Inspect chair",
        targetKind: "location",
        propertyId: PROPERTY,
        recurrenceKind: "monthly",
        nextDueOn: "2026-11-16",
        templateId: "99999999-9999-4999-8999-999999999999"
      })
    ).rejects.toBeInstanceOf(FacilityPmConflictError);
  });

  it("pauses, resumes without backfill, and deactivates without delete", async () => {
    db.facility_pm_plans = [
      {
        id: PLAN,
        organization_id: ORG,
        name: "Quarterly chair inspection",
        description: "",
        status: "active",
        target_kind: "asset",
        facility_asset_id: ASSET,
        property_id: PROPERTY,
        floor_label: null,
        department_label: null,
        room_label: null,
        priority: "normal",
        category: "preventive",
        recurrence_kind: "monthly",
        interval_n: 1,
        next_due_on: "2026-01-01",
        due_time: null,
        generate_days_before: 7,
        anchor_day_of_month: 1,
        template_id: null,
        last_generated_due_on: null,
        missed_occurrence_count: 0
      }
    ];
    const client = makeClient();
    const paused = await updatePmPlan(client as never, ORG, ACTOR, PLAN, { action: "pause" });
    expect(paused.status).toBe("paused");
    expect(db.facility_pm_plans[0]?.["id"]).toBe(PLAN);

    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-10T12:00:00.000Z"));
    const resumed = await updatePmPlan(client as never, ORG, ACTOR, PLAN, { action: "resume" });
    vi.useRealTimers();
    expect(resumed.status).toBe("active");
    expect(resumed.next_due_on).toBe("2026-05-01");
    expect(Number(resumed.missed_occurrence_count)).toBe(4);

    const inactive = await updatePmPlan(client as never, ORG, ACTOR, PLAN, { action: "deactivate" });
    expect(inactive.status).toBe("inactive");
    expect(db.facility_pm_plans).toHaveLength(1);
  });

  it("edits future schedule without rewriting generated work", async () => {
    db.facility_pm_plans = [
      {
        id: PLAN,
        organization_id: ORG,
        name: "Quarterly chair inspection",
        description: "old",
        status: "active",
        target_kind: "asset",
        facility_asset_id: ASSET,
        property_id: PROPERTY,
        priority: "normal",
        category: "preventive",
        recurrence_kind: "quarterly",
        interval_n: 1,
        next_due_on: "2026-11-16",
        generate_days_before: 7,
        anchor_day_of_month: 16,
        template_id: null,
        missed_occurrence_count: 0
      }
    ];
    const updated = await updatePmPlan(makeClient() as never, ORG, ACTOR, PLAN, {
      nextDueOn: "2026-12-01",
      recurrenceKind: "monthly",
      generateDaysBefore: 10,
      description: "Inspect arm, wheels, upholstery"
    });
    expect(updated.next_due_on).toBe("2026-12-01");
    expect(updated.recurrence_kind).toBe("monthly");
    expect(updated.anchor_day_of_month).toBe(1);
    expect(updated.generate_days_before).toBe(10);
  });

  it("summarizes active, due soon, overdue, and paused cheaply", () => {
    const summary = summarizePmPlans(
      [
        { status: "active", next_due_on: "2026-08-20" },
        { status: "active", next_due_on: "2026-08-10" },
        { status: "paused", next_due_on: "2026-08-12" }
      ] as never,
      "2026-08-18"
    );
    expect(summary).toEqual({ activePlans: 2, dueSoon: 1, overdue: 1, paused: 1 });
  });
});
