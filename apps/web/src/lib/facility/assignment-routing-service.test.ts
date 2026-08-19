import { beforeEach, describe, expect, it, vi } from "vitest";

const { assignWorkOrder, getWorkOrder, listTechnicians } = vi.hoisted(() => ({
  assignWorkOrder: vi.fn(),
  getWorkOrder: vi.fn(),
  listTechnicians: vi.fn()
}));

vi.mock("../maintenance/maintenance-service", () => ({
  assignWorkOrder,
  getWorkOrder,
  listTechnicians
}));

import {
  archiveAssignmentRule,
  assertEligibleAssignee,
  createAssignmentRule,
  previewAssignmentRules,
  reorderAssignmentRules,
  routeFacilityWorkOrder,
  setAssignmentRuleStatus,
  updateAssignmentRule
} from "./assignment-routing-service";

type Row = Record<string, unknown>;
type Tables = {
  facility_assignment_rules: Row[];
  facility_assignment_rule_evaluations: Row[];
  organization_memberships: Row[];
  facility_assets: Row[];
  facility_request_submissions: Row[];
  facility_pm_plans: Row[];
};

const ORG = "11111111-1111-4111-8111-111111111111";
const MIKE = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const JOHN = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const ACTOR = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const WO = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";

const db: Tables = {
  facility_assignment_rules: [],
  facility_assignment_rule_evaluations: [],
  organization_memberships: [],
  facility_assets: [],
  facility_request_submissions: [],
  facility_pm_plans: []
};

function matches(row: Row, filters: Array<{ col: string; value: unknown; mode: "eq" | "is" | "neq" }>) {
  return filters.every((filter) => {
    if (filter.mode === "is") return row[filter.col] === filter.value;
    if (filter.mode === "neq") return row[filter.col] !== filter.value;
    return row[filter.col] === filter.value;
  });
}

function makeClient() {
  const store = db as unknown as Record<string, Row[]>;
  return {
    from(table: string) {
      const filters: Array<{ col: string; value: unknown; mode: "eq" | "is" | "neq" }> = [];
      let insertPayload: Row | Row[] | null = null;
      let patch: Row | null = null;
      let limitCount: number | null = null;
      let orderCol: string | null = null;
      let ascending = true;
      let head = false;
      const api = {
        select: (_cols?: string, options?: { count?: string; head?: boolean }) => {
          head = Boolean(options?.head);
          return api;
        },
        insert: (payload: Row | Row[]) => {
          insertPayload = payload;
          return api;
        },
        update: (payload: Row) => {
          patch = payload;
          return api;
        },
        delete: () => {
          patch = { __delete: true };
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
        neq: (col: string, value: unknown) => {
          filters.push({ col, value, mode: "neq" });
          return api;
        },
        order: (col: string, options?: { ascending?: boolean }) => {
          orderCol = col;
          ascending = options?.ascending !== false;
          return api;
        },
        limit: (count: number) => {
          limitCount = count;
          return api;
        },
        maybeSingle: async () => {
          if (insertPayload) {
            const incoming = (Array.isArray(insertPayload) ? insertPayload[0] : insertPayload) ?? {};
            const created: Row = {
              id: `${table}_${(store[table] ?? []).length + 1}`,
              created_at: "2026-08-18T12:00:00.000Z",
              updated_at: "2026-08-18T12:00:00.000Z",
              ...incoming
            };
            if (
              table === "facility_assignment_rule_evaluations" &&
              created["trigger"] === "initial_create" &&
              (store[table] ?? []).some(
                (row) => row["work_order_id"] === created["work_order_id"] && row["trigger"] === "initial_create"
              )
            ) {
              return { data: null, error: { message: "duplicate key value violates unique constraint" } };
            }
            (store[table] ?? []).push(created);
            insertPayload = null;
            return { data: created, error: null };
          }
          const rows = (store[table] ?? []).filter((item) => matches(item, filters));
          const sorted = orderCol
            ? [...rows].sort((left, right) => {
                const l = left[orderCol as string];
                const r = right[orderCol as string];
                if (l === r) return 0;
                if (l == null) return 1;
                if (r == null) return -1;
                return ascending ? (String(l) > String(r) ? 1 : -1) : String(l) > String(r) ? -1 : 1;
              })
            : rows;
          return { data: (limitCount ? sorted.slice(0, limitCount) : sorted)[0] ?? null, error: null };
        },
        single: async () => {
          if (insertPayload) {
            const incoming = (Array.isArray(insertPayload) ? insertPayload[0] : insertPayload) ?? {};
            const created: Row = {
              id: incoming["id"] ?? `${table}_${(store[table] ?? []).length + 1}`,
              created_at: "2026-08-18T12:00:00.000Z",
              updated_at: "2026-08-18T12:00:00.000Z",
              ...incoming
            };
            (store[table] ?? []).push(created);
            insertPayload = null;
            return { data: created, error: null };
          }
          if (patch && !patch["__delete"]) {
            const row = (store[table] ?? []).find((item) => matches(item, filters));
            if (!row) return { data: null, error: { message: "not found" } };
            Object.assign(row, patch);
            return { data: row, error: null };
          }
          const row = (store[table] ?? []).find((item) => matches(item, filters));
          return { data: row ?? null, error: row ? null : { message: "not found" } };
        },
        then: (
          resolve: (value: { data: Row[]; error: null; count: number | null }) => unknown,
          reject?: (reason: unknown) => unknown
        ) => {
          if (patch?.["__delete"]) {
            store[table] = (store[table] ?? []).filter((item) => !matches(item, filters));
            patch = null;
          } else if (patch) {
            for (const row of store[table] ?? []) {
              if (matches(row, filters)) Object.assign(row, patch);
            }
            patch = null;
          }
          let rows = (store[table] ?? []).filter((item) => matches(item, filters));
          if (orderCol) {
            rows = [...rows].sort((left, right) => {
              const l = left[orderCol as string];
              const r = right[orderCol as string];
              if (l === r) return 0;
              return ascending ? (String(l) > String(r) ? 1 : -1) : String(l) > String(r) ? -1 : 1;
            });
          }
          if (limitCount) rows = rows.slice(0, limitCount);
          return Promise.resolve({
            data: head ? [] : rows,
            error: null,
            count: head ? rows.length : null
          }).then(resolve, reject);
        }
      };
      return api;
    }
  };
}

function workOrder(overrides: Row = {}): Row {
  return {
    id: WO,
    organization_id: ORG,
    property_id: "11111111-1111-4111-8111-111111111111",
    category: "plumbing",
    priority: "normal",
    status: "submitted",
    work_surface: "facility",
    assignee_type: "unassigned",
    technician_user_id: null,
    facility_asset_id: null,
    origin_source: "public_request",
    floor_label: null,
    department_label: null,
    room_label: null,
    request_number: "FR-2026-00001",
    requested_by_user_id: ACTOR,
    ...overrides
  };
}

beforeEach(() => {
  db.facility_assignment_rules = [];
  db.facility_assignment_rule_evaluations = [];
  db.organization_memberships = [
    {
      user_id: MIKE,
      organization_id: ORG,
      status: "active",
      roles: ["maintenance_technician"],
      operating_scope: "facility_operations"
    },
    {
      user_id: JOHN,
      organization_id: ORG,
      status: "active",
      roles: ["maintenance_technician"],
      operating_scope: "facility_operations"
    }
  ];
  db.facility_assets = [];
  db.facility_request_submissions = [];
  db.facility_pm_plans = [];
  assignWorkOrder.mockReset();
  getWorkOrder.mockReset();
  listTechnicians.mockReset();
  assignWorkOrder.mockImplementation(async (_db: unknown, _org: string, _actor: string, input: { workOrderId: string; technicianUserId: string }) => ({
    workOrder: workOrder({
      id: input.workOrderId,
      assignee_type: "technician",
      technician_user_id: input.technicianUserId,
      status: "assigned"
    })
  }));
  getWorkOrder.mockResolvedValue(workOrder());
  listTechnicians.mockResolvedValue([{ userId: MIKE, displayName: "Mike" }]);
});

describe("assignment rule CRUD and priority", () => {
  it("creates inactive rules with unique increasing priority", async () => {
    const first = await createAssignmentRule(makeClient() as never, ORG, ACTOR, {
      name: "Plumbing to Mike",
      assigneeUserId: MIKE,
      conditions: { category: "plumbing" }
    });
    const second = await createAssignmentRule(makeClient() as never, ORG, ACTOR, {
      name: "Emergency to John",
      assigneeUserId: JOHN,
      conditions: { priority: "emergency" }
    });
    expect(first.status).toBe("inactive");
    expect(first.sort_order).toBe(1);
    expect(second.sort_order).toBe(2);
  });

  it("activates, deactivates, and refuses a cross-org assignee", async () => {
    const rule = await createAssignmentRule(makeClient() as never, ORG, ACTOR, {
      name: "Plumbing to Mike",
      assigneeUserId: MIKE,
      conditions: { category: "plumbing" }
    });
    const active = await setAssignmentRuleStatus(makeClient() as never, ORG, ACTOR, rule.id as string, "active");
    expect(active.status).toBe("active");
    const inactive = await setAssignmentRuleStatus(makeClient() as never, ORG, ACTOR, rule.id as string, "inactive");
    expect(inactive.status).toBe("inactive");
    await expect(
      assertEligibleAssignee(makeClient() as never, ORG, "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee")
    ).rejects.toThrow(/not in this organization/);
  });

  it("reorders by explicit ids and keeps unique 1-based priority", async () => {
    const first = await createAssignmentRule(makeClient() as never, ORG, ACTOR, {
      name: "Rule A",
      assigneeUserId: MIKE,
      conditions: { category: "plumbing" }
    });
    const second = await createAssignmentRule(makeClient() as never, ORG, ACTOR, {
      name: "Rule B",
      assigneeUserId: JOHN,
      conditions: { category: "electrical" }
    });
    const reordered = await reorderAssignmentRules(makeClient() as never, ORG, ACTOR, [
      second.id as string,
      first.id as string
    ]);
    expect(reordered.map((row) => row.name)).toEqual(["Rule B", "Rule A"]);
    expect(reordered.map((row) => row.sort_order)).toEqual([1, 2]);
  });

  it("soft-deactivates a rule that already has audit history", async () => {
    const rule = await createAssignmentRule(makeClient() as never, ORG, ACTOR, {
      name: "Plumbing to Mike",
      assigneeUserId: MIKE,
      conditions: { category: "plumbing" }
    });
    db.facility_assignment_rule_evaluations.push({
      id: "eval_1",
      organization_id: ORG,
      work_order_id: WO,
      rule_id: rule.id,
      result: "matched"
    });
    const archived = await archiveAssignmentRule(makeClient() as never, ORG, ACTOR, rule.id as string);
    expect(archived).toMatchObject({ status: "inactive" });
    expect(db.facility_assignment_rules).toHaveLength(1);
  });
});

describe("routing evaluation", () => {
  async function seedActive(name: string, assignee: string, conditions: Row, sort = 1) {
    db.facility_assignment_rules.push({
      id: `rule_${name}`,
      organization_id: ORG,
      name,
      description: "",
      status: "active",
      sort_order: sort,
      assignee_user_id: assignee,
      conditions
    });
  }

  it("assigns the first matching rule and records a snapshot", async () => {
    await seedActive("Emergency", JOHN, { priority: "emergency" }, 1);
    await seedActive("Plumbing", MIKE, { category: "plumbing" }, 2);
    const routed = await routeFacilityWorkOrder(makeClient() as never, ORG, WO, {
      trigger: "initial_create",
      actorUserId: ACTOR
    });
    expect(routed.result).toBe("matched");
    expect(routed.assignedUserId).toBe(MIKE);
    expect(assignWorkOrder).toHaveBeenCalledTimes(1);
    expect(db.facility_assignment_rule_evaluations[0]).toMatchObject({
      result: "matched",
      assigned_user_id: MIKE,
      rule_id: "rule_Plumbing"
    });
    expect((db.facility_assignment_rule_evaluations[0]?.["rule_snapshot"] as Row)["name"]).toBe("Plumbing");
  });

  it("leaves work unassigned when nothing matches", async () => {
    await seedActive("HVAC", MIKE, { category: "hvac" }, 1);
    const routed = await routeFacilityWorkOrder(makeClient() as never, ORG, WO, {
      trigger: "initial_create",
      actorUserId: ACTOR
    });
    expect(routed.result).toBe("no_match");
    expect(assignWorkOrder).not.toHaveBeenCalled();
    expect(db.facility_assignment_rule_evaluations[0]?.["result"]).toBe("no_match");
  });

  it("does not fall through when the winning destination is invalid", async () => {
    db.organization_memberships = db.organization_memberships.filter((row) => row["user_id"] !== MIKE);
    await seedActive("Plumbing", MIKE, { category: "plumbing" }, 1);
    await seedActive("Anything", JOHN, { originSource: "public_request" }, 2);
    const routed = await routeFacilityWorkOrder(makeClient() as never, ORG, WO, {
      trigger: "initial_create",
      actorUserId: ACTOR
    });
    expect(routed.result).toBe("invalid_destination");
    expect(assignWorkOrder).not.toHaveBeenCalled();
    expect(routed.assignedUserId).toBeNull();
  });

  it("skips initial routing when the work is already assigned", async () => {
    getWorkOrder.mockResolvedValue(workOrder({ assignee_type: "technician", technician_user_id: JOHN }));
    await seedActive("Plumbing", MIKE, { category: "plumbing" }, 1);
    const routed = await routeFacilityWorkOrder(makeClient() as never, ORG, WO, {
      trigger: "initial_create",
      actorUserId: ACTOR
    });
    expect(routed.result).toBe("skipped");
    expect(assignWorkOrder).not.toHaveBeenCalled();
  });

  it("does not automatically re-route a manager override", async () => {
    getWorkOrder.mockResolvedValue(workOrder({ assignee_type: "technician", technician_user_id: JOHN }));
    await seedActive("Plumbing", MIKE, { category: "plumbing" }, 1);
    const routed = await routeFacilityWorkOrder(makeClient() as never, ORG, WO, {
      trigger: "manager_rerun",
      actorUserId: ACTOR
    });
    expect(routed.reason).toMatch(/already assigned/);
    expect(assignWorkOrder).not.toHaveBeenCalled();
  });

  it("is idempotent for a second initial_create evaluation", async () => {
    await seedActive("Plumbing", MIKE, { category: "plumbing" }, 1);
    await routeFacilityWorkOrder(makeClient() as never, ORG, WO, {
      trigger: "initial_create",
      actorUserId: ACTOR
    });
    assignWorkOrder.mockClear();
    const again = await routeFacilityWorkOrder(makeClient() as never, ORG, WO, {
      trigger: "initial_create",
      actorUserId: ACTOR
    });
    expect(again.result).toBe("skipped");
    expect(assignWorkOrder).not.toHaveBeenCalled();
  });

  it("keeps historical snapshots when the live rule is edited", async () => {
    const rule = await createAssignmentRule(makeClient() as never, ORG, ACTOR, {
      name: "Plumbing to Mike",
      assigneeUserId: MIKE,
      conditions: { category: "plumbing" },
      status: "active"
    });
    await routeFacilityWorkOrder(makeClient() as never, ORG, WO, {
      trigger: "initial_create",
      actorUserId: ACTOR
    });
    await updateAssignmentRule(makeClient() as never, ORG, ACTOR, rule.id as string, {
      name: "Plumbing to John",
      assigneeUserId: JOHN
    });
    expect((db.facility_assignment_rule_evaluations[0]?.["rule_snapshot"] as Row)["name"]).toBe("Plumbing to Mike");
    expect((db.facility_assignment_rule_evaluations[0]?.["rule_snapshot"] as Row)["assigneeUserId"]).toBe(MIKE);
  });

  it("previews without assigning", () => {
    db.facility_assignment_rules.push({
      id: "rule_1",
      name: "Plumbing",
      status: "active",
      sort_order: 1,
      assignee_user_id: MIKE,
      conditions: { category: "plumbing" }
    });
    const preview = previewAssignmentRules(db.facility_assignment_rules as never, {
      category: "plumbing",
      priority: "normal"
    }, "Mike");
    expect(preview.result).toBe("matched");
    expect(assignWorkOrder).not.toHaveBeenCalled();
  });
});
