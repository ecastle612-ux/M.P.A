"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Input, Select } from "@mpa/ui";
import {
  ANNOUNCEMENT_CATEGORIES,
  announcementCategoryLabel,
  type NotificationPreferencesRecord
} from "../../lib/communication/contracts";
import { NOTIFICATION_CATEGORIES, notificationCategoryLabel } from "../../lib/notifications/contracts";
import { NotificationPushSettingsPanel } from "./notification-push-settings-panel";

type PreferencesFormValues = {
  inAppEnabled: boolean;
  pushEnabled: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
  emergencyOverride: boolean;
  languageCode: string;
  categoryPreferences: Record<string, boolean>;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
};

const FALLBACK_FORM_VALUES: PreferencesFormValues = {
  inAppEnabled: true,
  pushEnabled: false,
  emailEnabled: true,
  smsEnabled: false,
  emergencyOverride: true,
  languageCode: "en",
  categoryPreferences: {
    community: true,
    emergency: true,
    maintenance: true,
    lease: true,
    general: true
  },
  quietHoursEnabled: false,
  quietHoursStart: "22:00",
  quietHoursEnd: "07:00"
};

function toFormValues(
  preferences: NotificationPreferencesRecord | null | undefined
): PreferencesFormValues {
  if (!preferences) {
    return { ...FALLBACK_FORM_VALUES, categoryPreferences: { ...FALLBACK_FORM_VALUES.categoryPreferences } };
  }
  const quiet = preferences.quietHours ?? {};
  return {
    inAppEnabled: preferences.inAppEnabled ?? true,
    pushEnabled: preferences.pushEnabled ?? false,
    emailEnabled: preferences.emailEnabled ?? true,
    smsEnabled: preferences.smsEnabled ?? false,
    emergencyOverride: preferences.emergencyOverride ?? true,
    languageCode: preferences.languageCode ?? "en",
    categoryPreferences: { ...FALLBACK_FORM_VALUES.categoryPreferences, ...preferences.categoryPreferences },
    quietHoursEnabled: Boolean(quiet["enabled"]),
    quietHoursStart: typeof quiet["startLocal"] === "string" ? quiet["startLocal"] : "22:00",
    quietHoursEnd: typeof quiet["endLocal"] === "string" ? quiet["endLocal"] : "07:00"
  };
}

export function NotificationPreferencesForm({
  initialPreferences
}: {
  initialPreferences: NotificationPreferencesRecord | null | undefined;
}) {
  const router = useRouter();
  const [values, setValues] = useState<PreferencesFormValues>(() => toFormValues(initialPreferences));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);

    const response = await fetch("/api/resident/preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        inAppEnabled: values.inAppEnabled,
        pushEnabled: values.pushEnabled,
        emailEnabled: values.emailEnabled,
        smsEnabled: values.smsEnabled,
        emergencyOverride: values.emergencyOverride,
        languageCode: values.languageCode,
        categoryPreferences: values.categoryPreferences,
        quietHours: {
          enabled: values.quietHoursEnabled,
          startLocal: values.quietHoursStart,
          endLocal: values.quietHoursEnd
        }
      })
    });
    setSubmitting(false);

    if (!response.ok) {
      const payload = (await response.json()) as { error?: string };
      setError(payload.error ?? "Unable to save preferences.");
      return;
    }

    setSuccess("Notification preferences saved.");
    router.refresh();
  }

  const categoryKeys = [
    ...ANNOUNCEMENT_CATEGORIES,
    ...NOTIFICATION_CATEGORIES.filter((c) => !ANNOUNCEMENT_CATEGORIES.includes(c as (typeof ANNOUNCEMENT_CATEGORIES)[number]))
  ];

  return (
    <Card>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <h1 className="font-display text-2xl font-semibold text-[var(--mpa-color-text-primary)]">
            Notification Preferences
          </h1>
          <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
            Choose how you receive property updates. Emergency alerts may still notify you during quiet hours.
          </p>
        </div>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-[var(--mpa-color-text-primary)]">Delivery channels</legend>
          <label className="flex items-center gap-2 text-sm text-[var(--mpa-color-text-secondary)]">
            <input
              type="checkbox"
              aria-label="In-app notifications enabled"
              checked={values.inAppEnabled}
              onChange={(event) => setValues((current) => ({ ...current, inAppEnabled: event.target.checked }))}
            />
            In-app notifications
          </label>
          <label className="flex items-center gap-2 text-sm text-[var(--mpa-color-text-secondary)]">
            <input
              type="checkbox"
              aria-label="Push notifications enabled"
              checked={values.pushEnabled}
              onChange={(event) => setValues((current) => ({ ...current, pushEnabled: event.target.checked }))}
            />
            Push notifications
          </label>
        </fieldset>

        <NotificationPushSettingsPanel
          propertyId={initialPreferences?.propertyId ?? null}
          pushEnabled={values.pushEnabled}
          onPushEnabledChange={(enabled) => setValues((current) => ({ ...current, pushEnabled: enabled }))}
        />

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-[var(--mpa-color-text-primary)]">Quiet hours</legend>
          <label className="flex items-center gap-2 text-sm text-[var(--mpa-color-text-secondary)]">
            <input
              type="checkbox"
              aria-label="Quiet hours enabled"
              checked={values.quietHoursEnabled}
              onChange={(event) => setValues((current) => ({ ...current, quietHoursEnabled: event.target.checked }))}
            />
            Pause non-emergency push during quiet hours
          </label>
          <div className="grid gap-2 sm:grid-cols-2">
            <Input
              aria-label="Quiet hours start"
              type="time"
              value={values.quietHoursStart}
              onChange={(event) => setValues((current) => ({ ...current, quietHoursStart: event.target.value }))}
              disabled={!values.quietHoursEnabled}
            />
            <Input
              aria-label="Quiet hours end"
              type="time"
              value={values.quietHoursEnd}
              onChange={(event) => setValues((current) => ({ ...current, quietHoursEnd: event.target.value }))}
              disabled={!values.quietHoursEnabled}
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-[var(--mpa-color-text-secondary)]">
            <input
              type="checkbox"
              aria-label="Emergency override"
              checked={values.emergencyOverride}
              onChange={(event) => setValues((current) => ({ ...current, emergencyOverride: event.target.checked }))}
            />
            Allow emergency push during quiet hours
          </label>
        </fieldset>

        <Select
          aria-label="Language code"
          value={values.languageCode}
          onChange={(event) => setValues((current) => ({ ...current, languageCode: event.target.value }))}
        >
          <option value="en">English</option>
          <option value="es">Spanish</option>
          <option value="fr">French</option>
        </Select>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-[var(--mpa-color-text-primary)]">Category subscriptions</legend>
          {categoryKeys.map((category) => (
            <label key={category} className="flex items-center gap-2 text-sm text-[var(--mpa-color-text-secondary)]">
              <input
                type="checkbox"
                aria-label={`${String(category)} notifications enabled`}
                checked={values.categoryPreferences[category] ?? true}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    categoryPreferences: {
                      ...current.categoryPreferences,
                      [category]: event.target.checked
                    }
                  }))
                }
              />
              {ANNOUNCEMENT_CATEGORIES.includes(category as (typeof ANNOUNCEMENT_CATEGORIES)[number])
                ? announcementCategoryLabel(category as (typeof ANNOUNCEMENT_CATEGORIES)[number])
                : notificationCategoryLabel(category as (typeof NOTIFICATION_CATEGORIES)[number])}
            </label>
          ))}
        </fieldset>

        {error ? (
          <p className="text-sm text-[var(--mpa-color-feedback-error)]" role="alert" aria-live="assertive">
            {error}
          </p>
        ) : null}
        {success ? <p className="text-sm text-[var(--mpa-color-text-primary)]">{success}</p> : null}

        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving..." : "Save Preferences"}
        </Button>
      </form>
    </Card>
  );
}
