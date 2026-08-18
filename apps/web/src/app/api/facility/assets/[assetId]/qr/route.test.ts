import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextResponse } from "next/server";

const authz = {
  result:
    {
      supabase: {},
      organizationId: "org_1",
      user: { id: "mgr_1" },
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

const createQr = vi.fn();
const revokeQr = vi.fn();
const getQr = vi.fn();

vi.mock("../../../../../../lib/facility/authz", () => ({
  requireFacilityAssetPermission: async () => authz.result
}));

vi.mock("../../../../../../lib/facility/asset-qr-service", () => ({
  createFacilityAssetQr: (...args: unknown[]) => createQr(...args),
  revokeFacilityAssetQr: (...args: unknown[]) => revokeQr(...args),
  getFacilityAssetQrState: (...args: unknown[]) => getQr(...args)
}));

vi.mock("../../../../../../lib/env/client-env", () => ({
  clientEnv: { NEXT_PUBLIC_APP_URL: "https://www.my-property-assistant.com" }
}));

import { GET, POST } from "./route";

describe("GET/POST /api/facility/assets/[assetId]/qr", () => {
  beforeEach(() => {
    createQr.mockReset();
    revokeQr.mockReset();
    getQr.mockReset();
    authz.result = {
      supabase: {},
      organizationId: "org_1",
      user: { id: "mgr_1" },
      roles: ["organization_admin"]
    };
  });

  it("returns active intake state without a plaintext token", async () => {
    getQr.mockResolvedValue({
      asset: { id: "asset_1" },
      intake: { id: "in_1", status: "active", public_token_prefix: "tok_ab", context_kind: "asset" }
    });
    const response = await GET(new Request("http://localhost/qr"), {
      params: Promise.resolve({ assetId: "asset_1" })
    });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      intake: { id: "in_1", status: "active", public_token_prefix: "tok_ab", context_kind: "asset" },
      hasActiveQr: true
    });
  });

  it("mints a QR for a published form", async () => {
    createQr.mockResolvedValue({
      token: "tok_secret",
      linkUrl: "https://www.my-property-assistant.com/request/tok_secret?via=link"
    });
    const response = await POST(
      new Request("http://localhost/qr", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ formId: "11111111-1111-4111-8111-111111111111" })
      }),
      { params: Promise.resolve({ assetId: "asset_1" }) }
    );
    expect(response.status).toBe(201);
    expect(createQr).toHaveBeenCalledWith(
      expect.anything(),
      "org_1",
      "mgr_1",
      "asset_1",
      { formId: "11111111-1111-4111-8111-111111111111" },
      "https://www.my-property-assistant.com"
    );
  });

  it("revokes the bound intake", async () => {
    revokeQr.mockResolvedValue({ revoked: true });
    const response = await POST(
      new Request("http://localhost/qr", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "revoke" })
      }),
      { params: Promise.resolve({ assetId: "asset_1" }) }
    );
    expect(response.status).toBe(200);
    expect(revokeQr).toHaveBeenCalled();
  });

  it("denies technicians from minting a QR", async () => {
    authz.result = { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
    const response = await POST(
      new Request("http://localhost/qr", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ formId: "11111111-1111-4111-8111-111111111111" })
      }),
      { params: Promise.resolve({ assetId: "asset_1" }) }
    );
    expect(response.status).toBe(403);
    expect(createQr).not.toHaveBeenCalled();
  });
});
