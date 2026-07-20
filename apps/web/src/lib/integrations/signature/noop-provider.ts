import type {
  CreateEnvelopeInput,
  EnvelopeRef,
  EnvelopeStatus,
  ExecutedArtifact,
  NormalizedSignatureEvent,
  SignatureProvider
} from "./contracts";

/**
 * Local/CI provider — no external network.
 * Sandbox simulate path completes via SignatureService webhooks.
 */
export const noopSignatureProvider: SignatureProvider = {
  id: "noop",

  async createEnvelope(input: CreateEnvelopeInput): Promise<EnvelopeRef> {
    const externalReference = `noop-env-${input.packageNumber}`;
    const recipientExternalIds: Record<string, string> = {};
    const signingUrls: Record<string, string> = {};
    for (const recipient of input.recipients) {
      recipientExternalIds[recipient.id] = `noop-rcpt-${recipient.id.slice(0, 8)}`;
      signingUrls[recipient.id] = `/signing/progress/pending#noop-${recipient.id}`;
    }
    return { externalReference, recipientExternalIds, signingUrls };
  },

  async getEnvelopeStatus(ref: EnvelopeRef): Promise<EnvelopeStatus> {
    return { externalReference: ref.externalReference, status: "sent" };
  },

  async cancelEnvelope(): Promise<void> {
    return;
  },

  async remindRecipient(): Promise<void> {
    return;
  },

  async downloadExecutedDocuments(ref: EnvelopeRef): Promise<ExecutedArtifact[]> {
    const body = Buffer.from(`NOOP executed document for ${ref.externalReference}`, "utf8").toString("base64");
    return [
      {
        name: "executed-agreement.pdf",
        contentType: "application/pdf",
        kind: "executed",
        contentBase64: body
      }
    ];
  },

  async downloadCertificate(ref: EnvelopeRef): Promise<ExecutedArtifact | null> {
    return {
      name: "certificate-of-completion.pdf",
      contentType: "application/pdf",
      kind: "certificate",
      contentBase64: Buffer.from(`NOOP certificate ${ref.externalReference}`, "utf8").toString("base64")
    };
  },

  async parseWebhook(payload: unknown): Promise<NormalizedSignatureEvent[]> {
    const body = (payload ?? {}) as Record<string, unknown>;
    const type = String(body["type"] ?? body["event"] ?? "completed");
    const externalEnvelopeId =
      typeof body["externalReference"] === "string"
        ? body["externalReference"]
        : typeof body["signature_request_id"] === "string"
          ? body["signature_request_id"]
          : null;
    const externalEventId =
      typeof body["id"] === "string" ? body["id"] : `noop-${Date.now()}-${type}`;
    const mapped =
      type.includes("view")
        ? "viewed"
        : type.includes("sign") && !type.includes("complete")
          ? "signed"
          : type.includes("decline")
            ? "declined"
            : type.includes("expire")
              ? "expired"
              : type.includes("cancel")
                ? "cancelled"
                : type.includes("fail")
                  ? "failed"
                  : type.includes("sent")
                    ? "sent"
                    : "completed";
    return [
      {
        externalEventId,
        externalEnvelopeId,
        type: mapped,
        recipientExternalId:
          typeof body["recipientExternalId"] === "string" ? body["recipientExternalId"] : null,
        recipientEmail: typeof body["email"] === "string" ? body["email"] : null,
        occurredAt: new Date().toISOString()
      }
    ];
  }
};
