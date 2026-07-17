import type { ReactNode } from "react";
import { Card, KpiMetric } from "@mpa/ui";

export type ListMetric = {
  label: string;
  value: string;
  hint?: string;
};

export function ListWorkspaceHeader({
  metrics,
  quickActions,
  recommendationsPlaceholder,
  recentActivity
}: {
  metrics: ListMetric[];
  quickActions?: ReactNode;
  recommendationsPlaceholder?: string;
  recentActivity?: ReactNode;
}) {
  if (metrics.length === 0 && !quickActions && !recommendationsPlaceholder && !recentActivity) {
    return null;
  }

  return (
    <div className="space-y-4">
      <Card variant="elevated" className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          {metrics.length > 0 ? (
            <div className="grid flex-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
              {metrics.map((metric) => (
                <KpiMetric
                  key={metric.label}
                  label={metric.label}
                  value={metric.value}
                  {...(metric.hint ? { hint: metric.hint } : {})}
                />
              ))}
            </div>
          ) : null}
          {quickActions ? <div className="flex shrink-0 flex-wrap gap-2">{quickActions}</div> : null}
        </div>
        {recommendationsPlaceholder ? (
          <p className="rounded-[var(--mpa-radius-md)] border border-dashed border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface-muted)]/50 px-3 py-2 text-xs text-[var(--mpa-color-text-secondary)]">
            {recommendationsPlaceholder}
          </p>
        ) : null}
      </Card>
      {recentActivity ? (
        <Card variant="elevated" className="space-y-2">
          <h3 className="mpa-section-title text-base">Recent activity</h3>
          {recentActivity}
        </Card>
      ) : null}
    </div>
  );
}
