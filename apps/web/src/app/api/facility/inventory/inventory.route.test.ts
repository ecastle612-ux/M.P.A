import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextResponse } from "next/server";

const authz = {
  result: {
    supabase: {},
    organizationId: "org_1",
    user: { id: "user_1" },
    roles: ["organization_admin"]
  } as
    | {
        supabase: object;
        organizationId: string;
        user: { id: string };
        roles: string[];
      }
    | { error: NextResponse }
};

const createItem = vi.fn();

vi.mock("../../../../lib/facility/authz", () => ({
  requireFacilityInventoryPermission: async () => authz.result
}));

vi.mock("../../../../lib/facility/inventory-service", () => ({
  createFacilityStockItem: (...args: unknown[]) => createItem(...args),
  decorateStockItem: (item: Record<string, unknown>) => ({ ...item, low_stock: false }),
  listFacilityStockItems: async () => []
}));

vi.mock("../../../../lib/property/property-catalog", () => ({
  listPortfolioProperties: async () => []
}));

vi.mock("../../../../lib/maintenance/maintenance-service", () => ({
  listVendors: async () => []
}));

import { POST } from "./route";

const SITE = "11111111-1111-4111-8111-111111111111";

function createRequest(body: unknown) {
  return new Request("http://localhost/api/facility/inventory", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });
}

describe("POST /api/facility/inventory", () => {
  beforeEach(() => {
    createItem.mockReset();
    authz.result = {
      supabase: {},
      organizationId: "org_1",
      user: { id: "user_1" },
      roles: ["organization_admin"]
    };
  });

  it("returns 201 with the created stock item from insert().select()", async () => {
    createItem.mockResolvedValue({
      id: "item_1",
      name: "MERV-13 filter",
      quantity_on_hand: 0
    });
    const response = await POST(
      createRequest({
        name: "MERV-13 filter",
        category: "filters",
        unitOfMeasure: "each",
        propertyPropertyId: SITE,
        storageLocationLabel: "Boiler room cage"
      })
    );
    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({
      item: { id: "item_1", name: "MERV-13 filter", quantity_on_hand: 0, low_stock: false }
    });
  });

  it("returns the authz denial for unauthorized actors", async () => {
    authz.result = { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
    const response = await POST(
      createRequest({
        name: "MERV-13 filter",
        category: "filters",
        unitOfMeasure: "each",
        propertyPropertyId: SITE,
        storageLocationLabel: "Boiler room cage"
      })
    );
    expect(response.status).toBe(403);
    expect(createItem).not.toHaveBeenCalled();
  });
});
