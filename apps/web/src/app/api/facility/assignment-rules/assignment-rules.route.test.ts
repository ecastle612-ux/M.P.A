import { beforeEach, describe, expect, it, vi } from "vitest";

const requireFacilityRoutingPermission = vi.fn();
const loadAssignmentRulesCatalog = vi.fn();
const listAssignmentEvaluations = vi.fn();

vi.mock("../../../../lib/facility/authz", () => ({
  requireFacilityRoutingPermission: () => requireFacilityRoutingPermission()
}));

vi.mock("../../../../lib/facility/assignment-routing-service", () => ({
  loadAssignmentRulesCatalog: (...args: unknown[]) => loadAssignmentRulesCatalog(...args),
  listAssignmentEvaluations: (...args: unknown[]) => listAssignmentEvaluations(...args),
  createAssignmentRule: vi.fn(),
  FacilityRoutingConflictError: class FacilityRoutingConflictError extends Error {}
}));

import { GET } from "./route";

describe("assignment rules admin API", () => {
  beforeEach(() => {
    requireFacilityRoutingPermission.mockReset();
    loadAssignmentRulesCatalog.mockReset();
    listAssignmentEvaluations.mockReset();
    loadAssignmentRulesCatalog.mockResolvedValue({
      rules: [],
      technicians: [],
      properties: [],
      assets: [],
      forms: [],
      templates: []
    });
    listAssignmentEvaluations.mockResolvedValue([]);
  });

  it("denies technicians and PM-only members at the gate", async () => {
    requireFacilityRoutingPermission.mockResolvedValue({
      error: new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 })
    });
    const response = await GET(new Request("http://localhost/api/facility/assignment-rules"));
    expect(response.status).toBe(403);
  });

  it("allows FO-effective managers", async () => {
    requireFacilityRoutingPermission.mockResolvedValue({
      supabase: {},
      organizationId: "org_1",
      user: { id: "mgr_1" }
    });
    const response = await GET(new Request("http://localhost/api/facility/assignment-rules"));
    expect(response.status).toBe(200);
  });
});
