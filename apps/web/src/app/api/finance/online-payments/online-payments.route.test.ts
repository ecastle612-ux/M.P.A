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

function forbidden() {
  return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
}

describe("docs/194 /api/finance/online-payments authorization", () => {
  beforeEach(() => {
    requireFinance.mockReset();
    serviceRole.mockReset();
  });

  it("denies FO / unauthorized users before service_role on GET", async () => {
    requireFinance.mockResolvedValue(forbidden());
    const response = await GET();
    expect(response.status).toBe(403);
    expect(requireFinance).toHaveBeenCalledWith("pm.finance:read");
    expect(serviceRole).not.toHaveBeenCalled();
  });

  it("denies unauthorized users before service_role on enable", async () => {
    requireFinance.mockResolvedValue(forbidden());
    const response = await POST(
      new Request("http://localhost/api/finance/online-payments", {
        method: "POST",
        body: JSON.stringify({ action: "enable" })
      })
    );
    expect(response.status).toBe(403);
    expect(requireFinance).toHaveBeenCalledWith("pm.finance:settings.manage");
    expect(serviceRole).not.toHaveBeenCalled();
  });
});
