import { Card } from "@mpa/ui";
import { Breadcrumbs } from "../../../../../components/shell/breadcrumbs";
import { NotificationPreferencesForm } from "../../../../../components/communication/notification-preferences-form";
import { fetchAuthedApi } from "../../../../../lib/communication/server-fetch";
import type { NotificationPreferencesRecord } from "../../../../../lib/communication/contracts";

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
  languageCode: "en",
  createdAt: "",
  updatedAt: ""
};

export default async function TenantPreferencesPage() {
  const result = await fetchAuthedApi<{ preferences: NotificationPreferencesRecord }>("/api/resident/preferences");
  const preferences = result.ok ? result.data.preferences : DEFAULT_PREFERENCES;

  if (!result.ok) {
    return (
      <div className="space-y-5">
        <Breadcrumbs
          items={[
            { href: "/portal/tenant", label: "Tenant home" },
            { label: "Preferences" }
          ]}
        />
        <Card>
          <p className="text-sm text-[var(--mpa-color-text-secondary)]">
            Notification preferences are not available yet. Defaults are shown below.
          </p>
        </Card>
        <NotificationPreferencesForm initialPreferences={preferences} />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <Breadcrumbs
        items={[
          { href: "/portal/tenant", label: "Tenant home" },
          { label: "Preferences" }
        ]}
      />
      <NotificationPreferencesForm initialPreferences={preferences} />
    </div>
  );
}
