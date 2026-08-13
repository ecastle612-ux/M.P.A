import { beforeEach, describe, expect, it, vi } from "vitest";

const store = {
  grant: null as Record<string, unknown> | null,
  audits: [] as Array<{ action: string }>
};

vi.mock("../auth/server", () => ({
  createAuthServerClient: async () => ({
    from: (table: string) => {
      const builder: Record<string, unknown> = {};
      const chain = () => builder;
      builder["select"] = chain;
      builder["eq"] = chain;
      builder["in"] = chain;
      builder["order"] = chain;
      builder["limit"] = chain;
      builder["maybeSingle"] = async () => {
        if (table === "master_admin_access_grants") {
          return { data: store.grant, error: null };
        }
        return { data: null, error: null };
      };
      builder["update"] = () => ({
        eq: () => ({
          eq: () => ({
            select: () => ({
              single: async () => {
                if (store.grant) {
                  store.grant = {
                    ...store.grant,
                    status: "ACTIVE",
                    activated_at: "2026-08-13T12:00:00.000Z",
                    updated_at: "2026-08-13T12:00:00.000Z"
                  };
                }
                return { data: store.grant, error: null };
              }
            })
          })
        })
      });
      return builder;
    }
  })
}));

vi.mock("./impersonation-service", () => ({
  writeSupportAudit: async (args: { action: string }) => {
    store.audits.push({ action: args.action });
  }
}));

vi.mock("../env/server-env", () => ({
  serverEnv: { SUPABASE_SERVICE_ROLE_KEY: "" }
}));

import { activateComplimentaryGrantForOrganization } from "./complimentary-grants";

describe("ADM-001 grant activation after Guided Setup", () => {
  beforeEach(() => {
    process.env["VITEST"] = "1";
    store.audits = [];
    store.grant = {
      id: "g1",
      organization_id: "org_1",
      invited_email: "tester@example.com",
      granted_by_user_id: "op_1",
      invitation_id: "inv_1",
      plan_granted: "mpa_property_manager",
      status: "INVITED",
      start_date: "2026-08-01T00:00:00.000Z",
      expiration_date: "2026-09-01T00:00:00.000Z",
      reason: "beta",
      notes: null,
      activated_at: null,
      created_at: "2026-08-01T00:00:00.000Z",
      updated_at: "2026-08-01T00:00:00.000Z",
      revoked_at: null,
      revoked_by_user_id: null
    };
  });

  it("transitions INVITED → ACTIVE and audits ACTIVATED", async () => {
    const result = await activateComplimentaryGrantForOrganization({
      organizationId: "org_1",
      actorUserId: "tester_1"
    });
    expect("grant" in result).toBe(true);
    if ("grant" in result) {
      expect(result.grant.status).toBe("ACTIVE");
    }
    expect(store.audits.some((a) => a.action === "MASTER_ADMIN_GRANT_ACTIVATED")).toBe(true);
  });
});
