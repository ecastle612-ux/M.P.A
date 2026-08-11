/**
 * MA-7 mutation audit — reuses platform_support_audit_events via writeSupportAudit.
 * Never logs secrets.
 */

import { scrubUnknown } from "../observability/scrub";
import { writeSupportAudit } from "./impersonation-service";

export type Ma7AuditResult = "success" | "failure" | "rejected" | "idempotent";

export type Ma7AuditInput = {
  operatorUserId: string;
  organizationId: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  reason: string | null;
  correlationId: string;
  result: Ma7AuditResult;
  previousState?: Record<string, unknown> | null;
  resultingState?: Record<string, unknown> | null;
  errorCode?: string | null;
  idempotencyKey?: string | null;
  extra?: Record<string, unknown>;
};

export async function writeMa7Audit(input: Ma7AuditInput): Promise<{ ok: boolean; error?: string }> {
  try {
    const payload = scrubUnknown({
      result: input.result,
      reason: input.reason,
      correlationId: input.correlationId,
      previousState: input.previousState ?? null,
      resultingState: input.resultingState ?? null,
      errorCode: input.errorCode ?? null,
      idempotencyKey: input.idempotencyKey ?? null,
      ...(input.extra ?? {})
    }) as Record<string, unknown>;

    await writeSupportAudit({
      operatorUserId: input.operatorUserId,
      organizationId: input.organizationId,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      payload
    });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "audit_failed" };
  }
}
