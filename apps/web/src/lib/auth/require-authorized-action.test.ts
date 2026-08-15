import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextResponse } from "next/server";

const state = {
  userId: "user_1" as string | null,
  orgId: "org_1" as string | null,
  membership: { id: "mem_1", status: "active", roles: ["organization_admin"] } as
    | { id: string; status: string; roles: string[] }
    | null,
  sku: "mpa_property_manager" as string | null,
  subscriptionStatus: "active" as string,
  permissions: [
    "pm.finance:read",
    "pm.properties:read",
    "pm.maintenance:read",
    "pm.maintenance:assign",
    "platform.reports:read",
    "platform.communications:read",
    "platform.communications:write"
  ] as string[]
};

vi.mock("./server", () => ({
  createAuthServerClient: async () => ({
    auth: {
      getUser: async () => ({
        data: { user: state.userId ? { id: state.userId } : null }
      })
    },
    from: (table: string) => {
      const builder = {
        select: () => builder,
        eq: () => builder,
        maybeSingle: async () => {
          if (table === "organization_memberships") {
            return { data: state.membership, error: null };
          }
          if (table === "organization_subscriptions") {
            return {
              data: state.sku ? { sku_code: state.sku, status: state.subscriptionStatus } : null,
              error: null
            };
          }
          return { data: null, error: null };
        }
      };
      return builder;
    }
  })
}));

vi.mock("../organization/server", () => ({
  getActiveOrganizationIdFromCookie: async () => state.orgId
}));

vi.mock("./authorization", () => ({
  resolveAuthorizationContext: async () => ({
    permissions: state.permissions,
    roles: state.membership?.roles ?? [],
    organizationId: state.orgId,
    userId: state.userId
  }),
  evaluatePermission: (_ctx: unknown, capability: string) => state.permissions.includes(capability)
}));

import { requireFinancePermission } from "../finance/authz";
import { requirePropertyPermission } from "../property/authz";
import { requireReportPermission } from "../reports/authz";
import { requireFacilityOperation } from "../facility/authz";
import { requireMaintenancePermission } from "../maintenance/authz";
import { requireStaffConversationPermission } from "../communications/conversation-authz";
import { requireWorkspaceRead, requireWorkspaceWrite } from "../documents/authz";

describe("PLAT-002 requireAuthorizedAction pipeline", () => {
  beforeEach(() => {
    state.userId = "user_1";
    state.orgId = "org_1";
    state.membership = { id: "mem_1", status: "active", roles: ["organization_admin"] };
    state.sku = "mpa_property_manager";
    state.subscriptionStatus = "active";
    state.permissions = [
      "pm.finance:read",
      "pm.properties:read",
      "pm.maintenance:read",
      "pm.maintenance:assign",
      "platform.reports:read",
      "platform.communications:read",
      "platform.communications:write"
    ];
  });

  it("rejects unauthenticated callers with 401", async () => {
    state.userId = null;
    const result = await requireFinancePermission("pm.finance:read");
    expect("error" in result).toBe(true);
    if ("error" in result) expect(result.error.status).toBe(401);
  });

  it("rejects missing organization with 400", async () => {
    state.orgId = null;
    const result = await requireFinancePermission("pm.finance:read");
    expect("error" in result).toBe(true);
    if ("error" in result) expect(result.error.status).toBe(400);
  });

  it("rejects missing membership with 403", async () => {
    state.membership = null;
    const result = await requireFinancePermission("pm.finance:read");
    expect("error" in result).toBe(true);
    if ("error" in result) expect(result.error.status).toBe(403);
  });

  it("rejects canceled SKU on module routes", async () => {
    state.subscriptionStatus = "canceled";
    const result = await requireFinancePermission("pm.finance:read");
    expect("error" in result).toBe(true);
    if ("error" in result) expect(result.error.status).toBe(403);
  });

  it("rejects missing capability even with PM SKU", async () => {
    state.permissions = [];
    const result = await requireFinancePermission("pm.finance:read");
    expect("error" in result).toBe(true);
    if ("error" in result) {
      expect(result.error).toBeInstanceOf(NextResponse);
      expect(result.error.status).toBe(403);
    }
  });
});

describe("PLAT-002 finance and property entitlements (C1/C2)", () => {
  beforeEach(() => {
    state.userId = "user_1";
    state.orgId = "org_1";
    state.membership = { id: "mem_1", status: "active", roles: ["organization_admin"] };
    state.sku = "mpa_property_manager";
    state.subscriptionStatus = "active";
    state.permissions = ["pm.finance:read", "pm.properties:read"];
  });

  it("allows PM SKU on finance and property", async () => {
    expect("error" in (await requireFinancePermission("pm.finance:read"))).toBe(false);
    expect("error" in (await requirePropertyPermission("pm.properties:read"))).toBe(false);
  });

  it("rejects FO SKU on finance and property even with RBAC", async () => {
    state.sku = "mpa_facility_operations";
    const finance = await requireFinancePermission("pm.finance:read");
    const property = await requirePropertyPermission("pm.properties:read");
    expect("error" in finance && finance.error.status === 403).toBe(true);
    expect("error" in property && property.error.status === 403).toBe(true);
  });

  it("allows Complete SKU on finance and property", async () => {
    state.sku = "mpa_complete_platform";
    expect("error" in (await requireFinancePermission("pm.finance:read"))).toBe(false);
    expect("error" in (await requirePropertyPermission("pm.properties:read"))).toBe(false);
  });
});

describe("PLAT-002 FO isolation and Complete union", () => {
  beforeEach(() => {
    state.userId = "user_1";
    state.orgId = "org_1";
    state.membership = { id: "mem_1", status: "active", roles: ["organization_admin"] };
    state.subscriptionStatus = "active";
    state.permissions = ["pm.maintenance:read", "pm.finance:read", "pm.properties:read"];
  });

  it("FO SKU allows facility APIs and denies PM maintenance", async () => {
    state.sku = "mpa_facility_operations";
    const facility = await requireFacilityOperation("pm.maintenance:read", "facility.operations");
    const maintenance = await requireMaintenancePermission("pm.maintenance:read", "pm.maintenance");
    expect("error" in facility).toBe(false);
    expect("error" in maintenance).toBe(true);
  });

  it("Complete SKU allows facility operations and PM finance", async () => {
    state.sku = "mpa_complete_platform";
    const facility = await requireFacilityOperation("pm.maintenance:read", "facility.operations");
    const finance = await requireFinancePermission("pm.finance:read");
    expect("error" in facility).toBe(false);
    expect("error" in finance).toBe(false);
  });
});

describe("PLAT-006 finance capability matrix (SKU then permission)", () => {
  beforeEach(() => {
    state.userId = "user_1";
    state.orgId = "org_1";
    state.subscriptionStatus = "active";
  });

  it("allows PM admin and property_manager finance read", async () => {
    for (const role of ["organization_admin", "property_manager"]) {
      state.sku = "mpa_property_manager";
      state.membership = { id: "mem_1", status: "active", roles: [role] };
      state.permissions = ["pm.finance:read", "pm.finance:charge.write"];
      expect("error" in (await requireFinancePermission("pm.finance:read"))).toBe(false);
    }
  });

  it("allows Complete admin finance and denies FO admin at SKU entitlement", async () => {
    state.membership = { id: "mem_1", status: "active", roles: ["organization_admin"] };
    state.permissions = ["pm.finance:read"];
    state.sku = "mpa_complete_platform";
    expect("error" in (await requireFinancePermission("pm.finance:read"))).toBe(false);
    state.sku = "mpa_facility_operations";
    const fo = await requireFinancePermission("pm.finance:read");
    expect("error" in fo && fo.error.status === 403).toBe(true);
  });

  it("allows leasing_agent read and denies leasing write", async () => {
    state.sku = "mpa_property_manager";
    state.membership = { id: "mem_1", status: "active", roles: ["leasing_agent"] };
    state.permissions = ["pm.finance:read"];
    expect("error" in (await requireFinancePermission("pm.finance:read"))).toBe(false);
    const write = await requireFinancePermission("pm.finance:charge.write");
    expect("error" in write && write.error.status === 403).toBe(true);
  });

  it("denies tenant, vendor, and technician staff finance", async () => {
    state.sku = "mpa_property_manager";
    state.permissions = [];
    for (const role of ["tenant", "vendor", "maintenance_technician"]) {
      state.membership = { id: "mem_1", status: "active", roles: [role] };
      const result = await requireFinancePermission("pm.finance:read");
      expect("error" in result && result.error.status === 403).toBe(true);
    }
  });
});

describe("PLAT-002 shared reports (legacy bypass removed)", () => {
  beforeEach(() => {
    state.userId = "user_1";
    state.orgId = "org_1";
    state.membership = { id: "mem_1", status: "active", roles: ["organization_admin"] };
    state.sku = "mpa_property_manager";
    state.subscriptionStatus = "active";
  });

  it("allows platform.reports:read", async () => {
    state.permissions = ["platform.reports:read"];
    expect("error" in (await requireReportPermission())).toBe(false);
  });

  it("rejects documents-read without reports capability", async () => {
    state.permissions = ["platform.documents:read"];
    const result = await requireReportPermission();
    expect("error" in result).toBe(true);
    if ("error" in result) expect(result.error.status).toBe(403);
  });

  it("denies tenant, vendor, and owner on staff shared reports", async () => {
    state.permissions = ["platform.reports:read"];
    for (const role of ["tenant", "vendor", "property_owner"]) {
      state.membership = { id: "mem_1", status: "active", roles: [role] };
      const result = await requireReportPermission();
      expect("error" in result && result.error.status === 403).toBe(true);
    }
  });
});

describe("PLAT-002 tenant communication staff (C5)", () => {
  beforeEach(() => {
    state.userId = "user_1";
    state.orgId = "org_1";
    state.sku = "mpa_property_manager";
    state.subscriptionStatus = "active";
    state.permissions = ["platform.communications:read", "platform.communications:write"];
    state.membership = { id: "mem_1", status: "active", roles: ["organization_admin"] };
  });

  it("allows PM organization admin", async () => {
    const result = await requireStaffConversationPermission("platform.communications:read");
    expect("error" in result).toBe(false);
  });

  it("denies FO technician", async () => {
    state.sku = "mpa_facility_operations";
    state.membership = { id: "mem_1", status: "active", roles: ["maintenance_technician"] };
    const result = await requireStaffConversationPermission("platform.communications:read");
    expect("error" in result).toBe(true);
    if ("error" in result) expect(result.error.status).toBe(403);
  });

  it("denies FO admin (no pm.portal_tenant)", async () => {
    state.sku = "mpa_facility_operations";
    const result = await requireStaffConversationPermission("platform.communications:read");
    expect("error" in result).toBe(true);
    if ("error" in result) expect(result.error.status).toBe(403);
  });

  it("denies Complete technician", async () => {
    state.sku = "mpa_complete_platform";
    state.membership = { id: "mem_1", status: "active", roles: ["maintenance_technician"] };
    const result = await requireStaffConversationPermission("platform.communications:read");
    expect("error" in result).toBe(true);
    if ("error" in result) expect(result.error.status).toBe(403);
  });

  it("allows Complete property manager", async () => {
    state.sku = "mpa_complete_platform";
    state.membership = { id: "mem_1", status: "active", roles: ["property_manager"] };
    const result = await requireStaffConversationPermission("platform.communications:read");
    expect("error" in result).toBe(false);
  });
});

describe("OPS-001 workspace staff isolation", () => {
  beforeEach(() => {
    state.userId = "user_1";
    state.orgId = "org_1";
    state.sku = "mpa_complete_platform";
    state.subscriptionStatus = "active";
    state.permissions = ["platform.documents:read", "platform.documents:write"];
    state.membership = { id: "mem_1", status: "active", roles: ["property_manager"] };
  });

  it("allows managers to read and write the workspace", async () => {
    expect("error" in (await requireWorkspaceRead())).toBe(false);
    expect("error" in (await requireWorkspaceWrite())).toBe(false);
  });

  it("allows technicians to read but not administer", async () => {
    state.membership = { id: "mem_1", status: "active", roles: ["maintenance_technician"] };
    expect("error" in (await requireWorkspaceRead())).toBe(false);
    const write = await requireWorkspaceWrite();
    expect("error" in write && write.error.status === 403).toBe(true);
  });

  it("denies tenant, vendor, and owner", async () => {
    for (const role of ["tenant", "vendor", "property_owner"]) {
      state.membership = { id: "mem_1", status: "active", roles: [role] };
      const read = await requireWorkspaceRead();
      const write = await requireWorkspaceWrite();
      expect("error" in read && read.error.status === 403).toBe(true);
      expect("error" in write && write.error.status === 403).toBe(true);
    }
  });
});
