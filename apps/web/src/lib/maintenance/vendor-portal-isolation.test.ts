import { describe, expect, it } from "vitest";
import { listVendorPortalWorkOrders, progressWorkOrder } from "./maintenance-service";

function createVendorClient(options: {
  vendors: Array<{ id: string; organization_id: string; name: string }>;
  workOrders: Array<Record<string, unknown>>;
  existing?: Record<string, unknown> | null;
}) {
  type Builder = {
    select: () => Builder;
    eq: (col: string, value: unknown) => Builder;
    in: (col: string, values: unknown[]) => Builder;
    order: () => Builder;
    update: () => Builder;
    insert: () => Builder;
    maybeSingle: () => Promise<{ data: unknown; error: null }>;
    single: () => Promise<{ data: unknown; error: null }>;
    then: (
      resolve: (value: { data: unknown; error: null }) => unknown,
      reject?: (reason: unknown) => unknown
    ) => Promise<unknown>;
  };

  const client = {
    lastIn: null as null | [string, unknown[]],
    from(table: string) {
      const builder: Builder = {
        select() {
          return builder;
        },
        eq() {
          return builder;
        },
        in(col: string, values: unknown[]) {
          client.lastIn = [col, values];
          return builder;
        },
        order() {
          return builder;
        },
        update() {
          return builder;
        },
        insert() {
          return builder;
        },
        maybeSingle: async () => ({ data: options.existing ?? null, error: null }),
        single: async () => ({ data: options.existing ?? options.workOrders[0] ?? null, error: null }),
        then(resolve, reject) {
          if (table === "vendor_vendors") {
            return Promise.resolve({ data: options.vendors, error: null }).then(resolve, reject);
          }
          return Promise.resolve({ data: options.workOrders, error: null }).then(resolve, reject);
        }
      };
      return builder;
    }
  };
  return client;
}

describe("Vendor portal isolation (PPS1-009)", () => {
  it("lists only work orders for the authenticated vendor account", async () => {
    const supabase = createVendorClient({
      vendors: [{ id: "vendor_a", organization_id: "org_a", name: "Acme" }],
      workOrders: [{ id: "wo_a", vendor_id: "vendor_a", organization_id: "org_a" }]
    });

    const result = await listVendorPortalWorkOrders(supabase as never, "user_vendor_a");
    expect(result.vendors).toHaveLength(1);
    expect(supabase.lastIn).toEqual(["vendor_id", ["vendor_a"]]);
    expect(result.workOrders[0]?.id).toBe("wo_a");
  });

  it("rejects progress when the work order is not linked to the vendor user", async () => {
    const foreignId = "33333333-3333-4333-8333-333333333333";
    const existing = {
      id: foreignId,
      organization_id: "org_b",
      status: "assigned",
      technician_user_id: null,
      vendor_id: "vendor_other",
      vendor_vendors: { user_id: "someone_else" },
      work_surface: "facility",
      property_id: null,
      resident_id: null,
      started_at: null
    };
    const supabase = createVendorClient({
      vendors: [],
      workOrders: [],
      existing
    });

    await expect(
      progressWorkOrder(supabase as never, "org_b", "user_vendor_a", "vendor", {
        workOrderId: foreignId,
        action: "start",
        note: "Should fail"
      })
    ).rejects.toThrow(/not assigned to your vendor account/i);
  });
});
