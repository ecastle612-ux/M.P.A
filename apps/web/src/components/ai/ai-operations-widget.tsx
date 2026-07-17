"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Badge, Button, Card } from "@mpa/ui";
import type { AiDashboardMetrics } from "../../lib/ai/contracts";
import { AI_ASSISTANT_DISCLAIMER } from "../../lib/ai/contracts";

const EMPTY_METRICS: AiDashboardMetrics = {
  dailySummary: "",
  recommendedActions: [],
  highPriorityItems: [],
  potentialRisks: [],
  portfolioInsights: [],
  recentActivity: []
};

export function AiOperationsWidget({ canUse }: { canUse: boolean }) {
  const [metrics, setMetrics] = useState<AiDashboardMetrics>(EMPTY_METRICS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function loadMetrics() {
      setIsLoading(true);
      try {
        const response = await fetch("/api/ai/dashboard", { cache: "no-store" });
        if (!response.ok || cancelled) return;
        const payload = (await response.json()) as { metrics: AiDashboardMetrics };
        if (!cancelled) setMetrics(payload.metrics);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    void loadMetrics();
    return () => {
      cancelled = true;
    };
  }, []);

  const recommendationCount = metrics.recommendedActions.length;
  const riskCount = metrics.potentialRisks.length;
  const summaryPreview = metrics.dailySummary
    ? metrics.dailySummary.length > 180
      ? `${metrics.dailySummary.slice(0, 180)}…`
      : metrics.dailySummary
    : "Run AI Operations to generate your daily portfolio briefing.";

  return (
    <section aria-labelledby="ai-ops-widget-heading" className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 id="ai-ops-widget-heading" className="text-sm font-semibold text-[var(--mpa-color-text-primary)]">
            AI Operations
          </h2>
          <p className="text-sm text-[var(--mpa-color-text-secondary)]">
            Portfolio intelligence and recommendations — property manager always in control.
          </p>
        </div>
        <Link href="/ai-operations">
          <Button variant="secondary" size="sm">
            Open AI Operations
          </Button>
        </Link>
      </div>

      <Card className="space-y-3">
        <div
          role="note"
          className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900"
        >
          {AI_ASSISTANT_DISCLAIMER}
        </div>

        {isLoading ? (
          <p className="text-sm text-[var(--mpa-color-text-secondary)]">Loading AI briefing…</p>
        ) : (
          <>
            <p className="whitespace-pre-wrap text-sm text-[var(--mpa-color-text-secondary)]">{summaryPreview}</p>
            <div className="flex flex-wrap gap-2">
              <Badge variant={recommendationCount > 0 ? "warning" : "neutral"}>
                {recommendationCount} recommendation{recommendationCount === 1 ? "" : "s"}
              </Badge>
              <Badge variant={riskCount > 0 ? "danger" : "neutral"}>
                {riskCount} risk{riskCount === 1 ? "" : "s"}
              </Badge>
              <Badge variant="info">{metrics.highPriorityItems.length} high priority</Badge>
            </div>
          </>
        )}

        {canUse ? (
          <Link href="/ai-operations">
            <Button size="sm">Run a prompt</Button>
          </Link>
        ) : (
          <p className="text-xs text-[var(--mpa-color-text-secondary)]">
            You can review AI insights. Ask an admin for AI use permission to run prompts.
          </p>
        )}
      </Card>
    </section>
  );
}
