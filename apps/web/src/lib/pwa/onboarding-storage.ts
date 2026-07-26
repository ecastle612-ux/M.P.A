/**
 * PMX-004 Phase 2 — org-safe install checklist persistence.
 * Key: mpa.pwa.onboarding.v1:<organizationId|none>
 */

export const PWA_ONBOARDING_KEY_PREFIX = "mpa.pwa.onboarding.v1";
export const PWA_ONBOARDING_FORCE_OPEN_KEY = "mpa.pwa.onboarding.force_open";
export const PWA_MAX_DISMISSALS = 4;

export type PwaChecklistState = {
  installed: boolean;
  notifications: boolean;
  offlineReady: boolean;
  cameraReady: boolean;
};

export type PwaOnboardingRecord = {
  v: 1;
  organizationId: string;
  completed: boolean;
  setupCompletedAt: string | null;
  dismissCount: number;
  remindAfter: number | null;
  checklist: PwaChecklistState;
};

const EMPTY_CHECKLIST: PwaChecklistState = {
  installed: false,
  notifications: false,
  offlineReady: false,
  cameraReady: false
};

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function onboardingStorageKey(organizationId: string | null | undefined): string {
  const org = organizationId?.trim() || "none";
  return `${PWA_ONBOARDING_KEY_PREFIX}:${org}`;
}

export function defaultOnboardingRecord(organizationId: string | null | undefined): PwaOnboardingRecord {
  return {
    v: 1,
    organizationId: organizationId?.trim() || "none",
    completed: false,
    setupCompletedAt: null,
    dismissCount: 0,
    remindAfter: null,
    checklist: { ...EMPTY_CHECKLIST }
  };
}

export function readOnboardingRecord(organizationId: string | null | undefined): PwaOnboardingRecord {
  const fallback = defaultOnboardingRecord(organizationId);
  if (!canUseStorage()) return fallback;
  try {
    const raw = window.localStorage.getItem(onboardingStorageKey(organizationId));
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<PwaOnboardingRecord>;
    if (parsed.v !== 1) return fallback;
    return {
      ...fallback,
      ...parsed,
      v: 1,
      organizationId: fallback.organizationId,
      checklist: {
        ...EMPTY_CHECKLIST,
        ...(parsed.checklist ?? {})
      }
    };
  } catch {
    return fallback;
  }
}

export function writeOnboardingRecord(record: PwaOnboardingRecord): void {
  if (!canUseStorage()) return;
  try {
    window.localStorage.setItem(onboardingStorageKey(record.organizationId), JSON.stringify(record));
  } catch {
    /* quota */
  }
}

/** Setup Completed KPI: Installed + Notifications + Offline Ready (camera enrichment). */
export function isSetupComplete(checklist: PwaChecklistState): boolean {
  return checklist.installed && checklist.notifications && checklist.offlineReady;
}

export function markChecklist(
  organizationId: string | null | undefined,
  patch: Partial<PwaChecklistState>
): PwaOnboardingRecord {
  const current = readOnboardingRecord(organizationId);
  const checklist = { ...current.checklist, ...patch };
  const setupDone = isSetupComplete(checklist);
  const next: PwaOnboardingRecord = {
    ...current,
    checklist,
    completed: current.completed || setupDone,
    setupCompletedAt:
      current.setupCompletedAt ?? (setupDone ? new Date().toISOString() : null)
  };
  writeOnboardingRecord(next);
  return next;
}

export function completeOnboardingIdempotent(
  organizationId: string | null | undefined
): PwaOnboardingRecord {
  const current = readOnboardingRecord(organizationId);
  if (current.completed) return current;
  const next: PwaOnboardingRecord = {
    ...current,
    completed: true,
    setupCompletedAt: current.setupCompletedAt ?? new Date().toISOString(),
    remindAfter: null
  };
  writeOnboardingRecord(next);
  return next;
}

export function dismissOnboardingWithBackoff(
  organizationId: string | null | undefined
): PwaOnboardingRecord {
  const current = readOnboardingRecord(organizationId);
  const dismissCount = current.dismissCount + 1;
  const backoffMs =
    dismissCount >= PWA_MAX_DISMISSALS
      ? 30 * 24 * 60 * 60 * 1000
      : dismissCount === 1
        ? 1 * 24 * 60 * 60 * 1000
        : dismissCount === 2
          ? 3 * 24 * 60 * 60 * 1000
          : 7 * 24 * 60 * 60 * 1000;
  const next: PwaOnboardingRecord = {
    ...current,
    dismissCount,
    remindAfter: Date.now() + backoffMs
  };
  writeOnboardingRecord(next);
  return next;
}

export function shouldShowOnboardingUi(
  organizationId: string | null | undefined,
  options?: { forceOpen?: boolean }
): boolean {
  if (options?.forceOpen) return true;
  const record = readOnboardingRecord(organizationId);
  if (record.completed) return false;
  if (record.dismissCount >= PWA_MAX_DISMISSALS && record.remindAfter && record.remindAfter > Date.now()) {
    return false;
  }
  if (record.remindAfter && record.remindAfter > Date.now()) return false;
  return true;
}

export function setForceOpenInstallHelp(open: boolean): void {
  if (!canUseStorage()) return;
  try {
    if (open) window.sessionStorage.setItem(PWA_ONBOARDING_FORCE_OPEN_KEY, "1");
    else window.sessionStorage.removeItem(PWA_ONBOARDING_FORCE_OPEN_KEY);
  } catch {
    /* ignore */
  }
}

export function isForceOpenInstallHelp(): boolean {
  if (!canUseStorage()) return false;
  try {
    return window.sessionStorage.getItem(PWA_ONBOARDING_FORCE_OPEN_KEY) === "1";
  } catch {
    return false;
  }
}

/**
 * Defer the generic push banner until install/standalone when coaching is still active.
 */
export function shouldDeferPushUntilInstalled(
  organizationId: string | null | undefined,
  standalone: boolean,
  platformEligible: boolean
): boolean {
  if (standalone) return false;
  if (!platformEligible) return false;
  const record = readOnboardingRecord(organizationId);
  if (record.completed || record.checklist.installed) return false;
  return true;
}
