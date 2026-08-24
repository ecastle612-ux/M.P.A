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

  it("activates only the lease stored against the SignWell document id", async () => {
    const eq = vi.fn().mockReturnThis();
    const limit = vi.fn(async () => ({
      data: [
        {
          id: "lease-a",
          organization_id: "org-a",
          status: "pending_signature",
          signwell_document_id: "doc_1"
        }
      ],
      error: null
    }));
    vi.doMock("../../../../../lib/signwell/client", () => ({
      verifySignWellWebhook: () => true,
      isSignWellCompletedStatus: () => true
    }));
    vi.doMock("../../../../../lib/supabase/service-role", () => ({
      createServiceRoleClient: () => ({
        from: (table: string) => {
          if (table === "signwell_webhook_events") {
            return { upsert: upsertMock };
          }
          return {
            select: () => ({
              eq: (column: string, value: string) => {
                eq(column, value);
                return { limit };
              }
            })
          };
        }
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
            hash: "ok"
          },
          data: {
            object: {
              id: "doc_1",
              status: "completed",
              metadata: { lease_id: "lease-a", organization_id: "org-a" }
            }
          }
        })
      })
    );
    expect(res.status).toBe(200);
    expect(eq).toHaveBeenCalledWith("signwell_document_id", "doc_1");
    expect(eq).not.toHaveBeenCalledWith("id", "lease-a");
    expect(activateMock).toHaveBeenCalledWith(
      expect.anything(),
      "org-a",
      null,
      "lease-a",
      { channel: "signwell", signwellStatus: "completed" }
    );
  });

  it("does not activate a different lease from metadata.lease_id", async () => {
    vi.doMock("../../../../../lib/signwell/client", () => ({
      verifySignWellWebhook: () => true,
      isSignWellCompletedStatus: () => true
    }));
    vi.doMock("../../../../../lib/supabase/service-role", () => ({
      createServiceRoleClient: () => ({
        from: (table: string) => {
          if (table === "signwell_webhook_events") {
            return { upsert: upsertMock };
          }
          return {
            select: () => ({
              eq: () => ({
                limit: async () => ({
                  data: [
                    {
                      id: "lease-a",
                      organization_id: "org-a",
                      status: "pending_signature",
                      signwell_document_id: "doc_1"
                    }
                  ],
                  error: null
                })
              })
            })
          };
        }
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
            hash: "ok"
          },
          data: {
            object: {
              id: "doc_1",
              status: "completed",
              metadata: { lease_id: "lease-other", organization_id: "org-a" }
            }
          }
        })
      })
    );
    const body = (await res.json()) as { unmatched?: boolean; reason?: string };
    expect(res.status).toBe(200);
    expect(body.unmatched).toBe(true);
    expect(body.reason).toBe("lease_mismatch");
    expect(activateMock).not.toHaveBeenCalled();
  });
});

describe("SEC-001 SignWell webhook document correlation", () => {
  const activateMock = vi.fn(async () => ({ alreadyActive: false }));
  const upsertMock = vi.fn(async () => ({ error: null }));
  const eqCalls: Array<{ column: string; value: string }> = [];

  function leaseClient(
    rows: Array<{
      id: string;
      organization_id: string;
      status: string;
      signwell_document_id?: string;
    }>
  ) {
    return {
      from: (table: string) => {
        if (table === "signwell_webhook_events") {
          return { upsert: upsertMock };
        }
        return {
          select: () => ({
            eq: (column: string, value: string) => {
              eqCalls.push({ column, value });
              return {
                limit: async () => ({ data: rows, error: null })
              };
            }
          })
        };
      }
    };
  }

  async function postCompleted(metadata: Record<string, string> = {}) {
    const { POST } = await import("./route");
    return POST(
      new Request("http://localhost/api/leasing/webhooks/signwell", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          event: {
            type: "document_completed",
            time: "2026-08-11T12:00:00Z",
            hash: "ok"
          },
          data: {
            object: {
              id: "doc_1",
              status: "completed",
              metadata
            }
          }
        })
      })
    );
  }

  beforeEach(() => {
    activateMock.mockReset();
    activateMock.mockResolvedValue({ alreadyActive: false });
    upsertMock.mockReset();
    eqCalls.length = 0;
    vi.resetModules();
    vi.doMock("../../../../../lib/signwell/client", () => ({
      verifySignWellWebhook: () => true,
      isSignWellCompletedStatus: () => true
    }));
    vi.doMock("../../../../../lib/leasing/lease-service", () => ({
      activateSignedLease: activateMock
    }));
  });

  it("looks up by signwell_document_id and activates the matching lease", async () => {
    vi.doMock("../../../../../lib/supabase/service-role", () => ({
      createServiceRoleClient: () =>
        leaseClient([
          {
            id: "lease-a",
            organization_id: "org-a",
            status: "pending_signature",
            signwell_document_id: "doc_1"
          }
        ])
    }));
    const res = await postCompleted({ lease_id: "lease-a", organization_id: "org-a" });
    expect(res.status).toBe(200);
    expect(eqCalls).toEqual([{ column: "signwell_document_id", value: "doc_1" }]);
    expect(eqCalls.some((call) => call.column === "id")).toBe(false);
    const body = (await res.json()) as { activated?: boolean; leaseId?: string };
    expect(body.activated).toBe(true);
    expect(body.leaseId).toBe("lease-a");
    expect(activateMock).toHaveBeenCalledWith(
      expect.anything(),
      "org-a",
      null,
      "lease-a",
      expect.objectContaining({ channel: "signwell" })
    );
  });

  it("does not activate another lease when metadata lease_id is wrong", async () => {
    vi.doMock("../../../../../lib/supabase/service-role", () => ({
      createServiceRoleClient: () =>
        leaseClient([
          {
            id: "lease-a",
            organization_id: "org-a",
            status: "pending_signature",
            signwell_document_id: "doc_1"
          }
        ])
    }));
    const res = await postCompleted({ lease_id: "lease-other", organization_id: "org-a" });
    const body = (await res.json()) as { unmatched?: boolean; reason?: string };
    expect(res.status).toBe(200);
    expect(body.unmatched).toBe(true);
    expect(body.reason).toBe("lease_mismatch");
    expect(activateMock).not.toHaveBeenCalled();
  });

  it("returns unmatched for an unknown document even when metadata has a lease id", async () => {
    vi.doMock("../../../../../lib/supabase/service-role", () => ({
      createServiceRoleClient: () => leaseClient([])
    }));
    const res = await postCompleted({ lease_id: "lease-b" });
    const body = (await res.json()) as { unmatched?: boolean };
    expect(res.status).toBe(200);
    expect(body.unmatched).toBe(true);
    expect(activateMock).not.toHaveBeenCalled();
  });

  it("ignores other-org metadata on a known document", async () => {
    vi.doMock("../../../../../lib/supabase/service-role", () => ({
      createServiceRoleClient: () =>
        leaseClient([
          {
            id: "lease-a",
            organization_id: "org-a",
            status: "pending_signature",
            signwell_document_id: "doc_1"
          }
        ])
    }));
    const res = await postCompleted({ organization_id: "org-other" });
    const body = (await res.json()) as { unmatched?: boolean; reason?: string };
    expect(body.unmatched).toBe(true);
    expect(body.reason).toBe("organization_mismatch");
    expect(activateMock).not.toHaveBeenCalled();
  });

  it("replays remain idempotent", async () => {
    activateMock.mockResolvedValueOnce({ alreadyActive: false }).mockResolvedValueOnce({
      alreadyActive: true
    });
    vi.doMock("../../../../../lib/supabase/service-role", () => ({
      createServiceRoleClient: () =>
        leaseClient([
          {
            id: "lease-a",
            organization_id: "org-a",
            status: "active",
            signwell_document_id: "doc_1"
          }
        ])
    }));
    const first = await postCompleted();
    const second = await postCompleted();
    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(upsertMock).toHaveBeenCalledTimes(2);
    expect(activateMock).toHaveBeenCalledTimes(2);
  });
});

