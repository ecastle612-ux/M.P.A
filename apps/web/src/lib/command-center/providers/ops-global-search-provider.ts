import { evaluateCapability } from "@mpa/shared";
import type { CommandCenterCategory, CommandCenterProvider, CommandCenterResult } from "../types";

type OpsSearchHit = {
  resultId: string;
  corpus: string;
  title: string;
  snippet: string;
  deepLink: string;
  score: number;
};

function categoryForCorpus(corpus: string): CommandCenterCategory {
  if (corpus === "commands") return "actions";
  if (corpus === "tasks" || corpus === "maintenance") return "maintenance";
  if (corpus === "ai") return "ai";
  if (corpus === "properties") return "properties";
  if (corpus === "units") return "units";
  if (corpus === "tenants") return "tenants";
  if (corpus === "leases") return "leases";
  if (corpus === "vendors") return "vendors";
  return "navigation";
}

/**
 * OPS-001 Slice E — fail-closed Global Search provider for Cmd+K.
 * Delegates to `/api/ops/search` (org + AuthZ enforced server-side).
 */
export const opsGlobalSearchProvider: CommandCenterProvider = {
  id: "ops-global-search",
  category: "actions",
  sectionTitle: "Secure search",
  priority: 14,
  enabled: (context) =>
    Boolean(context.query.trim()) &&
    (evaluateCapability(context.permissions, "dashboard:read") ||
      evaluateCapability(context.permissions, "maintenance:read")),
  search: async (context) => {
    const q = context.query.trim();
    if (!q) return [];

    const response = await fetch(`/api/ops/search?q=${encodeURIComponent(q)}&limit=20`, {
      cache: "no-store",
      signal: context.signal
    });
    if (!response.ok) return [];

    const payload = (await response.json()) as {
      hits?: OpsSearchHit[];
    };

    const results: CommandCenterResult[] = (payload.hits ?? []).map((hit) => ({
      id: hit.resultId,
      kind: hit.corpus === "commands" ? "action" : hit.corpus === "ai" ? "ai" : "navigation",
      category: categoryForCorpus(hit.corpus),
      label: hit.title,
      subtitle: hit.snippet,
      context: hit.corpus,
      badge: hit.corpus,
      status: null,
      statusVariant: "neutral",
      icon: hit.corpus === "commands" ? "⌘" : "⌕",
      href: hit.deepLink,
      shortcut: null,
      score: hit.score
    }));

    return results;
  }
};
