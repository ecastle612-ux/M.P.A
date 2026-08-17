import { beforeEach, describe, expect, it, vi } from "vitest";

const ADMIN_ID = "11111111-1111-4111-8111-111111111111";
const STAFF_ID = "22222222-2222-4222-8222-222222222222";

type MembershipRow = {
  id: string;
  user_id: string;
  roles: string[];
  status: string;
  operating_scope: string | null;
  created_at?: string;
};

const state = {
  user: { id: "admin-user" } as { id: string } | null,
  canRead: true,
  canUpdate: true,
  sku: "mpa_property_manager" as string | null,
  memberships: [] as MembershipRow[],
  lastUpdate: null as { id: string; status: string } | null
};

function membershipBuilder(filters: { id?: string } = {}) {
  let pendingPatch: { status?: string } | null = null;
  const builder: Record<string, unknown> = {
    select: () => builder,
    eq: (column: string, value: string) => {
      if (column === "id") {
        filters.id = value;
      }
      return builder;
    },
    order: () => builder,
    maybeSingle: async () => ({
      data: state.memberships.find((row) => row.id === filters.id) ?? null,
      error: null
    }),
    single: async () => {
      const target = state.memberships.find((row) => row.id === filters.id);
      if (pendingPatch && target) {
        if (pendingPatch.status) {
          target.status = pendingPatch.status;
        }
        state.lastUpdate = { id: target.id, status: target.status };
        return { data: target, error: null };
      }
      return { data: target ?? null, error: target ? null : { message: "not found" } };
    },
    then: (resolve: (value: { data: MembershipRow[]; error: null }) => unknown) =>
      resolve({ data: state.memberships, error: null })
  };
  builder["update"] = (patch: { status?: string }) => {
    pendingPatch = patch;
    return builder;
  };
  return builder;
}

vi.mock("../../../../../lib/auth/server", () => ({
  createAuthServerClient: async () => ({
    auth: {
      getUser: async () => ({ data: { user: state.user } })
    },
    from: (table: string) => {
      if (table === "organization_subscriptions") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: state.sku ? { sku_code: state.sku, status: "active" } : null,
                error: null
              })
            })
          })
        };
      }
      return membershipBuilder();
    }
  })
}));

vi.mock("../../../../../lib/auth/authorization", () => ({
  resolveAuthorizationContext: async () => ({ permissions: [] }),
  evaluatePermission: (_ctx: unknown, permission: string) => {
    if (permission === "membership:read") return state.canRead;
    if (permission === "membership:update") return state.canUpdate;
    return false;
  }
}));

vi.mock("../../../../../lib/organization/operating-scope-events", () => ({
  recordOperatingScopeEvent: async () => undefined
}));

import { PATCH } from "./route";

describe("PATCH /api/organizations/[organizationId]/memberships P1-06", () => {
  beforeEach(() => {
    state.user = { id: "admin-user" };
    state.canRead = true;
    state.canUpdate = true;
    state.sku = "mpa_property_manager";
    state.lastUpdate = null;
    state.memberships = [
      {
        id: ADMIN_ID,
        user_id: "admin-user",
        roles: ["organization_admin"],
        status: "active",
        operating_scope: null
      },
      {
        id: STAFF_ID,
        user_id: "staff-user",
        roles: ["property_manager"],
        status: "active",
        operating_scope: null
      }
    ];
  });

  it("lets an authorized admin deactivate a membership without destroying the row", async () => {
    const response = await PATCH(
      new Request("http://localhost/api", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ membershipId: STAFF_ID, status: "inactive" })
      }),
      { params: Promise.resolve({ organizationId: "org-1" }) }
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.membership.status).toBe("inactive");
    expect(body.membership.id).toBe(STAFF_ID);
    expect(state.memberships.find((row) => row.id === STAFF_ID)?.status).toBe("inactive");
    expect(state.memberships).toHaveLength(2);
  });

  it("forbids an unauthorized user from deactivating a membership", async () => {
    state.canUpdate = false;
    state.canRead = true;
    const response = await PATCH(
      new Request("http://localhost/api", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ membershipId: STAFF_ID, status: "inactive" })
      }),
      { params: Promise.resolve({ organizationId: "org-1" }) }
    );
    expect(response.status).toBe(403);
    expect(state.memberships.find((row) => row.id === STAFF_ID)?.status).toBe("active");
  });

  it("retains the historical membership record after deactivation", async () => {
    await PATCH(
      new Request("http://localhost/api", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ membershipId: STAFF_ID, status: "inactive" })
      }),
      { params: Promise.resolve({ organizationId: "org-1" }) }
    );
    const retained = state.memberships.find((row) => row.id === STAFF_ID);
    expect(retained).toBeDefined();
    expect(retained?.user_id).toBe("staff-user");
    expect(retained?.status).toBe("inactive");
  });

  it("fails closed when deactivating the last Organization Admin", async () => {
    const response = await PATCH(
      new Request("http://localhost/api", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ membershipId: ADMIN_ID, status: "inactive" })
      }),
      { params: Promise.resolve({ organizationId: "org-1" }) }
    );
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toMatch(/at least one active Organization Admin/i);
    expect(state.memberships.find((row) => row.id === ADMIN_ID)?.status).toBe("active");
  });
});
