import { persistPlatformErrorEvent } from "./durable-errors";
import { log } from "./logger";
import { scrubMetadata, scrubString } from "./scrub";
import { forwardToSentry, getSentryDsn } from "./sentry-sink";
import type { CaptureExceptionOptions, ErrorSeverity } from "./types";

function normalizeError(error: unknown): { message: string; name?: string; stack?: string } {
  if (error instanceof Error) {
    const normalized: { message: string; name?: string; stack?: string } = {
      message: scrubString(error.message || "Error"),
      name: scrubString(error.name || "Error")
    };
    if (error.stack) {
      normalized.stack = scrubString(error.stack);
    }
    return normalized;
  }
  if (typeof error === "string") {
    return { message: scrubString(error) };
  }
  try {
    return { message: scrubString(JSON.stringify(error)) };
  } catch {
    return { message: "Unknown error" };
  }
}

export function resolveSeverity(options?: CaptureExceptionOptions): ErrorSeverity {
  return options?.severity ?? "error";
}

/**
 * Production exception sink. Fail-open: never throws to callers.
 * - Always structured console log
 * - Optional Sentry when DSN configured
 * - Durable store for warning+ when service role available
 */
export function captureException(error: unknown, options: CaptureExceptionOptions = {}): void {
  const normalized = normalizeError(error);
  const severity = resolveSeverity(options);
  const metadata = scrubMetadata({
    ...(options.metadata ?? {}),
    severity,
    requestId: options.requestId,
    organizationId: options.organizationId,
    actorId: options.actorId,
    actorRole: options.actorRole,
    route: options.route,
    source: options.source ?? "server",
    errorName: normalized.name,
    sentryConfigured: Boolean(getSentryDsn())
  });

  log("error", normalized.message, metadata);

  if (options.persistDurable !== false) {
    void persistPlatformErrorEvent({
      severity,
      message: normalized.message,
      ...(normalized.name ? { errorName: normalized.name } : {}),
      ...(normalized.stack ? { stack: normalized.stack } : {}),
      ...(options.requestId ? { requestId: options.requestId } : {}),
      ...(options.organizationId ? { organizationId: options.organizationId } : {}),
      ...(options.actorId ? { actorId: options.actorId } : {}),
      ...(options.route ? { route: options.route } : {}),
      source: options.source ?? "server",
      metadata
    }).catch(() => {
      /* fail-open */
    });
  }

  void forwardToSentry({
    message: normalized.message,
    severity,
    metadata,
    ...(normalized.name ? { errorName: normalized.name } : {}),
    ...(normalized.stack ? { stack: normalized.stack } : {}),
    ...(options.requestId ? { requestId: options.requestId } : {}),
    ...(options.organizationId ? { organizationId: options.organizationId } : {}),
    ...(options.route ? { route: options.route } : {})
  }).catch(() => {
    /* fail-open */
  });
}

/** Back-compat: older callers pass a flat string record. */
export function captureExceptionLegacy(
  error: unknown,
  metadata: Record<string, string> = {}
): void {
  const options: CaptureExceptionOptions = { metadata };
  if (metadata["route"]) options.route = metadata["route"];
  if (metadata["requestId"]) options.requestId = metadata["requestId"];
  if (metadata["organizationId"]) options.organizationId = metadata["organizationId"];
  if (metadata["actorId"]) options.actorId = metadata["actorId"];
  if (metadata["actorRole"]) options.actorRole = metadata["actorRole"];
  captureException(error, options);
}
