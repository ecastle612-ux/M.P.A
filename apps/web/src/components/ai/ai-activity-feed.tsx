"use client";

import { Badge, Card } from "@mpa/ui";
import type { AiActivityRecord, AiActivityType } from "../../lib/ai/contracts";

function activityTypeLabel(type: AiActivityType): string {
  const labels: Record<AiActivityType, string> = {
    prompt_run: "Prompt run",
    insight_generated: "Insight generated",
    insight_dismissed: "Insight dismissed",
    insight_applied: "Insight applied",
    draft_created: "Draft created",
    summary_generated: "Summary generated"
  };
  return labels[type];
}

function activityBadgeVariant(type: AiActivityType): "success" | "warning" | "info" | "neutral" {
  if (type === "insight_applied") return "success";
  if (type === "insight_dismissed") return "neutral";
  if (type === "draft_created") return "warning";
  return "info";
}

export function AiActivityFeed({ activity }: { activity: AiActivityRecord[] }) {
  return (
    <Card className="space-y-3">
      <div>
        <h2 className="text-base font-semibold text-[var(--mpa-color-text-primary)]">Recent AI activity</h2>
        <p className="mt-0.5 text-xs text-[var(--mpa-color-text-secondary)]">
          Prompt runs, generated insights, and actions you have taken.
        </p>
      </div>
      {activity.length === 0 ? (
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">
          Your AI activity timeline fills in as you run prompts and review recommendations.
        </p>
      ) : (
        <ul className="space-y-2">
          {activity.map((item) => (
            <li key={item.id} className="rounded-md border border-[var(--mpa-color-border-default)] p-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={activityBadgeVariant(item.activityType)}>{activityTypeLabel(item.activityType)}</Badge>
              </div>
              <p className="mt-1 text-sm text-[var(--mpa-color-text-primary)]">{item.summary}</p>
              <p className="text-xs text-[var(--mpa-color-text-secondary)]">
                {new Date(item.createdAt).toLocaleString()}
              </p>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
