import {
  actionsProvider,
  navigationProvider,
  pinnedActionsProvider
} from "./providers/static-providers";
import { favoritesProvider, recentProvider } from "./providers/local-history-providers";
import {
  organizationsProvider,
  propertiesProvider,
  tenantsProvider,
  maintenanceProvider,
  vendorsProvider,
  leasesProvider,
  unitsProvider
} from "./providers/api-providers";
import { aiSearchProviderStub } from "./providers/ai-search-provider.stub";
import type {
  CommandCenterProvider,
  CommandCenterProviderRegistration,
  CommandCenterSearchContext,
  CommandCenterSection
} from "./types";

const CORE_PROVIDERS: CommandCenterProviderRegistration[] = [
  { ...pinnedActionsProvider, source: "core" },
  { ...favoritesProvider, source: "core" },
  { ...recentProvider, source: "core" },
  { ...propertiesProvider, source: "core" },
  { ...unitsProvider, source: "core" },
  { ...tenantsProvider, source: "core" },
  { ...maintenanceProvider, source: "core" },
  { ...vendorsProvider, source: "core" },
  { ...leasesProvider, source: "core" },
  { ...organizationsProvider, source: "core" },
  { ...actionsProvider, source: "core" },
  { ...navigationProvider, source: "core" },
  { ...aiSearchProviderStub, source: "extension" }
];

const extensionProviders: CommandCenterProviderRegistration[] = [];

export function registerCommandCenterProvider(provider: CommandCenterProvider): () => void {
  const registration: CommandCenterProviderRegistration = {
    ...provider,
    source: "extension"
  };
  extensionProviders.push(registration);
  return () => {
    const index = extensionProviders.findIndex((entry) => entry.id === provider.id);
    if (index >= 0) {
      extensionProviders.splice(index, 1);
    }
  };
}

export function listCommandCenterProviders(): CommandCenterProviderRegistration[] {
  return [...CORE_PROVIDERS, ...extensionProviders].sort((a, b) => a.priority - b.priority);
}

export async function searchCommandCenter(context: CommandCenterSearchContext): Promise<CommandCenterSection[]> {
  const providers = listCommandCenterProviders().filter((provider) => provider.enabled?.(context) ?? true);
  const sections = await Promise.all(
    providers.map(async (provider) => {
      const items = await provider.search(context);
      return {
        category: provider.category,
        title: provider.sectionTitle,
        items: items.sort((a, b) => b.score - a.score)
      } satisfies CommandCenterSection;
    })
  );

  return sections.filter((section) => section.items.length > 0);
}

export function toPaletteSections(sections: CommandCenterSection[]) {
  return sections.map((section) => ({
    title: section.title,
    items: section.items.map((item) => ({
      id: item.id,
      label: item.label,
      subtitle: item.subtitle ?? undefined,
      context: item.context ?? undefined,
      badge: item.badge,
      status: item.status ?? undefined,
      statusVariant: item.statusVariant,
      icon: item.icon,
      href: item.href ?? undefined,
      shortcut: item.shortcut ?? undefined
    }))
  }));
}

export type { CommandCenterResult } from "./types";
export { registerFutureAiSearchProvider } from "./providers/ai-search-provider.stub";
