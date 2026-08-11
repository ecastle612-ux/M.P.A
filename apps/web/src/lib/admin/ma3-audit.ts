/**
 * MA-3 Audit Log — pure helpers (read-only).
 */

import { scrubUnknown } from "../observability/scrub";
import { isAuthRelatedError } from "./ma1-overview";
import { parseErrorTimeRange } from "./platform-errors";

export type Ma3AuditSource = "support" | "domain" | "security";

export type Ma3AuditEvent = {
  id: string;
  source: Ma3AuditSource;
  createdAt: string;
  actorId: string | null;
  actorLabel: string | null;
  action: string;
  targetType: string;
  targetId: string | null;
  organizationId: string | null;
  organizationName: string | null;
  result: string;
  reason: string | null;
  correlationId: string | null;
  context: Record<string, unknown>;
};

export type Ma3AuditFilters = {
  range?: string;
  since?: string;
  organizationId?: string;
  actorId?: string;
  action?: string;
  targetType?: string;
  result?: string;
  source?: Ma3AuditSource | "all";
  q?: string;
};

export function scrubAuditPayload(payload: unknown): Record<string, unknown> {
  const scrubbed = scrubUnknown(payload ?? {});
  if (scrubbed && typeof scrubbed === "object" && !Array.isArray(scrubbed)) {
    return scrubbed as Record<string, unknown>;
  }
  return {};
}

export function parseAuditFilters(
  params: URLSearchParams | Record<string, string | string[] | undefined>
): Ma3AuditFilters & { rangeLabel: string } {
  const get = (key: string): string | undefined => {
    if (params instanceof URLSearchParams) return params.get(key) ?? undefined;
    const raw = params[key];
    return Array.isArray(raw) ? raw[0] : raw;
  };

  const range = get("range") ?? "7d";
  const parsedRange = parseErrorTimeRange(range);
  const out: Ma3AuditFilters & { rangeLabel: string } = {
    range,
    rangeLabel: parsedRange.label,
    source: "all"
  };
  if (parsedRange.since) out.since = parsedRange.since;

  const organizationId = get("organizationId")?.trim();
  const actorId = get("actor")?.trim() || get("actorId")?.trim();
  const action = get("action")?.trim();
  const targetType = get("targetType")?.trim();
  const result = get("result")?.trim();
  const q = get("q")?.trim();
  const sourceRaw = get("source")?.trim();

  if (organizationId) out.organizationId = organizationId;
  if (actorId) out.actorId = actorId;
  if (action) out.action = action;
  if (targetType) out.targetType = targetType;
  if (result) out.result = result;
  if (q) out.q = q;
  if (sourceRaw === "support" || sourceRaw === "domain" || sourceRaw === "security") {
    out.source = sourceRaw;
  }
  return out;
}

export function filterAuditEvents(
  events: Ma3AuditEvent[],
  filters: Ma3AuditFilters
): Ma3AuditEvent[] {
  const q = filters.q?.toLowerCase();
  return events.filter((e) => {
    if (filters.source && filters.source !== "all" && e.source !== filters.source) return false;
    if (filters.organizationId && e.organizationId !== filters.organizationId) return false;
    if (filters.actorId && e.actorId !== filters.actorId) return false;
    if (filters.action && !e.action.toLowerCase().includes(filters.action.toLowerCase())) {
      return false;
    }
    if (filters.targetType && e.targetType.toLowerCase() !== filters.targetType.toLowerCase()) {
      return false;
    }
    if (filters.result && e.result.toLowerCase() !== filters.result.toLowerCase()) return false;
    if (filters.since && e.createdAt < filters.since) return false;
    if (q) {
      const hay = [
        e.action,
        e.actorId ?? "",
        e.actorLabel ?? "",
        e.targetType,
        e.targetId ?? "",
        e.organizationId ?? "",
        e.organizationName ?? "",
        e.result,
        e.reason ?? "",
        e.correlationId ?? ""
      ]
        .join(" ")
        .toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

export function mapSupportAuditRow(row: {
  id: string;
  created_at: string;
  operator_user_id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  organization_id: string | null;
  payload: unknown;
  organizationName?: string | null;
}): Ma3AuditEvent {
  const context = scrubAuditPayload(row.payload);
  const reason =
    typeof context["reason"] === "string"
      ? context["reason"]
      : typeof context["notice"] === "string"
        ? context["notice"]
        : null;
  return {
    id: row.id,
    source: "support",
    createdAt: row.created_at,
    actorId: row.operator_user_id,
    actorLabel: "platform_operator",
    action: row.action,
    targetType: row.entity_type,
    targetId: row.entity_id,
    organizationId: row.organization_id,
    organizationName: row.organizationName ?? null,
    result: "recorded",
    reason,
    correlationId: typeof context["requestId"] === "string" ? context["requestId"] : null,
    context
  };
}

export function mapDomainAuditRow(row: {
  id: string;
  created_at: string;
  actor_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  organization_id: string | null;
  payload: unknown;
  correlation_id?: string | null;
  organizationName?: string | null;
}): Ma3AuditEvent {
  const context = scrubAuditPayload(row.payload);
  return {
    id: row.id,
    source: "domain",
    createdAt: row.created_at,
    actorId: row.actor_id,
    actorLabel: null,
    action: row.action,
    targetType: row.entity_type,
    targetId: row.entity_id,
    organizationId: row.organization_id,
    organizationName: row.organizationName ?? null,
    result: "recorded",
    reason: typeof context["reason"] === "string" ? context["reason"] : null,
    correlationId: row.correlation_id ?? (typeof context["correlation_id"] === "string" ? context["correlation_id"] : null),
    context
  };
}

export function mapSecurityErrorToAudit(row: {
  id: string;
  created_at: string;
  message: string;
  route: string | null;
  organization_id: string | null;
  actor_id: string | null;
  request_id: string | null;
  severity: string;
  metadata: Record<string, unknown>;
}): Ma3AuditEvent | null {
  if (
    !isAuthRelatedError({
      message: row.message,
      route: row.route,
      metadata: row.metadata
    })
  ) {
    return null;
  }
  return {
    id: row.id,
    source: "security",
    createdAt: row.created_at,
    actorId: row.actor_id,
    actorLabel: null,
    action: "authorization_or_security_signal",
    targetType: "route",
    targetId: row.route,
    organizationId: row.organization_id,
    organizationName: null,
    result: row.severity,
    reason: row.message.slice(0, 500),
    correlationId: row.request_id,
    context: scrubAuditPayload(row.metadata)
  };
}
