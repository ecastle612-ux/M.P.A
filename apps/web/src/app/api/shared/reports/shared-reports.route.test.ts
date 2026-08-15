import { beforeEach, describe, expect, it, vi } from "vitest";

const authState = {
  error: null as { status: number } | null,
  roles: ["organization_admin"] as string[],
  sku: "mpa_property_manager" as
    | "mpa_property_manager"
    | "mpa_facility_operations"
    | "mpa_complete_platform"
    | null,
  entitlements: ["platform.reports", "pm.financial_operations"] as string[],
  permissions: ["platform.reports:read", "pm.finance:reports.read"] as string[]
};

vi.mock("../../../../lib/reports/authz", () => ({
  requireReportPermission: async () => {
    if (authState.error) {
      const { NextResponse } = await import("next/server");
      return { error: NextResponse.json({ error: "denied" }, { status: authState.error.status }) };
    }
    return {
      supabase: {},
      organizationId: "org_a",
      roles: authState.roles,
      sku: authState.sku,
      entitlements: authState.entitlements,
      permissions: authState.permissions
    };
  }
}));

const built: { shape: { persona: string | null; loadFinance: boolean; areas: readonly string[] } | null } = {
  shape: null
};

vi.mock("../../../../lib/reports/analytics-service", () => ({
  buildOrganizationReportingSnapshot: async (
    _db: unknown,
    _orgId: string,
    options: { shape: { persona: string | null; loadFinance: boolean; areas: readonly string[] } }
  ) => {
    built.shape = options.shape;
    return { persona: options.shape.persona, areas: options.shape.areas.map((area) => ({ area })) };
  }
}));

import { GET } from "./route";

describe("PLAT-006 shared reports route authorization", () => {
  beforeEach(() => {
    authState.error = null;
    authState.roles = ["organization_admin"];
    authState.sku = "mpa_property_manager";
    authState.entitlements = ["platform.reports", "pm.financial_operations"];
    authState.permissions = ["platform.reports:read", "pm.finance:reports.read"];
    built.shape = null;
  });

  it("returns 401 when the pipeline rejects unauthenticated callers", async () => {
    authState.error = { status: 401 };
    const response = await GET(new Request("http://localhost/api/shared/reports"));
    expect(response.status).toBe(401);
  });

  it("returns 403 for portal roles that somehow reach the handler", async () => {
    authState.roles = ["tenant"];
    const response = await GET(new Request("http://localhost/api/shared/reports?persona=organization_owner"));
    expect(response.status).toBe(403);
    expect(built.shape).toBeNull();
  });

  it("ignores FO persona escalation on a Property Manager org", async () => {
    const response = await GET(
      new Request("http://localhost/api/shared/reports?persona=facility_manager")
    );
    expect(response.status).toBe(200);
    expect(built.shape?.persona).toBe("organization_owner");
    expect(built.shape?.areas).not.toContain("facility_operations");
    expect(built.shape?.loadFinance).toBe(true);
  });

  it("serves FO-only shapes and does not load finance", async () => {
    authState.sku = "mpa_facility_operations";
    authState.entitlements = ["platform.reports"];
    const response = await GET(
      new Request("http://localhost/api/shared/reports?persona=organization_owner&area=financial_performance")
    );
    expect(response.status).toBe(200);
    expect(built.shape?.persona).toBe("facility_manager");
    expect(built.shape?.loadFinance).toBe(false);
    expect(built.shape?.areas).not.toContain("resident_experience");
  });

  it("narrows Complete admin to FO when requested and refuses owner escalation from a technician", async () => {
    authState.sku = "mpa_complete_platform";
    const narrowed = await GET(
      new Request("http://localhost/api/shared/reports?persona=facility_manager")
    );
    expect(narrowed.status).toBe(200);
    expect(built.shape?.persona).toBe("facility_manager");
    expect(built.shape?.loadFinance).toBe(false);

    authState.roles = ["maintenance_technician"];
    authState.permissions = ["platform.reports:read"];
    const escalated = await GET(
      new Request("http://localhost/api/shared/reports?persona=organization_owner")
    );
    expect(escalated.status).toBe(200);
    expect(built.shape?.persona).toBe("facility_manager");
  });
});
