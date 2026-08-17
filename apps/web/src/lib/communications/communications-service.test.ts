import { beforeEach, describe, expect, it, vi } from "vitest";

const sendOperationalNoticeEmail = vi.fn();

vi.mock("./email", () => ({
  sendOperationalNoticeEmail: (...args: unknown[]) => sendOperationalNoticeEmail(...args)
}));

vi.mock("../property/events-audit", () => ({
  emitPropertyEvent: async () => undefined,
  writePropertyAudit: async () => undefined
}));

import { sendOperationalMessage } from "./communications-service";

type Row = Record<string, unknown>;

function createClient(options?: { recipientEmail?: string | null; recipientUserId?: string | null }) {
  const messages: Row[] = [];
  const notifications: Row[] = [];
  return {
    messages,
    notifications,
    from(table: string) {
      return {
        select: () => {
          const builder = {
            eq: () => builder,
            maybeSingle: async () => {
              if (table === "pm_residents") {
                return {
                  data: {
                    id: "res_1",
                    display_name: "Ada",
                    email: options?.recipientEmail ?? "ada@example.com",
                    user_id: options?.recipientUserId ?? "user_1",
                    property_id: "prop_1"
                  },
                  error: null
                };
              }
              return { data: null, error: null };
            }
          };
          return builder;
        },
        insert: (values: Row) => {
          if (table === "comms_messages") {
            const row = { id: "msg_1", ...values };
            messages.push(row);
            return {
              select: () => ({
                single: async () => ({ data: row, error: null })
              })
            };
          }
          if (table === "comms_notifications") {
            notifications.push(values);
          }
          return {
            select: () => ({
              single: async () => ({ data: values, error: null })
            })
          };
        }
      };
    }
  };
}

describe("operational message delivery honesty", () => {
  beforeEach(() => {
    sendOperationalNoticeEmail.mockReset();
  });

  it("records email_failed when the provider rejects an email channel send", async () => {
    sendOperationalNoticeEmail.mockResolvedValue({
      ok: false,
      error: "Email provider is not configured"
    });
    const client = createClient();
    const result = await sendOperationalMessage(client as never, "org_1", "staff_1", {
      audienceType: "resident",
      subject: "Building notice",
      body: "Elevator out tonight",
      channel: "email",
      residentId: "res_1"
    });
    expect(result.deliveryStatus).toBe("email_failed");
    expect(client.messages[0]?.["delivery_status"]).toBe("email_failed");
    expect(client.messages[0]?.["email_provider_id"]).toBeNull();
  });

  it("does not mark delivered when a both-channel email fails", async () => {
    sendOperationalNoticeEmail.mockResolvedValue({
      ok: false,
      error: "You can only send testing emails to your own email address"
    });
    const client = createClient();
    const result = await sendOperationalMessage(client as never, "org_1", "staff_1", {
      audienceType: "resident",
      subject: "Building notice",
      body: "Elevator out tonight",
      channel: "both",
      residentId: "res_1"
    });
    expect(result.deliveryStatus).toBe("email_failed");
    expect(client.notifications).toHaveLength(1);
  });

  it("records email_sent only after the provider accepts", async () => {
    sendOperationalNoticeEmail.mockResolvedValue({ ok: true, providerId: "re_abc" });
    const client = createClient();
    const result = await sendOperationalMessage(client as never, "org_1", "staff_1", {
      audienceType: "resident",
      subject: "Building notice",
      body: "Elevator out tonight",
      channel: "email",
      residentId: "res_1"
    });
    expect(result.deliveryStatus).toBe("email_sent");
    expect(client.messages[0]?.["email_provider_id"]).toBe("re_abc");
  });
});
