/**
 * SignWell adapter — V1.0 primary SignatureProvider (ADR-030 / API-004 amendment).
 * Uses REST only (no provider SDK in business modules).
 * Sandbox works without live keys when SIGNWELL_MODE=sandbox or key absent.
 */

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

function apiKey(): string | undefined {
  return env("SIGNWELL_API_KEY");
}

function webhookId(): string | undefined {
  return env("SIGNWELL_WEBHOOK_ID");
}

function isSandboxMode(): boolean {
  if (env("SIGNWELL_MODE") === "sandbox") return true;
  if (env("SIGNWELL_MODE") === "production") return false;
  const key = apiKey();
  return !key || key.startsWith("test_") || key.startsWith("sandbox_");
}

function baseUrl(): string {
  return (env("SIGNWELL_API_BASE_URL") ?? "https://www.signwell.com/api/v1").replace(/\/$/, "");
}

const DEFAULT_TIMEOUT_MS = 30_000;
const MAX_RETRIES = 4;

function retryBaseMs(): number {
  const raw = env("SIGNWELL_RETRY_BASE_MS");
  if (raw) {
    const parsed = Number(raw);
    if (Number.isFinite(parsed) && parsed >= 0) return parsed;
  }
  return 1000;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableStatus(status: number): boolean {
  return status === 429 || status >= 500;
}

async function signwellFetch(path: string, init?: RequestInit): Promise<Response> {
  const key = apiKey();
  if (!key) throw new Error("SIGNWELL_API_KEY is not configured");

  const url = `${baseUrl()}${path.startsWith("/") ? path : `/${path}`}`;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);
    try {
      const response = await fetch(url, {
        ...init,
        signal: controller.signal,
        headers: {
          "X-Api-Key": key,
          Accept: "application/json",
          ...(init?.body && !(init.body instanceof FormData)
            ? { "Content-Type": "application/json" }
            : {}),
          ...(init?.headers ?? {})
        }
      });
      if (isRetryableStatus(response.status) && attempt < MAX_RETRIES) {
        await sleep(Math.min(32_000, retryBaseMs() * 2 ** attempt));
        continue;
      }
      return response;
    } catch (error) {
      lastError =
        error instanceof Error
          ? error.name === "AbortError"
            ? new Error("SignWell request timed out")
            : error
          : new Error("SignWell network failure");
      if (attempt < MAX_RETRIES) {
        await sleep(Math.min(32_000, retryBaseMs() * 2 ** attempt));
        continue;
      }
    } finally {
      clearTimeout(timer);
    }
  }

  throw lastError ?? new Error("SignWell request failed");
}

function normalizeProviderError(status: number, body: string): Error {
  if (status === 401) return new Error("SignWell authentication failed");
  if (status === 404) return new Error("SignWell document not found");
  if (status === 422) return new Error(`SignWell validation error: ${body.slice(0, 400)}`);
  if (status === 429) return new Error("SignWell rate limit exceeded");
  if (status >= 500) return new Error("SignWell API outage");
  return new Error(`SignWell request failed: ${status} ${body.slice(0, 400)}`);
}

/**
 * Official verification: HMAC-SHA256(webhookId, `${type}@${time}`) === event.hash
 * @see https://developers.signwell.com/reference/event-hash-verification
 */
export function verifySignWellEventHash(
  event: { type?: unknown; time?: unknown; hash?: unknown },
  key: string
): boolean {
  const type = typeof event.type === "string" ? event.type : "";
  const time = event.time;
  const expected = typeof event.hash === "string" ? event.hash : "";
  if (!type || time == null || !expected) return false;
  const data = `${type}@${String(time)}`;
  const digest = createHmac("sha256", key).update(data).digest("hex");
  try {
    return timingSafeEqual(Buffer.from(digest), Buffer.from(expected));
  } catch {
    return false;
  }
}

function mapStatus(raw: string | undefined): EnvelopeStatus["status"] {
  const status = (raw ?? "").toLowerCase();
  if (status === "completed") return "completed";
  if (status === "declined") return "declined";
  if (status === "expired") return "expired";
  if (status === "canceled" || status === "cancelled") return "cancelled";
  if (status === "error" || status === "bounced" || status === "failed") return "failed";
  if (status === "draft" || status === "saved") return "sent";
  return "in_progress";
}

function mapEventType(eventType: string): NormalizedSignatureEvent["type"] {
  const t = eventType.toLowerCase();
  if (t.includes("completed") || t.includes("all_signed")) return "completed";
  if (t.includes("signed") && !t.includes("completed")) return "signed";
  if (t.includes("viewed") || t.includes("view")) return "viewed";
  if (t.includes("declined")) return "declined";
  if (t.includes("expired") || t.includes("expire")) return "expired";
  if (t.includes("cancel")) return "cancelled";
  if (t.includes("error") || t.includes("bounce") || t.includes("fail")) return "failed";
  if (t.includes("sent") || t.includes("created") || t.includes("in_progress")) return "sent";
  return "failed";
}

function expiresInDays(expiresAt: string | null | undefined): number | undefined {
  if (!expiresAt) return undefined;
  const ms = Date.parse(expiresAt) - Date.now();
  if (!Number.isFinite(ms) || ms <= 0) return 1;
  return Math.max(1, Math.ceil(ms / (24 * 60 * 60 * 1000)));
}

type SignWellDocumentResponse = {
  id?: string;
  status?: string;
  recipients?: Array<{
    id?: string | number;
    email?: string;
    name?: string;
    embedded_signing_url?: string;
  }>;
};

export const signwellProvider: SignatureProvider = {
  id: "signwell",

  async createEnvelope(input: CreateEnvelopeInput): Promise<EnvelopeRef> {
    if (isSandboxMode() && !apiKey()) {
      const recipientExternalIds: Record<string, string> = {};
      const signingUrls: Record<string, string> = {};
      for (const recipient of input.recipients) {
        recipientExternalIds[recipient.id] = `sw-rcpt-${recipient.id.slice(0, 8)}`;
        signingUrls[recipient.id] =
          `https://www.signwell.com/sandbox/sign/${input.packageNumber}/${recipient.id}`;
      }
      return {
        externalReference: `sw-sandbox-${input.packageNumber}`,
        recipientExternalIds,
        signingUrls
      };
    }

    const recipients = input.recipients.map((recipient, index) => ({
      id: String(index + 1),
      email: recipient.email,
      name: recipient.fullName,
      placeholder_name: recipient.role || `Signer_${index + 1}`
    }));

    const expiresIn = expiresInDays(input.expiresAt);
    const body: Record<string, unknown> = {
      test_mode: isSandboxMode() || Boolean(input.sandbox),
      name: input.subject,
      subject: input.subject,
      draft: false,
      with_signature_page: true,
      apply_signing_order: input.recipients.some((r) => r.signingOrder > 1),
      reminders: true,
      allow_decline: true,
      files: input.documents.map((doc) => ({
        name: doc.fileName,
        file_base64: doc.contentBase64
      })),
      recipients,
      metadata: {
        mpa_package_id: input.packageId,
        mpa_package_number: input.packageNumber,
        mpa_organization_id: input.organizationId,
        ...(input.metadata ?? {})
      }
    };
    if (input.message) body["message"] = input.message;
    if (expiresIn != null) body["expires_in"] = expiresIn;
    const accountId = env("SIGNWELL_ACCOUNT_ID");
    if (accountId) body["api_application_id"] = accountId;

    const response = await signwellFetch("/documents", {
      method: "POST",
      body: JSON.stringify(body)
    });
    if (!response.ok) {
      throw normalizeProviderError(response.status, await response.text());
    }

    const json = (await response.json()) as SignWellDocumentResponse;
    const externalReference = json.id;
    if (!externalReference) throw new Error("SignWell response missing document id");

    const recipientExternalIds: Record<string, string> = {};
    const signingUrls: Record<string, string> = {};
    for (const recipient of input.recipients) {
      const match = json.recipients?.find(
        (r) => r.email?.toLowerCase() === recipient.email.toLowerCase()
      );
      if (match?.id != null) recipientExternalIds[recipient.id] = String(match.id);
      if (match?.embedded_signing_url) signingUrls[recipient.id] = match.embedded_signing_url;
    }

    return {
      externalReference,
      recipientExternalIds,
      ...(Object.keys(signingUrls).length > 0 ? { signingUrls } : {})
    };
  },

  async getEnvelopeStatus(ref: EnvelopeRef): Promise<EnvelopeStatus> {
    if (isSandboxMode() && !apiKey()) {
      return { externalReference: ref.externalReference, status: "sent" };
    }
    const response = await signwellFetch(`/documents/${encodeURIComponent(ref.externalReference)}`);
    if (!response.ok) throw normalizeProviderError(response.status, await response.text());
    const json = (await response.json()) as SignWellDocumentResponse;
    return {
      externalReference: ref.externalReference,
      status: mapStatus(json.status)
    };
  },

  async cancelEnvelope(ref: EnvelopeRef): Promise<void> {
    if (isSandboxMode() && !apiKey()) return;
    const response = await signwellFetch(`/documents/${encodeURIComponent(ref.externalReference)}`, {
      method: "DELETE"
    });
    if (!response.ok && response.status !== 404) {
      throw normalizeProviderError(response.status, await response.text());
    }
  },

  async remindRecipient(ref: EnvelopeRef, _recipientExternalId: string): Promise<void> {
    if (isSandboxMode() && !apiKey()) return;
    // SignWell reminds all pending recipients on the document.
    const response = await signwellFetch(
      `/documents/${encodeURIComponent(ref.externalReference)}/remind`,
      { method: "POST", body: "{}" }
    );
    if (!response.ok && response.status !== 404) {
      throw normalizeProviderError(response.status, await response.text());
    }
  },

  async downloadExecutedDocuments(ref: EnvelopeRef): Promise<ExecutedArtifact[]> {
    if (isSandboxMode() && !apiKey()) {
      return [
        {
          name: "executed-agreement.pdf",
          contentType: "application/pdf",
          kind: "executed",
          contentBase64: Buffer.from(
            `SignWell sandbox executed ${ref.externalReference}`,
            "utf8"
          ).toString("base64")
        }
      ];
    }
    const response = await signwellFetch(
      `/documents/${encodeURIComponent(ref.externalReference)}/completed_pdf`
    );
    if (!response.ok) throw normalizeProviderError(response.status, await response.text());
    const contentType = response.headers.get("content-type") ?? "application/pdf";
    if (contentType.includes("application/json")) {
      const json = (await response.json()) as { url?: string; file_base64?: string };
      if (json.file_base64) {
        return [
          {
            name: "executed-agreement.pdf",
            contentType: "application/pdf",
            kind: "executed",
            contentBase64: json.file_base64,
            ...(json.url ? { url: json.url } : {})
          }
        ];
      }
      if (json.url) {
        return [
          {
            name: "executed-agreement.pdf",
            contentType: "application/pdf",
            kind: "executed",
            url: json.url
          }
        ];
      }
      throw new Error("SignWell completed PDF response missing file");
    }
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
    // SignWell embeds the audit trail in the completed PDF (final page).
    const executed = await this.downloadExecutedDocuments(ref);
    const primary = executed[0];
    if (!primary) return null;
    return {
      name: "certificate-of-completion.pdf",
      contentType: primary.contentType,
      kind: "certificate",
      ...(primary.contentBase64 ? { contentBase64: primary.contentBase64 } : {}),
      ...(primary.url ? { url: primary.url } : {})
    };
  },

  async parseWebhook(
    payload: unknown,
    headers: Record<string, string>
  ): Promise<NormalizedSignatureEvent[]> {
    const rawBody = headers["x-mpa-raw-body"] ?? JSON.stringify(payload ?? {});
    const simulate = headers["x-mpa-simulate"] === "1";
    const body = (payload ?? {}) as Record<string, unknown>;
    const eventNode = (body["event"] ?? {}) as Record<string, unknown>;

    const key = webhookId();
    if (!simulate) {
      if (key) {
        const ok = verifySignWellEventHash(
          {
            type: eventNode["type"],
            time: eventNode["time"],
            hash: eventNode["hash"]
          },
          key
        );
        if (!ok) throw new Error("Invalid SignWell webhook signature");
      } else if (!isSandboxMode()) {
        throw new Error("SIGNWELL_WEBHOOK_ID is not configured");
      }
    }

    const eventType = String(
      eventNode["type"] ?? body["event_type"] ?? body["type"] ?? "unknown"
    );
    const dataObject =
      (body["data"] as Record<string, unknown> | undefined)?.["object"] ??
      body["data"] ??
      body["object"] ??
      {};
    const object =
      typeof dataObject === "object" && dataObject ? (dataObject as Record<string, unknown>) : {};

    const externalEnvelopeId =
      typeof object["id"] === "string"
        ? object["id"]
        : typeof body["externalReference"] === "string"
          ? body["externalReference"]
          : typeof body["id"] === "string"
            ? body["id"]
            : null;

    const relatedSigner =
      (eventNode["related_signer"] as Record<string, unknown> | undefined) ??
      (eventNode["related_recipient"] as Record<string, unknown> | undefined);

    const occurredAt =
      typeof eventNode["time"] === "number"
        ? new Date(eventNode["time"] * 1000).toISOString()
        : new Date().toISOString();

    const externalEventId =
      typeof eventNode["hash"] === "string"
        ? eventNode["hash"]
        : typeof body["id"] === "string"
          ? body["id"]
          : `sw-${Date.now()}-${eventType}`;

    return [
      {
        externalEventId,
        externalEnvelopeId,
        type: mapEventType(eventType),
        recipientEmail:
          typeof relatedSigner?.["email"] === "string"
            ? relatedSigner["email"]
            : typeof body["email"] === "string"
              ? body["email"]
              : null,
        recipientExternalId:
          typeof relatedSigner?.["id"] === "string" || typeof relatedSigner?.["id"] === "number"
            ? String(relatedSigner["id"])
            : typeof body["recipientExternalId"] === "string"
              ? body["recipientExternalId"]
              : null,
        occurredAt,
        payloadDigest: createHmac("sha256", "mpa").update(rawBody).digest("hex").slice(0, 32)
      }
    ];
  }
};
