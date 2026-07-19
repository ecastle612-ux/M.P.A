import { log } from "./logger";
import { getEnvironment } from "./context";
import { redactString } from "./redaction";
import type { AuditEvent } from "./types";

/**
 * Record a compliance-grade audit event. Append-only by contract and fail-open.
 *
 * Foundation behavior: events are emitted through the structured log sink tagged
 * `audit: true`. A durable, immutable audit store (DB table) is a documented, Deferred
 * adapter that requires its own database design + RLS approval per the Implementation
 * Gate — it is intentionally NOT created here (no schema change).
 */
export function recordAuditEvent(event: AuditEvent): void {
  try {
    const record: Record<string, string | number | boolean | null> = {
      audit: true,
      action: event.action,
      resourceType: event.resourceType,
      environment: getEnvironment(),
      severity: event.severity ?? "info"
    };

    if (event.resourceId) record["resourceId"] = event.resourceId;
    if (event.actorId) record["actorId"] = event.actorId;
    if (event.actorRole) record["actorRole"] = event.actorRole;
    if (event.organizationId) record["organizationId"] = event.organizationId;
    if (event.requestId) record["requestId"] = event.requestId;
    if (event.ipHash) record["ipHash"] = event.ipHash;

    if (event.metadata) {
      for (const [key, value] of Object.entries(event.metadata)) {
        record[`meta_${key}`] = typeof value === "string" ? redactString(value) : value;
      }
    }

    log("info", "audit_event", record);
  } catch {
    // fail-open: audit emission must never break the request path
  }
}
