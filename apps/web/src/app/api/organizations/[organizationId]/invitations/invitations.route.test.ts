import { beforeEach, describe, expect, it, vi } from "vitest";

const state = {
  user: { id: "erick", email: "erick@example.com" } as { id: string; email: string } | null,
  sku: "mpa_complete_platform" as string | null,
  inviterRoles: ["organization_admin"] as string[],
  inviterScope: "both" as string | null,
  created: null as Record<string, unknown> | null
};

vi.mock("../../../../../lib/auth/server", () => ({
  createAuthServerClient: async () => ({
    auth: {
      getUser: async () => ({ data: { user: state.user } })
    },
    from: (table: string) => {
      const builder = {
        select: () => builder,
        eq: () => builder,
        order: () => builder,
        maybeSingle: async () => {
          if (table === "organization_subscriptions") {
            return {
              data: state.sku ? { sku_code: state.sku, status: "active" } : null,
              error: null
            };
          }
          if (table === "organization_memberships") {
            return {
              data: { roles: state.inviterRoles, operating_scope: state.inviterScope },
              error: null
            };
          }
          if (table === "organizations") {
            return { data: { name: "Clinic" }, error: null };
          }
          return { data: [], error: null };
        }
      };
      return builder;
    }
  })
}));

vi.mock("../../../../../lib/auth/authorization", () => ({
  resolveAuthorizationContext: async () => ({ permissions: ["invitation:create", "invitation:read"] }),
  evaluatePermission: () => true
}));

vi.mock("../../../../../lib/team/invitation-service", () => ({
  INVITATION_ROW_COLUMNS: "id, email, roles, status, token, delivery_status, operating_scope",
  buildAcceptUrl: (token: string) => `http://localhost:3000/accept-invitation/${token}`,
  invitationNoticeCopy: () => "Invitation created. Copy the accept link (email provider not configured).",
  InvitationCreateError: class InvitationCreateError extends Error {
    status = 400;
  },
  createAndSendInvitation: async (args: { operatingScope?: string | null; roles: string[] }) => {
    state.created = { roles: args.roles, operatingScope: args.operatingScope };
    return {
      invitation: {
        id: "inv-1",
        email: "new@example.com",
        roles: args.roles,
        status: "pending",
        token: "tok",
        delivery_status: "pending",
        operating_scope: args.operatingScope
      },
      acceptUrl: "http://localhost:3000/accept-invitation/tok",
      roleLabel: "Property Manager",
      emailStatus: "skipped",
      deliveryStatus: "pending"
    };
  }
}));

import { POST } from "./route";

describe("Complete invitation create grant caps", () => {
  beforeEach(() => {
    state.user = { id: "erick", email: "erick@example.com" };
    state.sku = "mpa_complete_platform";
    state.inviterRoles = ["organization_admin"];
    state.inviterScope = "both";
    state.created = null;
  });

  it("denies unauthenticated invitation creates", async () => {
    state.user = null;
    const response = await POST(
      new Request("http://localhost/api", {
        method: "POST",
        body: JSON.stringify({
          email: "x@example.com",
          roles: ["property_manager"]
        })
      }),
      { params: Promise.resolve({ organizationId: "org-complete" }) }
    );
    expect(response.status).toBe(401);
    expect(state.created).toBeNull();
  });

  it("creates Complete Property, Facility, and Both invitations when the inviter is BOTH", async () => {
    for (const scope of ["property_operations", "facility_operations", "both"] as const) {
      const response = await POST(
        new Request("http://localhost/api", {
          method: "POST",
          body: JSON.stringify({
            email: `${scope}@example.com`,
            roles: ["property_manager"],
            operatingScope: scope
          })
        }),
        { params: Promise.resolve({ organizationId: "org-complete" }) }
      );
      expect(response.status).toBe(201);
      expect(state.created?.["operatingScope"]).toBe(scope);
    }
  });

  it("denies a scoped Property inviter granting Facility or Both", async () => {
    state.inviterRoles = ["property_manager"];
    state.inviterScope = "property_operations";
    for (const scope of ["facility_operations", "both"] as const) {
      const response = await POST(
        new Request("http://localhost/api", {
          method: "POST",
          body: JSON.stringify({
            email: "x@example.com",
            roles: ["property_manager"],
            operatingScope: scope
          })
        }),
        { params: Promise.resolve({ organizationId: "org-complete" }) }
      );
      expect(response.status).toBe(403);
    }
  });

  it("denies a scoped Facility inviter granting Property or Both", async () => {
    state.inviterRoles = ["property_manager"];
    state.inviterScope = "facility_operations";
    for (const scope of ["property_operations", "both"] as const) {
      const response = await POST(
        new Request("http://localhost/api", {
          method: "POST",
          body: JSON.stringify({
            email: "x@example.com",
            roles: ["property_manager"],
            operatingScope: scope
          })
        }),
        { params: Promise.resolve({ organizationId: "org-complete" }) }
      );
      expect(response.status).toBe(403);
    }
  });

  it("stores implied scopes for single-product invitations", async () => {
    state.sku = "mpa_property_manager";
    const pm = await POST(
      new Request("http://localhost/api", {
        method: "POST",
        body: JSON.stringify({ email: "pm@example.com", roles: ["property_manager"] })
      }),
      { params: Promise.resolve({ organizationId: "org-pm" }) }
    );
    expect(pm.status).toBe(201);
    expect(state.created?.["operatingScope"]).toBe("property_operations");

    state.sku = "mpa_facility_operations";
    const fo = await POST(
      new Request("http://localhost/api", {
        method: "POST",
        body: JSON.stringify({ email: "fo@example.com", roles: ["property_manager"] })
      }),
      { params: Promise.resolve({ organizationId: "org-fo" }) }
    );
    expect(fo.status).toBe(201);
    expect(state.created?.["operatingScope"]).toBe("facility_operations");
  });
});
