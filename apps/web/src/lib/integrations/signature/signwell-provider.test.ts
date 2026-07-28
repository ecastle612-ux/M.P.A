import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { signwellProvider, verifySignWellEventHash } from "./signwell-provider";
import { createHmac } from "node:crypto";

describe("verifySignWellEventHash", () => {
  it("accepts official type@time HMAC with webhook id", () => {
    const webhookId = "webhook-id-abc";
    const type = "document_completed";
    const time = 1689332249;
    const hash = createHmac("sha256", webhookId).update(`${type}@${time}`).digest("hex");
    expect(verifySignWellEventHash({ type, time, hash }, webhookId)).toBe(true);
  });

  it("rejects tampered hash", () => {
    expect(
      verifySignWellEventHash(
        { type: "document_completed", time: 1, hash: "deadbeef" },
        "webhook-id"
      )
    ).toBe(false);
  });
});

describe("signwell provider", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env["SIGNWELL_API_KEY"];
    process.env["SIGNWELL_MODE"] = "sandbox";
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.unstubAllGlobals();
  });

  it("creates sandbox envelope without API key", async () => {
    const ref = await signwellProvider.createEnvelope({
      organizationId: "org",
      packageId: "pkg",
      packageNumber: "SIG-1",
      subject: "Lease",
      documents: [
        {
          title: "Lease",
          fileName: "lease.pdf",
          contentBase64: Buffer.from("%PDF").toString("base64")
        }
      ],
      recipients: [
        {
          id: "r1",
          role: "primary_applicant",
          fullName: "Ada",
          email: "ada@example.com",
          signingOrder: 1,
          signingGroup: 1,
          isRequired: true
        }
      ]
    });
    expect(ref.externalReference).toContain("sw-sandbox");
    expect(ref.recipientExternalIds?.["r1"]).toBeTruthy();
  });

  it("throws when API key missing in production mode", async () => {
    process.env["SIGNWELL_MODE"] = "production";
    await expect(
      signwellProvider.createEnvelope({
        organizationId: "org",
        packageId: "pkg",
        packageNumber: "SIG-2",
        subject: "Lease",
        documents: [
          {
            title: "Lease",
            fileName: "lease.pdf",
            contentBase64: Buffer.from("%PDF").toString("base64")
          }
        ],
        recipients: [
          {
            id: "r1",
            role: "primary_applicant",
            fullName: "Ada",
            email: "ada@example.com",
            signingOrder: 1,
            signingGroup: 1,
            isRequired: true
          }
        ]
      })
    ).rejects.toThrow(/SIGNWELL_API_KEY/);
  });

  it("normalizes auth failures from API", async () => {
    process.env["SIGNWELL_API_KEY"] = "live-key";
    process.env["SIGNWELL_MODE"] = "production";
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ errors: {} }), { status: 401 }))
    );
    await expect(
      signwellProvider.createEnvelope({
        organizationId: "org",
        packageId: "pkg",
        packageNumber: "SIG-3",
        subject: "Lease",
        documents: [
          {
            title: "Lease",
            fileName: "lease.pdf",
            contentBase64: Buffer.from("%PDF").toString("base64")
          }
        ],
        recipients: [
          {
            id: "r1",
            role: "primary_applicant",
            fullName: "Ada",
            email: "ada@example.com",
            signingOrder: 1,
            signingGroup: 1,
            isRequired: true
          }
        ]
      })
    ).rejects.toThrow(/authentication/i);
  });

  it("retries on 429 then succeeds", async () => {
    process.env["SIGNWELL_API_KEY"] = "live-key";
    process.env["SIGNWELL_MODE"] = "production";
    process.env["SIGNWELL_RETRY_BASE_MS"] = "0";
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response("slow down", { status: 429 }))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            id: "doc-1",
            recipients: [{ id: "1", email: "ada@example.com" }]
          }),
          { status: 201 }
        )
      );
    vi.stubGlobal("fetch", fetchMock);

    const ref = await signwellProvider.createEnvelope({
      organizationId: "org",
      packageId: "pkg",
      packageNumber: "SIG-4",
      subject: "Lease",
      documents: [
        {
          title: "Lease",
          fileName: "lease.pdf",
          contentBase64: Buffer.from("%PDF").toString("base64")
        }
      ],
      recipients: [
        {
          id: "r1",
          role: "primary_applicant",
          fullName: "Ada",
          email: "ada@example.com",
          signingOrder: 1,
          signingGroup: 1,
          isRequired: true
        }
      ]
    });
    expect(ref.externalReference).toBe("doc-1");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("maps webhook events and verifies hash", async () => {
    const webhookId = "wh-1";
    process.env["SIGNWELL_WEBHOOK_ID"] = webhookId;
    process.env["SIGNWELL_MODE"] = "production";
    const type = "document_signed";
    const time = 1700000000;
    const hash = createHmac("sha256", webhookId).update(`${type}@${time}`).digest("hex");
    const events = await signwellProvider.parseWebhook(
      {
        event: {
          type,
          time,
          hash,
          related_signer: { email: "ada@example.com", id: "1" }
        },
        data: { object: { id: "doc-xyz", status: "Pending" } }
      },
      { "x-mpa-raw-body": "{}" }
    );
    expect(events).toHaveLength(1);
    expect(events[0]?.type).toBe("signed");
    expect(events[0]?.externalEnvelopeId).toBe("doc-xyz");
    expect(events[0]?.recipientEmail).toBe("ada@example.com");
  });

  it("rejects invalid webhook hash in production", async () => {
    process.env["SIGNWELL_WEBHOOK_ID"] = "wh-1";
    process.env["SIGNWELL_MODE"] = "production";
    await expect(
      signwellProvider.parseWebhook(
        {
          event: { type: "document_completed", time: 1, hash: "nope" },
          data: { object: { id: "doc" } }
        },
        {}
      )
    ).rejects.toThrow(/Invalid SignWell webhook/);
  });

  it("accepts simulate webhook without hash", async () => {
    const events = await signwellProvider.parseWebhook(
      {
        id: "sim-1",
        type: "document_completed",
        externalReference: "doc-sim"
      },
      { "x-mpa-simulate": "1" }
    );
    expect(events[0]?.type).toBe("completed");
    expect(events[0]?.externalEnvelopeId).toBe("doc-sim");
  });

  it("downloads sandbox executed + certificate companion", async () => {
    const ref = { externalReference: "sw-sandbox-SIG-1" };
    const docs = await signwellProvider.downloadExecutedDocuments(ref);
    expect(docs[0]?.kind).toBe("executed");
    const cert = await signwellProvider.downloadCertificate(ref);
    expect(cert?.kind).toBe("certificate");
  });
});
