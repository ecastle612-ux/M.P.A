import { beforeEach, describe, expect, it, vi } from "vitest";

const ASSIGNED_WO = "11111111-1111-4111-8111-111111111111";
const FOREIGN_WO = "22222222-2222-4222-8222-222222222222";

const state = {
  userId: "vendor_user_1" as string | null,
  assignedWorkOrderIds: [ASSIGNED_WO] as string[],
  progressCalls: [] as Array<{
    organizationId: string;
    actorUserId: string;
    actorRole: string;
    workOrderId: string;
  }>
};

vi.mock("../../../../../lib/auth/server", () => ({
  createAuthServerClient: async () => ({
    auth: {
      getUser: async () => ({
        data: { user: state.userId ? { id: state.userId } : null }
      })
    }
  })
}));

vi.mock("../../../../../lib/maintenance/maintenance-service", () => ({
  listVendorPortalWorkOrders: async () => ({
    vendors: [{ id: "vendor_1", organization_id: "org_1", name: "Acme HVAC" }],
    workOrders: state.assignedWorkOrderIds.map((id) => ({
      id,
      organization_id: "org_1",
      title: "Assigned job",
      status: "assigned"
    }))
  }),
  listWorkOrderUpdates: async () => [],
  progressWorkOrder: async (
    _supabase: unknown,
    organizationId: string,
    actorUserId: string,
    actorRole: string,
    input: { workOrderId: string }
  ) => {
    state.progressCalls.push({
      organizationId,
      actorUserId,
      actorRole,
      workOrderId: input.workOrderId
    });
    return { id: input.workOrderId, status: "in_progress" };
  }
}));

import { GET, POST } from "./route";

describe("Vendor portal maintenance auth (PPS1-009)", () => {
  beforeEach(() => {
    state.userId = "vendor_user_1";
    state.assignedWorkOrderIds = [ASSIGNED_WO];
    state.progressCalls = [];
  });

  it("rejects unauthenticated GET", async () => {
    state.userId = null;
    const response = await GET();
    expect(response.status).toBe(401);
  });

  it("rejects updates for work orders not assigned to the vendor", async () => {
    const response = await POST(
      new Request("http://localhost/api/portal/vendor/maintenance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workOrderId: FOREIGN_WO,
          action: "start",
          note: "Trying foreign work"
        })
      })
    );
    expect(response.status).toBe(403);
    const body = (await response.json()) as { error?: string };
    expect(body.error).toMatch(/not assigned to this vendor/i);
    expect(state.progressCalls).toHaveLength(0);
  });

  it("allows start on assigned vendor work", async () => {
    const response = await POST(
      new Request("http://localhost/api/portal/vendor/maintenance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workOrderId: ASSIGNED_WO,
          action: "start",
          note: "On site"
        })
      })
    );
    expect(response.status).toBe(200);
    expect(state.progressCalls).toEqual([
      {
        organizationId: "org_1",
        actorUserId: "vendor_user_1",
        actorRole: "vendor",
        workOrderId: ASSIGNED_WO
      }
    ]);
  });
});
