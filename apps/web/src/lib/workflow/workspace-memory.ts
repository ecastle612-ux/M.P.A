/**
 * WF-004 — client-only workspace memory.
 * Soft defaults for forms; never authoritative over URL params or server data.
 */

const PREFIX = "mpa.wf_memory.";

export type WorkspaceMemory = {
  propertyId: string | null;
  unitId: string | null;
  tenantId: string | null;
  announcementScope: string | null;
  announcementCategory: string | null;
  accountingPeriod: string | null;
  lastVendorIdByCategory: Record<string, string>;
};

const EMPTY: WorkspaceMemory = {
  propertyId: null,
  unitId: null,
  tenantId: null,
  announcementScope: null,
  announcementCategory: null,
  accountingPeriod: null,
  lastVendorIdByCategory: {}
};

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readJson<T>(key: string, fallback: T): T {
  if (!canUseStorage()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): void {
  if (!canUseStorage()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore quota / private mode
  }
}

export function getWorkspaceMemory(): WorkspaceMemory {
  return {
    propertyId: readJson<string | null>(`${PREFIX}propertyId`, null),
    unitId: readJson<string | null>(`${PREFIX}unitId`, null),
    tenantId: readJson<string | null>(`${PREFIX}tenantId`, null),
    announcementScope: readJson<string | null>(`${PREFIX}announcementScope`, null),
    announcementCategory: readJson<string | null>(`${PREFIX}announcementCategory`, null),
    accountingPeriod: readJson<string | null>(`${PREFIX}accountingPeriod`, null),
    lastVendorIdByCategory: readJson<Record<string, string>>(`${PREFIX}lastVendorIdByCategory`, {})
  };
}

export function rememberPropertyContext(input: {
  propertyId?: string | null;
  unitId?: string | null;
  tenantId?: string | null;
}): void {
  if (input.propertyId) writeJson(`${PREFIX}propertyId`, input.propertyId);
  if (input.unitId) writeJson(`${PREFIX}unitId`, input.unitId);
  if (input.tenantId) writeJson(`${PREFIX}tenantId`, input.tenantId);
}

export function rememberAnnouncementDefaults(input: {
  targetingScope?: string | null;
  category?: string | null;
}): void {
  if (input.targetingScope) writeJson(`${PREFIX}announcementScope`, input.targetingScope);
  if (input.category) writeJson(`${PREFIX}announcementCategory`, input.category);
}

export function rememberAccountingPeriod(period: string | null | undefined): void {
  if (period) writeJson(`${PREFIX}accountingPeriod`, period);
}

export function rememberVendorForCategory(category: string, vendorId: string): void {
  if (!category || !vendorId) return;
  const current = readJson<Record<string, string>>(`${PREFIX}lastVendorIdByCategory`, {});
  writeJson(`${PREFIX}lastVendorIdByCategory`, { ...current, [category]: vendorId });
}

/** Resolve create-form defaults: URL/initial → memory → first option. */
export function resolveContextId(
  preferred: string | null | undefined,
  remembered: string | null | undefined,
  validIds: readonly string[],
  fallbackFirst = true
): string {
  if (preferred && validIds.includes(preferred)) return preferred;
  if (remembered && validIds.includes(remembered)) return remembered;
  if (fallbackFirst) return validIds[0] ?? "";
  return "";
}

export function emptyWorkspaceMemory(): WorkspaceMemory {
  return { ...EMPTY, lastVendorIdByCategory: {} };
}
