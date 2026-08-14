import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
  CRITICAL_NOTIFICATION_KEYS,
  isMissingMaintenanceNotificationsRelation,
  notifyLifecycle
} from "./lifecycle-notify";

vi.mock("../communications/email", () => ({
  sendOperationalNoticeEmail: vi.fn(async () => ({
    ok: false,
    error: "Email provider is not configured"
  }))
}));

import { sendOperationalNoticeEmail } from "../communications/email";

function createNotifyClient(options?: {
  preferences?: { email: boolean; in_app: boolean; sms?: boolean } | null;
  insertError?: { code?: string; message: string } | null;
}) {
  const updates: Array<Record<string, unknown>> = [];
  const inserts: Array<Record<string, unknown>> = [];
  return {
    updates,
    inserts,
    from(table: string) {
      return {
        insert(values: Record<string, unknown>) {
          inserts.push(values);
          return {
            select() {
              return {
                maybeSingle: async () =>
                  options?.insertError
                    ? { data: null, error: options.insertError }
                    : { data: { id: "notif_1" }, error: null }
              };
            }
          };
        },
        update(values: Record<string, unknown>) {
          updates.push(values);
          return {
            eq: async () => ({ error: null })
          };
        },
        select() {
          return {
            eq: () => ({
              maybeSingle: async () => {
                if (table !== "user_preferences") {
                  return { data: null, error: null };
                }
                if (options?.preferences === null) {
                  return { data: null, error: null };
                }
                return {
                  data: {
                    notification_preferences: options?.preferences ?? {
                      email: true,
                      in_app: true,
                      sms: false
                    }
                  },
                  error: null
                };
              }
            })
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

  it("honors email/in-app preferences and never SMS (PPS1-011)", async () => {
    const client = createNotifyClient({
      preferences: { email: false, in_app: false, sms: true }
    });
    const result = await notifyLifecycle(client as never, {
      organizationId: "org_1",
      userId: "user_1",
      workOrderId: "wo_1",
      key: "work_order.assigned",
      title: "Assigned",
      body: "You were assigned",
      href: "/pm/maintenance",
      emailCritical: true
    });
    expect(result.inApp).toBe(false);
    expect(result.emailStatus).toBe("skipped_preference");
    expect(client.inserts).toHaveLength(0);
    expect(sendOperationalNoticeEmail).not.toHaveBeenCalled();
  });

  it("soft-fails when the legacy notification relation is absent", async () => {
    const client = createNotifyClient({
      insertError: {
        code: "PGRST205",
        message: "Could not find the table 'public.maintenance_notifications' in the schema cache"
      }
    });
    const result = await notifyLifecycle(client as never, {
      organizationId: "org_1",
      userId: "user_1",
      workOrderId: "wo_1",
      key: "work_order.started",
      title: "Facility work started",
      body: "Started",
      href: "/facility/operations",
      emailCritical: true
    });
    expect(result.inApp).toBe(false);
    expect(result.notificationId).toBeNull();
    expect(result.emailStatus).not.toBe("sent");
  });

  it("still throws unexpected insert errors when the relation exists", async () => {
    const client = createNotifyClient({
      insertError: { code: "42501", message: "new row violates row-level security policy" }
    });
    await expect(
      notifyLifecycle(client as never, {
        organizationId: "org_1",
        userId: "user_1",
        workOrderId: "wo_1",
        key: "work_order.started",
        title: "Started",
        body: "Started",
        href: "/facility/operations"
      })
    ).rejects.toThrow(/row-level security/i);
  });

  it("detects undefined-table and schema-cache absence codes", () => {
    expect(
      isMissingMaintenanceNotificationsRelation({
        code: "42P01",
        message: 'relation "maintenance_notifications" does not exist'
      })
    ).toBe(true);
    expect(
      isMissingMaintenanceNotificationsRelation({
        code: "PGRST205",
        message: "Could not find the table 'public.maintenance_notifications' in the schema cache"
      })
    ).toBe(true);
    expect(
      isMissingMaintenanceNotificationsRelation({
        message: "new row violates row-level security policy"
      })
    ).toBe(false);
  });
});
