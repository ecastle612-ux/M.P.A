import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextResponse } from "next/server";
import { FacilityConflictError } from "../../../../lib/facility/asset-service";
import type * as AssetServiceModule from "../../../../lib/facility/asset-service";

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

const createAsset = vi.fn();

vi.mock("../../../../lib/facility/authz", () => ({
  requireFacilityAssetPermission: async () => authz.result
}));

vi.mock("../../../../lib/facility/asset-service", async () => {
  const actual = (await vi.importActual(
    "../../../../lib/facility/asset-service"
  )) as typeof AssetServiceModule;
  return {
    ...actual,
    createFacilityAsset: (...args: unknown[]) => createAsset(...args),
    listFacilityAssets: async () => []
  };
});

vi.mock("../../../../lib/property/property-catalog", () => ({
  listPortfolioProperties: async () => []
}));

vi.mock("../../../../lib/maintenance/maintenance-service", () => ({
  listVendors: async () => []
}));

import { POST } from "./route";

const SITE = "11111111-1111-4111-8111-111111111111";

function createRequest(body: unknown) {
  return new Request("http://localhost/api/facility/assets", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });
}

describe("POST /api/facility/assets", () => {
  beforeEach(() => {
    createAsset.mockReset();
    authz.result = {
      supabase: {},
      organizationId: "org_1",
      user: { id: "user_1" },
      roles: ["organization_admin"]
    };
  });

  it("returns 201 with the created asset from insert().select()", async () => {
    createAsset.mockResolvedValue({
      id: "asset_1",
      name: "Rooftop AHU-2",
      asset_code: "AHU-2"
    });
    const response = await POST(
      createRequest({
        name: "Rooftop AHU-2",
        assetType: "hvac",
        assetCode: "AHU-2",
        propertyPropertyId: SITE
      })
    );
    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({
      asset: { id: "asset_1", name: "Rooftop AHU-2", asset_code: "AHU-2" }
    });
  });

  it("maps duplicate asset_code to 409", async () => {
    createAsset.mockRejectedValue(new FacilityConflictError());
    const response = await POST(
      createRequest({
        name: "Rooftop AHU-2",
        assetType: "hvac",
        assetCode: "AHU-2",
        propertyPropertyId: SITE
      })
    );
    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      error: "Asset code already exists for this organization"
    });
  });

  it("returns the authz denial for unauthorized actors", async () => {
    authz.result = { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
    const response = await POST(
      createRequest({
        name: "Rooftop AHU-2",
        assetType: "hvac",
        assetCode: "AHU-2",
        propertyPropertyId: SITE
      })
    );
    expect(response.status).toBe(403);
    expect(createAsset).not.toHaveBeenCalled();
  });
});
