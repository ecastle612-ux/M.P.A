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
const ACTION_USAGE_KEY = "mpa_command_center_action_usage";
const OPS_SNOOZE_KEY = "mpa_ops_task_snooze";
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

export function getActionUsageScores(): Record<string, number> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(ACTION_USAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, number>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

/** Remember action frequency so frequently used actions rise automatically. */
export function recordActionUsage(key: string): void {
  if (typeof window === "undefined" || !key) return;
  try {
    const scores = getActionUsageScores();
    scores[key] = (scores[key] ?? 0) + 1;
    window.localStorage.setItem(ACTION_USAGE_KEY, JSON.stringify(scores));
  } catch {
    // Non-fatal.
  }
}

export function getSnoozedTaskIds(now = Date.now()): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(OPS_SNOOZE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as Record<string, string>;
    if (!parsed || typeof parsed !== "object") return new Set();
    const active = new Set<string>();
    const next: Record<string, string> = {};
    for (const [taskId, until] of Object.entries(parsed)) {
      const untilMs = Date.parse(until);
      if (!Number.isNaN(untilMs) && untilMs > now) {
        active.add(taskId);
        next[taskId] = until;
      }
    }
    window.localStorage.setItem(OPS_SNOOZE_KEY, JSON.stringify(next));
    return active;
  } catch {
    return new Set();
  }
}

/** Snooze a Today's Work task until the next local morning (or +4h fallback). */
export function snoozeOpsTask(taskId: string, hours = 4): void {
  if (typeof window === "undefined" || !taskId) return;
  try {
    const raw = window.localStorage.getItem(OPS_SNOOZE_KEY);
    const parsed = raw ? (JSON.parse(raw) as Record<string, string>) : {};
    const until = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
    parsed[taskId] = until;
    window.localStorage.setItem(OPS_SNOOZE_KEY, JSON.stringify(parsed));
  } catch {
    // Non-fatal.
  }
}
