import Link from "next/link";

export default function TenantMaintenancePage() {
  return (
    <section className="space-y-3 rounded-md border border-[var(--mpa-color-border-default)] bg-white p-5">
      <h2 className="font-display text-xl font-semibold text-[var(--mpa-color-text-primary)]">
        Maintenance request
      </h2>
      <p className="text-sm text-[var(--mpa-color-text-secondary)]">
        Your portal can accept maintenance requests after your lease is active. Detailed work-order
        tracking ships with the maintenance journey.
      </p>
      <Link href="/portal/tenant" className="text-sm text-[var(--mpa-color-brand-primary)] underline">
        Back to welcome
      </Link>
    </section>
  );
}
