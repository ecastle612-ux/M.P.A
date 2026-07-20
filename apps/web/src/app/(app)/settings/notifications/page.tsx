import { Card } from "@mpa/ui";
import { NotificationPreferencesForm } from "../../../../components/communication/notification-preferences-form";
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

export default async function NotificationSettingsPage() {
  const result = await fetchAuthedApi<{ preferences: NotificationPreferencesRecord }>("/api/resident/preferences");
  const preferences =
    result.ok && result.data.preferences ? result.data.preferences : DEFAULT_PREFERENCES;

  return (
    <div className="mx-auto w-full max-w-3xl space-y-5">
      {!result.ok ? (
        <Card>
          <p className="text-sm text-[var(--mpa-color-text-secondary)]">
            Notification preferences could not be loaded. Defaults are shown below.
          </p>
        </Card>
      ) : null}
      <NotificationPreferencesForm initialPreferences={preferences} />
    </div>
  );
}
