import { assertAssistantOnlyResponse } from "./events";
import { buildPortfolioContext } from "./context";
import { getDefaultAiProvider } from "./provider";
import { createAuthServerComponentClient } from "../auth/server";
import { notify } from "../notifications/service";
import type { NotificationPriority } from "../notifications/contracts";
import type { Json } from "@mpa/supabase";
import type {
  AiActivityRecord,
  AiActivityType,
  AiConversationRecord,
  AiDashboardMetrics,
  AiInsightRecord,
  AiMessageRecord,
  InsightPriority,
  InsightStatus,
  PromptKey,
  RunPromptInput
} from "./contracts";
import { getPromptDefinition } from "./contracts";

type AiDbClient = {
  from: (table: string) => ReturnType<Awaited<ReturnType<typeof createAuthServerComponentClient>>["from"]>;
};

function aiDb(client: Awaited<ReturnType<typeof createAuthServerComponentClient>>): AiDbClient {
  return client as unknown as AiDbClient;
}

type SupabaseClientType = Awaited<ReturnType<typeof createAuthServerComponentClient>>;

export type AiConversationDetail = AiConversationRecord & { messages: AiMessageRecord[] };

export async function getConversationsForUser(
  organizationId: string,
  userId: string,
  client?: SupabaseClientType
): Promise<AiConversationRecord[]> {
  const db = aiDb(await resolveClient(client));
  const { data, error } = await db
    .from("ai_conversations")
    .select("id, organization_id, user_id, title, status, last_prompt_key, metadata, created_at, updated_at, deleted_at")
    .eq("organization_id", organizationId)
    .eq("user_id", userId)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false })
    .limit(20);
  if (error) throw new Error(error.message);
  return ((data ?? []) as ConversationRow[]).map(toConversationRecord);
}

export async function getConversationForUser(
  organizationId: string,
  userId: string,
  conversationId: string,
  client?: SupabaseClientType
): Promise<AiConversationDetail | null> {
  const db = aiDb(await resolveClient(client));
  const { data, error } = await db
    .from("ai_conversations")
    .select("id, organization_id, user_id, title, status, last_prompt_key, metadata, created_at, updated_at, deleted_at")
    .eq("organization_id", organizationId)
    .eq("user_id", userId)
    .eq("id", conversationId)
    .is("deleted_at", null)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  const messages = await getMessagesForConversation(organizationId, conversationId, db);
  return { ...toConversationRecord(data as ConversationRow), messages };
}

export async function createConversation(
  organizationId: string,
  userId: string,
  title = "New conversation",
  client?: SupabaseClientType
): Promise<AiConversationRecord> {
  const db = aiDb(await resolveClient(client));
  const { data, error } = await db
    .from("ai_conversations")
    .insert({
      organization_id: organizationId,
      user_id: userId,
      title,
      created_by: userId,
      updated_by: userId
    })
    .select("id, organization_id, user_id, title, status, last_prompt_key, metadata, created_at, updated_at, deleted_at")
    .single();
  if (error) throw new Error(error.message);
  return toConversationRecord(data as ConversationRow);
}

export async function runAiPrompt(
  organizationId: string,
  userId: string,
  input: RunPromptInput,
  client?: SupabaseClientType
): Promise<AiConversationDetail> {
  const db = aiDb(await resolveClient(client));
  const promptKey = (input.promptKey ?? "custom_question") as PromptKey;
  const userMessage = input.message ?? getPromptDefinition(promptKey)?.label ?? "Portfolio question";

  let conversationId = input.conversationId;
  if (!conversationId) {
    const created = await createConversation(organizationId, userId, userMessage.slice(0, 80), db as unknown as SupabaseClientType);
    conversationId = created.id;
  }

  const context = await buildPortfolioContext(organizationId, db as unknown as SupabaseClientType);
  const provider = getDefaultAiProvider();
  const result = provider.executePrompt({ promptKey, message: input.message ?? null, context });
  assertAssistantOnlyResponse(result.content);

  await insertMessage(db, organizationId, conversationId, userId, "user", userMessage, promptKey, []);
  const assistantMessage = await insertMessage(
    db,
    organizationId,
    conversationId,
    userId,
    "assistant",
    result.content,
    promptKey,
    result.sources
  );

  await db
    .from("ai_conversations")
    .update({ title: result.title, last_prompt_key: promptKey, updated_by: userId })
    .eq("organization_id", organizationId)
    .eq("id", conversationId);

  for (const candidate of result.insightCandidates) {
    const { data: inserted } = await db
      .from("ai_insights")
      .insert({
        organization_id: organizationId,
        insight_type: candidate.insightType,
        category: candidate.category,
        priority: candidate.priority,
        title: candidate.title,
        content: candidate.content,
        action_href: candidate.actionHref ?? null,
        action_label: candidate.actionLabel ?? null,
        prompt_key: promptKey,
        sources: result.sources as unknown as Json,
        created_by: userId,
        updated_by: userId
      })
      .select("id, title, priority, action_href")
      .single();
    if (inserted) {
      const row = inserted as {
        id: string;
        title: string;
        priority: InsightPriority;
        action_href: string | null;
      };
      await notify(
        {
          organizationId,
          actorUserId: userId,
          eventKey: `ai.insight_created:${row.id}`,
          recipientUserIds: [userId],
          category: "ai_operations",
          priority: mapInsightPriority(row.priority),
          title: "New AI recommendation",
          body: row.title,
          href: row.action_href ?? "/ai-operations",
          sourceEntityType: "ai_insight",
          sourceEntityId: row.id
        },
        db as unknown as SupabaseClientType
      ).catch(() => undefined);
    }
  }

  await recordAiActivity(db, organizationId, userId, {
    activityType: result.insightCandidates.some((c) => c.insightType === "draft") ? "draft_created" : "prompt_run",
    conversationId,
    promptKey,
    summary: `Ran prompt: ${result.title}`,
    payload: { promptKey, messageCount: 2 }
  });

  const messages = await getMessagesForConversation(organizationId, conversationId, db);
  const conversation = await getConversationForUser(organizationId, userId, conversationId, db as unknown as SupabaseClientType);
  if (!conversation) throw new Error("Conversation not found after prompt run");
  void assistantMessage;
  return { ...conversation, messages };
}

export async function getInsightsForOrganization(
  organizationId: string,
  options: { status?: InsightStatus | "all"; limit?: number } = {},
  client?: SupabaseClientType
): Promise<AiInsightRecord[]> {
  const db = aiDb(await resolveClient(client));
  let query = db
    .from("ai_insights")
    .select(
      "id, organization_id, insight_type, category, priority, status, title, content, action_href, action_label, entity_type, entity_id, prompt_key, sources, metadata, created_at, updated_at, dismissed_at, deleted_at"
    )
    .eq("organization_id", organizationId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
  if (options.status && options.status !== "all") query = query.eq("status", options.status);
  if (options.limit) query = query.limit(options.limit);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return ((data ?? []) as InsightRow[]).map(toInsightRecord);
}

export async function updateInsightStatus(
  organizationId: string,
  userId: string,
  insightId: string,
  status: "dismissed" | "applied",
  client?: SupabaseClientType
): Promise<AiInsightRecord | null> {
  const db = aiDb(await resolveClient(client));
  const payload =
    status === "dismissed"
      ? { status, dismissed_at: new Date().toISOString(), dismissed_by: userId, updated_by: userId }
      : { status, updated_by: userId };
  const { data, error } = await db
    .from("ai_insights")
    .update(payload)
    .eq("organization_id", organizationId)
    .eq("id", insightId)
    .is("deleted_at", null)
    .select(
      "id, organization_id, insight_type, category, priority, status, title, content, action_href, action_label, entity_type, entity_id, prompt_key, sources, metadata, created_at, updated_at, dismissed_at, deleted_at"
    )
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (data) {
    await recordAiActivity(db, organizationId, userId, {
      activityType: status === "dismissed" ? "insight_dismissed" : "insight_applied",
      insightId,
      summary: `${status === "dismissed" ? "Dismissed" : "Applied"} insight: ${(data as InsightRow).title}`
    });
  }
  return data ? toInsightRecord(data as InsightRow) : null;
}

export async function syncPortfolioInsights(
  organizationId: string,
  userId: string,
  client?: SupabaseClientType
): Promise<void> {
  const db = aiDb(await resolveClient(client));
  const context = await buildPortfolioContext(organizationId, db as unknown as SupabaseClientType);
  const provider = getDefaultAiProvider();
  const summary = provider.executePrompt({ promptKey: "portfolio_summary", message: null, context });
  const createdInsights: Array<{ id: string; title: string; content: string; priority: InsightPriority; actionHref: string | null }> =
    [];

  for (const candidate of summary.insightCandidates) {
    const { count } = await db
      .from("ai_insights")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("title", candidate.title)
      .eq("status", "active")
      .is("deleted_at", null);
    if ((count ?? 0) > 0) continue;
    const { data: inserted } = await db
      .from("ai_insights")
      .insert({
        organization_id: organizationId,
        insight_type: candidate.insightType,
        category: candidate.category,
        priority: candidate.priority,
        title: candidate.title,
        content: candidate.content,
        action_href: candidate.actionHref ?? null,
        action_label: candidate.actionLabel ?? null,
        prompt_key: "portfolio_summary",
        created_by: userId,
        updated_by: userId
      })
      .select("id, title, content, priority, action_href")
      .single();
    if (inserted) {
      const row = inserted as {
        id: string;
        title: string;
        content: string;
        priority: InsightPriority;
        action_href: string | null;
      };
      createdInsights.push({
        id: row.id,
        title: row.title,
        content: row.content,
        priority: row.priority,
        actionHref: row.action_href
      });
    }
  }

  const extraPrompts: PromptKey[] = ["show_overdue_maintenance", "summarize_financial_health", "show_expiring_leases"];
  for (const key of extraPrompts) {
    const result = provider.executePrompt({ promptKey: key, message: null, context });
    for (const candidate of result.insightCandidates) {
      const { count } = await db
        .from("ai_insights")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", organizationId)
        .eq("title", candidate.title)
        .eq("status", "active")
        .is("deleted_at", null);
      if ((count ?? 0) > 0) continue;
      const { data: inserted } = await db
        .from("ai_insights")
        .insert({
          organization_id: organizationId,
          insight_type: candidate.insightType,
          category: candidate.category,
          priority: candidate.priority,
          title: candidate.title,
          content: candidate.content,
          action_href: candidate.actionHref ?? null,
          action_label: candidate.actionLabel ?? null,
          prompt_key: key,
          created_by: userId,
          updated_by: userId
        })
        .select("id, title, content, priority, action_href")
        .single();
      if (inserted) {
        const row = inserted as {
          id: string;
          title: string;
          content: string;
          priority: InsightPriority;
          action_href: string | null;
        };
        createdInsights.push({
          id: row.id,
          title: row.title,
          content: row.content,
          priority: row.priority,
          actionHref: row.action_href
        });
      }
    }
  }

  await recordAiActivity(db, organizationId, userId, {
    activityType: "summary_generated",
    promptKey: "portfolio_summary",
    summary: "Generated portfolio AI insights",
    payload: { source: "relational" }
  });

  for (const insight of createdInsights) {
    await notify(
      {
        organizationId,
        actorUserId: userId,
        eventKey: `ai.insight_created:${insight.id}`,
        recipientUserIds: [userId],
        category: "ai_operations",
        priority: mapInsightPriority(insight.priority),
        title: "New AI recommendation",
        body: insight.title,
        href: insight.actionHref ?? "/ai-operations",
        sourceEntityType: "ai_insight",
        sourceEntityId: insight.id
      },
      db as unknown as SupabaseClientType
    ).catch(() => undefined);
  }
}

function mapInsightPriority(priority: InsightPriority): NotificationPriority {
  if (priority === "high") return "high";
  if (priority === "low") return "low";
  return "normal";
}

export async function getAiDashboardMetrics(
  organizationId: string,
  userId: string,
  client?: SupabaseClientType
): Promise<AiDashboardMetrics> {
  await syncPortfolioInsights(organizationId, userId, client).catch(() => undefined);
  const db = aiDb(await resolveClient(client));
  const context = await buildPortfolioContext(organizationId, db as unknown as SupabaseClientType);
  const provider = getDefaultAiProvider();
  const summaryResult = provider.executePrompt({ promptKey: "portfolio_summary", message: null, context });

  const [insights, recentActivity] = await Promise.all([
    getInsightsForOrganization(organizationId, { status: "active", limit: 30 }, db as unknown as SupabaseClientType),
    getAiActivityForOrganization(organizationId, { limit: 8 }, db as unknown as SupabaseClientType)
  ]);

  return {
    dailySummary: summaryResult.content.split(assistantFooterMarker())[0]?.trim() ?? summaryResult.content,
    recommendedActions: insights.filter((i) => i.insightType === "recommendation").slice(0, 5),
    highPriorityItems: insights.filter((i) => i.priority === "high").slice(0, 5),
    potentialRisks: insights.filter((i) => i.insightType === "risk").slice(0, 5),
    portfolioInsights: insights.filter((i) => i.insightType === "summary").slice(0, 5),
    recentActivity
  };
}

export async function getAiActivityForOrganization(
  organizationId: string,
  options: { limit?: number } = {},
  client?: SupabaseClientType
): Promise<AiActivityRecord[]> {
  const db = aiDb(await resolveClient(client));
  let query = db
    .from("ai_activity")
    .select("id, organization_id, user_id, activity_type, conversation_id, insight_id, prompt_key, summary, payload, created_at")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });
  if (options.limit) query = query.limit(options.limit);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return ((data ?? []) as ActivityRow[]).map(toActivityRecord);
}

async function getMessagesForConversation(
  organizationId: string,
  conversationId: string,
  db: AiDbClient
): Promise<AiMessageRecord[]> {
  const { data, error } = await db
    .from("ai_messages")
    .select("id, organization_id, conversation_id, role, content, prompt_key, sources, metadata, created_at")
    .eq("organization_id", organizationId)
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return ((data ?? []) as MessageRow[]).map(toMessageRecord);
}

async function insertMessage(
  db: AiDbClient,
  organizationId: string,
  conversationId: string,
  userId: string,
  role: AiMessageRecord["role"],
  content: string,
  promptKey: string,
  sources: AiMessageRecord["sources"]
): Promise<AiMessageRecord> {
  const { data, error } = await db
    .from("ai_messages")
    .insert({
      organization_id: organizationId,
      conversation_id: conversationId,
      role,
      content,
      prompt_key: promptKey,
      sources: sources as unknown as Json,
      created_by: userId
    })
    .select("id, organization_id, conversation_id, role, content, prompt_key, sources, metadata, created_at")
    .single();
  if (error) throw new Error(error.message);
  return toMessageRecord(data as MessageRow);
}

async function recordAiActivity(
  db: AiDbClient,
  organizationId: string,
  userId: string,
  input: {
    activityType: AiActivityType;
    conversationId?: string | null;
    insightId?: string | null;
    promptKey?: string | null;
    summary: string;
    payload?: Record<string, unknown>;
  }
): Promise<void> {
  const { error } = await db.from("ai_activity").insert({
    organization_id: organizationId,
    user_id: userId,
    activity_type: input.activityType,
    conversation_id: input.conversationId ?? null,
    insight_id: input.insightId ?? null,
    prompt_key: input.promptKey ?? null,
    summary: input.summary,
    payload: (input.payload ?? {}) as Json
  });
  if (error) throw new Error(error.message);
}

function assistantFooterMarker(): string {
  return "\n\n---";
}

type ConversationRow = {
  id: string;
  organization_id: string;
  user_id: string;
  title: string;
  status: AiConversationRecord["status"];
  last_prompt_key: string | null;
  metadata: Json | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

type MessageRow = {
  id: string;
  organization_id: string;
  conversation_id: string;
  role: AiMessageRecord["role"];
  content: string;
  prompt_key: string | null;
  sources: Json | null;
  metadata: Json | null;
  created_at: string;
};

type InsightRow = {
  id: string;
  organization_id: string;
  insight_type: AiInsightRecord["insightType"];
  category: AiInsightRecord["category"];
  priority: AiInsightRecord["priority"];
  status: AiInsightRecord["status"];
  title: string;
  content: string;
  action_href: string | null;
  action_label: string | null;
  entity_type: string | null;
  entity_id: string | null;
  prompt_key: string | null;
  sources: Json | null;
  metadata: Json | null;
  created_at: string;
  updated_at: string;
  dismissed_at: string | null;
  deleted_at: string | null;
};

type ActivityRow = {
  id: string;
  organization_id: string;
  user_id: string;
  activity_type: AiActivityType;
  conversation_id: string | null;
  insight_id: string | null;
  prompt_key: string | null;
  summary: string;
  payload: Json | null;
  created_at: string;
};

function toConversationRecord(row: ConversationRow): AiConversationRecord {
  return {
    id: row.id,
    organizationId: row.organization_id,
    userId: row.user_id,
    title: row.title,
    status: row.status,
    lastPromptKey: row.last_prompt_key,
    metadata: (row.metadata as Record<string, unknown> | null) ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at
  };
}

function toMessageRecord(row: MessageRow): AiMessageRecord {
  return {
    id: row.id,
    organizationId: row.organization_id,
    conversationId: row.conversation_id,
    role: row.role,
    content: row.content,
    promptKey: row.prompt_key,
    sources: (row.sources as AiMessageRecord["sources"] | null) ?? [],
    metadata: (row.metadata as Record<string, unknown> | null) ?? {},
    createdAt: row.created_at
  };
}

function toInsightRecord(row: InsightRow): AiInsightRecord {
  return {
    id: row.id,
    organizationId: row.organization_id,
    insightType: row.insight_type,
    category: row.category,
    priority: row.priority,
    status: row.status,
    title: row.title,
    content: row.content,
    actionHref: row.action_href,
    actionLabel: row.action_label,
    entityType: row.entity_type,
    entityId: row.entity_id,
    promptKey: row.prompt_key,
    sources: (row.sources as AiInsightRecord["sources"] | null) ?? [],
    metadata: (row.metadata as Record<string, unknown> | null) ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    dismissedAt: row.dismissed_at,
    deletedAt: row.deleted_at
  };
}

function toActivityRecord(row: ActivityRow): AiActivityRecord {
  return {
    id: row.id,
    organizationId: row.organization_id,
    userId: row.user_id,
    activityType: row.activity_type,
    conversationId: row.conversation_id,
    insightId: row.insight_id,
    promptKey: row.prompt_key,
    summary: row.summary,
    payload: (row.payload as Record<string, unknown> | null) ?? {},
    createdAt: row.created_at
  };
}

async function resolveClient(client?: SupabaseClientType): Promise<SupabaseClientType> {
  return client ?? (await createAuthServerComponentClient());
}
