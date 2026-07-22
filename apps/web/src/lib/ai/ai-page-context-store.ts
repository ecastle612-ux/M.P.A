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
  launcherLabel: "What needs attention across the portfolio?",
  suggestions: [
    {
      id: "portfolio",
      label: "What needs attention across the portfolio?",
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
  /** List routes — avoid “this property/resident” wording. */
  listMode?: boolean;
}): AiPageContextValue {
  const label = input.entityLabel?.trim() || null;
  const listMode = Boolean(input.listMode) && !input.entityId;

  switch (input.entityType) {
    case "dashboard":
      return {
        ...input,
        launcherLabel: "What should I handle first today?",
        suggestions: [
          {
            id: "attention",
            label: "What should I handle first today?",
            promptKey: "summarize_today_activity"
          },
          {
            id: "maintenance",
            label: "Which work orders are overdue?",
            promptKey: "show_overdue_maintenance"
          },
          {
            id: "collections",
            label: "Who still owes rent?",
            promptKey: "summarize_financial_health",
            message: "List residents with outstanding or late balances and the next collection step."
          }
        ]
      };
    case "property":
      if (listMode) {
        return {
          ...input,
          launcherLabel: "Which properties need attention?",
          suggestions: [
            {
              id: "properties-attention",
              label: "Which properties need attention?",
              message:
                "Rank properties by vacancies, open maintenance, and late rent so I know where to start."
            },
            {
              id: "vacancies",
              label: "Where are the vacant units?",
              promptKey: "explain_occupancy"
            }
          ]
        };
      }
      return {
        ...input,
        launcherLabel: label ? `What's open at ${label}?` : "What's open at this property?",
        suggestions: [
          {
            id: "ask-property",
            label: label ? `What's open at ${label}?` : "What's open at this property?",
            message: label
              ? `Summarize vacancies, open work orders, and rent risk for property ${label}.`
              : "Summarize vacancies, open work orders, and rent risk for this property."
          },
          {
            id: "occupancy",
            label: "Explain occupancy",
            promptKey: "explain_occupancy"
          }
        ]
      };
    case "resident":
      if (listMode) {
        return {
          ...input,
          launcherLabel: "Which residents need follow-up?",
          suggestions: [
            {
              id: "residents-followup",
              label: "Which residents need follow-up?",
              message: "List residents with late rent, open maintenance, or incomplete profiles."
            }
          ]
        };
      }
      return {
        ...input,
        launcherLabel: label ? `Summarize ${label}'s account` : "Summarize this resident's account",
        suggestions: [
          {
            id: "ask-resident",
            label: label ? `Summarize ${label}'s account` : "Summarize this resident's account",
            message: label
              ? `Summarize lease status, balance, and open maintenance for ${label}.`
              : "Summarize this resident's lease, balance, and open maintenance."
          },
          {
            id: "draft-reminder",
            label: "Draft a rent reminder",
            message: label
              ? `Draft a short, professional rent reminder message for ${label}.`
              : "Draft a short, professional rent reminder for this resident."
          }
        ]
      };
    case "work_order":
      if (listMode) {
        return {
          ...input,
          launcherLabel: "Which work orders need action?",
          suggestions: [
            {
              id: "wo-queue",
              label: "Which work orders need action?",
              promptKey: "show_overdue_maintenance",
              message: "Prioritize open work orders by urgency, overdue status, and waiting on resident/vendor."
            }
          ]
        };
      }
      return {
        ...input,
        launcherLabel: label ? `Next step for ${label}` : "What's the next step on this work order?",
        suggestions: [
          {
            id: "summarize-wo",
            label: label ? `Next step for ${label}` : "What's the next step on this work order?",
            promptKey: "draft_maintenance_update",
            message: label
              ? `Summarize work order ${label}: status, urgency, and the next action I should take.`
              : "Summarize this work order: status, urgency, and the next action I should take."
          },
          {
            id: "suggest-vendor",
            label: "Who should I assign?",
            promptKey: "summarize_vendor_performance",
            message: "Suggest a suitable vendor for this work order based on category and history."
          },
          {
            id: "draft-response",
            label: "Draft resident update",
            promptKey: "draft_maintenance_update"
          }
        ]
      };
    case "lease":
      if (listMode) {
        return {
          ...input,
          launcherLabel: "Which leases need attention?",
          suggestions: [
            {
              id: "leases-attention",
              label: "Which leases need attention?",
              message: "List leases that are expiring, awaiting signature, or need renewal outreach."
            }
          ]
        };
      }
      return {
        ...input,
        launcherLabel: label ? `Explain lease ${label}` : "Explain this lease in plain language",
        suggestions: [
          {
            id: "explain-lease",
            label: label ? `Explain lease ${label}` : "Explain this lease in plain language",
            message: label
              ? `Explain lease ${label}: status, rent, dates, and renewal posture.`
              : "Explain this lease: status, rent, dates, and renewal posture."
          }
        ]
      };
    case "financial":
    case "report":
      return {
        ...input,
        launcherLabel: "Explain collections and cash position",
        suggestions: [
          {
            id: "explain-financials",
            label: "Explain collections and cash position",
            promptKey: "summarize_financial_health"
          },
          {
            id: "late-rent",
            label: "Who is late on rent?",
            message: "List late rent balances with resident, property, and recommended next step."
          }
        ]
      };
    case "settings":
      return {
        ...input,
        launcherLabel: "Help me configure settings",
        suggestions: [
          {
            id: "ask-settings",
            label: "Help me configure settings",
            message: "Explain what I can configure here and any recommended defaults for operations."
          }
        ]
      };
    case "messages":
      return {
        ...input,
        launcherLabel: "Draft a resident update",
        suggestions: [
          {
            id: "draft-announcement",
            label: "Draft a property announcement",
            promptKey: "draft_announcement"
          },
          {
            id: "draft-owner",
            label: "Draft an owner update",
            message: "Draft a concise owner update summarizing today's operational changes."
          }
        ]
      };
    case "unit":
      if (listMode) {
        return {
          ...input,
          launcherLabel: "Which units need leasing attention?",
          suggestions: [
            {
              id: "units-attention",
              label: "Which units need leasing attention?",
              promptKey: "explain_occupancy"
            }
          ]
        };
      }
      return {
        ...input,
        launcherLabel: label ? `Status of unit ${label}` : "What's the status of this unit?",
        suggestions: [
          {
            id: "unit-status",
            label: label ? `Status of unit ${label}` : "What's the status of this unit?",
            message: label
              ? `Summarize occupancy, lease, and open maintenance for unit ${label}.`
              : "Summarize occupancy, lease, and open maintenance for this unit."
          }
        ]
      };
    case "vendor":
      if (listMode) {
        return {
          ...input,
          launcherLabel: "Which vendors need follow-up?",
          suggestions: [
            {
              id: "vendors-followup",
              label: "Which vendors need follow-up?",
              promptKey: "summarize_vendor_performance"
            }
          ]
        };
      }
      return {
        ...input,
        launcherLabel: label ? `How is ${label} performing?` : "How is this vendor performing?",
        suggestions: [
          {
            id: "vendor-perf",
            label: label ? `How is ${label} performing?` : "How is this vendor performing?",
            promptKey: "summarize_vendor_performance"
          }
        ]
      };
    case "applicant":
      if (listMode) {
        return {
          ...input,
          launcherLabel: "Which applicants need a decision?",
          suggestions: [
            {
              id: "applicants-queue",
              label: "Which applicants need a decision?",
              message: "List applicants awaiting review, screening, or lease offer."
            }
          ]
        };
      }
      return {
        ...input,
        launcherLabel: label ? `Next step for ${label}` : "What's the next leasing step?",
        suggestions: [
          {
            id: "applicant-next",
            label: label ? `Next step for ${label}` : "What's the next leasing step?",
            message: label
              ? `Summarize application status and the next leasing action for ${label}.`
              : "Summarize application status and the next leasing action."
          }
        ]
      };
    default:
      return {
        ...input,
        launcherLabel: "What needs attention across the portfolio?",
        suggestions: DEFAULT_AI_PAGE_CONTEXT.suggestions
      };
  }
}
