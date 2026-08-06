import Link from "next/link";
import { UniversalDashboard } from "../dashboard-framework";
import { VendorsTable } from "./vendors-table";
import { buildVendorCommandCenterViewModel } from "../../lib/vendor/ux016-view-model";
import type { VendorRecord } from "../../lib/vendor/contracts";

const BELOW_FOLD = [
  { href: "/maintenance", label: "Assigned Jobs" },
  { href: "/financials", label: "Invoices" },
  { href: "/vendors", label: "Compliance" },
  { href: "/vendors", label: "Insurance" },
  { href: "/communications", label: "Messages" },
  { href: "/documents", label: "Documents" },
  { href: "/vendors", label: "Performance" },
  { href: "/financials", label: "Payment Status" }
] as const;

/**
 * CORE-004 Phase 5 — Vendor Operations home (STD-001 UDF).
 */
export function VendorCommandCenter({
  vendors,
  permissions,
  userName
}: {
  vendors: VendorRecord[];
  permissions: {
    canCreate: boolean;
    canUpdate: boolean;
    canArchive: boolean;
    canDelete: boolean;
    canAssign: boolean;
  };
  userName: string | null;
}) {
  const model = buildVendorCommandCenterViewModel({
    vendors,
    canCreate: permissions.canCreate,
    canAssign: permissions.canAssign,
    userName
  });

  return (
    <div className="space-y-8" data-core004="vendor-command-center" data-std001="vendor-home">
      <UniversalDashboard model={model} />
      <section aria-labelledby="vendor-tools-heading" className="space-y-3">
        <h2
          id="vendor-tools-heading"
          className="font-display text-lg font-semibold text-[var(--mpa-color-text-primary)]"
        >
          Vendor tools
        </h2>
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {BELOW_FOLD.map((item) => (
            <li key={`${item.label}-${item.href}`}>
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
      <section aria-labelledby="vendor-directory-heading" className="space-y-3">
        <h2
          id="vendor-directory-heading"
          className="font-display text-lg font-semibold text-[var(--mpa-color-text-primary)]"
        >
          Vendor directory
        </h2>
        <VendorsTable
          initialItems={vendors}
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
