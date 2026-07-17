"use client";

import Link from "next/link";
import { useState } from "react";
import { Badge, Button, Card } from "@mpa/ui";
import type { AiInsightRecord } from "../../lib/ai/contracts";
import { toInsightTypeLabel } from "../../lib/ai/contracts";

export function AiRecommendationCards({
  recommendations,
  canUse,
  onInsightUpdated
}: {
  recommendations: AiInsightRecord[];
  canUse: boolean;
  onInsightUpdated?: (insightId: string, status: "dismissed" | "applied") => void;
}) {
  const [items, setItems] = useState(recommendations);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function updateInsight(insightId: string, status: "dismissed" | "applied") {
    if (!canUse) return;
    setPendingId(insightId);
    setError(null);
    try {
      const response = await fetch(`/api/ai/insights/${insightId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status })
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { message?: string } | null;
        throw new Error(payload?.message ?? "Unable to update recommendation");
      }
      setItems((current) => current.filter((item) => item.id !== insightId));
      onInsightUpdated?.(insightId, status);
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Unable to update recommendation");
    } finally {
      setPendingId(null);
    }
  }

  return (
    <Card className="space-y-3">
      <div>
        <h2 className="text-base font-semibold text-[var(--mpa-color-text-primary)]">Recommended actions</h2>
        <p className="mt-0.5 text-xs text-[var(--mpa-color-text-secondary)]">
          You stay in control — dismiss or apply each recommendation manually. Nothing happens automatically.
        </p>
      </div>

      {error ? <p className="text-sm text-[var(--mpa-color-danger,#C0392B)]">{error}</p> : null}

      {items.length === 0 ? (
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">
          Recommendations appear after you run prompts or as your portfolio activity grows.
        </p>
      ) : (
        <ul className="space-y-3">
          {items.map((insight) => (
            <li key={insight.id} className="rounded-md border border-[var(--mpa-color-border-default)] p-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={insight.priority === "high" ? "danger" : insight.priority === "medium" ? "warning" : "info"}>
                  {insight.priority}
                </Badge>
                <Badge variant="neutral">{toInsightTypeLabel(insight.insightType)}</Badge>
                <Badge variant="info">{insight.category}</Badge>
              </div>
              <p className="mt-2 text-sm font-medium text-[var(--mpa-color-text-primary)]">{insight.title}</p>
              <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">{insight.content}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {insight.actionHref && insight.actionLabel ? (
                  <Link href={insight.actionHref}>
                    <Button variant="secondary" size="sm">
                      {insight.actionLabel}
                    </Button>
                  </Link>
                ) : null}
                {canUse ? (
                  <>
                    <Button
                      size="sm"
                      disabled={pendingId === insight.id}
                      onClick={() => void updateInsight(insight.id, "applied")}
                    >
                      {pendingId === insight.id ? "Saving…" : "Mark applied"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={pendingId === insight.id}
                      onClick={() => void updateInsight(insight.id, "dismissed")}
                    >
                      Dismiss
                    </Button>
                  </>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
