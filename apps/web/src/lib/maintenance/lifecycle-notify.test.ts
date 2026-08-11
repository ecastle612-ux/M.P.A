import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { CRITICAL_NOTIFICATION_KEYS, notifyLifecycle } from "./lifecycle-notify";

vi.mock("../communications/email", () => ({
  sendOperationalNoticeEmail: vi.fn(async () => ({
    ok: false,
    error: "Email provider is not configured"
  }))
}));

import { sendOperationalNoticeEmail } from "../communications/email";

function createNotifyClient() {
  const updates: Array<Record<string, unknown>> = [];
  const inserts: Array<Record<string, unknown>> = [];
  return {
    updates,
    inserts,
    from() {
      return {
        insert(values: Record<string, unknown>) {
          inserts.push(values);
          return {
            select() {
              return {
                maybeSingle: async () => ({ data: { id: "notif_1" }, error: null })
              };
            }
          };
        },
        update(values: Record<string, unknown>) {
          updates.push(values);
          return {
            eq: async () => ({ error: null })
          };
        }
      };
    }
  };
}

describe("STAB-007 lifecycle notifications", () => {
  beforeEach(() => {
    vi.mocked(sendOperationalNoticeEmail).mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("skips when no user id", async () => {
    const client = createNotifyClient();
    const result = await notifyLifecycle(client as never, {
      organizationId: "org_1",
      userId: null,
      workOrderId: "wo_1",
      key: "work_order.assigned",
      title: "Assigned",
      body: "You were assigned",
      href: "/pm/maintenance",
      emailCritical: true
    });
    expect(result.inApp).toBe(false);
    expect(result.emailStatus).toBe("skipped_no_user");
    expect(client.inserts).toHaveLength(0);
  });

  it("records in-app only when email not requested", async () => {
    const client = createNotifyClient();
    const result = await notifyLifecycle(client as never, {
      organizationId: "org_1",
      userId: "user_1",
      workOrderId: "wo_1",
      key: "work_order.triaged",
      title: "Reviewed",
      body: "Prioritized",
      href: "/portal/tenant/maintenance"
    });
    expect(result.inApp).toBe(true);
    expect(result.emailStatus).toBe("not_requested");
    expect(client.inserts[0]?.["channel"]).toBe("in_app");
    expect(sendOperationalNoticeEmail).not.toHaveBeenCalled();
  });

  it("does not claim email success when provider is not configured", async () => {
    const client = createNotifyClient();
    const result = await notifyLifecycle(client as never, {
      organizationId: "org_1",
      userId: "user_1",
      workOrderId: "wo_1",
      key: "work_order.cancelled",
      title: "Cancelled",
      body: "Cancelled by manager",
      href: "/facility/operations",
      emailCritical: true
    });
    // Without service role email lookup in vitest, email is skipped_no_email before send.
    expect(result.inApp).toBe(true);
    expect(["skipped_no_email", "skipped_not_configured", "failed"]).toContain(result.emailStatus);
    expect(result.emailStatus).not.toBe("sent");
    expect(CRITICAL_NOTIFICATION_KEYS.has("work_order.cancelled")).toBe(true);
  });
});
