import type { PerformanceProbe } from "./contracts";

/**
 * Static performance budgets + known hotspots (PT-001).
 * Runtime timings are filled when `measurePerformanceProbes` is called with timers.
 */
export const PERFORMANCE_BUDGETS: Array<{ surface: string; budgetMs: number; note: string }> = [
  { surface: "Operations Center / Dashboard", budgetMs: 1500, note: "Parallel snapshot; watch N+1 lifecycle tiles." },
  { surface: "Resident list", budgetMs: 800, note: "Paginate; avoid select * with nested joins." },
  { surface: "Applicant list", budgetMs: 800, note: "Keep screening status denormalized for list views." },
  { surface: "Maintenance list", budgetMs: 800, note: "Index organization_id + status + updated_at." },
  { surface: "Payments / Financials", budgetMs: 1200, note: "Charge + payment aggregates should be precomputed or limited." },
  { surface: "Search / Command Center", budgetMs: 600, note: "Debounce client queries; cap result sets." },
  { surface: "Migration Dashboard", budgetMs: 1200, note: "Switching snapshot runs multi-count queries — cache 30–45s client-side." },
  { surface: "Media upload intent", budgetMs: 1000, note: "Signed URL creation should stay under 1s." },
  { surface: "Document / statement generation", budgetMs: 5000, note: "Async job preferred above ~50 leases." }
];

export function buildStaticPerformanceReport(timings?: Record<string, number>): PerformanceProbe[] {
  return PERFORMANCE_BUDGETS.map((budget) => {
    const measuredMs = timings?.[budget.surface] ?? null;
    if (measuredMs == null) {
      return {
        surface: budget.surface,
        measuredMs: null,
        budgetMs: budget.budgetMs,
        status: "skipped" as const,
        note: `${budget.note} (not measured in this run — budget documented for QA perf probes.)`
      };
    }
    const status = measuredMs <= budget.budgetMs ? "pass" : measuredMs <= budget.budgetMs * 1.5 ? "warn" : "fail";
    return {
      surface: budget.surface,
      measuredMs,
      budgetMs: budget.budgetMs,
      status,
      note: budget.note
    };
  });
}

export async function timeAsync<T>(fn: () => Promise<T>): Promise<{ value: T; ms: number }> {
  const start = performance.now();
  const value = await fn();
  return { value, ms: Math.round(performance.now() - start) };
}
