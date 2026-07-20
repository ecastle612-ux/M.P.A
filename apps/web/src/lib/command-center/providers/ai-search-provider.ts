import { evaluateCapability } from "@mpa/shared";
import { PROMPT_LIBRARY } from "../../ai/contracts";
import { fuzzyFilter, fuzzyScore } from "../fuzzy";
import type { CommandCenterProvider, CommandCenterResult } from "../types";

type ConversationRecord = {
  id: string;
  title: string;
  lastPromptKey: string | null;
  updatedAt: string;
};

export const aiSearchProvider: CommandCenterProvider = {
  id: "ai-search",
  category: "ai",
  sectionTitle: "Ask AI",
  priority: 15,
  enabled: (context) => evaluateCapability(context.permissions, "ai:read"),
  search: async (context) => {
    const items: CommandCenterResult[] = [];
    const query = context.query.trim();

    if (evaluateCapability(context.permissions, "ai:use")) {
      const askAiScore = query
        ? Math.max(
            fuzzyScore(query, "Ask AI"),
            fuzzyScore(query, "Open AI Operations Center"),
            fuzzyScore(query, "AI Operations")
          )
        : 120;
      if (askAiScore > 0) {
        items.push({
          id: "ai-open-center",
          kind: "ai",
          category: "ai",
          label: "Ask AI",
          subtitle: "Open AI Operations Center",
          context: "Portfolio assistant — PM always in control",
          badge: "AI",
          status: "Assistant",
          statusVariant: "info",
          icon: "✦",
          href: "/ai-operations",
          shortcut: "G I",
          score: askAiScore === 120 ? askAiScore : askAiScore + 40
        });
      }
    }

    const promptMatches = fuzzyFilter(
      query,
      PROMPT_LIBRARY.filter((prompt) => prompt.suggested),
      (prompt) => [prompt.label, prompt.description, prompt.key.replaceAll("_", " ")],
      8
    );

    for (const { item: prompt, score } of promptMatches) {
      if (!evaluateCapability(context.permissions, "ai:use")) continue;
      items.push({
        id: `ai-prompt-${prompt.key}`,
        kind: "ai",
        category: "ai",
        label: prompt.label,
        subtitle: prompt.description,
        context: "Built-in prompt",
        badge: "Prompt",
        status: "Suggested",
        statusVariant: "neutral",
        icon: "✦",
        href: `/ai-operations?prompt=${prompt.key}`,
        shortcut: null,
        score: score + 20
      });
    }

    if (evaluateCapability(context.permissions, "ai:read")) {
      try {
        const conversations = await fetchRecentConversations(context.signal);
        const conversationMatches = fuzzyFilter(
          query,
          conversations,
          (conversation) => [conversation.title, conversation.lastPromptKey?.replaceAll("_", " ") ?? ""],
          5
        );

        for (const { item: conversation, score } of conversationMatches) {
          items.push({
            id: `ai-conversation-${conversation.id}`,
            kind: "ai",
            category: "ai",
            label: conversation.title,
            subtitle: conversation.lastPromptKey
              ? `Last prompt: ${conversation.lastPromptKey.replaceAll("_", " ")}`
              : "Recent AI conversation",
            context: "Resume conversation",
            badge: "AI",
            status: "Recent",
            statusVariant: "neutral",
            icon: "💬",
            href: `/ai-operations?conversation=${conversation.id}`,
            shortcut: null,
            score: score + 10
          });
        }
      } catch {
        // Ignore aborted or transient conversation fetch failures during palette search.
      }
    }

    return items.filter((item) => item.score > 0).sort((a, b) => b.score - a.score);
  }
};

async function fetchRecentConversations(signal: AbortSignal): Promise<ConversationRecord[]> {
  const response = await fetch("/api/ai/conversations", { signal, cache: "no-store" });
  if (!response.ok) return [];
  const payload = (await response.json()) as { items?: ConversationRecord[] };
  return payload.items ?? [];
}

export function registerFutureAiSearchProvider(provider: CommandCenterProvider): CommandCenterProvider {
  return {
    ...provider,
    id: provider.id || "ai-search",
    priority: provider.priority ?? 15
  };
}
