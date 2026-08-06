import Link from "next/link";
import { UniversalDashboard } from "../dashboard-framework";
import {
  buildResidentPortalViewModel,
  type ResidentPortalAttention,
  type ResidentPortalTodayCard
} from "../../lib/resident/ux016-view-model";
import type { ResidentWorkflowStage } from "../../lib/resident/workflow";

const BELOW_FOLD = [
  { href: "/portal/tenant/maintenance", label: "Maintenance" },
  { href: "/portal/tenant/payments", label: "Payments" },
  { href: "/portal/tenant/documents", label: "Documents" },
  { href: "/portal/tenant/messages", label: "Messages" },
  { href: "/portal/tenant/documents", label: "Lease" },
  { href: "/portal/tenant/community", label: "Community" },
  { href: "/portal/tenant/more", label: "Amenities" }
] as const;

/**
 * CORE-004 Phase 4 — calm resident portal on STD-001 UDF.
 * Tools sit below Insights — no custom dashboard anatomy.
 */
export function ResidentPortalHome({
  firstName,
  propertyName,
  unitNumber,
  hasLinkedTenant,
  workflowStage,
  attentionItems,
  todayCards,
  balanceDue,
  openMaintenanceCount
}: {
  firstName: string;
  propertyName: string | null;
  unitNumber: string | null;
  hasLinkedTenant: boolean;
  workflowStage?: ResidentWorkflowStage | null;
  attentionItems: ResidentPortalAttention[];
  todayCards: ResidentPortalTodayCard[];
  balanceDue?: number | null;
  openMaintenanceCount?: number;
}) {
  const model = buildResidentPortalViewModel({
    firstName,
    propertyName,
    unitNumber,
    hasLinkedTenant,
    ...(workflowStage ? { workflowStage } : {}),
    attentionItems,
    todayCards,
    ...(balanceDue != null ? { balanceDue } : {}),
    ...(openMaintenanceCount != null ? { openMaintenanceCount } : {})
  });

  return (
    <div
      className="mx-auto max-w-lg space-y-8 pb-10 sm:max-w-2xl"
      data-core004="resident-portal-home"
      data-std001="resident-portal"
    >
      <UniversalDashboard model={model} />
      <section aria-labelledby="resident-tools-heading" className="space-y-3">
        <h2
          id="resident-tools-heading"
          className="font-display text-lg font-semibold text-[var(--mpa-color-text-primary)]"
        >
          Your tools
        </h2>
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {BELOW_FOLD.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="flex min-h-11 items-center justify-center rounded-[var(--mpa-radius-lg)] border border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-surface)] px-3 py-2 text-sm font-medium text-[var(--mpa-color-text-primary)]"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
