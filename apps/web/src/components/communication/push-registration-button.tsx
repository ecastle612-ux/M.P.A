"use client";

import { useEffect, useState } from "react";
import { Button } from "@mpa/ui";
import {
  clearEnrollmentSuppression,
  markEnrollmentCompleted,
  suppressEnrollmentDenied
} from "../../lib/notifications/enrollment-suppression";
import {
  loadOneSignalSdkScript,
  obtainPushSubscription,
  registerDeviceWithServer,
  type EnrolledViaClient
} from "../../lib/notifications/client-push";

/**
 * Client-only push registration control (Settings / preferences).
 */
export function PushRegistrationButton({
  propertyId,
  enrolledVia = "settings",
  label = "Enable push notifications",
  onRegistered
}: {
  propertyId?: string | null;
  enrolledVia?: EnrolledViaClient;
  label?: string;
  onRegistered?: () => void;
}) {
  const appId = process.env["NEXT_PUBLIC_ONESIGNAL_APP_ID"];
  const [status, setStatus] = useState<"idle" | "working" | "ready" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (appId) loadOneSignalSdkScript();
  }, [appId]);

  async function register() {
    setStatus("working");
    setMessage(null);
    clearEnrollmentSuppression();
    try {
      const result = await obtainPushSubscription(appId ? { appId } : undefined);
      if (result.status === "denied") {
        suppressEnrollmentDenied();
        setStatus("error");
        setMessage("You can enable notifications later in Settings.");
        return;
      }
      if (result.status === "error") {
        setStatus("error");
        setMessage(result.message);
        return;
      }

      const registered = await registerDeviceWithServer({
        subscriptionId: result.subscriptionId,
        propertyId: propertyId ?? null,
        enrolledVia,
        deviceLabel: "Web browser"
      });
      if (!registered.ok) {
        throw new Error(registered.message);
      }

      markEnrollmentCompleted();
      setStatus("ready");
      setMessage(
        result.via === "onesignal"
          ? "Notifications enabled successfully."
          : "Device registered locally (noop / development)."
      );
      onRegistered?.();
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Unable to enable push");
    }
  }

  return (
    <div className="space-y-2">
      <Button type="button" onClick={() => void register()} disabled={status === "working"}>
        {status === "working" ? "Enabling…" : status === "ready" ? "Push enabled" : label}
      </Button>
      {message ? (
        <p
          className={`text-xs ${
            status === "error" ? "text-[var(--mpa-color-feedback-error)]" : "text-[var(--mpa-color-text-secondary)]"
          }`}
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}
