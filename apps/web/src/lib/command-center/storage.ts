import type { CommandCenterItemKind } from "./types";

export type CommandCenterStoredItem = {
  key: string;
  kind: CommandCenterItemKind;
  label: string;
  subtitle: string | null;
  context: string | null;
  badge: string;
  status: string | null;
  href: string;
  visitedAt: string;
};

const RECENTS_KEY = "mpa_command_center_recents";
const FAVORITES_KEY = "mpa_command_center_favorites";
const MAX_RECENTS = 12;
const MAX_FAVORITES = 16;

function readList(key: string): CommandCenterStoredItem[] {
  if (typeof window === "undefined") {
    return [];
  }
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CommandCenterStoredItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeList(key: string, items: CommandCenterStoredItem[]): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(key, JSON.stringify(items));
  } catch {
    // Non-fatal preference persistence failure.
  }
}

export function getRecentItems(): CommandCenterStoredItem[] {
  return readList(RECENTS_KEY);
}

export function getFavoriteItems(): CommandCenterStoredItem[] {
  return readList(FAVORITES_KEY);
}

export function recordRecentItem(item: Omit<CommandCenterStoredItem, "visitedAt">): void {
  const nextItem: CommandCenterStoredItem = { ...item, visitedAt: new Date().toISOString() };
  const withoutDuplicate = getRecentItems().filter((entry) => entry.key !== item.key);
  writeList(RECENTS_KEY, [nextItem, ...withoutDuplicate].slice(0, MAX_RECENTS));
}

export function toggleFavoriteItem(item: Omit<CommandCenterStoredItem, "visitedAt">): boolean {
  const favorites = getFavoriteItems();
  const exists = favorites.some((entry) => entry.key === item.key);
  if (exists) {
    writeList(
      FAVORITES_KEY,
      favorites.filter((entry) => entry.key !== item.key)
    );
    return false;
  }
  writeList(FAVORITES_KEY, [{ ...item, visitedAt: new Date().toISOString() }, ...favorites].slice(0, MAX_FAVORITES));
  return true;
}

export function isFavoriteItem(key: string): boolean {
  return getFavoriteItems().some((entry) => entry.key === key);
}

export function buildStorageKey(kind: CommandCenterItemKind, id: string): string {
  return `${kind}:${id}`;
}
