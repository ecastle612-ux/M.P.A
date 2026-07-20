"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@mpa/ui";
import {
  clearEnrollmentSuppression,
  isEnrollmentSuppressed,
  markEnrollmentCompleted,
  suppressEnrollmentDenied,
  suppressEnrollmentNotNow
} from "../../lib/notifications/enrollment-suppression";
import {
  loadOneSignalSdkScript,
  obtainPushSubscription,
  registerDeviceWithServer
} from "../../lib/notifications/client-push";

/** Idle → Loading → Permission/Enroll → Enabled | Denied | Failed | Timeout */
type EnrollmentState =
  | "idle"
  | "loading"
  | "visible"
  | "permission"
  | "enroll"
  | "enabled"
  | "denied"
  | "failed"
  | "timeout"
  | "toast";

/**
 * Non-intrusive post-sign-in push enrollment banner (API-001A + UX-001 WI-4).
 */
export function PushEnrollmentBanner({ settingsHref }: { settingsHref: string }) {
  const [state, setState] = useState<EnrollmentState>("loading");
  const [toast, setToast] = useState<string | null>(null);

  const evaluate = useCallback(async () => {
    if (typeof window === "undefined") return;
    if (isEnrollmentSuppressed()) {
      setState("idle");
      return;
    }
    if (typeof Notification !== "undefined" && Notification.permission === "denied") {
      suppressEnrollmentDenied();
      setState("denied");
      return;
    }

    try {
      const response = await fetch("/api/notifications/devices", { cache: "no-store" });
      if (!response.ok) {
        setState("idle");
        return;
      }
      const payload = (await response.json()) as { hasActiveDevice?: boolean };
      if (payload.hasActiveDevice) {
        markEnrollmentCompleted();
        setState("enabled");
        return;
      }
      loadOneSignalSdkScript();
      setState("visible");
    } catch {
      setState("idle");
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void evaluate();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [evaluate]);

  useEffect(() => {
    if (!toast || state !== "toast") return;
    const timer = window.setTimeout(() => {
      setToast(null);
      setState("idle");
    }, 5000);
    return () => window.clearTimeout(timer);
  }, [toast, state]);

  async function handleEnable() {
    setState("permission");
    clearEnrollmentSuppression();
    try {
      const result = await obtainPushSubscription();
      if (result.status === "denied") {
        suppressEnrollmentDenied();
        setToast("You can enable notifications later in Settings.");
        setState("toast");
        return;
      }
      if (result.status === "error") {
        setToast(result.message);
        setState("failed");
        window.setTimeout(() => {
          setToast(result.message);
          setState("toast");
        }, 0);
        return;
      }

      setState("enroll");
      const registered = await registerDeviceWithServer({
        subscriptionId: result.subscriptionId,
        enrolledVia: "onboarding_banner",
        deviceLabel: "Web browser"
      });
      if (!registered.ok) {
        setToast(registered.message);
        setState(registered.timedOut ? "timeout" : "failed");
        window.setTimeout(() => setState("toast"), 0);
        return;
      }

      markEnrollmentCompleted();
      setToast("Notifications enabled successfully.");
      setState("enabled");
      window.setTimeout(() => setState("toast"), 0);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to enable notifications.";
      setToast(message);
      setState("failed");
      window.setTimeout(() => setState("toast"), 0);
    }
  }

  function handleNotNow() {
    suppressEnrollmentNotNow();
    setState("idle");
  }

  if (state === "loading" || state === "idle" || state === "enabled" || state === "denied") {
    return null;
  }

  if (state === "toast" && toast) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="border-b border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-muted)] px-4 py-2 text-sm text-[var(--mpa-color-text-primary)]"
      >
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2">
          <p>{toast}</p>
          {toast.includes("Settings") ? (
            <Link href={settingsHref} className="font-semibold text-[var(--mpa-color-brand-primary)] hover:underline">
              Open Settings
            </Link>
          ) : null}
        </div>
      </div>
    );
  }

  const working = state === "permission" || state === "enroll";
  if (state !== "visible" && !working && state !== "failed" && state !== "timeout") return null;

  return (
    <div
      role="region"
      aria-label="Enable push notifications"
      className="border-b border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-surface)] px-4 py-3"
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">
          Stay informed about maintenance updates, announcements, lease reminders, and emergencies.
          {state === "timeout" || state === "failed"
            ? " Enrollment did not finish — you can retry or open Settings."
            : null}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" disabled={working} onClick={() => void handleEnable()}>
            {working ? "Enabling…" : state === "timeout" || state === "failed" ? "Retry" : "Enable Notifications"}
          </Button>
          <Button type="button" size="sm" variant="secondary" disabled={working} onClick={handleNotNow}>
            Not Now
          </Button>
        </div>
      </div>
    </div>
  );
}
