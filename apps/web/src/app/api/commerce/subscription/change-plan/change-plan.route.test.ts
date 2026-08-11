import { describe, expect, it, vi } from "vitest";

vi.mock("../../../../../lib/auth/server", () => ({
  createAuthServerClient: async () => ({
    auth: {
      getUser: async () => ({ data: { user: { id: "user_test" } } })
    }
  })
}));

import { POST } from "./route";

describe("POST /api/commerce/subscription/change-plan", () => {
  it("rejects Business planTier", async () => {
    const res = await POST(
      new Request("http://localhost/api/commerce/subscription/change-plan", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          cookie: "mpa_active_organization_id=org_test"
        },
        body: JSON.stringify({ planTier: "business" })
      })
    );
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("unsupported_plan");
  });

  it("rejects Professional legacy plan-price swaps", async () => {
    const res = await POST(
      new Request("http://localhost/api/commerce/subscription/change-plan", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          cookie: "mpa_active_organization_id=org_test"
        },
        body: JSON.stringify({ planTier: "professional", billingCycle: "annual" })
      })
    );
    expect(res.status).toBe(409);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("unsupported_plan_change");
  });
});
