import { beforeEach, describe, expect, it, vi } from "vitest";

const createRequestIntake = vi.fn();
const revokeRequestIntake = vi.fn();
const getFacilityAsset = vi.fn();
const buildPublicRequestQrSvg = vi.fn();
const writeMaintenanceAudit = vi.fn();

vi.mock("./request-form-service", () => ({
  createRequestIntake: (...args: unknown[]) => createRequestIntake(...args),
  revokeRequestIntake: (...args: unknown[]) => revokeRequestIntake(...args)
}));

vi.mock("./asset-service", () => ({
  getFacilityAsset: (...args: unknown[]) => getFacilityAsset(...args)
}));

vi.mock("./public-request-qr", () => ({
  assertSafePublicRequestUrl: () => ({ ok: true }),
  buildPublicRequestQrSvg: (...args: unknown[]) => buildPublicRequestQrSvg(...args),
  publicRequestAbsoluteUrl: (origin: string, token: string, via: string) =>
    `${origin}/request/${token}?via=${via}`
}));

vi.mock("../maintenance/events-audit", () => ({
  writeMaintenanceAudit: (...args: unknown[]) => writeMaintenanceAudit(...args)
}));

import { buildAssetLabelSvg, createFacilityAssetQr, revokeFacilityAssetQr } from "./asset-qr-service";

const CHAIR = {
  id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  name: "Exam Chair 14",
  asset_code: "AST-000214",
  status: "active",
  property_property_id: "11111111-1111-4111-8111-111111111111",
  property_properties: { name: "North Clinic" },
  floor_label: "3",
  department_label: "Cardiology",
  room_label: "312",
  active_request_intake_id: null as string | null
};

function supabaseStub() {
  return {
    from: (table: string) => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () =>
            table === "organizations"
              ? { data: { name: "North Clinic" }, error: null }
              : { data: null, error: null }
        })
      }),
      update: () => ({
        eq: () => ({
          eq: () => ({
            is: async () => ({ error: null })
          })
        })
      })
    })
  };
}

describe("FO-EFF Slice 3 asset QR", () => {
  beforeEach(() => {
    createRequestIntake.mockReset();
    revokeRequestIntake.mockReset();
    getFacilityAsset.mockReset();
    buildPublicRequestQrSvg.mockReset();
    writeMaintenanceAudit.mockReset();
    getFacilityAsset.mockResolvedValue({ ...CHAIR });
    createRequestIntake.mockResolvedValue({
      intake: {
        id: "intake_new",
        status: "active",
        context_kind: "asset",
        public_token_prefix: "tok_hi",
        form_id: "form_1"
      },
      token: "tok_high_entropy_public_only"
    });
    buildPublicRequestQrSvg.mockResolvedValue(
      '<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"></svg>'
    );
    writeMaintenanceAudit.mockResolvedValue(undefined);
  });

  it("mints a docs/204 asset intake whose public URL contains only the token", async () => {
    const created = await createFacilityAssetQr(
      supabaseStub() as never,
      "org_1",
      "mgr_1",
      CHAIR.id,
      { formId: "11111111-1111-4111-8111-111111111111" },
      "https://www.my-property-assistant.com"
    );
    expect(createRequestIntake).toHaveBeenCalledWith(
      expect.anything(),
      "org_1",
      "mgr_1",
      expect.objectContaining({
        contextKind: "asset",
        context: expect.objectContaining({
          facilityAssetId: CHAIR.id,
          facilityAssetLabel: "Exam Chair 14",
          floorLabel: "3",
          departmentLabel: "Cardiology",
          roomLabel: "312"
        })
      })
    );
    expect(created.linkUrl).toBe(
      "https://www.my-property-assistant.com/request/tok_high_entropy_public_only?via=link"
    );
    expect(created.linkUrl).not.toContain(CHAIR.id);
    expect(created.linkUrl).not.toContain("org_1");
    expect(created.labelSvg).toContain("Exam Chair 14");
    expect(created.labelSvg).toContain("AST-000214");
    expect(created.labelSvg).toContain("Scan to report a problem");
    expect(created.labelSvg).not.toContain(CHAIR.id);
  });

  it("revokes the previous intake instead of retargeting it to another asset", async () => {
    getFacilityAsset.mockResolvedValue({ ...CHAIR, active_request_intake_id: "intake_old" });
    revokeRequestIntake.mockResolvedValue({ id: "intake_old", status: "revoked" });
    await createFacilityAssetQr(
      supabaseStub() as never,
      "org_1",
      "mgr_1",
      CHAIR.id,
      { formId: "11111111-1111-4111-8111-111111111111" },
      "https://www.my-property-assistant.com"
    );
    expect(revokeRequestIntake).toHaveBeenCalledWith(expect.anything(), "org_1", "intake_old");
    expect(createRequestIntake).toHaveBeenCalledTimes(1);
  });

  it("blocks QR minting on retired assets", async () => {
    getFacilityAsset.mockResolvedValue({ ...CHAIR, status: "retired" });
    await expect(
      createFacilityAssetQr(
        supabaseStub() as never,
        "org_1",
        "mgr_1",
        CHAIR.id,
        { formId: "11111111-1111-4111-8111-111111111111" },
        "https://www.my-property-assistant.com"
      )
    ).rejects.toThrow(/Retired assets cannot receive a new public request QR/);
    expect(createRequestIntake).not.toHaveBeenCalled();
  });

  it("deactivates the bound intake without deleting submission history", async () => {
    getFacilityAsset.mockResolvedValue({ ...CHAIR, active_request_intake_id: "intake_old" });
    revokeRequestIntake.mockResolvedValue({ id: "intake_old", status: "revoked" });
    const result = await revokeFacilityAssetQr(supabaseStub() as never, "org_1", "mgr_1", CHAIR.id);
    expect(result).toEqual({ revoked: true });
    expect(revokeRequestIntake).toHaveBeenCalledWith(expect.anything(), "org_1", "intake_old");
  });

  it("prints a grayscale-safe label without internal UUIDs", () => {
    const svg = buildAssetLabelSvg({
      organizationName: "North Clinic",
      assetName: "Exam Chair 14",
      assetCode: "AST-000214",
      qrSvg: '<svg xmlns="http://www.w3.org/2000/svg"><rect width="10" height="10"/></svg>'
    });
    expect(svg).toContain("#111111");
    expect(svg).toContain("#ffffff");
    expect(svg).toContain("M.P.A.");
    expect(svg).toContain("Scan → Describe → Submit");
    expect(svg).not.toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
  });
});
