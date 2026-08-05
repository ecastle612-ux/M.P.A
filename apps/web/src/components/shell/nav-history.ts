"use client";

import {
  getFavoriteItems,
  getRecentItems,
  type CommandCenterStoredItem
} from "../../lib/command-center/storage";

export const NAV_HISTORY_EVENT = "mpa:nav-history";
export const OPEN_MOBILE_NAV_EVENT = "mpa:open-mobile-nav";
export const OPEN_NOTIFICATIONS_EVENT = "mpa:open-notifications";

/**
 * useSyncExternalStore requires getSnapshot to return a cached reference when
 * data is unchanged (Object.is). Returning `.slice()` / `[]` every call causes
 * an infinite re-render loop in React 19.
 */
const EMPTY_NAV_HISTORY: CommandCenterStoredItem[] = [];
let favoritesSnapshotCache: CommandCenterStoredItem[] = EMPTY_NAV_HISTORY;
let favoritesSnapshotKey = "";
let recentsSnapshotCache: CommandCenterStoredItem[] = EMPTY_NAV_HISTORY;
let recentsSnapshotKey = "";

function cacheNavHistorySnapshot(
  items: CommandCenterStoredItem[],
  previousKey: string,
  previousValue: CommandCenterStoredItem[]
): { key: string; value: CommandCenterStoredItem[] } {
  const key = JSON.stringify(items);
  if (key === previousKey) return { key: previousKey, value: previousValue };
  return { key, value: items.length === 0 ? EMPTY_NAV_HISTORY : items };
}

export function subscribeNavHistory(onStoreChange: () => void) {
  const onLocal = () => onStoreChange();
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(NAV_HISTORY_EVENT, onLocal);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(NAV_HISTORY_EVENT, onLocal);
  };
}

export function getFavoritesSnapshot(limit = 8) {
  const next = cacheNavHistorySnapshot(
    getFavoriteItems().slice(0, limit),
    favoritesSnapshotKey,
    favoritesSnapshotCache
  );
  favoritesSnapshotKey = next.key;
  favoritesSnapshotCache = next.value;
  return favoritesSnapshotCache;
}

export function getRecentsSnapshot(limit = 6) {
  const next = cacheNavHistorySnapshot(
    getRecentItems().slice(0, limit),
    recentsSnapshotKey,
    recentsSnapshotCache
  );
  recentsSnapshotKey = next.key;
  recentsSnapshotCache = next.value;
  return recentsSnapshotCache;
}

export function getEmptyHistorySnapshot(): CommandCenterStoredItem[] {
  return EMPTY_NAV_HISTORY;
}

export function notifyNavHistory() {
  window.dispatchEvent(new Event(NAV_HISTORY_EVENT));
}

export function openMobileNavDrawer() {
  window.dispatchEvent(new Event(OPEN_MOBILE_NAV_EVENT));
}

export function openNotificationCenter() {
  window.dispatchEvent(new Event(OPEN_NOTIFICATIONS_EVENT));
}
