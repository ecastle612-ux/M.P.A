import { Breadcrumbs } from "./breadcrumbs";
import { OrganizationFoundationPanel } from "../organization/organization-foundation-panel";
import { OpsUniversalDashboard } from "../ops/ops-universal-dashboard";
import type { DashboardSnapshot } from "../../lib/dashboard/server";
import type { CommandCenterHomeComposition } from "../../lib/ops/command-center-home";

export function DashboardShell({
  organizationName,
  snapshot,
  commandCenterHome = null,
  userGreetingName = null,
  timeGreeting = "Good morning",
  dateLabel,
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
  commandCenterHome?: CommandCenterHomeComposition | null;
  userGreetingName?: string | null;
  timeGreeting?: string;
  dateLabel: string;
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
          <p className="mt-3 text-sm text-[var(--mpa-color-text-secondary)]">
            This page is your work companion. Once setup is complete, Immediate Attention and Today’s Mission will
            surface what needs you next.
          </p>
        </section>
        <OrganizationFoundationPanel />
      </main>
    );
  }

  return (
    <main className="mpa-page-wide flex-1 space-y-5">
      <Breadcrumbs
        items={[{ href: "/dashboard", label: "Operations Center" }, { label: "Overview" }]}
      />
      <OpsUniversalDashboard
        organizationName={organizationName}
        snapshot={snapshot}
        commandCenterHome={commandCenterHome}
        userGreetingName={userGreetingName}
        timeGreeting={timeGreeting}
        dateLabel={dateLabel}
        permissions={permissions}
      />
    </main>
  );
}
