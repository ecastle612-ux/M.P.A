"use client";

import {
  parseRecentItemsJson,
  recentItemsStorageKey,
  rememberRecentItem,
  type RecentItemRef,
  type RecentRecordType
} from "@mpa/shared";

export function readRecentItems(orgId: string, userId: string): RecentItemRef[] {
  if (typeof window === "undefined") return [];
  try {
    return parseRecentItemsJson(window.localStorage.getItem(recentItemsStorageKey(orgId, userId)));
  } catch {
    return [];
  }
}

export function writeRecentItem(
  orgId: string,
  userId: string,
  item: { type: RecentRecordType; id: string }
): RecentItemRef[] {
  const next = rememberRecentItem(readRecentItems(orgId, userId), item);
  try {
    window.localStorage.setItem(recentItemsStorageKey(orgId, userId), JSON.stringify(next));
  } catch {
    // Non-fatal client preference.
  }
  return next;
}
