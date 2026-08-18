import type { StaffSearchDomain } from "./search";

export const RECENT_ITEMS_STORAGE_PREFIX = "mpa_recent_items:v1";
export const RECENT_ITEMS_MAX = 8;

export const RECENT_RECORD_TYPES = [
  "property",
  "resident",
  "asset",
  "facility_work_order",
  "pm_work_order",
  "vendor",
] as const;

export type RecentRecordType = (typeof RECENT_RECORD_TYPES)[number];

export interface RecentItemRef {
  type: RecentRecordType;
  id: string;
  viewedAt: string;
}

export function recentItemsStorageKey(orgId: string, userId: string): string {
  return `${RECENT_ITEMS_STORAGE_PREFIX}:${orgId}:${userId}`;
}

export function isRecentRecordType(value: string): value is RecentRecordType {
  return (RECENT_RECORD_TYPES as readonly string[]).includes(value);
}

export function recentTypeToSearchDomain(type: RecentRecordType): StaffSearchDomain {
  return type;
}

export function rememberRecentItem(
  existing: RecentItemRef[],
  next: Omit<RecentItemRef, "viewedAt">,
  nowIso = new Date().toISOString(),
): RecentItemRef[] {
  const filtered = existing.filter((item) => !(item.type === next.type && item.id === next.id));
  return [{ ...next, viewedAt: nowIso }, ...filtered].slice(0, RECENT_ITEMS_MAX);
}

export function parseRecentItemsJson(raw: string | null): RecentItemRef[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item): item is RecentItemRef => {
        if (!item || typeof item !== "object") return false;
        const rec = item as RecentItemRef;
        return (
          isRecentRecordType(rec.type) &&
          typeof rec.id === "string" &&
          rec.id.length > 0 &&
          typeof rec.viewedAt === "string"
        );
      })
      .slice(0, RECENT_ITEMS_MAX);
  } catch {
    return [];
  }
}
