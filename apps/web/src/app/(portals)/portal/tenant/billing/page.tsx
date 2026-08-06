import { ResidentBillingPortal } from "../../../../../components/finance/resident-billing-portal";

export default function TenantBillingPage() {
  return (
    <main className="mx-auto w-full max-w-3xl space-y-4 p-4 md:p-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
          Resident portal
        </p>
        <h1 className="mt-1 font-display text-2xl font-semibold text-[var(--mpa-color-text-primary)]">Billing</h1>
        <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
          See what you owe, pay online, and download receipts — no accounting jargon.
        </p>
      </header>
      <ResidentBillingPortal />
    </main>
  );
}
