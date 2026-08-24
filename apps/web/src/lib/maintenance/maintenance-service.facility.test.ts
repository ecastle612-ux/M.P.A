import { describe, expect, it } from "vitest";
import {
  cancelWorkOrder,
  createFacilityWorkOrder,
  listWorkOrders
} from "./maintenance-service";

function createFilterAwareClient(options: {
  listRows?: unknown[];
  property?: unknown;
  existingWorkOrder?: unknown;
}) {
  type Builder = {
    select: () => Builder;
    insert: () => Builder;
    update: () => Builder;
    eq: (col: string, value: unknown) => Builder;
    order: () => Builder;
    limit: () => Builder;
    is: () => Builder;
    maybeSingle: () => Promise<{ data: unknown; error: null }>;
    single: () => Promise<{ data: unknown; error: null }>;
    then: (
      resolve: (value: { data: unknown; error: null }) => unknown,
      reject?: (reason: unknown) => unknown
    ) => Promise<unknown>;
  };

  const client: {
    lastEq: Array<[string, unknown]>;
    from: (table: string) => Builder;
  } = {
    lastEq: [],
    from(table: string) {
      const filters: Array<[string, unknown]> = [];
      const builder: Builder = {
        select() {
          return builder;
        },
        insert() {
          return builder;
        },
        update() {
          return builder;
        },
        eq(col: string, value: unknown) {
          filters.push([col, value]);
          client.lastEq = filters;
          return builder;
        },
        is() {
          return builder;
        },
        order() {
          return builder;
        },
        limit() {
          return builder;
        },
        maybeSingle: async () => {
          if (table === "property_properties") {
            return { data: options.property ?? null, error: null };
          }
          if (table === "facility_assets") {
            return { data: null, error: null };
          }
          if (table === "maintenance_work_orders") {
            return { data: options.existingWorkOrder ?? null, error: null };
          }
          return { data: null, error: null };
        },
        single: async () => ({ data: options.existingWorkOrder ?? null, error: null }),
        then(resolve, reject) {
          return Promise.resolve({
            data: options.listRows ?? [],
            error: null
          }).then(resolve, reject);
        }
      };
      return builder;
    }
  };
  return client;
}

describe("STAB-004 maintenance-service facility surface", () => {
  it("listWorkOrders filters by facility surface when requested", async () => {
    const supabase = createFilterAwareClient({ listRows: [] });
    await listWorkOrders(supabase as never, "org_1", { surface: "facility" });
    expect(supabase.lastEq).toContainEqual(["organization_id", "org_1"]);
    expect(supabase.lastEq).toContainEqual(["work_surface", "facility"]);
  });

  it("createFacilityWorkOrder rejects unknown property", async () => {
    const supabase = createFilterAwareClient({ property: null });
    await expect(
      createFacilityWorkOrder(supabase as never, "org_1", "user_1", {
        title: "Test work",
        description: "Should fail property check",
        category: "general",
        priority: "normal",
        propertyId: "11111111-1111-4111-8111-111111111111"
      })
    ).rejects.toThrow(/Property not found/);
  });

  it("createFacilityWorkOrder refuses an asset from another organization", async () => {
    const supabase = createFilterAwareClient({
      property: { id: "11111111-1111-4111-8111-111111111111", name: "North Clinic" }
    });
    await expect(
      createFacilityWorkOrder(supabase as never, "org_1", "user_1", {
        title: "Repair chair",
        description: "Arm is broken",
        category: "general",
        priority: "normal",
        propertyId: "11111111-1111-4111-8111-111111111111",
        facilityAssetId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"
      })
    ).rejects.toThrow(/Facility asset not found for organization/);
  });

  it("cancelWorkOrder refuses completed work", async () => {
    const supabase = createFilterAwareClient({
      existingWorkOrder: {
        id: "wo_1",
        organization_id: "org_1",
        property_id: "prop_1",
        resident_id: null,
        status: "completed",
        work_surface: "facility"
      }
    });

    await expect(
      cancelWorkOrder(supabase as never, "org_1", "user_1", {
        workOrderId: "22222222-2222-4222-8222-222222222222"
      })
    ).rejects.toThrow(/Cannot cancel/);
  });
});
