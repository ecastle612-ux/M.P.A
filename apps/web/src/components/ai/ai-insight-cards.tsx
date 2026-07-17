"use client";

import Link from "next/link";
import { Badge, Card } from "@mpa/ui";
import type { AiInsightRecord } from "../../lib/ai/contracts";
import { toInsightTypeLabel } from "../../lib/ai/contracts";
import { GUIDANCE_TIPS } from "../../lib/experience/guidance-tips";

function priorityVariant(priority: AiInsightRecord["priority"]): "danger" | "warning" | "info" {
  if (priority === "high") return "danger";
  if (priority === "medium") return "warning";
  return "info";
}

function InsightList({
  title,
  description,
  items
}: {
  title: string;
  description: string;
  items: AiInsightRecord[];
}) {
  return (
    <Card className="space-y-3">
      <div>
        <h3 className="text-base font-semibold text-[var(--mpa-color-text-primary)]">{title}</h3>
        <p className="mt-0.5 text-xs text-[var(--mpa-color-text-secondary)]">{description}</p>
      </div>
      <ul className="space-y-2">
        {items.map((insight) => (
          <li key={insight.id} className="rounded-md border border-[var(--mpa-color-border-default)] p-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={priorityVariant(insight.priority)}>{insight.priority}</Badge>
              <Badge variant="neutral">{toInsightTypeLabel(insight.insightType)}</Badge>
              <Badge variant="info">{insight.category}</Badge>
            </div>
            <p className="mt-2 text-sm font-medium text-[var(--mpa-color-text-primary)]">{insight.title}</p>
            <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">{insight.content}</p>
            {insight.actionHref && insight.actionLabel ? (
              <Link
                href={insight.actionHref}
                className="mt-2 inline-block text-xs font-semibold text-[var(--mpa-color-brand-primary)] hover:underline"
              >
                {insight.actionLabel} →
              </Link>
            ) : null}
          </li>
        ))}
      </ul>
    </Card>
  );
}

export function AiInsightCards({
  portfolioInsights,
  highPriorityItems,
  potentialRisks,
  dailySummary
}: {
  portfolioInsights: AiInsightRecord[];
  highPriorityItems: AiInsightRecord[];
  potentialRisks: AiInsightRecord[];
  dailySummary: string;
}) {
  const hasInsights =
    Boolean(dailySummary) ||
    portfolioInsights.length > 0 ||
    highPriorityItems.length > 0 ||
    potentialRisks.length > 0;

  return (
    <section className="space-y-4" aria-labelledby="ai-insights-heading">
      <div>
        <h2 id="ai-insights-heading" className="text-base font-semibold text-[var(--mpa-color-text-primary)]">
          Portfolio intelligence
        </h2>
        <p className="mt-0.5 text-xs text-[var(--mpa-color-text-secondary)]">
          Summaries and signals from your portfolio — review before acting.
        </p>
      </div>

      {!hasInsights ? (
        <Card className="space-y-3 border-dashed border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface-muted)]/40 p-6 text-center">
          <h3 className="font-display text-base font-semibold text-[var(--mpa-color-text-primary)]">
            Insights appear as your portfolio grows
          </h3>
          <p className="mx-auto max-w-md text-sm text-[var(--mpa-color-text-secondary)]">{GUIDANCE_TIPS.ai}</p>
          <p className="text-xs text-[var(--mpa-color-text-secondary)]">
            Run a portfolio summary prompt above to generate your first briefing.
          </p>
        </Card>
      ) : (
        <>
          {dailySummary ? (
            <Card className="space-y-2 border-[var(--mpa-color-brand-primary)]/20 bg-[var(--mpa-color-bg-surface-muted)]">
              <h3 className="text-sm font-semibold text-[var(--mpa-color-text-primary)]">Daily briefing</h3>
              <p className="whitespace-pre-wrap text-sm text-[var(--mpa-color-text-secondary)]">{dailySummary}</p>
            </Card>
          ) : null}

          {(portfolioInsights.length > 0 || highPriorityItems.length > 0 || potentialRisks.length > 0) && (
            <div className="grid gap-4 lg:grid-cols-3">
              {portfolioInsights.length > 0 ? (
                <InsightList
                  title="Portfolio insights"
                  description="Executive summaries across your operations."
                  items={portfolioInsights}
                />
              ) : null}
              {highPriorityItems.length > 0 ? (
                <InsightList
                  title="High priority"
                  description="Items that need your attention soon."
                  items={highPriorityItems}
                />
              ) : null}
              {potentialRisks.length > 0 ? (
                <InsightList
                  title="Potential risks"
                  description="Operational risks surfaced for review."
                  items={potentialRisks}
                />
              ) : null}
            </div>
          )}
        </>
      )}
    </section>
  );
}
