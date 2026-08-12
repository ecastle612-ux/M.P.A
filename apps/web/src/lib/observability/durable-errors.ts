import type { ErrorSeverity } from "./types";

export type PlatformErrorEventRow = {
  id: string;
  created_at: string;
  severity: ErrorSeverity;
  message: string;
  error_name: string | null;
  stack: string | null;
  request_id: string | null;
  organization_id: string | null;
  actor_id: string | null;
  route: string | null;
  source: string;
  metadata: Record<string, unknown>;
};

async function tryServiceRole() {
  try {
    if (process.env["VITEST"]) return null;
    const { serverEnv } = await import("../env/server-env");
    if (!serverEnv.SUPABASE_SERVICE_ROLE_KEY) return null;
    const { createServiceRoleClient } = await import("../supabase/service-role");
    return createServiceRoleClient();
  } catch {
    return null;
  }
}

export async function persistPlatformErrorEvent(input: {
  severity: ErrorSeverity;
  message: string;
  errorName?: string;
  stack?: string;
  requestId?: string;
  organizationId?: string;
  actorId?: string;
  route?: string;
  source?: "server" | "client" | "edge" | "job";
  metadata?: Record<string, string>;
}): Promise<{ ok: true; id?: string } | { ok: false; error: string }> {
  // Only persist warning+ to keep the MA feed actionable.
  if (input.severity === "debug" || input.severity === "info") {
    return { ok: false, error: "Severity below durable threshold" };
  }

  const service = await tryServiceRole();
  if (!service) {
    return { ok: false, error: "Service role unavailable" };
  }

  try {
    const { data, error } = await service
      .from("platform_error_events")
      .insert({
        severity: input.severity,
        message: input.message.slice(0, 2000),
        error_name: input.errorName?.slice(0, 200) ?? null,
        stack: input.stack?.slice(0, 8000) ?? null,
        request_id: input.requestId ?? null,
        organization_id: input.organizationId ?? null,
        actor_id: input.actorId ?? null,
        route: input.route?.slice(0, 500) ?? null,
        source: input.source ?? "server",
        metadata: input.metadata ?? {}
      })
      .select("id")
      .maybeSingle();

    if (error) {
      return { ok: false, error: error.message };
    }
    const id = typeof data?.id === "string" ? data.id : undefined;
    return id ? { ok: true, id } : { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to persist error event"
    };
  }
}

const ERROR_SELECT =
  "id, created_at, severity, message, error_name, stack, request_id, organization_id, actor_id, route, source, metadata";

export async function listRecentPlatformErrorEvents(limit = 25): Promise<PlatformErrorEventRow[]> {
  const service = await tryServiceRole();
  if (!service) {
    return [];
  }
  try {
    const { data, error } = await service
      .from("platform_error_events")
      .select(ERROR_SELECT)
      .order("created_at", { ascending: false })
      .limit(Math.min(Math.max(limit, 1), 100));
    if (error || !data) {
      return [];
    }
    return data as PlatformErrorEventRow[];
  } catch {
    return [];
  }
}

export type ListPlatformErrorEventsQuery = {
  limit?: number;
  severity?: string;
  organizationId?: string;
  since?: string;
  until?: string;
  routeContains?: string;
};

/**
 * MA-1 — operator inspect query over platform_error_events.
 * Service-role read; caller must enforce platform operator authorization.
 */
export async function listPlatformErrorEvents(
  query: ListPlatformErrorEventsQuery = {}
): Promise<{ rows: PlatformErrorEventRow[]; degraded: boolean; detail?: string }> {
  const service = await tryServiceRole();
  if (!service) {
    return { rows: [], degraded: true, detail: "Service role unavailable — durable error feed empty" };
  }

  const limit = Math.min(Math.max(query.limit ?? 50, 1), 200);

  try {
    // Loose client: generated Database types may lag Sprint 5 table.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- additive ops table
    let q: any = service
      .from("platform_error_events")
      .select(ERROR_SELECT)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (query.severity && query.severity !== "all") {
      q = q.eq("severity", query.severity);
    }
    if (query.organizationId) {
      q = q.eq("organization_id", query.organizationId);
    }
    if (query.since) {
      q = q.gte("created_at", query.since);
    }
    if (query.until) {
      q = q.lte("created_at", query.until);
    }

    const { data, error } = await q;
    if (error) {
      return { rows: [], degraded: true, detail: error.message };
    }

    let rows = (data ?? []) as PlatformErrorEventRow[];
    if (query.routeContains) {
      const needle = query.routeContains.toLowerCase();
      rows = rows.filter((row) => {
        const hay = `${row.route ?? ""} ${row.error_name ?? ""} ${row.message}`.toLowerCase();
        return hay.includes(needle);
      });
    }
    return { rows, degraded: false };
  } catch (error) {
    return {
      rows: [],
      degraded: true,
      detail: error instanceof Error ? error.message : "Failed to load platform_error_events"
    };
  }
}

export async function getPlatformErrorEventById(
  id: string
): Promise<{ row: PlatformErrorEventRow | null; degraded: boolean; detail?: string }> {
  const service = await tryServiceRole();
  if (!service) {
    return { row: null, degraded: true, detail: "Service role unavailable" };
  }
  try {
    const { data, error } = await service
      .from("platform_error_events")
      .select(ERROR_SELECT)
      .eq("id", id)
      .maybeSingle();
    if (error) {
      return { row: null, degraded: true, detail: error.message };
    }
    return { row: (data as PlatformErrorEventRow | null) ?? null, degraded: false };
  } catch (error) {
    return {
      row: null,
      degraded: true,
      detail: error instanceof Error ? error.message : "Failed to load error event"
    };
  }
}
