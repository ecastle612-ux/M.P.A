import { beforeEach, describe, expect, it, vi } from "vitest";

const acceptCalls: Array<Record<string, unknown>> = [];

vi.mock("../../../../../lib/env/server-env", () => ({
  serverEnv: {
    SUPABASE_SERVICE_ROLE_KEY: "test_service_role"
  }
}));

vi.mock("../../../../../lib/auth/server", () => ({
  createAuthServerClient: async () => ({
    auth: {
      getUser: async () => ({
        data: { user: { id: "sarah-user", email: "sarah@example.com" } }
      })
    }
  })
}));

vi.mock("../../../../../lib/supabase/service-role", () => ({
  createServiceRoleClient: () => ({ kind: "service_role" })
}));

vi.mock("../../../../../lib/team/invitation-service", () => ({
  InvitationAcceptanceError: class InvitationAcceptanceError extends Error {
    constructor(
      message: string,
      readonly status: number
    ) {
      super(message);
    }
  },
  acceptInvitation: async (args: Record<string, unknown>) => {
    acceptCalls.push(args);
    return {
      organizationId: "org-complete",
      roles: ["property_manager"],
      operatingScope: "property_operations",
      homeHref: "/pm/mission-control",
      roleLabel: "Property Manager",
      idempotent: false
    };
  }
}));

import { POST } from "./route";

describe("invitation accept route trust boundary", () => {
  beforeEach(() => {
    acceptCalls.length = 0;
  });

  it("ignores browser role and operating_scope and uses the service_role client", async () => {
    const response = await POST(
      new Request("http://localhost/api", {
        method: "POST",
        body: JSON.stringify({
          roles: ["organization_admin"],
          operatingScope: "both"
        })
      }),
      { params: Promise.resolve({ token: "tok-1" }) }
    );
    expect(response.status).toBe(200);
    expect(acceptCalls).toHaveLength(1);
    expect(acceptCalls[0]?.["supabase"]).toEqual({ kind: "service_role" });
    expect(acceptCalls[0]?.["token"]).toBe("tok-1");
    expect(acceptCalls[0]?.["userId"]).toBe("sarah-user");
    expect(acceptCalls[0]).not.toHaveProperty("roles");
    expect(acceptCalls[0]).not.toHaveProperty("operatingScope");
    const payload = (await response.json()) as { roles: string[]; operatingScope: string };
    expect(payload.roles).toEqual(["property_manager"]);
    expect(payload.operatingScope).toBe("property_operations");
  });
});
