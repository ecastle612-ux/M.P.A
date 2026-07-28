/**
 * OPS-001 Slice E — Global Search (fail-closed).
 * Org-scoped · permission-aware · no cross-org leakage · Commands corpus.
 */

import { createServiceRoleServerClient } from "../auth/server";
import { searchQuickActionCommands } from "./quick-actions";
import { listOpsTasksByPriority } from "./task-engine";
import { listAiRecommendations } from "./ai-director";
import type { OpsDbClient } from "./types";

export type SearchCorpus =
  | "tasks"
  | "ai"
  | "commands"
  | "properties"
  | "units"
  | "tenants"
  | "leases"
  | "maintenance"
  | "vendors";

export type GlobalSearchHit = {
  resultId: string;
  corpus: SearchCorpus;
  title: string;
  snippet: string;
  deepLink: string;
  score: number;
  priorityHint?: string;
};

export type GlobalSearchInput = {
  organizationId: string;
  principalId: string;
  query: string;
  permissions: readonly string[];
  rolePlane?: string;
  corpora?: SearchCorpus[];
  limit?: number;
};

function serviceClient(): OpsDbClient {
  return createServiceRoleServerClient() as unknown as OpsDbClient;
}

function canRead(permissions: readonly string[], anyOf: string[]): boolean {
  return anyOf.some((p) => permissions.includes(p));
}

/**
 * Fail-closed: denied corpora return empty (never leak). Org filter always applied.
 */
export async function globalSearch(input: GlobalSearchInput): Promise<{
  hits: GlobalSearchHit[];
  deniedCorpora: SearchCorpus[];
  total: number;
}> {
  void input.rolePlane;
  const q = input.query.trim();
  const limit = input.limit ?? 40;
  const requested = input.corpora ?? [
    "tasks",
    "ai",
    "commands",
    "properties",
    "units",
    "tenants",
    "leases",
    "maintenance",
    "vendors"
  ];
  const deniedCorpora: SearchCorpus[] = [];
  const hits: GlobalSearchHit[] = [];
  const db = serviceClient();

  if (!q) {
    return { hits: [], deniedCorpora: [], total: 0 };
  }

  const like = `%${q.replaceAll("%", "").replaceAll(",", " ")}%`;

  for (const corpus of requested) {
    if (corpus === "commands") {
      if (!canRead(input.permissions, ["dashboard:read", "maintenance:read", "maintenance:write"])) {
        deniedCorpora.push(corpus);
        continue;
      }
      for (const cmd of searchQuickActionCommands({ query: q, permissions: input.permissions })) {
        hits.push({
          resultId: `command:${cmd.actionId}`,
          corpus: "commands",
          title: cmd.title,
          snippet: cmd.snippet,
          deepLink: cmd.href,
          score: 0.9
        });
      }
      continue;
    }

    if (corpus === "tasks") {
      if (!canRead(input.permissions, ["maintenance:read", "dashboard:read"])) {
        deniedCorpora.push(corpus);
        continue;
      }
      const tasks = await listOpsTasksByPriority({
        organizationId: input.organizationId,
        limit: 30
      });
      for (const task of tasks) {
        if (
          !task.title.toLowerCase().includes(q.toLowerCase()) &&
          !task.taskId.includes(q)
        ) {
          continue;
        }
        hits.push({
          resultId: `task:${task.taskId}`,
          corpus: "tasks",
          title: task.title,
          snippet: `${task.priority} · ${task.status}`,
          deepLink: task.deepLink ?? "/dashboard#priority-tasks",
          score: 0.85,
          priorityHint: task.priority
        });
      }
      continue;
    }

    if (corpus === "ai") {
      if (!canRead(input.permissions, ["maintenance:read", "ai:read", "dashboard:read"])) {
        deniedCorpora.push(corpus);
        continue;
      }
      const recs = await listAiRecommendations({
        organizationId: input.organizationId,
        limit: 20
      });
      for (const rec of recs) {
        if (
          !rec.title.toLowerCase().includes(q.toLowerCase()) &&
          !rec.summary.toLowerCase().includes(q.toLowerCase())
        ) {
          continue;
        }
        hits.push({
          resultId: `ai:${rec.recommendationId}`,
          corpus: "ai",
          title: rec.title,
          snippet: rec.summary.slice(0, 120),
          deepLink: rec.deepLink ?? "/inbox?kind=ai",
          score: 0.8,
          priorityHint: rec.confidenceBand
        });
      }
      continue;
    }

    // Domain corpora — fail closed without permission; org-scoped query when allowed.
    const tableByCorpus: Record<
      Exclude<SearchCorpus, "tasks" | "ai" | "commands">,
      { table: string; titleCol: string; permission: string[]; href: (id: string) => string }
    > = {
      properties: {
        table: "properties",
        titleCol: "name",
        permission: ["property:read"],
        href: (id) => `/properties/${id}`
      },
      units: {
        table: "units",
        titleCol: "unit_number",
        permission: ["unit:read"],
        href: (id) => `/units/${id}`
      },
      tenants: {
        table: "tenants",
        titleCol: "full_name",
        permission: ["tenant:read"],
        href: (id) => `/tenants/${id}`
      },
      leases: {
        table: "leases",
        titleCol: "status",
        permission: ["lease:read"],
        href: (id) => `/leases/${id}`
      },
      maintenance: {
        table: "maintenance_work_orders",
        titleCol: "title",
        permission: ["maintenance:read"],
        href: (id) => `/maintenance/${id}`
      },
      vendors: {
        table: "vendors",
        titleCol: "name",
        permission: ["vendor:read"],
        href: (id) => `/vendors/${id}`
      }
    };

    const spec = tableByCorpus[corpus as keyof typeof tableByCorpus];
    if (!spec) continue;
    if (!canRead(input.permissions, spec.permission)) {
      deniedCorpora.push(corpus);
      continue;
    }

    const { data, error } = await db
      .from(spec.table)
      .select(`id, ${spec.titleCol}`)
      .eq("organization_id", input.organizationId)
      .ilike(spec.titleCol, like)
      .limit(8);

    if (error) {
      // Fail closed on schema variance — deny rather than leak.
      deniedCorpora.push(corpus);
      continue;
    }

    for (const row of (data ?? []) as Array<Record<string, unknown>>) {
      const id = String(row["id"]);
      const title = String(row[spec.titleCol] ?? id);
      hits.push({
        resultId: `${corpus}:${id}`,
        corpus,
        title,
        snippet: `${corpus} · org-scoped`,
        deepLink: spec.href(id),
        score: 0.7
      });
    }
  }

  hits.sort((a, b) => b.score - a.score);
  const sliced = hits.slice(0, limit);
  return { hits: sliced, deniedCorpora, total: sliced.length };
}

/** Alias used by `/api/ops/search` (OE-05 fail-closed). */
export async function runGlobalSearch(input: GlobalSearchInput) {
  return globalSearch(input);
}
