import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextResponse } from "next/server";

const { requireFinance, serviceRole } = vi.hoisted(() => ({
  requireFinance: vi.fn(),
  serviceRole: vi.fn()
}));

vi.mock("../../../../lib/finance/authz", () => ({
  requireFinancePermission: (...args: unknown[]) => requireFinance(...args)
}));

vi.mock("../../../../lib/supabase/service-role", () => ({
  createServiceRoleClient: () => serviceRole()
}));

import { GET, POST } from "./route";

describe("POST /api/finance/connect authorization", () => {
  beforeEach(() => {
    requireFinance.mockReset();
    serviceRole.mockReset();
  });

  it("denies FO / facility-only before service_role", async () => {
    requireFinance.mockResolvedValue({
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 })
    });
    const response = await POST(
      new Request("http://localhost/api/finance/connect", {
        method: "POST",
        body: JSON.stringify({ action: "start" })
      })
    );
    expect(response.status).toBe(403);
    expect(serviceRole).not.toHaveBeenCalled();
  });

  it("GET is denied without pm.finance:read", async () => {
    requireFinance.mockResolvedValue({
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 })
    });
    const response = await GET();
    expect(response.status).toBe(403);
    expect(requireFinance).toHaveBeenCalledWith("pm.finance:read");
  });
});
