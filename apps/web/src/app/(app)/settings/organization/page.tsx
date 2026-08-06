import { OrganizationFoundationPanel } from "../../../../components/organization/organization-foundation-panel";
import { Breadcrumbs } from "../../../../components/shell/breadcrumbs";

export default function Page() {
  return (
    <main className="flex-1 space-y-4 bg-[var(--mpa-color-bg-app)] p-4 md:p-6">
      <Breadcrumbs items={[{ href: "/launcher", label: "Launcher" }, { label: "Organization Settings" }]} />
      <h1 className="font-display text-2xl font-semibold text-[var(--mpa-color-text-primary)]">Organization Settings</h1>
      <p className="text-sm text-[var(--mpa-color-text-secondary)]">
        Shared platform organization foundation. Commercial product assignment happens in Guided Setup.
      </p>
      <OrganizationFoundationPanel />
    </main>
  );
}
