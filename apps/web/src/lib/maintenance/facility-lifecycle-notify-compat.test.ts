import { describe, expect, it } from "vitest";
import { progressWorkOrder } from "./maintenance-service";

const MISSING_TABLE = {
  code: "PGRST205",
  message: "Could not find the table 'public.maintenance_notifications' in the schema cache"
};

function createLifecycleClient(options: {
  workOrder: Record<string, unknown>;
  notificationError?: { code?: string; message: string } | null;
}) {
  const updated = { ...options.workOrder };

  return {
    from(table: string) {
      const api = {
        select() {
          return api;
        },
        insert() {
          return api;
        },
        update(patch: Record<string, unknown>) {
          Object.assign(updated, patch);
          return api;
        },
        eq() {
          return api;
        },
        maybeSingle: async () => {
          if (table === "maintenance_work_orders") {
            return { data: options.workOrder, error: null };
          }
          if (table === "user_preferences") {
            return {
              data: { notification_preferences: { email: true, in_app: true, sms: false } },
              error: null
            };
          }
          if (table === "maintenance_notifications" && options.notificationError) {
            return { data: null, error: options.notificationError };
          }
          return { data: null, error: null };
        },
        single: async () => ({ data: updated, error: null }),
        then(
          resolve: (value: { data: unknown; error: { code?: string; message: string } | null }) => unknown,
          reject?: (reason: unknown) => unknown
        ) {
          if (table === "maintenance_notifications" && options.notificationError) {
            return Promise.resolve({ data: null, error: options.notificationError }).then(
              resolve,
              reject
            );
          }
          return Promise.resolve({ data: null, error: null }).then(resolve, reject);
        }
      };
      return api;
    }
  };
}

const baseOrder = {
  id: "44444444-4444-4444-8444-444444444444",
  organization_id: "org_1",
  status: "assigned",
  work_surface: "facility",
  technician_user_id: "tech_1",
  requested_by_user_id: "mgr_1",
  vendor_id: null,
  vendor_vendors: null,
  property_id: null,
  resident_id: null,
  started_at: null,
  priority: "normal",
  pm_residents: null
};

describe("FAC-003 work-order lifecycle with optional notifications", () => {
  it("starts a facility work order when the legacy notify table is absent", async () => {
    const client = createLifecycleClient({
      workOrder: baseOrder,
      notificationError: MISSING_TABLE
    });
    const result = await progressWorkOrder(client as never, "org_1", "mgr_1", "manager", {
      workOrderId: baseOrder.id,
      action: "start",
      note: "On site"
    });
    expect(result.status).toBe("in_progress");
  });

  it("completes a facility work order to closed when the legacy notify table is absent", async () => {
    const client = createLifecycleClient({
      workOrder: { ...baseOrder, status: "in_progress", started_at: "2026-08-14T12:00:00.000Z" },
      notificationError: MISSING_TABLE
    });
    const result = await progressWorkOrder(client as never, "org_1", "mgr_1", "manager", {
      workOrderId: baseOrder.id,
      action: "complete",
      note: "Filters replaced"
    });
    expect(result.status).toBe("closed");
  });

  it("still succeeds when the notify table is present", async () => {
    const client = createLifecycleClient({
      workOrder: baseOrder,
      notificationError: null
    });
    const result = await progressWorkOrder(client as never, "org_1", "mgr_1", "manager", {
      workOrderId: baseOrder.id,
      action: "start",
      note: "On site"
    });
    expect(result.status).toBe("in_progress");
  });
});
