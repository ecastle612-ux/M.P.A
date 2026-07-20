import { fuzzyFilter } from "../fuzzy";
import type { CommandCenterProvider, CommandCenterResult } from "../types";

const SHORTCUTS = [
  { id: "help-cmdk", label: "Open Command Center", shortcut: "⌘K / Ctrl+K", detail: "Primary action hub" },
  { id: "help-escape", label: "Close Command Center", shortcut: "Esc", detail: "Return to the page" },
  { id: "help-nav", label: "Navigate results", shortcut: "↑ ↓", detail: "Move selection" },
  { id: "help-enter", label: "Run selected action", shortcut: "Enter", detail: "Open or start work" },
  { id: "help-gd", label: "Operations Center / Today’s Work", shortcut: "G D", detail: "Go to dashboard" },
  { id: "help-gm", label: "Maintenance queue", shortcut: "G M", detail: "Open work orders" },
  { id: "help-gi", label: "Inbox", shortcut: "G I", detail: "Communications inbox" },
  { id: "help-ct", label: "Continue Move In", shortcut: "C T", detail: "Guided resident onboarding" },
  { id: "help-cy", label: "Record Payment", shortcut: "C Y", detail: "One-shot payment" },
  { id: "help-cm", label: "Create Work Order", shortcut: "C M", detail: "Log maintenance" },
  { id: "help-co", label: "Continue Move Out", shortcut: "C O", detail: "Guided move-out" },
  { id: "help-question", label: "Show this shortcut list", shortcut: "?", detail: "Type ? in the palette" }
] as const;

export const helpShortcutsProvider: CommandCenterProvider = {
  id: "help-shortcuts",
  category: "navigation",
  sectionTitle: "Keyboard shortcuts",
  priority: 3,
  enabled: (context) => {
    const q = context.query.trim().toLowerCase();
    return q === "?" || q.startsWith("help") || q.startsWith("shortcut") || q.startsWith("keyboard");
  },
  search: async (context) => {
    const matches = fuzzyFilter(
      context.query.trim() === "?" ? "" : context.query,
      [...SHORTCUTS],
      (item) => [item.label, item.shortcut, item.detail],
      16
    );

    return matches.map(
      ({ item, score }, index): CommandCenterResult => ({
        id: item.id,
        kind: "navigation",
        category: "navigation",
        label: item.label,
        subtitle: item.detail,
        context: "Keyboard",
        badge: "Shortcut",
        status: null,
        statusVariant: "neutral",
        icon: "⌨",
        href: null,
        shortcut: item.shortcut,
        score: 300 - index + score,
        onSelect: () => undefined
      })
    );
  }
};
