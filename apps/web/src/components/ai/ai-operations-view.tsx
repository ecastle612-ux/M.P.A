"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, PageHeader } from "@mpa/ui";
import type {
  AiActivityRecord,
  AiConversationRecord,
  AiDashboardMetrics,
  AiInsightRecord,
  PromptDefinition,
  PromptKey
} from "../../lib/ai/contracts";
import { AI_ASSISTANT_DISCLAIMER } from "../../lib/ai/contracts";
import type { AiConversationDetail } from "../../lib/ai/server";
import { AiActivityFeed } from "./ai-activity-feed";
import { AiInsightCards } from "./ai-insight-cards";
import { AiRecommendationCards } from "./ai-recommendation-cards";
import { AiSearchAssistant } from "./ai-search-assistant";
import { AiSidebar } from "./ai-sidebar";

export function AiOperationsView({
  metrics: initialMetrics,
  activity: initialActivity,
  insights: initialInsights,
  conversations: initialConversations,
  prompts,
  permissions,
  initialPromptKey = null,
  initialConversationId = null
}: {
  metrics: AiDashboardMetrics;
  activity: AiActivityRecord[];
  insights: AiInsightRecord[];
  conversations: AiConversationRecord[];
  prompts: PromptDefinition[];
  permissions: { canUse: boolean };
  initialPromptKey?: PromptKey | null;
  initialConversationId?: string | null;
}) {
  const [metrics, setMetrics] = useState(initialMetrics);
  const [activity, setActivity] = useState(initialActivity);
  const [insights, setInsights] = useState(initialInsights);
  const [conversations, setConversations] = useState(initialConversations);
  const [activeConversation, setActiveConversation] = useState<AiConversationDetail | null>(null);
  const [pendingPromptKey, setPendingPromptKey] = useState<PromptKey | null>(initialPromptKey);

  useEffect(() => {
    if (!initialConversationId) return;
    let cancelled = false;
    void (async () => {
      const response = await fetch(`/api/ai/conversations/${initialConversationId}`, { cache: "no-store" });
      if (!response.ok || cancelled) return;
      const payload = (await response.json()) as { conversation: AiConversationDetail };
      setActiveConversation(payload.conversation);
    })();
    return () => {
      cancelled = true;
    };
  }, [initialConversationId]);

  const refreshPanels = useCallback(async () => {
    const [metricsResponse, activityResponse, insightsResponse, conversationsResponse] = await Promise.all([
      fetch("/api/ai/dashboard", { cache: "no-store" }),
      fetch("/api/ai/activity?limit=8", { cache: "no-store" }),
      fetch("/api/ai/insights?status=active", { cache: "no-store" }),
      fetch("/api/ai/conversations", { cache: "no-store" })
    ]);

    if (metricsResponse.ok) {
      const payload = (await metricsResponse.json()) as { metrics: AiDashboardMetrics };
      setMetrics(payload.metrics);
    }
    if (activityResponse.ok) {
      const payload = (await activityResponse.json()) as { items: AiActivityRecord[] };
      setActivity(payload.items);
    }
    if (insightsResponse.ok) {
      const payload = (await insightsResponse.json()) as { items: AiInsightRecord[] };
      setInsights(payload.items);
    }
    if (conversationsResponse.ok) {
      const payload = (await conversationsResponse.json()) as { items: AiConversationRecord[] };
      setConversations(payload.items);
    }
  }, []);

  function handleConversationChange(conversation: AiConversationDetail) {
    setActiveConversation(conversation);
    setConversations((current) => {
      const withoutActive = current.filter((item) => item.id !== conversation.id);
      return [conversation, ...withoutActive];
    });
    void refreshPanels();
  }

  function handleSelectPrompt(promptKey: PromptKey) {
    setPendingPromptKey(promptKey);
  }

  function handleSelectConversation(conversationId: string) {
    void (async () => {
      const response = await fetch(`/api/ai/conversations/${conversationId}`, { cache: "no-store" });
      if (!response.ok) return;
      const payload = (await response.json()) as { conversation: AiConversationDetail };
      setActiveConversation(payload.conversation);
      setPendingPromptKey(null);
    })();
  }

  const recommendations =
    metrics.recommendedActions.length > 0
      ? metrics.recommendedActions
      : insights.filter((insight) => insight.insightType === "recommendation");

  return (
    <div className="flex min-h-0 flex-col gap-3 xl:gap-5">
      <div className="shrink-0 space-y-2">
        <PageHeader
          overline="AI Operations Center"
          title="AI Operations"
          description="Ask questions, run prompts, and act on recommendations — under your control."
        />
        <Card variant="elevated" className="border-[var(--mpa-color-brand-primary)]/15 py-2">
          <div
            role="note"
            className="rounded-[var(--mpa-radius-md)] border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-900 sm:text-sm"
          >
            {AI_ASSISTANT_DISCLAIMER}
          </div>
        </Card>
      </div>

      {/* Mobile: viewport-locked conversational workspace; desktop: side-by-side */}
      <div className="grid min-h-0 flex-1 gap-3 xl:grid-cols-[minmax(16rem,20rem)_minmax(0,1fr)] xl:gap-5">
        <div className="xl:sticky xl:top-0 xl:max-h-[calc(100dvh-8rem)] xl:overflow-y-auto">
          <AiSidebar
            prompts={prompts}
            conversations={conversations}
            activeConversationId={activeConversation?.id ?? null}
            canUse={permissions.canUse}
            onSelectPrompt={handleSelectPrompt}
            onSelectConversation={handleSelectConversation}
          />
        </div>

        <div className="flex min-h-[min(70dvh,36rem)] flex-col gap-3 xl:min-h-0">
          <div className="flex min-h-0 flex-1 flex-col">
            <AiSearchAssistant
              key={activeConversation?.id ?? "new-conversation"}
              conversationId={activeConversation?.id ?? null}
              conversationTitle={activeConversation?.title ?? null}
              initialMessages={
                activeConversation?.messages.map((message) => ({
                  id: message.id,
                  role: message.role,
                  content: message.content,
                  promptKey: message.promptKey,
                  createdAt: message.createdAt
                })) ?? []
              }
              canUse={permissions.canUse}
              pendingPromptKey={pendingPromptKey}
              onConversationChange={handleConversationChange}
              onPromptComplete={() => setPendingPromptKey(null)}
            />
          </div>

          <div className="space-y-3 xl:space-y-5">
            <AiRecommendationCards
              recommendations={recommendations}
              canUse={permissions.canUse}
              onInsightUpdated={() => void refreshPanels()}
            />

            <AiInsightCards
              dailySummary={metrics.dailySummary}
              portfolioInsights={metrics.portfolioInsights}
              highPriorityItems={metrics.highPriorityItems}
              potentialRisks={metrics.potentialRisks}
            />

            <AiActivityFeed activity={activity} />
          </div>
        </div>
      </div>
    </div>
  );
}
