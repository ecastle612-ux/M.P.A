import Link from "next/link";
import { Card } from "@mpa/ui";

export default function TenantPortalPage() {
  return (
    <Card className="space-y-3">
      <h2 className="font-display text-xl font-semibold text-[var(--mpa-color-text-primary)]">Resident home</h2>
      <p className="text-sm text-[var(--mpa-color-text-secondary)]">
        Check your balance, upcoming charges, and payment history in Billing.
      </p>
      <Link
        href="/portal/tenant/billing"
        className="inline-flex h-9 items-center rounded-md bg-[var(--mpa-color-brand-primary)] px-4 text-sm font-medium text-white"
      >
        Go to Billing
      </Link>
    </Card>
  );
}
