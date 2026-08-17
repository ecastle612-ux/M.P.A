import { ResidentBillingPortal } from "../../../../../components/finance/resident-billing-portal";
import { ResidentPageIntro } from "../../../../../components/shell/resident-workspace";

export default function TenantBillingPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <ResidentPageIntro
        eyebrow="Billing"
        title="Billing"
        description="See balances, payment history, and receipts. No accounting jargon."
      />
      <ResidentBillingPortal />
    </div>
  );
}
