"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Input, Select } from "@mpa/ui";
import {
  ANNOUNCEMENT_CATEGORIES,
  announcementCategoryLabel,
  type NotificationPreferencesRecord
} from "../../lib/communication/contracts";

type PreferencesFormValues = {
  inAppEnabled: boolean;
  pushEnabled: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
  languageCode: string;
  categoryPreferences: Record<string, boolean>;
};

function toFormValues(preferences: NotificationPreferencesRecord): PreferencesFormValues {
  return {
    inAppEnabled: preferences.inAppEnabled,
    pushEnabled: preferences.pushEnabled,
    emailEnabled: preferences.emailEnabled,
    smsEnabled: preferences.smsEnabled,
    languageCode: preferences.languageCode,
    categoryPreferences: { ...preferences.categoryPreferences }
  };
}

export function NotificationPreferencesForm({
  initialPreferences
}: {
  initialPreferences: NotificationPreferencesRecord;
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
        languageCode: values.languageCode,
        categoryPreferences: values.categoryPreferences
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

  return (
    <Card>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <h1 className="font-display text-2xl font-semibold text-[var(--mpa-color-text-primary)]">
            Notification Preferences
          </h1>
          <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
            Choose how you receive property announcements and community updates.
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
          <label className="flex items-center gap-2 text-sm text-[var(--mpa-color-text-secondary)]">
            <input
              type="checkbox"
              aria-label="Email notifications enabled"
              checked={values.emailEnabled}
              onChange={(event) => setValues((current) => ({ ...current, emailEnabled: event.target.checked }))}
            />
            Email
          </label>
          <label className="flex items-center gap-2 text-sm text-[var(--mpa-color-text-secondary)]">
            <input
              type="checkbox"
              aria-label="SMS notifications enabled"
              checked={values.smsEnabled}
              onChange={(event) => setValues((current) => ({ ...current, smsEnabled: event.target.checked }))}
            />
            SMS (where enabled)
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
          {ANNOUNCEMENT_CATEGORIES.map((category) => (
            <label key={category} className="flex items-center gap-2 text-sm text-[var(--mpa-color-text-secondary)]">
              <input
                type="checkbox"
                aria-label={`${announcementCategoryLabel(category)} notifications enabled`}
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
              {announcementCategoryLabel(category)}
            </label>
          ))}
        </fieldset>

        <Input
          aria-label="Quiet hours placeholder"
          placeholder="Quiet hours (placeholder — configured server-side)"
          disabled
          value=""
        />

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
