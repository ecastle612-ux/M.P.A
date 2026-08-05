import { UniversalDashboard } from "../dashboard-framework";
import { LeasesTable } from "./leases-table";
import { buildLeasingCommandCenterViewModel } from "../../lib/lease/ux016-view-model";
import type { LeaseListItem } from "../../lib/lease/server";
import type { ApplicantListItem } from "../../lib/applicant/server";

/**
 * CORE-004 Phase 3 — Leasing Operations home (STD-001 UDF).
 * Directory tools sit below Insights — no custom dashboard anatomy.
 */
export function LeasingCommandCenter({
  leases,
  applicants,
  permissions,
  userName
}: {
  leases: LeaseListItem[];
  applicants: ApplicantListItem[];
  permissions: {
    canCreate: boolean;
    canUpdate: boolean;
    canArchive: boolean;
    canDelete: boolean;
    canCreateApplicant: boolean;
  };
  userName: string | null;
}) {
  const model = buildLeasingCommandCenterViewModel({
    leases,
    applicants,
    canCreateLease: permissions.canCreate,
    canCreateApplicant: permissions.canCreateApplicant,
    userName
  });

  return (
    <div className="space-y-8" data-core004="leasing-command-center" data-std001="leasing-home">
      <UniversalDashboard model={model} />
      <section aria-labelledby="leasing-directory-heading" className="space-y-3">
        <h2
          id="leasing-directory-heading"
          className="font-display text-lg font-semibold text-[var(--mpa-color-text-primary)]"
        >
          Lease directory
        </h2>
        <LeasesTable
          initialItems={leases}
          permissions={{
            canCreate: permissions.canCreate,
            canUpdate: permissions.canUpdate,
            canArchive: permissions.canArchive,
            canDelete: permissions.canDelete
          }}
        />
      </section>
    </div>
  );
}
