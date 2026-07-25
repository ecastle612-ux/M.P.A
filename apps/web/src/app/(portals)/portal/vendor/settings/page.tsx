import { AppPage } from "../../../../../components/presentation/app-page";
import { AppearanceSettingsPanel } from "../../../../../components/settings/appearance-settings-panel";

export default function VendorSettingsPage() {
  return (
    <AppPage
      breadcrumbs={[
        { href: "/portal/vendor", label: "Work queue" },
        { label: "Settings" }
      ]}
    >
      <div className="mx-auto max-w-3xl space-y-5">
        <div>
          <h1 className="text-xl font-semibold text-[var(--mpa-color-text-primary)]">Settings</h1>
          <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
            Appearance and account preferences for your vendor workspace.
          </p>
        </div>
        <AppearanceSettingsPanel />
      </div>
    </AppPage>
  );
}
