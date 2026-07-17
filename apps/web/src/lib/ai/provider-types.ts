import type { DashboardSnapshot } from "../dashboard/server";

export type PortfolioContext = {
  snapshot: DashboardSnapshot;
  vacantUnits: Array<{ id: string; unitNumber: string; propertyName: string | null; occupancyStatus: string }>;
  generatedAt: string;
};

export type PromptExecutionResult = {
  content: string;
  title: string;
  sources: Array<{ type: string; label: string; href?: string | null }>;
  insightCandidates: Array<{
    insightType: "summary" | "recommendation" | "risk" | "draft";
    category: "portfolio" | "maintenance" | "vendor" | "financial" | "communication" | "lease" | "vacancy" | "general";
    priority: "high" | "medium" | "low";
    title: string;
    content: string;
    actionHref?: string | null;
    actionLabel?: string | null;
  }>;
};

export type AiProvider = {
  id: string;
  name: string;
  executePrompt: (input: {
    promptKey: string;
    message: string | null;
    context: PortfolioContext;
  }) => PromptExecutionResult;
};
