import { fuzzyFilter } from "../fuzzy";
import { getFavoriteItems, getRecentItems } from "../storage";
import type { CommandCenterProvider, CommandCenterResult, CommandCenterStatusVariant } from "../types";

export const recentProvider: CommandCenterProvider = {
  id: "recent",
  category: "recent",
  sectionTitle: "Recently Viewed",
  priority: 20,
  enabled: (context) => !context.query.trim() || context.query.trim().length >= 1,
  search: async (context) => {
    const recents = getRecentItems();
    const matches = fuzzyFilter(
      context.query,
      recents,
      (item) => [item.label, item.subtitle ?? "", item.context ?? "", item.badge],
      8
    );

    return matches.map(({ item, score }) => ({
      id: `recent-${item.key}`,
      kind: item.kind,
      category: "recent",
      label: item.label,
      subtitle: item.subtitle,
      context: item.context,
      badge: item.badge,
      status: item.status,
      statusVariant: statusVariantForKind(item.kind),
      icon: iconForKind(item.kind, "recent"),
      href: item.href,
      shortcut: null,
      score: context.query.trim() ? score : 95 - recents.findIndex((entry) => entry.key === item.key),
      favoriteKey: item.key
    }));
  }
};

export const favoritesProvider: CommandCenterProvider = {
  id: "favorites",
  category: "favorites",
  sectionTitle: "Favorites",
  priority: 15,
  search: async (context) => {
    const favorites = getFavoriteItems();
    const matches = fuzzyFilter(
      context.query,
      favorites,
      (item) => [item.label, item.subtitle ?? "", item.context ?? "", item.badge],
      8
    );

    return matches.map(({ item, score }) => ({
      id: `favorite-${item.key}`,
      kind: item.kind,
      category: "favorites",
      label: item.label,
      subtitle: item.subtitle,
      context: item.context,
      badge: item.badge,
      status: item.status,
      statusVariant: statusVariantForKind(item.kind),
      icon: "★",
      href: item.href,
      shortcut: null,
      score: context.query.trim() ? score : 98 - favorites.findIndex((entry) => entry.key === item.key),
      favoriteKey: item.key
    }));
  }
};

function iconForKind(kind: CommandCenterResult["kind"], mode: "default" | "recent" = "default"): string {
  if (mode === "recent") {
    return "↺";
  }
  switch (kind) {
    case "property":
      return "🏢";
    case "unit":
      return "🚪";
    case "tenant":
      return "👤";
    case "organization":
      return "🏛";
    case "dashboard":
      return "⌁";
    default:
      return "•";
  }
}

function statusVariantForKind(kind: CommandCenterResult["kind"]): CommandCenterStatusVariant {
  switch (kind) {
    case "property":
    case "unit":
    case "tenant":
      return "success";
    case "organization":
      return "info";
    default:
      return "neutral";
  }
}

export { iconForKind, statusVariantForKind };
