export const PROMPT_KEYS = [
  "show_vacant_units",
  "show_overdue_maintenance",
  "show_expiring_leases",
  "summarize_vendor_performance",
  "summarize_owner_portfolio",
  "summarize_today_activity",
  "draft_announcement",
  "draft_maintenance_update",
  "portfolio_summary",
  "explain_occupancy",
  "summarize_financial_health",
  "summarize_communication_activity",
  "summarize_lease_renewals",
  "custom_question"
] as const;

export const INSIGHT_TYPES = ["summary", "recommendation", "risk", "draft"] as const;
export const INSIGHT_CATEGORIES = [
  "portfolio",
  "maintenance",
  "vendor",
  "financial",
  "communication",
  "lease",
  "vacancy",
  "general"
] as const;
export const INSIGHT_PRIORITIES = ["high", "medium", "low"] as const;
export const INSIGHT_STATUSES = ["active", "dismissed", "applied"] as const;
export const AI_ACTIVITY_TYPES = [
  "prompt_run",
  "insight_generated",
  "insight_dismissed",
  "insight_applied",
  "draft_created",
  "summary_generated"
] as const;

export type PromptKey = (typeof PROMPT_KEYS)[number];
export type InsightType = (typeof INSIGHT_TYPES)[number];
export type InsightCategory = (typeof INSIGHT_CATEGORIES)[number];
export type InsightPriority = (typeof INSIGHT_PRIORITIES)[number];
export type InsightStatus = (typeof INSIGHT_STATUSES)[number];
export type AiActivityType = (typeof AI_ACTIVITY_TYPES)[number];

export type PromptDefinition = {
  key: PromptKey;
  label: string;
  description: string;
  category: InsightCategory | "general";
  suggested: boolean;
};

export type AiConversationRecord = {
  id: string;
  organizationId: string;
  userId: string;
  title: string;
  status: "active" | "archived";
  lastPromptKey: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type AiMessageRecord = {
  id: string;
  organizationId: string;
  conversationId: string;
  role: "user" | "assistant" | "system";
  content: string;
  promptKey: string | null;
  sources: Array<{ type: string; label: string; href?: string | null }>;
  metadata: Record<string, unknown>;
  createdAt: string;
};

export type AiInsightRecord = {
  id: string;
  organizationId: string;
  insightType: InsightType;
  category: InsightCategory;
  priority: InsightPriority;
  status: InsightStatus;
  title: string;
  content: string;
  actionHref: string | null;
  actionLabel: string | null;
  entityType: string | null;
  entityId: string | null;
  promptKey: string | null;
  sources: Array<{ type: string; label: string; href?: string | null }>;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  dismissedAt: string | null;
  deletedAt: string | null;
};

export type AiActivityRecord = {
  id: string;
  organizationId: string;
  userId: string;
  activityType: AiActivityType;
  conversationId: string | null;
  insightId: string | null;
  promptKey: string | null;
  summary: string;
  payload: Record<string, unknown>;
  createdAt: string;
};

export type RunPromptInput = {
  promptKey?: PromptKey | null;
  message?: string | null;
  conversationId?: string | null;
};

export type AiDashboardMetrics = {
  dailySummary: string;
  recommendedActions: AiInsightRecord[];
  highPriorityItems: AiInsightRecord[];
  potentialRisks: AiInsightRecord[];
  portfolioInsights: AiInsightRecord[];
  recentActivity: AiActivityRecord[];
};

export const PROMPT_LIBRARY: PromptDefinition[] = [
  {
    key: "show_vacant_units",
    label: "Show vacant units",
    description: "List vacant-ready and vacant-not-ready units across the portfolio.",
    category: "vacancy",
    suggested: true
  },
  {
    key: "show_overdue_maintenance",
    label: "Show overdue maintenance",
    description: "Surface overdue work orders and high-priority open items.",
    category: "maintenance",
    suggested: true
  },
  {
    key: "show_expiring_leases",
    label: "Show leases expiring soon",
    description: "Highlight leases expiring within the next 60 days.",
    category: "lease",
    suggested: true
  },
  {
    key: "summarize_vendor_performance",
    label: "Summarize vendor performance",
    description: "Review open assignments, response times, and preferred vendors.",
    category: "vendor",
    suggested: true
  },
  {
    key: "summarize_owner_portfolio",
    label: "Summarize owner portfolio",
    description: "Portfolio-level occupancy, vacancies, and operational highlights.",
    category: "portfolio",
    suggested: true
  },
  {
    key: "summarize_today_activity",
    label: "Summarize today's activity",
    description: "Recent changes across properties, tenants, maintenance, and financials.",
    category: "general",
    suggested: true
  },
  {
    key: "draft_announcement",
    label: "Draft announcement",
    description: "Draft a tenant announcement for your review — not sent automatically.",
    category: "communication",
    suggested: true
  },
  {
    key: "draft_maintenance_update",
    label: "Draft maintenance update",
    description: "Draft a resident maintenance status update for your review.",
    category: "maintenance",
    suggested: true
  },
  {
    key: "portfolio_summary",
    label: "Portfolio summary",
    description: "Executive summary of portfolio health.",
    category: "portfolio",
    suggested: false
  },
  {
    key: "explain_occupancy",
    label: "Explain occupancy",
    description: "Break down occupied vs vacant units and occupancy rate.",
    category: "portfolio",
    suggested: false
  },
  {
    key: "summarize_financial_health",
    label: "Summarize financial health",
    description: "Rent due, late charges, outstanding balances, and recent payments.",
    category: "financial",
    suggested: false
  },
  {
    key: "summarize_communication_activity",
    label: "Summarize communication activity",
    description: "Announcements, read rates, and scheduled communications.",
    category: "communication",
    suggested: false
  },
  {
    key: "summarize_lease_renewals",
    label: "Summarize lease renewals",
    description: "Renewals needed, upcoming expirations, and move-ins/outs.",
    category: "lease",
    suggested: false
  }
];

export const AI_ASSISTANT_DISCLAIMER =
  "AI assistant — recommendations and drafts require property manager review. M.P.A. never performs irreversible actions automatically.";

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function parseRunPromptInput(payload: unknown): RunPromptInput | null {
  if (!payload || typeof payload !== "object") return null;
  const body = payload as Record<string, unknown>;
  const input: RunPromptInput = {};
  if (isNonEmptyString(body["promptKey"]) && PROMPT_KEYS.includes(body["promptKey"] as PromptKey)) {
    input.promptKey = body["promptKey"] as PromptKey;
  }
  if (isNonEmptyString(body["message"])) input.message = body["message"].trim();
  if (isNonEmptyString(body["conversationId"])) input.conversationId = body["conversationId"].trim();
  if (!input.promptKey && !input.message) return null;
  return input;
}

export function getPromptDefinition(key: PromptKey): PromptDefinition | undefined {
  return PROMPT_LIBRARY.find((prompt) => prompt.key === key);
}

export function toInsightTypeLabel(type: InsightType): string {
  const labels: Record<InsightType, string> = {
    summary: "Summary",
    recommendation: "Recommendation",
    risk: "Risk",
    draft: "Draft"
  };
  return labels[type];
}
