export type AuthEventAction = "login_succeeded" | "login_failed" | "password_reset_requested";

/**
 * Fire-and-forget report of an authentication attempt outcome to the audited, rate-limited
 * `/api/auth/events` endpoint. Fully fail-open: never awaited on the auth happy path and
 * never throws, so it cannot affect sign-in behavior or timing.
 */
export function reportAuthEvent(action: AuthEventAction): void {
  try {
    if (typeof fetch === "undefined") return;
    void fetch("/api/auth/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
      keepalive: true
    }).catch(() => {
      // fail-open
    });
  } catch {
    // fail-open
  }
}
