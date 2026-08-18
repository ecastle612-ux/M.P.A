import { beforeEach, describe, expect, it, vi } from "vitest";
import { wendyFurnitureFormSnapshot } from "@mpa/shared";

const createFacilityWorkOrder = vi.fn();
const notifyLifecycle = vi.fn();
const writeMaintenanceAudit = vi.fn();
const sendOperationalNoticeEmail = vi.fn();

vi.mock("../maintenance/maintenance-service", () => ({
  createFacilityWorkOrder: (...args: unknown[]) => createFacilityWorkOrder(...args)
}));
vi.mock("../maintenance/lifecycle-notify", () => ({
  notifyLifecycle: (...args: unknown[]) => notifyLifecycle(...args)
}));
vi.mock("../maintenance/events-audit", () => ({
  writeMaintenanceAudit: (...args: unknown[]) => writeMaintenanceAudit(...args)
}));
vi.mock("../communications/email", () => ({
  sendOperationalNoticeEmail: (...args: unknown[]) => sendOperationalNoticeEmail(...args)
}));

import { resolvePublicIntake, submitPublicRequest } from "./public-request-service";
import { generateFacilityRequestToken, hashFacilityRequestToken } from "./request-token";

type Row = Record<string, unknown>;

function tableStore() {
  const rows: Record<string, Row[]> = {
    facility_request_intakes: [],
    facility_request_forms: [],
    facility_request_form_versions: [],
    facility_request_submissions: [],
    facility_request_number_counters: [],
    organizations: [{ id: "org_1", name: "Main Clinic" }],
    property_properties: [{ id: "11111111-1111-4111-8111-111111111111", name: "Main Clinic", organization_id: "org_1" }],
    organization_memberships: [
      { user_id: "mgr_1", roles: ["property_manager"], operating_scope: "facility_operations", status: "active", organization_id: "org_1" }
    ],
    maintenance_work_orders: [],
    media_attachments: []
  };

  function from(table: string) {
    const api = {
      select: () => api,
      insert: (value: Row | Row[]) => {
        const incoming = Array.isArray(value) ? value : [value];
        const created = incoming.map((item, index) => ({
          id: `${table}_${(rows[table]?.length ?? 0) + index}`,
          ...item
        }));
        rows[table] = [...(rows[table] ?? []), ...created];
        const row = created[0] ?? {};
        return {
          select: () => ({
            single: async () => ({ data: row, error: null }),
            maybeSingle: async () => ({ data: row, error: null })
          })
        };
      },
      update: (value: Row) => ({
        eq: () => ({
          eq: () => ({
            maybeSingle: async () => ({ data: { ...value }, error: null }),
            select: () => ({ single: async () => ({ data: { ...value }, error: null }) }),
            in: async () => ({ error: null })
          }),
          maybeSingle: async () => ({ data: { ...value }, error: null }),
          in: async () => ({ error: null })
        })
      }),
      eq: (col: string, val: unknown) => {
        const matches = (rows[table] ?? []).filter((row) => row[col] === val);
        const second = (col2: string, val2: unknown) => {
          const nested = matches.filter((row) => row[col2] === val2);
          const result = {
            data: nested,
            error: null,
            maybeSingle: async () => ({ data: nested[0] ?? null, error: null }),
            eq: (col3: string, val3: unknown) => ({
              maybeSingle: async () => ({
                data: nested.find((row) => row[col3] === val3) ?? null,
                error: null
              })
            }),
            then: (resolve: (value: { data: Row[]; error: null }) => unknown) =>
              resolve({ data: nested, error: null })
          };
          return result;
        };
        return {
          eq: second,
          maybeSingle: async () => ({ data: matches[0] ?? null, error: null }),
          order: () => Promise.resolve({ data: matches, error: null })
        };
      },
      order: () => Promise.resolve({ data: rows[table] ?? [], error: null })
    };
    return api;
  }

  return { from, rows };
}

describe("public request service", () => {
  const token = generateFacilityRequestToken();
  const version = {
    id: "ver_1",
    field_snapshot: wendyFurnitureFormSnapshot(),
    published_at: "2026-08-18T00:00:00.000Z"
  };

  beforeEach(() => {
    createFacilityWorkOrder.mockReset();
    notifyLifecycle.mockReset();
    writeMaintenanceAudit.mockReset();
    sendOperationalNoticeEmail.mockReset();
    createFacilityWorkOrder.mockResolvedValue({
      id: "wo_1",
      submitted_at: "2026-08-18T12:00:00.000Z"
    });
    notifyLifecycle.mockResolvedValue({ inApp: true, notificationId: "n1", emailStatus: "sent" });
    writeMaintenanceAudit.mockResolvedValue(undefined);
  });

  it("resolves an active token and hides revoked/inactive forms", async () => {
    const db = tableStore();
    db.rows["facility_request_intakes"]!.push({
      id: "in_1",
      organization_id: "org_1",
      form_id: "form_1",
      status: "active",
      public_token_hash: hashFacilityRequestToken(token),
      context_json: { floorLabel: "3", propertyId: "11111111-1111-4111-8111-111111111111", propertyLabel: "Main Clinic" }
    });
    db.rows["facility_request_forms"]!.push({
      id: "form_1",
      name: "Furniture / Maintenance Request",
      instructions: "Scan and tell us what broke.",
      status: "active",
      access_policy: "contact_required",
      current_version_id: "ver_1",
      property_id: null,
      organization_id: "org_1"
    });
    db.rows["facility_request_form_versions"]!.push(version);

    const resolved = await resolvePublicIntake(db as never, token);
    expect(resolved.ok).toBe(true);
    if (!resolved.ok) return;
    expect(resolved.portal.lockedContext.floorLabel).toBe("3");
    expect(resolved.organizationId).toBe("org_1");

    db.rows["facility_request_intakes"]![0]!["status"] = "revoked";
    const revoked = await resolvePublicIntake(db as never, token);
    expect(revoked.ok).toBe(false);
  });

  it("creates one facility work order for Wendy without a second convert step", async () => {
    const db = tableStore();
    db.rows["facility_request_intakes"]!.push({
      id: "in_1",
      organization_id: "org_1",
      form_id: "form_1",
      status: "active",
      public_token_hash: hashFacilityRequestToken(token),
      context_json: { floorLabel: "3", propertyId: "11111111-1111-4111-8111-111111111111", propertyLabel: "Main Clinic" }
    });
    db.rows["facility_request_forms"]!.push({
      id: "form_1",
      name: "Furniture / Maintenance Request",
      instructions: null,
      status: "active",
      access_policy: "contact_required",
      current_version_id: "ver_1",
      property_id: null,
      organization_id: "org_1",
      created_by_user_id: "mgr_1"
    });
    db.rows["facility_request_form_versions"]!.push(version);

    const result = await submitPublicRequest(db as never, {
      token,
      via: "qr",
      values: {
        floor: "3",
        department: "Cardiology",
        requester_name: "Wendy",
        issue_title: "Chair arm is broken",
        issue_description: "Chair arm is broken",
        requester_email: "wendy@clinic.test"
      },
      attachments: [{ kind: "image", mimeType: "image/jpeg", fileSize: 1200, mediaId: "media_1" }],
      idempotencyKey: "idem-wendy-1",
      origin: "https://www.my-property-assistant.com"
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.requestNumber).toMatch(/^FR-2026-\d{5}$/);
    expect(result.source).toBe("qr");
    expect(createFacilityWorkOrder).toHaveBeenCalledTimes(1);
    const woArgs = createFacilityWorkOrder.mock.calls[0];
    expect(woArgs?.[1]).toBe("org_1");
    expect(woArgs?.[3]).toMatchObject({ title: "Chair arm is broken" });
    expect(woArgs?.[4]).toMatchObject({
      intakeChannel: "qr",
      createdByUserId: "mgr_1",
      floorLabel: "3",
      departmentLabel: "Cardiology"
    });
    expect(notifyLifecycle).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ key: "work_order.public_submitted" })
    );
    expect(db.rows["facility_request_submissions"]).toHaveLength(1);
  });

  it("rejects a superseded form version", async () => {
    const db = tableStore();
    db.rows["facility_request_intakes"]!.push({
      id: "in_1",
      organization_id: "org_1",
      form_id: "form_1",
      status: "active",
      public_token_hash: hashFacilityRequestToken(token),
      context_json: { floorLabel: "3", propertyId: "11111111-1111-4111-8111-111111111111" }
    });
    db.rows["facility_request_forms"]!.push({
      id: "form_1",
      name: "Furniture",
      instructions: null,
      status: "active",
      access_policy: "contact_required",
      current_version_id: "ver_1",
      property_id: null,
      organization_id: "org_1"
    });
    db.rows["facility_request_form_versions"]!.push(version);
    const result = await submitPublicRequest(db as never, {
      token,
      via: "qr",
      values: {
        floor: "3",
        department: "Cardiology",
        requester_name: "Wendy",
        issue_title: "Chair arm is broken",
        issue_description: "Chair arm is broken"
      },
      attachments: [{ kind: "image", mimeType: "image/jpeg", fileSize: 1200 }],
      idempotencyKey: "idem-2",
      expectedVersionId: "ver_old",
      origin: "https://www.my-property-assistant.com"
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.status).toBe(409);
    expect(createFacilityWorkOrder).not.toHaveBeenCalled();
  });

  it("requires a signed-in actor for authenticated-only forms", async () => {
    const db = tableStore();
    db.rows["facility_request_intakes"]!.push({
      id: "in_1",
      organization_id: "org_1",
      form_id: "form_1",
      status: "active",
      public_token_hash: hashFacilityRequestToken(token),
      context_json: { propertyId: "11111111-1111-4111-8111-111111111111", propertyLabel: "Main Clinic" }
    });
    db.rows["facility_request_forms"]!.push({
      id: "form_1",
      name: "Staff only",
      instructions: null,
      status: "active",
      access_policy: "authenticated_only",
      current_version_id: "ver_1",
      property_id: null,
      organization_id: "org_1"
    });
    db.rows["facility_request_form_versions"]!.push(version);
    const denied = await submitPublicRequest(db as never, {
      token,
      via: "link",
      values: {
        floor: "3",
        department: "Cardiology",
        requester_name: "Wendy",
        issue_title: "Chair arm is broken",
        issue_description: "Chair arm is broken"
      },
      attachments: [{ kind: "image", mimeType: "image/jpeg", fileSize: 1200 }],
      idempotencyKey: "idem-auth",
      origin: "https://www.my-property-assistant.com"
    });
    expect(denied.ok).toBe(false);
    if (denied.ok) return;
    expect(denied.status).toBe(401);
  });
});
