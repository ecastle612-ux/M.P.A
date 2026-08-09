import Link from "next/link";
import {
  PmDocumentsStrip,
  PmPageChrome,
  PmQuickActions,
  documentsHref
} from "../../../../components/shell/pm-workspace";

export default function Page() {
  return (
    <PmPageChrome
      crumbs={[
        { href: "/pm/mission-control", label: "Mission Control" },
        { label: "Vendors" }
      ]}
      eyebrow="Property Manager · Vendors"
      title="Vendors"
      description="Vendor work happens where the job lives — assign in Maintenance, pay in Financial Operations. No duplicate vendor console."
    >
      <PmQuickActions
        actions={[
          { href: "/pm/maintenance", label: "Assign in Maintenance", primary: true },
          { href: "/pm/financial-operations#vendor-invoices", label: "Vendor invoices" },
          { href: documentsHref("vendor"), label: "Vendor contracts" }
        ]}
      />

      <section className="grid max-w-3xl gap-3 md:grid-cols-2">
        <article className="rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4">
          <h2 className="text-sm font-semibold text-[var(--mpa-color-text-primary)]">
            Maintenance assignment
          </h2>
          <p className="mt-2 text-sm text-[var(--mpa-color-text-secondary)]">
            Triage work orders and assign technicians or vendors in one queue.
          </p>
          <Link
            href="/pm/maintenance"
            className="mt-3 inline-block text-sm font-medium text-[var(--mpa-color-brand-primary)] underline"
          >
            Open Maintenance Command Center
          </Link>
        </article>
        <article className="rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4">
          <h2 className="text-sm font-semibold text-[var(--mpa-color-text-primary)]">Payables</h2>
          <p className="mt-2 text-sm text-[var(--mpa-color-text-secondary)]">
            Vendor invoices and approvals stay in Financial Operations — Collections & AP.
          </p>
          <Link
            href="/pm/financial-operations#vendor-invoices"
            className="mt-3 inline-block text-sm font-medium text-[var(--mpa-color-brand-primary)] underline"
          >
            Open vendor invoices
          </Link>
        </article>
      </section>

      <PmDocumentsStrip
        entityType="vendor"
        title="Vendor contracts"
        detail="Contracts and vendor paperwork attach in Documents — ready for Document Intelligence."
      />
    </PmPageChrome>
  );
}
