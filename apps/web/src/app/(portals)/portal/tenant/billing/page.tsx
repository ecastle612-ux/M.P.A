import { ResidentBillingPortal } from "../../../../../components/finance/resident-billing-portal";
import { ResidentPageIntro } from "../../../../../components/shell/resident-workspace";

export default function TenantBillingPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <ResidentPageIntro
        eyebrow="Payments"
        title="Pay rent"
        description="See what you owe and pay securely. No accounting jargon."
      />
      <ResidentBillingPortal />
    </div>
  );
}
