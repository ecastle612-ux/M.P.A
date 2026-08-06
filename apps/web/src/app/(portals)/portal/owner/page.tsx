import Link from "next/link";
import { Card } from "@mpa/ui";

export default function OwnerPortalPage() {
  return (
    <div className="space-y-4">
      <Card>
        <h2 className="text-lg font-semibold text-[var(--mpa-color-text-primary)]">Owner home</h2>
        <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
          See income, expenses, outstanding rent, and occupancy in a simple operational summary.
        </p>
        <Link
          href="/portal/owner/financials"
          className="mt-4 inline-block text-sm text-[var(--mpa-color-brand-primary)] underline"
        >
          Open financial summary
        </Link>
      </Card>
    </div>
  );
}
