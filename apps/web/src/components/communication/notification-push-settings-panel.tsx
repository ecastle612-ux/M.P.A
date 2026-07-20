"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@mpa/ui";
import type { PushDeviceStatusRecord } from "../../lib/notifications/enrollment";
import { PushRegistrationButton } from "./push-registration-button";

function truncateId(value: string | null): string {
  if (!value) return "—";
  if (value.length <= 16) return value;
  return `${value.slice(0, 8)}…${value.slice(-4)}`;
}

function formatWhen(value: string | null | undefined): string {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

function pushStatusLabel(input: {
  browserPermission: NotificationPermission | "unsupported";
  pushEnabled: boolean;
  activeDevice: PushDeviceStatusRecord | null;
}): string {
  if (input.browserPermission === "denied") return "Browser blocked";
  if (!input.activeDevice) return input.pushEnabled ? "Needs registration" : "Not registered";
  if (!input.pushEnabled) return "Disabled";
  if (!input.activeDevice.isActive) return "Needs re-register";
  return "Enabled";
}

/**
 * Push delivery controls for Notification Settings (API-001A Slice 2 / 6).
 */
export function NotificationPushSettingsPanel({
  propertyId,
  pushEnabled,
  onPushEnabledChange
}: {
  propertyId?: string | null;
  pushEnabled: boolean;
  onPushEnabledChange: (enabled: boolean) => void;
}) {
  const [devices, setDevices] = useState<PushDeviceStatusRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [testMessage, setTestMessage] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);
  const [browserPermission, setBrowserPermission] = useState<NotificationPermission | "unsupported">(
    "unsupported"
  );

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      if (typeof Notification !== "undefined") {
        setBrowserPermission(Notification.permission);
      }
      const response = await fetch("/api/notifications/devices", { cache: "no-store" });
      if (!response.ok) {
        setDevices([]);
        return;
      }
      const payload = (await response.json()) as { devices?: PushDeviceStatusRecord[] };
      setDevices(payload.devices ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void refresh();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [refresh]);

  const activeDevice = devices.find((device) => device.isActive && device.externalSubscriptionId) ?? null;
  const statusLabel = pushStatusLabel({ browserPermission, pushEnabled, activeDevice });

  async function sendTest() {
    setTesting(true);
    setTestMessage(null);
    try {
      const response = await fetch("/api/notifications/test", { method: "POST" });
      const payload = (await response.json().catch(() => ({}))) as { error?: string; message?: string };
      if (!response.ok) {
        setTestMessage(payload.error ?? payload.message ?? "Test notification failed");
        return;
      }
      setTestMessage("Test notification sent. Check your browser and Notification Center.");
    } catch {
      setTestMessage("Test notification failed");
    } finally {
      setTesting(false);
    }
  }

  async function disableDevice() {
    if (!activeDevice?.externalSubscriptionId) {
      onPushEnabledChange(false);
      return;
    }
    const response = await fetch("/api/notifications/devices", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ externalSubscriptionId: activeDevice.externalSubscriptionId })
    });
    if (response.ok) {
      onPushEnabledChange(false);
      await refresh();
    }
  }

  return (
    <fieldset className="space-y-3 rounded-[var(--mpa-radius-lg)] border border-[var(--mpa-color-border-subtle)] p-3">
      <legend className="px-1 text-sm font-medium text-[var(--mpa-color-text-primary)]">Push delivery</legend>

      <dl className="grid gap-2 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">Push status</dt>
          <dd className="font-medium text-[var(--mpa-color-text-primary)]">{loading ? "…" : statusLabel}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">Current device</dt>
          <dd className="text-[var(--mpa-color-text-primary)]">
            {activeDevice ? `${activeDevice.deviceLabel ?? activeDevice.platform} · ${truncateId(activeDevice.externalSubscriptionId)}` : "None"}
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">Last registration</dt>
          <dd className="text-[var(--mpa-color-text-primary)]">{formatWhen(activeDevice?.lastRegistrationAt)}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">Preference</dt>
          <dd className="text-[var(--mpa-color-text-primary)]">{pushEnabled ? "Push enabled" : "Push disabled"}</dd>
        </div>
      </dl>

      <div className="flex flex-wrap gap-2">
        <PushRegistrationButton
          propertyId={propertyId ?? null}
          enrolledVia="settings"
          label={activeDevice ? "Re-register Device" : "Enable Push"}
          onRegistered={() => {
            onPushEnabledChange(true);
            void refresh();
          }}
        />
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={!activeDevice && !pushEnabled}
          onClick={() => void disableDevice()}
        >
          Disable Push
        </Button>
        <Button type="button" size="sm" variant="secondary" disabled={!activeDevice || testing} onClick={() => void sendTest()}>
          {testing ? "Sending…" : "Send Test Notification"}
        </Button>
      </div>

      {testMessage ? <p className="text-xs text-[var(--mpa-color-text-secondary)]">{testMessage}</p> : null}
    </fieldset>
  );
}
