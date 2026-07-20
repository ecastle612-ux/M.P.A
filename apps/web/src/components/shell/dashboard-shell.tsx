import { Breadcrumbs } from "./breadcrumbs";
import { OrganizationFoundationPanel } from "../organization/organization-foundation-panel";
import { OperationsCenterView } from "../operations-center/operations-center-view";
import { formatRefreshTime } from "../../lib/format/time";
import type { DashboardSnapshot } from "../../lib/dashboard/server";

export function DashboardShell({
  organizationName,
  snapshot,
  userGreetingName = null,
  timeGreeting = "Good morning",
  permissions = {
    canCreateProperty: false,
    canCreateUnit: false,
    canCreateTenant: false,
    canCreateApplicant: false,
    canReadApplicants: false,
    canReadScreening: false,
    canReadSignatures: false,
    canCreateMaintenance: false,
    canReadMaintenance: false,
    canCreateVendor: false,
    canReadVendors: false,
    canCreateLease: false,
    canReadLeases: false,
    canCreateCommunication: false,
    canReadCommunications: false,
    canCreateFinancial: false,
    canReadFinancials: false,
    canReadAi: false,
    canUseAi: false,
    canReadMigration: false,
    canCreateMigration: false
  }
}: {
  organizationName: string | null;
  snapshot: DashboardSnapshot | null;
  userGreetingName?: string | null;
  timeGreeting?: string;
  permissions?: {
    canCreateProperty: boolean;
    canCreateUnit: boolean;
    canCreateTenant: boolean;
    canCreateApplicant: boolean;
    canReadApplicants: boolean;
    canReadScreening: boolean;
    canReadSignatures: boolean;
    canCreateMaintenance: boolean;
    canReadMaintenance: boolean;
    canCreateVendor: boolean;
    canReadVendors: boolean;
    canCreateLease: boolean;
    canReadLeases: boolean;
    canCreateCommunication: boolean;
    canReadCommunications: boolean;
    canCreateFinancial: boolean;
    canReadFinancials: boolean;
    canReadAi: boolean;
    canUseAi: boolean;
    canReadMigration: boolean;
    canCreateMigration: boolean;
  };
}) {
  if (!snapshot) {
    return (
      <main className="mpa-page-wide flex-1 space-y-5">
        <Breadcrumbs
          items={[{ href: "/dashboard", label: "Operations Center" }, { label: "Overview" }]}
        />
        <section className="rounded-lg border border-dashed border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] p-6">
          <h1 className="font-display text-2xl font-semibold text-[var(--mpa-color-text-primary)]">
            Welcome to your Operations Center
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-[var(--mpa-color-text-secondary)]">
            Create your first organization to unlock portfolio visibility, operational tasks, and live activity.
          </p>
        </section>
        <OrganizationFoundationPanel />
      </main>
    );
  }

  return (
    <OperationsCenterView
      initialSnapshot={snapshot}
      organizationName={organizationName}
      userGreetingName={userGreetingName}
      timeGreeting={timeGreeting}
      permissions={permissions}
      initialRefreshedAt={formatRefreshTime(new Date())}
    />
  );
}
