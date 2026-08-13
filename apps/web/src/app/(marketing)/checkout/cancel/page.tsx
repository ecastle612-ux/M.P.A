import type { Metadata } from "next";
import {
  isCommercialQuoteExpired,
  isBillingCycle,
  isProductSku,
  type BillingCycle,
  type ProductSku
} from "@mpa/shared";
import { CheckoutCancelPage } from "../../../../components/marketing/checkout-cancel-page";
import { createAuthServerClient } from "../../../../lib/auth/server";
import { acquisitionStateTokenFromCookies } from "../../../../lib/commerce/acquisition-quote-cookie";
import { getAcquisitionByQuoteId } from "../../../../lib/commerce/acquisition-session-store";

export const metadata: Metadata = {
  title: "Checkout Canceled — My Property Assistant",
  robots: { index: false, follow: false }
};

export default async function Page({
  searchParams
}: {
  searchParams: Promise<{ quote?: string; offer?: string }>;
}) {
  const params = await searchParams;
  const quoteId = params.quote?.trim() || null;
  const offerId = params.offer?.trim() || null;

  let quoteContext: {
    productSku: ProductSku;
    billingCycle: BillingCycle;
    snapshotId?: string | null;
    managedUnits?: number | null;
    expired: boolean;
  } | null = null;

  if (quoteId) {
    const record = await getAcquisitionByQuoteId(quoteId, {
      stateToken: await acquisitionStateTokenFromCookies()
    });
    if (record && isProductSku(record.quote.module) && isBillingCycle(record.quote.billing_interval)) {
      quoteContext = {
        productSku: record.quote.module,
        billingCycle: record.quote.billing_interval,
        snapshotId: record.snapshot.snapshot_id,
        managedUnits: record.answers.managedUnits,
        expired: isCommercialQuoteExpired(record.quote)
      };
    }
  }

  const supabase = await createAuthServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  return (
    <CheckoutCancelPage
      quoteId={quoteId}
      offerId={offerId}
      quoteContext={quoteContext}
      isAuthenticated={Boolean(user)}
    />
  );
}
