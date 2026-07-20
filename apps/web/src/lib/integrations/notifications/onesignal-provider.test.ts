import { afterEach, describe, expect, it, vi } from "vitest";
import { onesignalProvider } from "./onesignal-provider";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
  delete process.env["ONESIGNAL_APP_ID"];
  delete process.env["ONESIGNAL_API_KEY"];
  delete process.env["ONESIGNAL_REST_API_KEY"];
  delete process.env["NEXT_PUBLIC_ONESIGNAL_APP_ID"];
  vi.restoreAllMocks();
});

describe("onesignalProvider current App API Key model", () => {
  it("rejects legacy / non os_v2_app keys on health", async () => {
    process.env["ONESIGNAL_APP_ID"] = "11111111-1111-4111-8111-111111111111";
    process.env["ONESIGNAL_API_KEY"] = "r2yki3x4nuhhlegacykey12345";

    const health = await onesignalProvider.health!();
    expect(health.ok).toBe(false);
    expect(health.detail).toMatch(/os_v2_app_/);
  });

  it("health uses app-scoped notifications list, not GET /apps", async () => {
    process.env["ONESIGNAL_APP_ID"] = "11111111-1111-4111-8111-111111111111";
    process.env["ONESIGNAL_API_KEY"] = "os_v2_app_testkey_abcdefghijklmnopqrstuvwxyz0123456789";

    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      expect(url).toContain("/notifications?");
      expect(url).toContain("app_id=11111111-1111-4111-8111-111111111111");
      expect(url).not.toContain("/apps/");
      return new Response(JSON.stringify({ notifications: [] }), { status: 200 });
    });
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const health = await onesignalProvider.health!();
    expect(health.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledOnce();
    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    const headers = (init.headers ?? {}) as Record<string, string>;
    expect(String(headers["Authorization"])).toMatch(/^Key os_v2_app_/);
  });

  it("send posts target_channel push with Key auth", async () => {
    process.env["ONESIGNAL_APP_ID"] = "11111111-1111-4111-8111-111111111111";
    process.env["ONESIGNAL_API_KEY"] = "os_v2_app_testkey_abcdefghijklmnopqrstuvwxyz0123456789";

    const notificationId = "11111111-1111-4111-8111-111111111111";
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body ?? "{}")) as Record<string, unknown>;
      expect(body["target_channel"]).toBe("push");
      expect(body["include_subscription_ids"]).toEqual(["sub-1"]);
      // OneSignal requires UUID idempotency keys — use notificationId, not opaque M.P.A. event keys.
      expect(body["idempotency_key"]).toBe(notificationId);
      expect((body["data"] as Record<string, unknown>)["mpa_idempotency_key"]).toBe("org:event:user");
      return new Response(JSON.stringify({ id: "notif-1" }), { status: 200 });
    });
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const result = await onesignalProvider.send({
      organizationId: "org-1",
      notificationId,
      idempotencyKey: "org:event:user",
      userId: "user-1",
      externalSubscriptionIds: ["sub-1"],
      title: "Hello",
      body: "World",
      category: "announcement",
      priority: "normal"
    });

    expect(result.status).toBe("sent");
    expect(result.externalId).toBe("notif-1");
  });

  it("registerDevice remains client-subscription passthrough", async () => {
    const result = await onesignalProvider.registerDevice({
      organizationId: "org-1",
      userId: "user-1",
      platform: "web",
      externalSubscriptionId: "sub-abc",
      enrolledVia: "portal"
    });
    expect(result.externalSubscriptionId).toBe("sub-abc");
    expect(result.providerKey).toBe("onesignal");
  });
});
