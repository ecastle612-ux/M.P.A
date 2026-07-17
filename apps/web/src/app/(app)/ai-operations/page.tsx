import { redirect } from "next/navigation";
import { Card } from "@mpa/ui";
import { Breadcrumbs } from "../../../components/shell/breadcrumbs";
import { AiOperationsView } from "../../../components/ai/ai-operations-view";
import { createAuthServerComponentClient } from "../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../lib/organization/server";
import { fetchAuthedApi } from "../../../lib/ai/server-fetch";
import type {
  AiActivityRecord,
  AiConversationRecord,
  AiDashboardMetrics,
  AiInsightRecord,
  PromptDefinition,
  PromptKey
} from "../../../lib/ai/contracts";
const EMPTY_METRICS: AiDashboardMetrics = {
  dailySummary: "",
  recommendedActions: [],
  highPriorityItems: [],
  potentialRisks: [],
  portfolioInsights: [],
  recentActivity: []
};

export default async function AiOperationsPage({
  searchParams
}: {
  searchParams: Promise<{ prompt?: string; conversation?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createAuthServerComponentClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const organizationId = await resolveActiveOrganizationIdForUser(user.id);
  if (!organizationId) {
    return (
      <main className="mpa-page flex-1 space-y-5">
        <Breadcrumbs items={[{ href: "/dashboard", label: "Dashboard" }, { label: "AI Operations" }]} />
        <Card>
          <h1 className="text-xl font-semibold text-[var(--mpa-color-text-primary)]">No active organization</h1>
          <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
            Select or create an organization before using AI Operations.
          </p>
        </Card>
      </main>
    );
  }

  const authorization = await resolveAuthorizationContext(user, organizationId);
  if (!evaluatePermission(authorization, "ai:read")) {
    redirect("/unauthorized");
  }

  const [metricsResult, activityResult, insightsResult, conversationsResult, promptsResult] = await Promise.all([
    fetchAuthedApi<{ metrics: AiDashboardMetrics }>("/api/ai/dashboard"),
    fetchAuthedApi<{ items: AiActivityRecord[] }>("/api/ai/activity?limit=8"),
    fetchAuthedApi<{ items: AiInsightRecord[] }>("/api/ai/insights?status=active"),
    fetchAuthedApi<{ items: AiConversationRecord[] }>("/api/ai/conversations"),
    fetchAuthedApi<{ prompts: PromptDefinition[] }>("/api/ai/prompts")
  ]);

  const metrics = metricsResult.ok ? metricsResult.data.metrics : EMPTY_METRICS;
  const activity = activityResult.ok ? activityResult.data.items : metrics.recentActivity;
  const insights = insightsResult.ok ? insightsResult.data.items : [];
  const conversations = conversationsResult.ok ? conversationsResult.data.items : [];
  const prompts = promptsResult.ok ? promptsResult.data.prompts : [];

  const permissions = {
    canUse: evaluatePermission(authorization, "ai:use")
  };

  return (
    <main className="mpa-page flex-1 space-y-5">
      <Breadcrumbs items={[{ href: "/dashboard", label: "Dashboard" }, { label: "AI Operations" }]} />
      <AiOperationsView
        metrics={metrics}
        activity={activity}
        insights={insights}
        conversations={conversations}
        prompts={prompts}
        permissions={permissions}
        initialPromptKey={
          params.prompt && prompts.some((prompt) => prompt.key === params.prompt)
            ? (params.prompt as PromptKey)
            : null
        }
        initialConversationId={params.conversation ?? null}
      />
    </main>
  );
}
