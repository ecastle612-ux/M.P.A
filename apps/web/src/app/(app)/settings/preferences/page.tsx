import { Card } from "@mpa/ui";
import { AppearanceSettingsPanel } from "../../../../components/settings/appearance-settings-panel";
import { NotificationPreferencesForm } from "../../../../components/communication/notification-preferences-form";
import { PwaInstallSettingsPanel } from "../../../../components/pwa/pwa-install-settings-panel";
import { fetchAuthedApi } from "../../../../lib/communication/server-fetch";
import type { NotificationPreferencesRecord } from "../../../../lib/communication/contracts";

const DEFAULT_PREFERENCES: NotificationPreferencesRecord = {
  id: "",
  organizationId: "",
  userId: "",
  tenantId: null,
  propertyId: null,
  inAppEnabled: true,
  pushEnabled: false,
  emailEnabled: true,
  smsEnabled: false,
  categoryPreferences: {
    community: true,
    emergency: true,
    maintenance: true,
    lease: true,
    general: true
  },
  quietHours: {},
  propertyPreferences: [],
  emergencyOverride: true,
  languageCode: "en",
  createdAt: "",
  updatedAt: ""
};

/**
 * UX-012 A09 — Preferences SoT: theme + notification prefs + PWA install.
 */
export default async function SettingsPreferencesPage() {
  const result = await fetchAuthedApi<{ preferences: NotificationPreferencesRecord }>(
    "/api/resident/preferences"
  );
  const preferences =
    result.ok && result.data.preferences ? result.data.preferences : DEFAULT_PREFERENCES;

  return (
    <div className="mx-auto w-full max-w-3xl space-y-5">
      <header className="space-y-1">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-[var(--mpa-color-text-primary)]">
          Preferences
        </h1>
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">
          Appearance, notifications, and install options for your account.
        </p>
      </header>

      <AppearanceSettingsPanel />

      {!result.ok ? (
        <Card>
          <p className="text-sm text-[var(--mpa-color-text-secondary)]">
            Notification preferences could not be loaded. Defaults are shown below.
          </p>
        </Card>
      ) : null}
      <PwaInstallSettingsPanel />
      <NotificationPreferencesForm initialPreferences={preferences} />
    </div>
  );
}
