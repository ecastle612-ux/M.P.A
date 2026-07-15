import type { CommandCenterProvider } from "../types";

/**
 * Future AI search provider registration point.
 * PMX-003 intentionally ships no AI behavior — only the extension contract.
 */
export const aiSearchProviderStub: CommandCenterProvider = {
  id: "ai-search",
  category: "actions",
  sectionTitle: "AI Search",
  priority: 999,
  enabled: () => false,
  search: async () => []
};

export function registerFutureAiSearchProvider(provider: CommandCenterProvider): CommandCenterProvider {
  return {
    ...provider,
    id: provider.id || "ai-search",
    priority: provider.priority ?? 999
  };
}
