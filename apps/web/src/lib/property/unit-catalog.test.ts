import { describe, expect, it, vi } from "vitest";
import {
  archivePropertyUnit,
  createPropertyUnit,
  updatePropertyUnit
} from "./unit-catalog";

vi.mock("./events-audit", () => ({
  emitPropertyEvent: vi.fn(async () => undefined),
  writePropertyAudit: vi.fn(async () => undefined)
}));

vi.mock("./property-catalog", () => ({
  getPortfolioProperty: vi.fn(async (_db: unknown, organizationId: string, propertyId: string) => {
    if (organizationId !== "org-a" || propertyId !== "prop-a") {
      return null;
    }
    return {
      id: "prop-a",
      organization_id: "org-a",
      name: "Oak",
      property_units: [{ id: "u1", unit_label: "1", status: "available" }]
    };
  })
}));

type Row = Record<string, unknown>;

function createMockDb(options: {
  unit?: Row | null;
  residentCount?: number;
  leaseCount?: number;
  openMaintenanceCount?: number;
  insertError?: { message: string; code?: string } | null;
  updateError?: { message: string; code?: string } | null;
  otherOrgLeak?: boolean;
}) {
  const inserts: Row[] = [];
  const updates: Row[] = [];

  const client = {
    inserts,
    updates,
    from(table: string) {
      const filters: Array<[string, unknown]> = [];
      const builder = {
        select() {
          return builder;
        },
        insert(row: Row | Row[]) {
          const payload = (Array.isArray(row) ? row[0] : row) ?? {};
          inserts.push(payload);
          return builder;
        },
        update(row: Row) {
          updates.push(row);
          return builder;
        },
        eq(col: string, value: unknown) {
          filters.push([col, value]);
          return builder;
        },
        in() {
          return builder;
        },
        maybeSingle: async () => {
          if (table === "property_units") {
            const org = filters.find((f) => f[0] === "organization_id")?.[1];
            if (options.otherOrgLeak && org === "org-b") {
              return { data: null, error: null };
            }
            return { data: options.unit ?? null, error: null };
          }
          return { data: null, error: null };
        },
        single: async () => {
          if (table === "property_units") {
            if (options.insertError && inserts.length > 0 && updates.length === 0) {
              return { data: null, error: options.insertError };
            }
            if (options.updateError && updates.length > 0) {
              return { data: null, error: options.updateError };
            }
            const base = options.unit ?? {
              id: "u-new",
              organization_id: "org-a",
              property_id: "prop-a",
              unit_label: "2",
              status: "available"
            };
            const merged = {
              ...base,
              ...(updates[updates.length - 1] ?? {}),
              ...(inserts[inserts.length - 1] ?? {})
            };
            return { data: merged, error: null };
          }
          return { data: null, error: null };
        },
        then(
          resolve: (value: { count: number; error: null }) => unknown,
          reject?: (reason: unknown) => unknown
        ) {
          let count = 0;
          if (table === "pm_residents") count = options.residentCount ?? 0;
          if (table === "lease_agreements") count = options.leaseCount ?? 0;
          if (table === "maintenance_work_orders") count = options.openMaintenanceCount ?? 0;
          return Promise.resolve({ count, error: null }).then(resolve, reject);
        }
      };
      return builder;
    }
  };

  return client;
}

describe("unit-catalog (PM unit management)", () => {
  it("creates a unit in the property organization", async () => {
    const db = createMockDb({});
    const unit = await createPropertyUnit(
      db as never,
      "org-a",
      "actor-1",
      "prop-a",
      { unitLabel: "2" }
    );
    expect(unit.unit_label).toBe("2");
    expect(db.inserts[0]?.["organization_id"]).toBe("org-a");
    expect(db.inserts[0]?.["property_id"]).toBe("prop-a");
  });

  it("enforces organization isolation on create (unknown property)", async () => {
    await expect(
      createPropertyUnit(createMockDb({}) as never, "org-b", "actor-1", "prop-a", {
        unitLabel: "9"
      })
    ).rejects.toThrow(/Property not found/i);
  });

  it("edits unit label when safe", async () => {
    const db = createMockDb({
      unit: {
        id: "u1",
        organization_id: "org-a",
        property_id: "prop-a",
        unit_label: "1",
        status: "available"
      }
    });
    const unit = await updatePropertyUnit(db as never, "org-a", "actor-1", "prop-a", "u1", {
      unitLabel: "1A"
    });
    expect(unit.unit_label).toBe("1A");
  });

  it("archives available units to offline", async () => {
    const db = createMockDb({
      unit: {
        id: "u1",
        organization_id: "org-a",
        property_id: "prop-a",
        unit_label: "1",
        status: "available"
      },
      residentCount: 0,
      leaseCount: 0
    });
    const unit = await archivePropertyUnit(db as never, "org-a", "actor-1", "prop-a", "u1");
    expect(unit.status).toBe("offline");
    expect(db.updates.at(-1)?.["status"]).toBe("offline");
  });

  it("blocks archive when a resident is assigned", async () => {
    const db = createMockDb({
      unit: {
        id: "u1",
        organization_id: "org-a",
        property_id: "prop-a",
        unit_label: "1",
        status: "available"
      },
      residentCount: 1,
      leaseCount: 0
    });
    await expect(
      archivePropertyUnit(db as never, "org-a", "actor-1", "prop-a", "u1")
    ).rejects.toThrow(/resident\/lease/i);
  });

  it("blocks occupied status edits driven by relationships", async () => {
    const db = createMockDb({
      unit: {
        id: "u1",
        organization_id: "org-a",
        property_id: "prop-a",
        unit_label: "1",
        status: "occupied"
      },
      residentCount: 1,
      leaseCount: 1
    });
    await expect(
      updatePropertyUnit(db as never, "org-a", "actor-1", "prop-a", "u1", {
        status: "available"
      })
    ).rejects.toThrow(/Clear the resident/i);
  });
});
