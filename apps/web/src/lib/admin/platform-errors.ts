/**
 * MA-1 Critical Errors — safe DTOs and filter helpers over platform_error_events.
 * Never expose secrets, tokens, or payment credentials.
 */

import { scrubMetadata, scrubString, scrubUnknown } from "../observability/scrub";
import type { ErrorSeverity } from "../observability/types";
import type { PlatformErrorEventRow } from "../observability/durable-errors";

export type PlatformErrorFilters = {
  severity?: ErrorSeverity | "all";
  organizationId?: string;
  routeContains?: string;
  /** ISO lower bound (inclusive) */
  since?: string;
  /** ISO upper bound (inclusive) */
  until?: string;
  /** Reserved — schema has no resolution columns in Sprint 5 */
  resolution?: "all";
};

export type SafePlatformErrorDto = {
  id: string;
  createdAt: string;
  severity: ErrorSeverity;
  message: string;
  errorName: string | null;
  route: string | null;
  organizationId: string | null;
  requestId: string | null;
  source: string;
  actorId: string | null;
  /** Stack truncated + scrubbed; omitted when empty */
  stack: string | null;
  metadata: Record<string, unknown>;
  /**
   * Occurrence count is not stored on platform_error_events.
   * Always 1 per row; documented for future slice.
   */
  occurrenceCount: number;
  /**
   * Resolution is not in schema (Sprint 5). Always "untracked".
   */
  resolutionStatus: "untracked";
  resolutionNote: string;
};

export const RESOLUTION_LIMITATION =
  "platform_error_events has no resolved_at/resolved_by columns. Resolution filtering is deferred to a future MA slice — do not invent an incomplete resolution system.";

const MAX_STACK = 4000;

function scrubStack(stack: string | null): string | null {
  if (!stack) return null;
  return scrubString(stack)
    .replace(/\b(password|passwd|secret|token|api[_-]?key)\s*[:=]\s*\S+/gi, "$1=[redacted]")
    .slice(0, MAX_STACK);
}

export function toSafePlatformErrorDto(row: PlatformErrorEventRow): SafePlatformErrorDto {
  const scrubbedMeta = scrubUnknown(row.metadata ?? {}) as Record<string, unknown>;
  const flatMeta = scrubMetadata(
    Object.fromEntries(
      Object.entries(scrubbedMeta).map(([k, v]) => [
        k,
        typeof v === "string" || typeof v === "number" || typeof v === "boolean" || v == null
          ? v
          : JSON.stringify(v)
      ])
    )
  );

  return {
    id: row.id,
    createdAt: row.created_at,
    severity: row.severity,
    message: scrubString(row.message).slice(0, 2000),
    errorName: row.error_name ? scrubString(row.error_name).slice(0, 200) : null,
    route: row.route ? scrubString(row.route).slice(0, 500) : null,
    organizationId: row.organization_id,
    requestId: row.request_id,
    source: row.source,
    actorId: row.actor_id,
    stack: scrubStack(row.stack),
    metadata: flatMeta,
    occurrenceCount: 1,
    resolutionStatus: "untracked",
    resolutionNote: RESOLUTION_LIMITATION
  };
}

export function filterPlatformErrorRows(
  rows: PlatformErrorEventRow[],
  filters: PlatformErrorFilters
): PlatformErrorEventRow[] {
  return rows.filter((row) => {
    if (filters.severity && filters.severity !== "all" && row.severity !== filters.severity) {
      return false;
    }
    if (filters.organizationId && row.organization_id !== filters.organizationId) {
      return false;
    }
    if (filters.routeContains) {
      const needle = filters.routeContains.toLowerCase();
      const route = (row.route ?? "").toLowerCase();
      const name = (row.error_name ?? "").toLowerCase();
      const message = row.message.toLowerCase();
      if (!route.includes(needle) && !name.includes(needle) && !message.includes(needle)) {
        return false;
      }
    }
    if (filters.since) {
      if (row.created_at < filters.since) return false;
    }
    if (filters.until) {
      if (row.created_at > filters.until) return false;
    }
    return true;
  });
}

export function parseErrorTimeRange(
  range: string | null | undefined,
  now = new Date()
): { since?: string; label: string } {
  const value = (range ?? "24h").toLowerCase();
  const ms =
    value === "1h"
      ? 60 * 60 * 1000
      : value === "7d"
        ? 7 * 24 * 60 * 60 * 1000
        : value === "30d"
          ? 30 * 24 * 60 * 60 * 1000
          : 24 * 60 * 60 * 1000;
  const label =
    value === "1h" ? "Last 1 hour" : value === "7d" ? "Last 7 days" : value === "30d" ? "Last 30 days" : "Last 24 hours";
  return { since: new Date(now.getTime() - ms).toISOString(), label };
}

export function parsePlatformErrorFilters(
  params: URLSearchParams | Record<string, string | string[] | undefined>
): PlatformErrorFilters & { rangeLabel: string } {
  const get = (key: string): string | undefined => {
    if (params instanceof URLSearchParams) {
      return params.get(key) ?? undefined;
    }
    const raw = params[key];
    return Array.isArray(raw) ? raw[0] : raw;
  };

  const severityRaw = get("severity") ?? "all";
  const allowed = ["all", "debug", "info", "warning", "error", "critical"] as const;
  const severity = (allowed as readonly string[]).includes(severityRaw)
    ? (severityRaw as NonNullable<PlatformErrorFilters["severity"]>)
    : "all";

  const range = parseErrorTimeRange(get("range"));
  const organizationId = get("organizationId")?.trim();
  const routeContains = get("q")?.trim() || get("route")?.trim();

  const out: PlatformErrorFilters & { rangeLabel: string } = {
    severity,
    rangeLabel: range.label,
    resolution: "all"
  };
  if (organizationId) out.organizationId = organizationId;
  if (routeContains) out.routeContains = routeContains;
  if (range.since) out.since = range.since;
  return out;
}
