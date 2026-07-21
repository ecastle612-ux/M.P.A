/**
 * SH-002: external store for floating copilot page context.
 * Updates must NOT re-render the application shell / drawer / search inputs.
 * Only FloatingAiCopilot (and optional bridges) subscribe.
 */

import type { PromptKey } from "./contracts";

export type AiPageEntityType =
  | "dashboard"
  | "property"
  | "resident"
  | "unit"
  | "work_order"
  | "lease"
  | "vendor"
  | "applicant"
  | "financial"
  | "report"
  | "messages"
  | "settings"
  | "generic";

export type AiPageContextValue = {
  entityType: AiPageEntityType;
  entityId?: string | null;
  entityLabel?: string | null;
  launcherLabel: string;
  suggestions: Array<{ id: string; label: string; promptKey?: PromptKey; message?: string }>;
};

export const DEFAULT_AI_PAGE_CONTEXT: AiPageContextValue = {
  entityType: "generic",
  launcherLabel: "Ask about your portfolio",
  suggestions: [
    {
      id: "portfolio",
      label: "Ask about your portfolio",
      promptKey: "portfolio_summary"
    }
  ]
};

let current: AiPageContextValue = DEFAULT_AI_PAGE_CONTEXT;
const listeners = new Set<() => void>();

export function getAiPageContextSnapshot(): AiPageContextValue {
  return current;
}

export function subscribeAiPageContext(onStoreChange: () => void): () => void {
  listeners.add(onStoreChange);
  return () => {
    listeners.delete(onStoreChange);
  };
}

export function setAiPageContext(next: AiPageContextValue | null): void {
  current = next ?? DEFAULT_AI_PAGE_CONTEXT;
  listeners.forEach((listener) => listener());
}

export function buildAiPageContext(input: {
  entityType: AiPageEntityType;
  entityId?: string | null;
  entityLabel?: string | null;
}): AiPageContextValue {
  const label = input.entityLabel?.trim() || null;
  switch (input.entityType) {
    case "dashboard":
      return {
        ...input,
        launcherLabel: "What requires attention today?",
        suggestions: [
          {
            id: "attention",
            label: "What requires attention today?",
            promptKey: "summarize_today_activity"
          },
          {
            id: "maintenance",
            label: "Show overdue maintenance",
            promptKey: "show_overdue_maintenance"
          }
        ]
      };
    case "property":
      return {
        ...input,
        launcherLabel: label ? `Ask about ${label}` : "Ask about this property",
        suggestions: [
          {
            id: "ask-property",
            label: label ? `Ask about ${label}` : "Ask about this property",
            message: label
              ? `Summarize operational status, vacancies, and open work for property ${label}.`
              : "Summarize this property's operational status, vacancies, and open work."
          },
          {
            id: "occupancy",
            label: "Explain occupancy",
            promptKey: "explain_occupancy"
          }
        ]
      };
    case "resident":
      return {
        ...input,
        launcherLabel: label ? `Ask about ${label}` : "Ask about this resident",
        suggestions: [
          {
            id: "ask-resident",
            label: label ? `Ask about ${label}` : "Ask about this resident",
            message: label
              ? `Summarize lease, balance, and open maintenance for resident ${label}.`
              : "Summarize this resident's lease, balance, and open maintenance."
          }
        ]
      };
    case "work_order":
      return {
        ...input,
        launcherLabel: "Summarize this work order",
        suggestions: [
          {
            id: "summarize-wo",
            label: "Summarize this work order",
            promptKey: "draft_maintenance_update",
            message: label
              ? `Summarize work order ${label}: status, urgency, and next step.`
              : "Summarize this work order: status, urgency, and next step."
          },
          {
            id: "suggest-vendor",
            label: "Suggest vendor",
            promptKey: "summarize_vendor_performance",
            message: "Suggest a suitable vendor for this work order based on category and history."
          },
          {
            id: "draft-response",
            label: "Draft response",
            promptKey: "draft_maintenance_update"
          }
        ]
      };
    case "financial":
    case "report":
      return {
        ...input,
        launcherLabel: "Explain financials",
        suggestions: [
          {
            id: "explain-financials",
            label: "Explain financials",
            promptKey: "summarize_financial_health"
          }
        ]
      };
    case "settings":
      return {
        ...input,
        launcherLabel: "Ask about settings",
        suggestions: [
          {
            id: "ask-settings",
            label: "Ask about settings",
            message: "Help me understand organization settings and what I can configure here."
          }
        ]
      };
    case "messages":
      return {
        ...input,
        launcherLabel: "Help with communications",
        suggestions: [
          {
            id: "draft-announcement",
            label: "Draft announcement",
            promptKey: "draft_announcement"
          }
        ]
      };
    default:
      return {
        ...input,
        launcherLabel: "Ask about your portfolio",
        suggestions: DEFAULT_AI_PAGE_CONTEXT.suggestions
      };
  }
}
