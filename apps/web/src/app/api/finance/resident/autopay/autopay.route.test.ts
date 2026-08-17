import { beforeEach, describe, expect, it, vi } from "vitest";

const state = {
  userId: "tenant_1" as string | null,
  resident: null as Record<string, unknown> | null
};

vi.mock("../../../../../lib/auth/server", () => ({
  createAuthServerClient: async () => ({
    auth: {
      getUser: async () => ({
        data: { user: state.userId ? { id: state.userId } : null }
      })
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => ({
            maybeSingle: async () => ({ data: state.resident, error: null })
          })
        })
      })
    })
  })
}));

const serviceRole = vi.fn();
vi.mock("../../../../../lib/supabase/service-role", () => ({
  createServiceRoleClient: () => serviceRole()
}));

import { POST } from "./route";

describe("POST /api/finance/resident/autopay occupancy", () => {
  beforeEach(() => {
    state.userId = "tenant_1";
    state.resident = null;
    serviceRole.mockReset();
  });

  it("denies a former tenant before service_role", async () => {
    state.resident = {
      id: "res_1",
      lease_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      organization_id: "org_1",
      occupancy_status: "moved_out",
      occupy_from: "2020-01-01",
      occupy_to: "2024-01-01"
    };
    const response = await POST(
      new Request("http://localhost/api/finance/resident/autopay", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "start",
          leaseId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
          paymentMethodType: "card",
          consentText:
            "I authorize M.P.A. to automatically charge the payment method I save for posted recurring rent and AutoPay-eligible recurring fees."
        })
      })
    );
    expect(response.status).toBe(403);
    expect(serviceRole).not.toHaveBeenCalled();
  });

  it("denies admin-only callers with no occupancy row", async () => {
    state.resident = null;
    const response = await POST(
      new Request("http://localhost/api/finance/resident/autopay", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "start",
          leaseId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
          paymentMethodType: "card",
          consentText:
            "I authorize M.P.A. to automatically charge the payment method I save for posted recurring rent and AutoPay-eligible recurring fees."
        })
      })
    );
    expect(response.status).toBe(403);
    expect(serviceRole).not.toHaveBeenCalled();
  });
});
