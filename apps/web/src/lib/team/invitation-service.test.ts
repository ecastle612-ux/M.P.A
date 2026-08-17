import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  acceptInvitation,
  createAndSendInvitation,
  InvitationAcceptanceError,
  InvitationCreateError,
  invitationEmailNotice,
  resendInvitationEmail
} from "./invitation-service";

type Row = Record<string, unknown>;

function createMemoryDb() {
  const tables = {
    organization_invitations: [] as Row[],
    organization_memberships: [] as Row[],
    organization_operating_scope_events: [] as Row[],
    organization_subscriptions: [] as Row[],
    organization_setup_state: [] as Row[],
    event_domain_events: [] as Row[],
    audit_events: [] as Row[],
    organizations: [] as Row[]
  };

  function matches(row: Row, filters: Array<[string, unknown]>): boolean {
    return filters.every(([column, value]) => row[column] === value);
  }

  function from(table: string) {
    const filters: Array<[string, unknown]> = [];
    let action: "select" | "insert" | "update" = "select";
    let payload: Row | null = null;

    const execute = (): { data: Row[] | Row | null; error: { code?: string; message: string } | null } => {
      const rows = tables[table as keyof typeof tables] ?? [];
      if (action === "insert" && payload) {
        const inserted = payload;
        if (table === "organization_invitations") {
          const conflict = rows.some(
            (row) =>
              row["organization_id"] === inserted["organization_id"] &&
              String(row["email"]).toLowerCase() === String(inserted["email"]).toLowerCase() &&
              row["status"] === "pending"
          );
          if (conflict) {
            return {
              data: null,
              error: { code: "23505", message: "organization_invitations_pending_email_org_uidx" }
            };
          }
        }
        if (table === "organization_memberships") {
          const conflict = rows.some(
            (row) => row["organization_id"] === inserted["organization_id"] && row["user_id"] === inserted["user_id"]
          );
          if (conflict) {
            return {
              data: null,
              error: { code: "23505", message: "organization_memberships_organization_id_user_id_key" }
            };
          }
        }
        if (table === "organization_operating_scope_events") {
          const conflict = rows.some(
            (row) =>
              row["invitation_id"] === inserted["invitation_id"] &&
              row["reason"] === "invitation.accepted" &&
              inserted["reason"] === "invitation.accepted"
          );
          if (conflict) {
            return {
              data: null,
              error: { code: "23505", message: "organization_operating_scope_events_invitation_accepted_uidx" }
            };
          }
        }
        const row: Row = {
          id: (inserted["id"] as string | undefined) ?? `${table}-${rows.length + 1}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          status: table === "organization_invitations" ? "pending" : inserted["status"],
          token: (inserted["token"] as string | undefined) ?? "11111111-1111-4111-8111-111111111111",
          expires_at:
            (inserted["expires_at"] as string | undefined) ??
            new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          ...inserted
        };
        rows.push(row);
        return { data: [row], error: null };
      }
      if (action === "update" && payload) {
        const updated: Row[] = [];
        for (const row of rows) {
          if (matches(row, filters)) {
            Object.assign(row, payload, { updated_at: new Date().toISOString() });
            updated.push(row);
          }
        }
        return { data: updated, error: null };
      }
      return { data: rows.filter((row) => matches(row, filters)), error: null };
    };

    const builder = {
      select: () => builder,
      insert: (row: Row) => {
        action = "insert";
        payload = row;
        return builder;
      },
      update: (row: Row) => {
        action = "update";
        payload = row;
        return builder;
      },
      eq: (column: string, value: unknown) => {
        filters.push([column, value]);
        return builder;
      },
      order: () => builder,
      maybeSingle: async () => {
        const result = execute();
        if (result.error) {
          return { data: null, error: result.error };
        }
        const rows = (result.data as Row[]) ?? [];
        return { data: rows[0] ?? null, error: null };
      },
      single: async () => {
        const result = execute();
        if (result.error) {
          return { data: null, error: result.error };
        }
        const rows = (result.data as Row[]) ?? [];
        if (!rows[0]) {
          return { data: null, error: { message: "not found" } };
        }
        return { data: rows[0], error: null };
      },
      then: (onfulfilled: (value: { data: Row[]; error: null }) => unknown, onrejected?: (reason: unknown) => unknown) => {
        const result = execute();
        if (result.error) {
          return Promise.resolve({ data: [], error: result.error }).then(onfulfilled as never, onrejected);
        }
        return Promise.resolve({ data: (result.data as Row[]) ?? [], error: null }).then(onfulfilled, onrejected);
      }
    };
    return builder;
  }

  return {
    tables,
    client: { from }
  };
}

const sendEmail = vi.fn(
  async (input?: Record<string, unknown>): Promise<
    { ok: true; providerId: string } | { ok: false; error: string }
  > => {
    void input;
    return { ok: true, providerId: "re_test" };
  }
);

describe("docs/135 invitation transport and acceptance", () => {
  const originalKey = process.env["RESEND_API_KEY"];
  const originalFrom = process.env["RESEND_FROM_EMAIL"];
  const originalAppUrl = process.env["NEXT_PUBLIC_APP_URL"];
  const originalVercel = process.env["VERCEL_ENV"];

  beforeEach(() => {
    sendEmail.mockClear();
    delete process.env["RESEND_API_KEY"];
    delete process.env["RESEND_FROM_EMAIL"];
    delete process.env["VERCEL_ENV"];
  });

  afterEach(() => {
    restoreEnv("RESEND_API_KEY", originalKey);
    restoreEnv("RESEND_FROM_EMAIL", originalFrom);
    restoreEnv("NEXT_PUBLIC_APP_URL", originalAppUrl);
    restoreEnv("VERCEL_ENV", originalVercel);
  });

  it("creates Complete Property and Facility invitations with delivery_status pending when no Resend key", async () => {
    const db = createMemoryDb();
    const property = await createAndSendInvitation({
      supabase: db.client as never,
      organizationId: "org-complete",
      actorId: "erick",
      email: "sarah@example.com",
      roles: ["property_manager"],
      organizationName: "Clinic",
      operatingScope: "property_operations",
      sendEmail
    });
    expect(property.deliveryStatus).toBe("pending");
    expect(property.emailStatus).toBe("skipped");
    expect(property.invitation["delivery_status"]).toBe("pending");
    expect(property.invitation["operating_scope"]).toBe("property_operations");
    expect(sendEmail).not.toHaveBeenCalled();

    const facility = await createAndSendInvitation({
      supabase: db.client as never,
      organizationId: "org-complete",
      actorId: "erick",
      email: "mike@example.com",
      roles: ["property_manager"],
      organizationName: "Clinic",
      operatingScope: "facility_operations",
      sendEmail
    });
    expect(facility.invitation["operating_scope"]).toBe("facility_operations");
    expect(facility.deliveryStatus).toBe("pending");
  });

  it("uses the verified-domain from in production instead of onboarding@resend.dev", async () => {
    process.env["RESEND_API_KEY"] = "re_test_key";
    process.env["VERCEL_ENV"] = "production";
    process.env["NEXT_PUBLIC_APP_URL"] = "https://www.my-property-assistant.com";
    const db = createMemoryDb();
    const created = await createAndSendInvitation({
      supabase: db.client as never,
      organizationId: "org-complete",
      actorId: "erick",
      email: "uat.invite@example.com",
      roles: ["property_manager"],
      organizationName: "Clinic",
      operatingScope: "property_operations",
      sendEmail
    });
    expect(sendEmail).toHaveBeenCalledTimes(1);
    expect(sendEmail.mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({
        from: "My Property Assistant <noreply@my-property-assistant.com>",
        to: "uat.invite@example.com",
        idempotencyKey: `invitation:${created.invitation["id"] as string}`
      })
    );
    expect(created.deliveryStatus).toBe("sent");
  });

  it("does not claim sent when the provider rejects the send", async () => {
    process.env["RESEND_API_KEY"] = "re_test_key";
    sendEmail.mockResolvedValueOnce({ ok: false as const, error: "You can only send testing emails to your own email address" });
    const db = createMemoryDb();
    const created = await createAndSendInvitation({
      supabase: db.client as never,
      organizationId: "org-complete",
      actorId: "erick",
      email: "uat.invite@example.com",
      roles: ["property_manager"],
      organizationName: "Clinic",
      operatingScope: "property_operations",
      sendEmail
    });
    expect(created.deliveryStatus).toBe("failed");
    expect(created.emailStatus).toBe("failed");
    expect(created.invitation["delivery_status"]).toBe("failed");
    expect(created.invitation["last_delivered_at"]).toBeNull();
  });

  it("creates Complete Both invitations and records sent transport when the provider accepts", async () => {
    process.env["RESEND_API_KEY"] = "re_test_key";
    const db = createMemoryDb();
    const both = await createAndSendInvitation({
      supabase: db.client as never,
      organizationId: "org-complete",
      actorId: "erick",
      email: "generalist@example.com",
      roles: ["property_manager"],
      organizationName: "Clinic",
      operatingScope: "both",
      sendEmail
    });
    expect(sendEmail).toHaveBeenCalledTimes(1);
    expect(both.deliveryStatus).toBe("sent");
    expect(both.emailStatus).toBe("sent");
    expect(both.invitation["last_delivered_at"]).toBeTruthy();
    expect(invitationEmailNotice("sent", false)).toBe("sent");
  });

  it("creates single-product PM and FO invitations with implied scopes", async () => {
    const db = createMemoryDb();
    const pm = await createAndSendInvitation({
      supabase: db.client as never,
      organizationId: "org-pm",
      actorId: "admin",
      email: "pm.staff@example.com",
      roles: ["property_manager"],
      organizationName: "PM Org",
      operatingScope: "property_operations",
      sendEmail
    });
    const fo = await createAndSendInvitation({
      supabase: db.client as never,
      organizationId: "org-fo",
      actorId: "admin",
      email: "fo.staff@example.com",
      roles: ["property_manager"],
      organizationName: "FO Org",
      operatingScope: "facility_operations",
      sendEmail
    });
    expect(pm.invitation["operating_scope"]).toBe("property_operations");
    expect(fo.invitation["operating_scope"]).toBe("facility_operations");
  });

  it("rejects a second pending invitation for the same email", async () => {
    const db = createMemoryDb();
    await createAndSendInvitation({
      supabase: db.client as never,
      organizationId: "org-complete",
      actorId: "erick",
      email: "sarah@example.com",
      roles: ["property_manager"],
      organizationName: "Clinic",
      operatingScope: "property_operations",
      sendEmail
    });
    await expect(
      createAndSendInvitation({
        supabase: db.client as never,
        organizationId: "org-complete",
        actorId: "erick",
        email: "sarah@example.com",
        roles: ["property_manager"],
        organizationName: "Clinic",
        operatingScope: "property_operations",
        sendEmail
      })
    ).rejects.toMatchObject({ status: 409 });
  });

  it("support resend uses the invitation sender and writes delivery_status", async () => {
    process.env["RESEND_API_KEY"] = "re_test_key";
    const db = createMemoryDb();
    const created = await createAndSendInvitation({
      supabase: db.client as never,
      organizationId: "org-complete",
      actorId: "erick",
      email: "sarah@example.com",
      roles: ["property_manager"],
      organizationName: "Clinic",
      operatingScope: "property_operations",
      sendEmail
    });
    sendEmail.mockClear();
    const resent = await resendInvitationEmail({
      supabase: db.client as never,
      invitationId: created.invitation["id"] as string,
      actorId: "support",
      sendEmail
    });
    expect(sendEmail).toHaveBeenCalledTimes(1);
    expect(resent.deliveryStatus).toBe("sent");
    expect(resent.emailStatus).toBe("sent");
  });

  it("acceptance copies persisted role and operating_scope and records one accepted event", async () => {
    const db = createMemoryDb();
    db.tables["organization_subscriptions"].push({
      organization_id: "org-complete",
      sku_code: "mpa_complete_platform",
      status: "active"
    });
    const created = await createAndSendInvitation({
      supabase: db.client as never,
      organizationId: "org-complete",
      actorId: "erick",
      email: "sarah@example.com",
      roles: ["property_manager"],
      organizationName: "Clinic",
      operatingScope: "property_operations",
      sendEmail
    });

    const result = await acceptInvitation({
      supabase: db.client as never,
      token: created.invitation["token"] as string,
      userId: "sarah-user",
      userEmail: "sarah@example.com"
    });

    expect(result.roles).toEqual(["property_manager"]);
    expect(result.operatingScope).toBe("property_operations");
    expect(result.idempotent).toBe(false);
    expect(db.tables["organization_memberships"]).toHaveLength(1);
    expect(db.tables["organization_memberships"][0]?.["operating_scope"]).toBe("property_operations");
    expect(db.tables["organization_invitations"][0]?.["status"]).toBe("accepted");
    expect(
      db.tables["organization_operating_scope_events"].filter((row) => row["reason"] === "invitation.accepted")
    ).toHaveLength(1);
  });

  it("denies wrong-email, expired, and revoked acceptance", async () => {
    const db = createMemoryDb();
    const created = await createAndSendInvitation({
      supabase: db.client as never,
      organizationId: "org-complete",
      actorId: "erick",
      email: "sarah@example.com",
      roles: ["property_manager"],
      organizationName: "Clinic",
      operatingScope: "property_operations",
      sendEmail
    });
    const token = created.invitation["token"] as string;

    await expect(
      acceptInvitation({
        supabase: db.client as never,
        token,
        userId: "other",
        userEmail: "other@example.com"
      })
    ).rejects.toBeInstanceOf(InvitationAcceptanceError);

    db.tables["organization_invitations"][0]!["expires_at"] = new Date(Date.now() - 1000).toISOString();
    await expect(
      acceptInvitation({
        supabase: db.client as never,
        token,
        userId: "sarah-user",
        userEmail: "sarah@example.com"
      })
    ).rejects.toMatchObject({ status: 410 });

    db.tables["organization_invitations"][0]!["expires_at"] = new Date(Date.now() + 86400000).toISOString();
    db.tables["organization_invitations"][0]!["status"] = "revoked";
    await expect(
      acceptInvitation({
        supabase: db.client as never,
        token,
        userId: "sarah-user",
        userEmail: "sarah@example.com"
      })
    ).rejects.toMatchObject({ status: 409 });
  });

  it("already-accepted retry is idempotent and creates no duplicate membership or event", async () => {
    const db = createMemoryDb();
    db.tables["organization_subscriptions"].push({
      organization_id: "org-complete",
      sku_code: "mpa_complete_platform",
      status: "active"
    });
    const created = await createAndSendInvitation({
      supabase: db.client as never,
      organizationId: "org-complete",
      actorId: "erick",
      email: "sarah@example.com",
      roles: ["property_manager"],
      organizationName: "Clinic",
      operatingScope: "property_operations",
      sendEmail
    });
    const token = created.invitation["token"] as string;
    await acceptInvitation({
      supabase: db.client as never,
      token,
      userId: "sarah-user",
      userEmail: "sarah@example.com"
    });
    const retry = await acceptInvitation({
      supabase: db.client as never,
      token,
      userId: "sarah-user",
      userEmail: "sarah@example.com"
    });
    expect(retry.idempotent).toBe(true);
    expect(db.tables["organization_memberships"]).toHaveLength(1);
    expect(
      db.tables["organization_operating_scope_events"].filter((row) => row["reason"] === "invitation.accepted")
    ).toHaveLength(1);
  });

  it("concurrent second accept after membership insert does not duplicate membership", async () => {
    const db = createMemoryDb();
    db.tables["organization_subscriptions"].push({
      organization_id: "org-complete",
      sku_code: "mpa_complete_platform",
      status: "active"
    });
    const created = await createAndSendInvitation({
      supabase: db.client as never,
      organizationId: "org-complete",
      actorId: "erick",
      email: "sarah@example.com",
      roles: ["property_manager"],
      organizationName: "Clinic",
      operatingScope: "property_operations",
      sendEmail
    });
    const first = acceptInvitation({
      supabase: db.client as never,
      token: created.invitation["token"] as string,
      userId: "sarah-user",
      userEmail: "sarah@example.com"
    });
    const second = acceptInvitation({
      supabase: db.client as never,
      token: created.invitation["token"] as string,
      userId: "sarah-user",
      userEmail: "sarah@example.com"
    });
    const results = await Promise.all([first, second]);
    expect(results.every((result) => result.organizationId === "org-complete")).toBe(true);
    expect(db.tables["organization_memberships"]).toHaveLength(1);
    expect(
      db.tables["organization_operating_scope_events"].filter((row) => row["reason"] === "invitation.accepted")
    ).toHaveLength(1);
  });

  it("does not overwrite an existing last BOTH admin into an unsafe scope", async () => {
    const db = createMemoryDb();
    db.tables["organization_subscriptions"].push({
      organization_id: "org-complete",
      sku_code: "mpa_complete_platform",
      status: "active"
    });
    db.tables["organization_memberships"].push({
      id: "mem-erick",
      organization_id: "org-complete",
      user_id: "erick-user",
      roles: ["organization_admin"],
      status: "active",
      operating_scope: "both"
    });
    db.tables["organization_invitations"].push({
      id: "inv-narrow",
      organization_id: "org-complete",
      email: "erick@example.com",
      roles: ["property_manager"],
      status: "pending",
      token: "22222222-2222-4222-8222-222222222222",
      expires_at: new Date(Date.now() + 86400000).toISOString(),
      operating_scope: "property_operations",
      invited_by: "other"
    });

    await expect(
      acceptInvitation({
        supabase: db.client as never,
        token: "22222222-2222-4222-8222-222222222222",
        userId: "erick-user",
        userEmail: "erick@example.com"
      })
    ).rejects.toMatchObject({ status: 409 });
    expect(db.tables["organization_memberships"][0]?.["roles"]).toEqual(["organization_admin"]);
    expect(db.tables["organization_memberships"][0]?.["operating_scope"]).toBe("both");
    expect(db.tables["organization_invitations"][0]?.["status"]).toBe("pending");
  });

  it("create does not write email_status columns", async () => {
    const db = createMemoryDb();
    await createAndSendInvitation({
      supabase: db.client as never,
      organizationId: "org-complete",
      actorId: "erick",
      email: "sarah@example.com",
      roles: ["property_manager"],
      organizationName: "Clinic",
      operatingScope: "property_operations",
      sendEmail
    });
    const row = db.tables["organization_invitations"][0];
    expect(row).not.toHaveProperty("email_status");
    expect(row).toHaveProperty("delivery_status");
  });
});

function restoreEnv(name: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[name];
  } else {
    process.env[name] = value;
  }
}

describe("InvitationCreateError", () => {
  it("carries a status", () => {
    expect(new InvitationCreateError("duplicate", 409).status).toBe(409);
  });
});
