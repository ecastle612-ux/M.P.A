import Link from "next/link";
import { skuIncludesOnlineRentCollection, type ProductSku } from "@mpa/shared";

/** Restrained post-setup discovery. Never a Guided Setup requirement. FO-only hidden. */
export function OnlinePaymentsDiscoveryLink({
  productSku,
  className = ""
}: {
  productSku: ProductSku | null | undefined;
  className?: string;
}) {
  if (!skuIncludesOnlineRentCollection(productSku)) {
    return null;
  }

  return (
    <p className={`text-sm text-[var(--mpa-color-text-secondary)] ${className}`}>
      When you are ready,{" "}
      <Link
        href="/pm/financial-operations/online-payments"
        className="font-semibold text-[var(--mpa-color-brand-primary)] underline"
      >
        set up Online Payments
      </Link>
      . Stripe Connect is optional and not required to start using M.P.A.
    </p>
  );
}
