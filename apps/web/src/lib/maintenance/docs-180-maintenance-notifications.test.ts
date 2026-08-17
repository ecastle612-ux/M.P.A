import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { listUnifiedNotifications } from "../communications/communications-service";
import { notifyLifecycle } from "./lifecycle-notify";

const migration = readFileSync(
  resolve(
    process.cwd(),
    "../../supabase/migrations/20260817120000_docs_180_maintenance_notifications.sql"
  ),
  "utf8"
);

describe("docs/180 maintenance_notifications migration contract", () => {
  it("creates only the designed notifications object", () => {
    expect(migration).toContain("create table if not exists public.maintenance_notifications");
    expect(migration).toContain("email_delivery_status");
    expect(migration).toContain("enable row level security");
    expect(migration).toContain("maintenance_notifications_select_own");
    expect(migration).toContain("maintenance_notifications_insert");
    expect(migration).toContain("maintenance_notifications_update_own");
    expect(migration).toContain("user_id = auth.uid()");
    expect(migration).toContain("grant select, insert, update on table public.maintenance_notifications to authenticated");
    expect(migration).not.toMatch(/create table if not exists public\.maintenance_work_orders/i);
    expect(migration).not.toContain("comms_notifications");
    expect(migration).not.toContain("in_app_notifications");
    expect(migration).not.toContain("financial_notifications");
  });
});

describe("docs/180 Notification Center + lifecycle after designed table", () => {
  it("maps maintenance rows into the unified inbox", async () => {
    const items = await listUnifiedNotifications(
      {
        from(table: string) {
          return {
            select() {
              return this;
            },
            eq() {
              return this;
            },
            order() {
              return this;
            },
            limit: async () => {
              if (table === "maintenance_notifications") {
                return {
                  data: [
                    {
                      id: "mn_1",
                      title: "Assigned",
                      body: "You were assigned",
                      href: "/pm/maintenance",
                      read_at: null,
                      created_at: "2026-08-17T00:00:00.000Z",
                      notification_key: "work_order.assigned"
                    }
                  ],
                  error: null
                };
              }
              return { data: [], error: null };
            }
          };
        }
      } as never,
      "org_a",
      "user_a"
    );
    expect(items).toEqual([
      expect.objectContaining({
        id: "maintenance:mn_1",
        source: "maintenance",
        title: "Assigned",
        notificationKey: "work_order.assigned"
      })
    ]);
  });

  it("records in-app when the table exists and does not throw on email failure", async () => {
    const inserts: Array<Record<string, unknown>> = [];
    const client = {
      from(table: string) {
        return {
          insert(values: Record<string, unknown>) {
            inserts.push(values);
            return {
              select() {
                return {
                  maybeSingle: async () => ({ data: { id: "mn_ok" }, error: null })
                };
              }
            };
          },
          update() {
            return { eq: async () => ({ error: null }) };
          },
          select() {
            return {
              eq: () => ({
                maybeSingle: async () =>
                  table === "user_preferences"
                    ? {
                        data: {
                          notification_preferences: { email: true, in_app: true, sms: false }
                        },
                        error: null
                      }
                    : { data: null, error: null }
              })
            };
          }
        };
      }
    };
    const result = await notifyLifecycle(client as never, {
      organizationId: "org_a",
      userId: "user_a",
      workOrderId: "wo_1",
      key: "work_order.assigned",
      title: "Assigned",
      body: "Assigned",
      href: "/pm/maintenance",
      emailCritical: true
    });
    expect(result.inApp).toBe(true);
    expect(result.notificationId).toBe("mn_ok");
    expect(result.emailStatus).not.toBe("sent");
    expect(inserts[0]?.["organization_id"]).toBe("org_a");
    expect(inserts[0]?.["user_id"]).toBe("user_a");
  });
});
