import { createHmac } from "crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { verifySignWellWebhookWithSecret } from "../../../../../lib/signwell/client";

const WEBHOOK_ID = "signwell_webhook_secret_test";

function validHash(eventType: string, eventTime: string, secret = WEBHOOK_ID): string {
  return createHmac("sha256", secret).update(`${eventType}@${eventTime}`).digest("hex");
}

describe("STAB-003 SignWell webhook fail-closed", () => {
  it("accepts a valid webhook signature", () => {
    const eventType = "document_completed";
    const eventTime = "2026-08-11T12:00:00Z";
    expect(
      verifySignWellWebhookWithSecret(WEBHOOK_ID, {
        eventType,
        eventTime,
        hash: validHash(eventType, eventTime)
      })
    ).toBe(true);
  });

  it("rejects an invalid webhook signature", () => {
    expect(
      verifySignWellWebhookWithSecret(WEBHOOK_ID, {
        eventType: "document_completed",
        eventTime: "2026-08-11T12:00:00Z",
        hash: "deadbeef"
      })
    ).toBe(false);
  });

  it("rejects missing webhook ID/configuration (production fail-closed)", () => {
    expect(
      verifySignWellWebhookWithSecret(undefined, {
        eventType: "document_completed",
        eventTime: "2026-08-11T12:00:00Z",
        hash: validHash("document_completed", "2026-08-11T12:00:00Z")
      })
    ).toBe(false);
    expect(
      verifySignWellWebhookWithSecret("", {
        eventType: "document_completed",
        eventTime: "2026-08-11T12:00:00Z",
        hash: "anything"
      })
    ).toBe(false);
    expect(
      verifySignWellWebhookWithSecret(null, {
        eventType: "document_completed",
        eventTime: "2026-08-11T12:00:00Z",
        hash: "anything"
      })
    ).toBe(false);
  });

  it("rejects malformed payload fields", () => {
    expect(
      verifySignWellWebhookWithSecret(WEBHOOK_ID, {
        eventType: "",
        eventTime: "2026-08-11T12:00:00Z",
        hash: validHash("document_completed", "2026-08-11T12:00:00Z")
      })
    ).toBe(false);
    expect(
      verifySignWellWebhookWithSecret(WEBHOOK_ID, {
        eventType: "document_completed",
        eventTime: "",
        hash: validHash("document_completed", "2026-08-11T12:00:00Z")
      })
    ).toBe(false);
    expect(
      verifySignWellWebhookWithSecret(WEBHOOK_ID, {
        eventType: "document_completed",
        eventTime: "2026-08-11T12:00:00Z",
        hash: ""
      })
    ).toBe(false);
  });

  it("rejects forged payload (wrong secret / tampered type)", () => {
    const eventTime = "2026-08-11T12:00:00Z";
    expect(
      verifySignWellWebhookWithSecret(WEBHOOK_ID, {
        eventType: "document_completed",
        eventTime,
        hash: validHash("document_completed", eventTime, "attacker_secret")
      })
    ).toBe(false);
    expect(
      verifySignWellWebhookWithSecret(WEBHOOK_ID, {
        eventType: "document_completed",
        eventTime,
        hash: validHash("document_viewed", eventTime)
      })
    ).toBe(false);
  });
});

describe("STAB-003 SignWell webhook route gates service-role mutations", () => {
  const activateMock = vi.fn();
  const upsertMock = vi.fn(async () => ({ error: null }));

  beforeEach(() => {
    activateMock.mockReset();
    upsertMock.mockReset();
    vi.resetModules();
  });

  it("does not run service-role mutation when verification fails (missing config)", async () => {
    vi.doMock("../../../../../lib/signwell/client", () => ({
      verifySignWellWebhook: () => false,
      isSignWellCompletedStatus: () => true
    }));
    vi.doMock("../../../../../lib/supabase/service-role", () => ({
      createServiceRoleClient: () => {
        throw new Error("service role must not be created when verification fails");
      }
    }));
    vi.doMock("../../../../../lib/leasing/lease-service", () => ({
      activateSignedLease: activateMock
    }));

    const { POST } = await import("./route");
    const res = await POST(
      new Request("http://localhost/api/leasing/webhooks/signwell", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          event: {
            type: "document_completed",
            time: "2026-08-11T12:00:00Z",
            hash: "forged"
          },
          data: { object: { id: "doc_1", status: "completed" } }
        })
      })
    );
    expect(res.status).toBe(401);
    expect(activateMock).not.toHaveBeenCalled();
  });

  it("does not activate lease on invalid signature", async () => {
    vi.doMock("../../../../../lib/signwell/client", () => ({
      verifySignWellWebhook: () => false,
      isSignWellCompletedStatus: () => true
    }));
    vi.doMock("../../../../../lib/supabase/service-role", () => ({
      createServiceRoleClient: () => ({
        from: () => ({ upsert: upsertMock })
      })
    }));
    vi.doMock("../../../../../lib/leasing/lease-service", () => ({
      activateSignedLease: activateMock
    }));

    const { POST } = await import("./route");
    const res = await POST(
      new Request("http://localhost/api/leasing/webhooks/signwell", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          event: {
            type: "document_completed",
            time: "2026-08-11T12:00:00Z",
            hash: "bad"
          },
          data: { object: { id: "doc_1", status: "completed" } }
        })
      })
    );
    expect(res.status).toBe(401);
    expect(upsertMock).not.toHaveBeenCalled();
    expect(activateMock).not.toHaveBeenCalled();
  });

  it("rejects malformed payload before service-role work", async () => {
    vi.doMock("../../../../../lib/signwell/client", () => ({
      verifySignWellWebhook: () => true,
      isSignWellCompletedStatus: () => true
    }));
    vi.doMock("../../../../../lib/supabase/service-role", () => ({
      createServiceRoleClient: () => {
        throw new Error("should not create client for malformed body");
      }
    }));
    vi.doMock("../../../../../lib/leasing/lease-service", () => ({
      activateSignedLease: activateMock
    }));

    const { POST } = await import("./route");
    const res = await POST(
      new Request("http://localhost/api/leasing/webhooks/signwell", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ event: { type: "document_completed" } })
      })
    );
    expect(res.status).toBe(400);
    expect(activateMock).not.toHaveBeenCalled();
  });
});
