import { beforeEach, describe, expect, it, vi } from "vitest";

const events: Array<{ eventType?: string; action?: string; aggregateType?: string }> = [];

vi.mock("../property/events-audit", () => ({
  emitPropertyEvent: async (args: { eventType: string; aggregateType: string }) => {
    events.push({ eventType: args.eventType, aggregateType: args.aggregateType });
  },
  writePropertyAudit: async (args: { action: string }) => {
    events.push({ action: args.action });
  }
}));

vi.mock("./email", () => ({
  sendOperationalNoticeEmail: async () => ({ ok: true, providerId: "test" })
}));

vi.mock("../media/media-service", () => ({
  attachMediaToEntity: async (input: { mediaIds: string[]; relatedEntityId: string }) => ({
    media: input.mediaIds.map((id) => ({ id, related_entity_id: input.relatedEntityId }))
  }),
  listMediaForEntity: async () => []
}));

type Row = Record<string, unknown>;
const db = {
  property_properties: [] as Row[],
  pm_residents: [] as Row[],
  lease_residents: [] as Row[],
  maintenance_work_orders: [] as Row[],
  comms_conversations: [] as Row[],
  comms_conversation_participants: [] as Row[],
  comms_conversation_messages: [] as Row[],
  comms_message_reads: [] as Row[],
  comms_notifications: [] as Row[],
  user_profiles: [] as Row[],
  property_units: [] as Row[]
};

function matches(row: Row, filters: Array<{ col: string; value: unknown; op: string }>) {
  return filters.every((filter) => {
    if (filter.op === "eq") return row[filter.col] === filter.value;
    if (filter.op === "is") return row[filter.col] == null;
    if (filter.op === "in") return (filter.value as unknown[]).includes(row[filter.col]);
    return true;
  });
}

function makeClient() {
  return {
    from(table: keyof typeof db) {
      const state = {
        filters: [] as Array<{ col: string; value: unknown; op: string }>,
        insertRow: null as Row | null,
        patch: null as Row | null,
        upsertRow: null as Row | null
      };
      const api = {
        select: () => api,
        insert: (payload: Row) => {
          state.insertRow = {
            id: (payload["id"] as string) ?? crypto.randomUUID(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            ...payload
          };
          return api;
        },
        update: (payload: Row) => {
          state.patch = payload;
          return api;
        },
        upsert: (payload: Row) => {
          state.upsertRow = payload;
          return api;
        },
        eq: (col: string, value: unknown) => {
          state.filters.push({ col, value, op: "eq" });
          return api;
        },
        is: (col: string, value: unknown) => {
          state.filters.push({ col, value, op: "is" });
          return api;
        },
        in: (col: string, value: unknown[]) => {
          state.filters.push({ col, value, op: "in" });
          return api;
        },
        not: () => api,
        order: () => api,
        limit: () => api,
        maybeSingle: async () => {
          const row = (db[table] ?? []).find((item) => matches(item, state.filters)) ?? null;
          return { data: row, error: null };
        },
        single: async () => {
          if (state.insertRow) {
            db[table] = db[table] ?? [];
            db[table].push(state.insertRow);
            return { data: state.insertRow, error: null };
          }
          const row = (db[table] ?? []).find((item) => matches(item, state.filters)) ?? null;
          return { data: row, error: row ? null : { message: "missing" } };
        },
        then: (
          resolve: (value: unknown) => void,
          reject: (reason: unknown) => void
        ) => {
          Promise.resolve()
            .then(() => {
              db[table] = db[table] ?? [];
              if (state.insertRow) {
                const already = db[table].some((row) => row["id"] === state.insertRow?.["id"]);
                if (!already) db[table].push(state.insertRow);
                const created = state.insertRow;
                state.insertRow = null;
                return { data: [created], error: null };
              }
              const rows = db[table].filter((item) => matches(item, state.filters));
              if (state.patch) {
                for (const row of rows) Object.assign(row, state.patch);
                const result = rows.map((row) => ({ ...row }));
                state.patch = null;
                return { data: result, error: null };
              }
              if (state.upsertRow) {
                db[table].push({ ...state.upsertRow });
                const upserted = state.upsertRow;
                state.upsertRow = null;
                return { data: [upserted], error: null };
              }
              return { data: rows, error: null };
            })
            .then(resolve, reject);
        }
      };
      return api;
    }
  };
}

import {
  assertCanAccessConversation,
  closeConversation,
  markConversationRead,
  sendConversationMessage,
  startConversation
} from "./conversation-service";

const org = "org_1";
const otherOrg = "org_2";
const staff = "staff_1";
const tenantUser = "tenant_1";
const otherTenant = "tenant_2";

function seed() {
  db.property_properties = [{ id: "prop_1", organization_id: org, name: "Oak" }];
  db.pm_residents = [
    {
      id: "res_1",
      organization_id: org,
      user_id: tenantUser,
      lease_id: "lease_1",
      property_id: "prop_1",
      unit_id: "unit_1",
      display_name: "Ada",
      email: "ada@example.com",
      portal_status: "active"
    },
    {
      id: "res_2",
      organization_id: org,
      user_id: otherTenant,
      lease_id: "lease_2",
      property_id: "prop_1",
      unit_id: "unit_2",
      display_name: "Bea",
      email: "bea@example.com",
      portal_status: "active"
    }
  ];
  db.maintenance_work_orders = [
    {
      id: "wo_1",
      organization_id: org,
      title: "Leak",
      work_surface: "residential",
      resident_id: "res_1",
      property_id: "prop_1"
    },
    {
      id: "wo_fo",
      organization_id: org,
      title: "Boiler",
      work_surface: "facility",
      resident_id: null,
      property_id: "prop_1"
    }
  ];
}

describe("COM-002 conversation lifecycle", () => {
  beforeEach(() => {
    events.length = 0;
    (Object.keys(db) as Array<keyof typeof db>).forEach((key) => {
      db[key] = [];
    });
    seed();
  });

  it("starts a staff conversation, lets the tenant reply, and records receipts", async () => {
    const supabase = makeClient();
    const started = await startConversation(supabase as never, org, staff, {
      tenantAccountId: "res_1",
      body: "Welcome home"
    });
    expect(started.conversation.tenantAccountId).toBe("res_1");
    expect(db.comms_notifications.some((row) => row["user_id"] === tenantUser)).toBe(true);
    expect(events.some((item) => item.eventType === "conversation.started")).toBe(true);
    expect(events.some((item) => item.aggregateType === "property_properties")).toBe(true);

    await markConversationRead(
      supabase as never,
      org,
      tenantUser,
      "tenant",
      started.conversation.id,
      "res_1"
    );
    expect(
      db.comms_notifications.some(
        (row) =>
          row["user_id"] === tenantUser &&
          row["read_at"] != null &&
          row["conversation_id"] === started.conversation.id
      )
    ).toBe(true);

    const replied = await sendConversationMessage(
      supabase as never,
      org,
      tenantUser,
      "tenant",
      started.conversation.id,
      { body: "Thank you", tenantAccountId: "res_1" }
    );
    expect(replied.conversation.status).toBe("open");
    expect(db.comms_notifications.some((row) => row["user_id"] === staff)).toBe(true);

    await markConversationRead(supabase as never, org, staff, "staff", started.conversation.id);
    expect(db.comms_message_reads.length).toBeGreaterThan(0);
    expect(
      db.comms_notifications.some(
        (row) => row["user_id"] === staff && row["read_at"] != null && row["conversation_id"] === started.conversation.id
      )
    ).toBe(true);
  });

  it("reuses an idempotency key instead of creating a second message", async () => {
    const supabase = makeClient();
    const started = await startConversation(supabase as never, org, staff, {
      tenantAccountId: "res_1",
      body: "Welcome home"
    });
    const first = await sendConversationMessage(
      supabase as never,
      org,
      tenantUser,
      "tenant",
      started.conversation.id,
      { body: "Thank you", tenantAccountId: "res_1", idempotencyKey: "send-1" }
    );
    const second = await sendConversationMessage(
      supabase as never,
      org,
      tenantUser,
      "tenant",
      started.conversation.id,
      { body: "Thank you", tenantAccountId: "res_1", idempotencyKey: "send-1" }
    );
    expect(second.messageId).toBe(first.messageId);
    expect(
      db.comms_conversation_messages.filter((row) => row["sender_user_id"] === tenantUser)
    ).toHaveLength(1);
  });

  it("reuses the same conversation for the same tenant and work order", async () => {
    const supabase = makeClient();
    const first = await startConversation(supabase as never, org, staff, {
      tenantAccountId: "res_1",
      body: "About the leak",
      linkedEntityType: "work_order",
      linkedEntityId: "wo_1"
    });
    const second = await startConversation(supabase as never, org, staff, {
      tenantAccountId: "res_1",
      body: "Plumber tomorrow",
      linkedEntityType: "work_order",
      linkedEntityId: "wo_1"
    });
    expect(second.conversation.id).toBe(first.conversation.id);
    expect(db.comms_conversations).toHaveLength(1);
    expect(events.some((item) => item.aggregateType === "maintenance_work_orders")).toBe(true);
  });

  it("closes and reopens on a later send", async () => {
    const supabase = makeClient();
    const started = await startConversation(supabase as never, org, staff, {
      tenantAccountId: "res_1",
      body: "Hello"
    });
    await closeConversation(supabase as never, org, staff, started.conversation.id);
    expect(db.comms_conversations[0]?.["status"]).toBe("closed");
    await sendConversationMessage(supabase as never, org, staff, "staff", started.conversation.id, {
      body: "Reopening"
    });
    expect(db.comms_conversations[0]?.["status"]).toBe("open");
    expect(events.some((item) => item.eventType === "conversation.reopened")).toBe(true);
  });

  it("enforces tenant lease isolation and organization isolation", async () => {
    const supabase = makeClient();
    const started = await startConversation(supabase as never, org, staff, {
      tenantAccountId: "res_1",
      body: "Private"
    });
    await expect(
      sendConversationMessage(supabase as never, org, otherTenant, "tenant", started.conversation.id, {
        body: "Peek",
        tenantAccountId: "res_2"
      })
    ).rejects.toThrow("Forbidden");

    await expect(
      sendConversationMessage(supabase as never, otherOrg, staff, "staff", started.conversation.id, {
        body: "Cross org"
      })
    ).rejects.toThrow(/Forbidden|not found/i);

    expect(() =>
      assertCanAccessConversation(db.comms_conversations[0] as never, {
        organizationId: org,
        plane: "tenant",
        tenantAccountId: "res_2"
      })
    ).toThrow("Forbidden");
  });

  it("rejects facility work-order linking", async () => {
    const supabase = makeClient();
    await expect(
      startConversation(supabase as never, org, staff, {
        tenantAccountId: "res_1",
        body: "Boiler?",
        linkedEntityType: "work_order",
        linkedEntityId: "wo_fo"
      })
    ).rejects.toThrow("Facility work orders");
  });

  it("attaches MEDIA-001 ids to the sent message", async () => {
    const supabase = makeClient();
    const started = await startConversation(supabase as never, org, staff, {
      tenantAccountId: "res_1",
      body: "",
      mediaIds: ["media_1"]
    });
    expect(started.messageId).toBeTruthy();
    expect(events.some((item) => item.eventType === "conversation.attachment.added")).toBe(true);
  });
});
