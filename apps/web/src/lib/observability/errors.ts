import { log } from "./logger";
import { getEnvironment } from "./context";
import { redactString, redactContext } from "./redaction";
import type { CaptureMetadata } from "./types";

const ENVELOPE_KEYS = new Set(["module", "severity"]);

/**
 * Capture an error into the observability sink with a standard, PII-scrubbed envelope
 * (`timestamp, environment, severity, module, request_id, organization, user`). Always
 * non-blocking and fail-open: telemetry must never throw into caller code paths.
 */
export function captureException(error: unknown, metadata: CaptureMetadata = {}): void {
  try {
    const rawMessage =
      error instanceof Error ? error.message : typeof error === "string" ? error : "Unknown error";

    const extras: Record<string, string | number | boolean | null | undefined> = {};
    for (const [key, value] of Object.entries(metadata)) {
      if (ENVELOPE_KEYS.has(key)) continue;
      extras[key] = value;
    }

    log("error", redactString(rawMessage), {
      timestamp: new Date().toISOString(),
      environment: getEnvironment(),
      severity: metadata.severity ?? "error",
      module: metadata.module ?? "unknown",
      errorName: error instanceof Error ? error.name : "UnknownError",
      ...redactContext(extras)
    });
  } catch {
    // fail-open: swallow telemetry failures
  }
}
