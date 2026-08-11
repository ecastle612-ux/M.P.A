import { createAuthServerClient } from "../auth/server";
import { serverEnv } from "../env/server-env";
import { listPlatformErrorEvents } from "../observability/durable-errors";
import {
  filterAuditEvents,
  mapDomainAuditRow,
  mapSecurityErrorToAudit,
  mapSupportAuditRow,
  parseAuditFilters,
  type Ma3AuditEvent,
  type Ma3AuditFilters
} from "./ma3-audit";

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- additive ops tables
type AnyClient = { from: (table: string) => any };

async function tryServiceRole(): Promise<AnyClient | null> {
  try {
    if (process.env["VITEST"]) return null;
    if (!serverEnv.SUPABASE_SERVICE_ROLE_KEY) return null;
    const { createServiceRoleClient } = await import("../supabase/service-role");
    return createServiceRoleClient() as unknown as AnyClient;
  } catch {
    return null;
  }
}

export type Ma3AuditDirectory = {
  events: Ma3AuditEvent[];
  filters: Ma3AuditFilters & { rangeLabel: string };
  degraded: string[];
  limitations: string[];
};

export async function loadMa3AuditDirectory(
  searchParams: URLSearchParams | Record<string, string | string[] | undefined> = {}
): Promise<Ma3AuditDirectory> {
  const degraded: string[] = [];
  const limitations = [
    "Severity is not a first-class column on audit tables — security signals use platform_error_events heuristics.",
    "Actor role/capability beyond platform_operator / membership role is not stored on every audit row."
  ];
  const filters = parseAuditFilters(searchParams);
  const service = await tryServiceRole();
  const client = (service ?? ((await createAuthServerClient()) as unknown as AnyClient)) as AnyClient;

  const orgNameById = new Map<string, string>();
  try {
    const { data: orgs } = await client.from("organizations").select("id, name").limit(2000);
    for (const o of (orgs ?? []) as Array<{ id: string; name: string }>) {
      orgNameById.set(o.id, o.name);
    }
  } catch {
    // optional enrichment
  }

  const events: Ma3AuditEvent[] = [];

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let q: any = client
      .from("platform_support_audit_events")
      .select("id, created_at, operator_user_id, action, entity_type, entity_id, organization_id, payload")
      .order("created_at", { ascending: false })
      .limit(300);
    if (filters.organizationId) q = q.eq("organization_id", filters.organizationId);
    if (filters.actorId) q = q.eq("operator_user_id", filters.actorId);
    if (filters.since) q = q.gte("created_at", filters.since);
    const { data, error } = await q;
    if (error) degraded.push(`Support audit: ${error.message}`);
    else {
      for (const row of (data ?? []) as Array<Record<string, unknown>>) {
        const orgId = typeof row["organization_id"] === "string" ? row["organization_id"] : null;
        events.push(
          mapSupportAuditRow({
            id: String(row["id"]),
            created_at: String(row["created_at"] ?? ""),
            operator_user_id: String(row["operator_user_id"] ?? ""),
            action: String(row["action"] ?? ""),
            entity_type: String(row["entity_type"] ?? "unknown"),
            entity_id: typeof row["entity_id"] === "string" ? row["entity_id"] : null,
            organization_id: orgId,
            payload: row["payload"],
            organizationName: orgId ? orgNameById.get(orgId) ?? null : null
          })
        );
      }
    }
  } catch (e) {
    degraded.push(e instanceof Error ? e.message : "Support audit load failed");
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let q: any = client
      .from("audit_events")
      .select("id, created_at, actor_id, action, entity_type, entity_id, organization_id, payload, correlation_id")
      .order("created_at", { ascending: false })
      .limit(300);
    if (filters.organizationId) q = q.eq("organization_id", filters.organizationId);
    if (filters.actorId) q = q.eq("actor_id", filters.actorId);
    if (filters.since) q = q.gte("created_at", filters.since);
    const { data, error } = await q;
    if (error) degraded.push(`Domain audit: ${error.message}`);
    else {
      for (const row of (data ?? []) as Array<Record<string, unknown>>) {
        const orgId = typeof row["organization_id"] === "string" ? row["organization_id"] : null;
        events.push(
          mapDomainAuditRow({
            id: String(row["id"]),
            created_at: String(row["created_at"] ?? ""),
            actor_id: typeof row["actor_id"] === "string" ? row["actor_id"] : null,
            action: String(row["action"] ?? ""),
            entity_type: String(row["entity_type"] ?? "unknown"),
            entity_id:
              typeof row["entity_id"] === "string"
                ? row["entity_id"]
                : row["entity_id"] != null
                  ? String(row["entity_id"])
                  : null,
            organization_id: orgId,
            payload: row["payload"],
            correlation_id: typeof row["correlation_id"] === "string" ? row["correlation_id"] : null,
            organizationName: orgId ? orgNameById.get(orgId) ?? null : null
          })
        );
      }
    }
  } catch (e) {
    degraded.push(e instanceof Error ? e.message : "Domain audit load failed");
  }

  try {
    const { rows, degraded: errDegraded, detail } = await listPlatformErrorEvents({
      limit: 150,
      organizationId: filters.organizationId,
      since: filters.since
    });
    if (errDegraded) degraded.push(`Security signals: ${detail ?? "error feed unavailable"}`);
    for (const row of rows) {
      const mapped = mapSecurityErrorToAudit({
        id: row.id,
        created_at: row.created_at,
        message: row.message,
        route: row.route,
        organization_id: row.organization_id,
        actor_id: row.actor_id,
        request_id: row.request_id,
        severity: row.severity,
        metadata: row.metadata ?? {}
      });
      if (mapped) {
        if (mapped.organizationId) {
          mapped.organizationName = orgNameById.get(mapped.organizationId) ?? null;
        }
        events.push(mapped);
      }
    }
  } catch (e) {
    degraded.push(e instanceof Error ? e.message : "Security signal load failed");
  }

  if (!service) degraded.push("Service role unavailable — audit may be incomplete under RLS");

  const filtered = filterAuditEvents(events, filters).sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt)
  );

  return {
    events: filtered.slice(0, 400),
    filters,
    degraded,
    limitations
  };
}

export async function loadMa3AuditEvent(
  eventId: string
): Promise<{ event: Ma3AuditEvent | null; degraded: string[] }> {
  const degraded: string[] = [];
  const service = await tryServiceRole();
  const client = (service ?? ((await createAuthServerClient()) as unknown as AnyClient)) as AnyClient;

  try {
    const { data } = await client
      .from("platform_support_audit_events")
      .select("id, created_at, operator_user_id, action, entity_type, entity_id, organization_id, payload")
      .eq("id", eventId)
      .maybeSingle();
    if (data) {
      const row = data as Record<string, unknown>;
      return {
        event: mapSupportAuditRow({
          id: String(row["id"]),
          created_at: String(row["created_at"] ?? ""),
          operator_user_id: String(row["operator_user_id"] ?? ""),
          action: String(row["action"] ?? ""),
          entity_type: String(row["entity_type"] ?? "unknown"),
          entity_id: typeof row["entity_id"] === "string" ? row["entity_id"] : null,
          organization_id: typeof row["organization_id"] === "string" ? row["organization_id"] : null,
          payload: row["payload"]
        }),
        degraded
      };
    }
  } catch (e) {
    degraded.push(e instanceof Error ? e.message : "Support audit detail failed");
  }

  try {
    const { data } = await client
      .from("audit_events")
      .select("id, created_at, actor_id, action, entity_type, entity_id, organization_id, payload, correlation_id")
      .eq("id", eventId)
      .maybeSingle();
    if (data) {
      const row = data as Record<string, unknown>;
      return {
        event: mapDomainAuditRow({
          id: String(row["id"]),
          created_at: String(row["created_at"] ?? ""),
          actor_id: typeof row["actor_id"] === "string" ? row["actor_id"] : null,
          action: String(row["action"] ?? ""),
          entity_type: String(row["entity_type"] ?? "unknown"),
          entity_id:
            typeof row["entity_id"] === "string"
              ? row["entity_id"]
              : row["entity_id"] != null
                ? String(row["entity_id"])
                : null,
          organization_id: typeof row["organization_id"] === "string" ? row["organization_id"] : null,
          payload: row["payload"],
          correlation_id: typeof row["correlation_id"] === "string" ? row["correlation_id"] : null
        }),
        degraded
      };
    }
  } catch (e) {
    degraded.push(e instanceof Error ? e.message : "Domain audit detail failed");
  }

  try {
    const { rows } = await listPlatformErrorEvents({ limit: 200 });
    const match = rows.find((r) => r.id === eventId);
    if (match) {
      const mapped = mapSecurityErrorToAudit({
        id: match.id,
        created_at: match.created_at,
        message: match.message,
        route: match.route,
        organization_id: match.organization_id,
        actor_id: match.actor_id,
        request_id: match.request_id,
        severity: match.severity,
        metadata: match.metadata ?? {}
      });
      if (mapped) return { event: mapped, degraded };
    }
  } catch (e) {
    degraded.push(e instanceof Error ? e.message : "Security detail failed");
  }

  return { event: null, degraded };
}
