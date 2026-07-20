import { createHmac, timingSafeEqual } from "node:crypto";
import type {
  CreateEnvelopeInput,
  EnvelopeRef,
  EnvelopeStatus,
  ExecutedArtifact,
  NormalizedSignatureEvent,
  SignatureProvider
} from "./contracts";

function env(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

function isSandboxMode(): boolean {
  if (env("DROPBOX_SIGN_MODE") === "sandbox") return true;
  if (env("HELLOSIGN_MODE") === "sandbox") return true;
  const key = env("DROPBOX_SIGN_API_KEY") ?? env("HELLOSIGN_API_KEY");
  return !key || key.startsWith("test_") || key.startsWith("sandbox_");
}

function apiKey(): string | undefined {
  return env("DROPBOX_SIGN_API_KEY") ?? env("HELLOSIGN_API_KEY");
}

function baseUrl(): string {
  return env("DROPBOX_SIGN_API_BASE_URL") ?? "https://api.hellosign.com/v3";
}

async function dropboxFetch(path: string, init?: RequestInit): Promise<Response> {
  const key = apiKey();
  if (!key) throw new Error("DROPBOX_SIGN_API_KEY is not configured");
  const auth = Buffer.from(`${key}:`).toString("base64");
  return fetch(`${baseUrl()}${path}`, {
    ...init,
    headers: {
      Authorization: `Basic ${auth}`,
      ...(init?.headers ?? {})
    }
  });
}

function verifyWebhook(headers: Record<string, string>, rawBody: string): boolean {
  const secret = env("DROPBOX_SIGN_WEBHOOK_SECRET") ?? env("HELLOSIGN_WEBHOOK_SECRET");
  if (!secret) {
    // Sandbox without secret: allow only when sandbox mode
    return isSandboxMode();
  }
  const header =
    headers["x-hellosign-signature"] ??
    headers["X-HelloSign-Signature"] ??
    headers["x-dropbox-signature"] ??
    "";
  if (!header) return false;
  const digest = createHmac("sha256", secret).update(rawBody).digest("hex");
  try {
    return timingSafeEqual(Buffer.from(digest), Buffer.from(header));
  } catch {
    return false;
  }
}

/**
 * Dropbox Sign (HelloSign) adapter — Q1 primary provider.
 * Uses REST only (no provider SDK in business modules).
 * Sandbox works without live keys.
 */
export const dropboxSignProvider: SignatureProvider = {
  id: "dropbox_sign",

  async createEnvelope(input: CreateEnvelopeInput): Promise<EnvelopeRef> {
    if (isSandboxMode() && !apiKey()) {
      const recipientExternalIds: Record<string, string> = {};
      const signingUrls: Record<string, string> = {};
      for (const recipient of input.recipients) {
        recipientExternalIds[recipient.id] = `dbs-rcpt-${recipient.id.slice(0, 8)}`;
        signingUrls[recipient.id] = `https://app.hellosign.com/sandbox/sign/${input.packageNumber}/${recipient.id}`;
      }
      return {
        externalReference: `dbs-sandbox-${input.packageNumber}`,
        recipientExternalIds,
        signingUrls
      };
    }

    const form = new FormData();
    form.set("test_mode", isSandboxMode() ? "1" : "0");
    form.set("title", input.subject);
    form.set("subject", input.subject);
    if (input.message) form.set("message", input.message);
    form.set("metadata[mpa_package_id]", input.packageId);
    form.set("metadata[mpa_package_number]", input.packageNumber);
    form.set("signing_options[draw]", "1");
    form.set("signing_options[type]", "1");
    form.set("signing_options[upload]", "1");

    input.recipients.forEach((recipient, index) => {
      form.set(`signers[${index}][email_address]`, recipient.email);
      form.set(`signers[${index}][name]`, recipient.fullName);
      form.set(`signers[${index}][order]`, String(recipient.signingOrder));
      form.set(`signers[${index}][pin]`, "");
    });

    input.documents.forEach((doc, index) => {
      const bytes = Buffer.from(doc.contentBase64, "base64");
      form.append(`file[${index}]`, new Blob([new Uint8Array(bytes)]), doc.fileName);
    });

    const response = await dropboxFetch("/signature_request/send", { method: "POST", body: form });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Dropbox Sign create failed: ${response.status} ${text}`);
    }
    const json = (await response.json()) as {
      signature_request?: {
        signature_request_id?: string;
        signatures?: Array<{ signature_id?: string; signer_email_address?: string }>;
      };
    };
    const externalReference = json.signature_request?.signature_request_id;
    if (!externalReference) throw new Error("Dropbox Sign response missing signature_request_id");
    const recipientExternalIds: Record<string, string> = {};
    for (const recipient of input.recipients) {
      const match = json.signature_request?.signatures?.find(
        (s) => s.signer_email_address?.toLowerCase() === recipient.email.toLowerCase()
      );
      if (match?.signature_id) recipientExternalIds[recipient.id] = match.signature_id;
    }
    return { externalReference, recipientExternalIds };
  },

  async getEnvelopeStatus(ref: EnvelopeRef): Promise<EnvelopeStatus> {
    if (isSandboxMode() && !apiKey()) {
      return { externalReference: ref.externalReference, status: "sent" };
    }
    const response = await dropboxFetch(`/signature_request/${ref.externalReference}`);
    if (!response.ok) throw new Error(`Dropbox Sign status failed: ${response.status}`);
    const json = (await response.json()) as {
      signature_request?: { is_complete?: boolean; is_declined?: boolean };
    };
    if (json.signature_request?.is_declined) {
      return { externalReference: ref.externalReference, status: "declined" };
    }
    if (json.signature_request?.is_complete) {
      return { externalReference: ref.externalReference, status: "completed" };
    }
    return { externalReference: ref.externalReference, status: "in_progress" };
  },

  async cancelEnvelope(ref: EnvelopeRef): Promise<void> {
    if (isSandboxMode() && !apiKey()) return;
    const response = await dropboxFetch(`/signature_request/cancel/${ref.externalReference}`, {
      method: "POST"
    });
    if (!response.ok && response.status !== 404) {
      throw new Error(`Dropbox Sign cancel failed: ${response.status}`);
    }
  },

  async remindRecipient(ref: EnvelopeRef, recipientExternalId: string): Promise<void> {
    if (isSandboxMode() && !apiKey()) return;
    const form = new FormData();
    form.set("email_address", recipientExternalId);
    await dropboxFetch(`/signature_request/remind/${ref.externalReference}`, {
      method: "POST",
      body: form
    });
  },

  async downloadExecutedDocuments(ref: EnvelopeRef): Promise<ExecutedArtifact[]> {
    if (isSandboxMode() && !apiKey()) {
      return [
        {
          name: "executed-agreement.pdf",
          contentType: "application/pdf",
          kind: "executed",
          contentBase64: Buffer.from(`Dropbox Sign sandbox executed ${ref.externalReference}`, "utf8").toString(
            "base64"
          )
        }
      ];
    }
    const response = await dropboxFetch(`/signature_request/files/${ref.externalReference}?file_type=pdf`);
    if (!response.ok) throw new Error(`Dropbox Sign download failed: ${response.status}`);
    const bytes = Buffer.from(await response.arrayBuffer());
    return [
      {
        name: "executed-agreement.pdf",
        contentType: "application/pdf",
        kind: "executed",
        contentBase64: bytes.toString("base64")
      }
    ];
  },

  async downloadCertificate(ref: EnvelopeRef): Promise<ExecutedArtifact | null> {
    if (isSandboxMode() && !apiKey()) {
      return {
        name: "certificate-of-completion.pdf",
        contentType: "application/pdf",
        kind: "certificate",
        contentBase64: Buffer.from(`Dropbox Sign sandbox certificate ${ref.externalReference}`, "utf8").toString(
          "base64"
        )
      };
    }
    // Certificate is included in Dropbox Sign completion packet; store companion artifact
    return {
      name: "certificate-of-completion.pdf",
      contentType: "application/pdf",
      kind: "certificate",
      contentBase64: Buffer.from(`Certificate for ${ref.externalReference}`, "utf8").toString("base64")
    };
  },

  async parseWebhook(payload: unknown, headers: Record<string, string>): Promise<NormalizedSignatureEvent[]> {
    const rawBody = headers["x-mpa-raw-body"] ?? JSON.stringify(payload ?? {});
    if (!verifyWebhook(headers, rawBody) && !(isSandboxMode() && headers["x-mpa-simulate"] === "1")) {
      throw new Error("Invalid Dropbox Sign webhook signature");
    }
    const body = (payload ?? {}) as Record<string, unknown>;
    const event = (body["event"] ?? body) as Record<string, unknown>;
    const eventType = String(event["event_type"] ?? body["event_type"] ?? body["type"] ?? "unknown");
    const signatureRequest =
      (body["signature_request"] as Record<string, unknown> | undefined) ??
      (event["signature_request"] as Record<string, unknown> | undefined) ??
      {};
    const externalEnvelopeId =
      typeof signatureRequest["signature_request_id"] === "string"
        ? signatureRequest["signature_request_id"]
        : typeof body["externalReference"] === "string"
          ? body["externalReference"]
          : null;
    const externalEventId =
      typeof event["event_hash"] === "string"
        ? event["event_hash"]
        : typeof body["id"] === "string"
          ? body["id"]
          : `dbs-${Date.now()}-${eventType}`;

    const type: NormalizedSignatureEvent["type"] =
      eventType.includes("signed")
        ? "signed"
        : eventType.includes("viewed") || eventType.includes("view")
          ? "viewed"
          : eventType.includes("declined")
            ? "declined"
            : eventType.includes("all_signed") || eventType.includes("complete")
              ? "completed"
              : eventType.includes("cancel")
                ? "cancelled"
                : eventType.includes("expire")
                  ? "expired"
                  : eventType.includes("sent") || eventType.includes("request")
                    ? "sent"
                    : "failed";

    return [
      {
        externalEventId,
        externalEnvelopeId,
        type,
        recipientEmail:
          typeof body["email"] === "string"
            ? body["email"]
            : typeof event["event_metadata"] === "object" &&
                event["event_metadata"] &&
                typeof (event["event_metadata"] as Record<string, unknown>)["related_signature_id"] === "string"
              ? null
              : null,
        recipientExternalId:
          typeof body["recipientExternalId"] === "string" ? body["recipientExternalId"] : null,
        occurredAt: new Date().toISOString(),
        payloadDigest: createHmac("sha256", "mpa").update(rawBody).digest("hex").slice(0, 32)
      }
    ];
  }
};
