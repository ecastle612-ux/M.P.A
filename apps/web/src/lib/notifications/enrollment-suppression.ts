/**
 * Client-side enrollment banner suppression (API-001A).
 * Server source of truth for enrollment remains resident_devices.
 */

export const ENROLLMENT_NOT_NOW_MS = 7 * 24 * 60 * 60 * 1000;

const KEYS = {
  notNowUntil: "mpa.push_enroll_not_now_until",
  denied: "mpa.push_enroll_denied",
  completed: "mpa.push_enroll_completed"
} as const;

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function isEnrollmentSuppressed(): boolean {
  if (!canUseStorage()) return false;
  try {
    if (window.localStorage.getItem(KEYS.denied) === "1") return true;
    if (window.localStorage.getItem(KEYS.completed) === "1") return true;
    const until = window.localStorage.getItem(KEYS.notNowUntil);
    if (until && Number(until) > Date.now()) return true;
  } catch {
    return false;
  }
  return false;
}

export function suppressEnrollmentNotNow(cooldownMs = ENROLLMENT_NOT_NOW_MS): void {
  if (!canUseStorage()) return;
  try {
    window.localStorage.setItem(KEYS.notNowUntil, String(Date.now() + cooldownMs));
  } catch {
    /* ignore quota */
  }
}

export function suppressEnrollmentDenied(): void {
  if (!canUseStorage()) return;
  try {
    window.localStorage.setItem(KEYS.denied, "1");
  } catch {
    /* ignore */
  }
}

export function markEnrollmentCompleted(): void {
  if (!canUseStorage()) return;
  try {
    window.localStorage.setItem(KEYS.completed, "1");
    window.localStorage.removeItem(KEYS.notNowUntil);
    window.localStorage.removeItem(KEYS.denied);
  } catch {
    /* ignore */
  }
}

/** Clear suppression when user re-enables from Settings. */
export function clearEnrollmentSuppression(): void {
  if (!canUseStorage()) return;
  try {
    window.localStorage.removeItem(KEYS.notNowUntil);
    window.localStorage.removeItem(KEYS.denied);
    window.localStorage.removeItem(KEYS.completed);
  } catch {
    /* ignore */
  }
}
