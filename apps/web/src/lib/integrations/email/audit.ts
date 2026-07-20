import { createHash } from "node:crypto";
import type { EmailProviderKey, EmailTemplateKey, SendEmailResult } from "./contracts";

export type EmailDeliveryTelemetry = {
  lastSuccessAt: string | null;
  lastFailureAt: string | null;
  lastFailureMessage: string | null;
  lastDeliveryAt: string | null;
  lastDeliveryStatus: SendEmailResult["status"] | null;
  lastRequestId: string | null;
  lastExternalId: string | null;
  lastTemplateKey: EmailTemplateKey | null;
};

const telemetry: EmailDeliveryTelemetry = {
  lastSuccessAt: null,
  lastFailureAt: null,
  lastFailureMessage: null,
  lastDeliveryAt: null,
  lastDeliveryStatus: null,
  lastRequestId: null,
  lastExternalId: null,
  lastTemplateKey: null
};

/** Process-local idempotency guard to prevent duplicate logical sends. */
const recentIdempotencyKeys = new Map<string, { at: number; result: SendEmailResult }>();
const IDEMPOTENCY_TTL_MS = 15 * 60 * 1000;

export function redactEmail(email: string): string {
  const trimmed = email.trim().toLowerCase();
  const at = trimmed.indexOf("@");
  if (at <= 1) return "***";
  const domain = trimmed.slice(at + 1);
  return `${trimmed[0]}***@${domain}`;
}

export function hashEmail(email: string): string {
  return createHash("sha256").update(email.trim().toLowerCase()).digest("hex").slice(0, 16);
}

export function getEmailDeliveryTelemetry(): EmailDeliveryTelemetry {
  return { ...telemetry };
}

export function rememberIdempotentResult(idempotencyKey: string, result: SendEmailResult): void {
  recentIdempotencyKeys.set(idempotencyKey, { at: Date.now(), result });
  pruneIdempotencyCache();
}

export function getRecentIdempotentResult(idempotencyKey: string): SendEmailResult | null {
  pruneIdempotencyCache();
  return recentIdempotencyKeys.get(idempotencyKey)?.result ?? null;
}

function pruneIdempotencyCache(): void {
  const cutoff = Date.now() - IDEMPOTENCY_TTL_MS;
  for (const [key, entry] of recentIdempotencyKeys) {
    if (entry.at < cutoff) recentIdempotencyKeys.delete(key);
  }
}

export function recordEmailAudit(input: {
  organizationId: string;
  providerKey: EmailProviderKey;
  templateKey: EmailTemplateKey;
  idempotencyKey: string;
  recipientEmail: string;
  result: SendEmailResult;
  correlation?: {
    notificationId?: string | null;
    sourceEntityType?: string | null;
    sourceEntityId?: string | null;
  };
}): void {
  const now = new Date().toISOString();
  const entry = {
    timestamp: now,
    organizationId: input.organizationId,
    provider: input.providerKey,
    template: input.templateKey,
    idempotencyKey: input.idempotencyKey,
    recipient: redactEmail(input.recipientEmail),
    recipientHash: hashEmail(input.recipientEmail),
    requestId: input.result.requestId ?? null,
    externalId: input.result.externalId ?? null,
    deliveryResult: input.result.status,
    errorCode: input.result.errorCode ?? null,
    correlation: input.correlation ?? null
  };

  // Structured audit log — never includes API keys or Authorization headers.
  console.info("[email.audit]", entry);

  telemetry.lastDeliveryAt = now;
  telemetry.lastDeliveryStatus = input.result.status;
  telemetry.lastRequestId = input.result.requestId ?? null;
  telemetry.lastExternalId = input.result.externalId ?? null;
  telemetry.lastTemplateKey = input.templateKey;

  if (input.result.status === "sent" || input.result.status === "queued") {
    telemetry.lastSuccessAt = now;
  } else if (input.result.status === "failed") {
    telemetry.lastFailureAt = now;
    telemetry.lastFailureMessage = input.result.errorCode ?? input.result.errorMessage ?? "failed";
  }
}
