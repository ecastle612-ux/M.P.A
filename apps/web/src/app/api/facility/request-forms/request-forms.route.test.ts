import { beforeEach, describe, expect, it, vi } from "vitest";

const requireFacilityRequestFormsPermission = vi.fn();

vi.mock("../../../../lib/facility/authz", () => ({
  requireFacilityRequestFormsPermission: () => requireFacilityRequestFormsPermission()
}));

vi.mock("../../../../lib/facility/request-form-service", () => ({
  listRequestForms: vi.fn(async () => []),
  createRequestForm: vi.fn()
}));

import { GET } from "./route";

describe("request form admin API", () => {
  beforeEach(() => {
    requireFacilityRequestFormsPermission.mockReset();
  });

  it("denies technicians and PM-only members at the gate", async () => {
    requireFacilityRequestFormsPermission.mockResolvedValue({
      error: new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 })
    });
    const response = await GET();
    expect(response.status).toBe(403);
  });

  it("allows FO-effective managers", async () => {
    requireFacilityRequestFormsPermission.mockResolvedValue({
      supabase: {},
      organizationId: "org_1",
      user: { id: "mgr_1" }
    });
    const response = await GET();
    expect(response.status).toBe(200);
  });
});
