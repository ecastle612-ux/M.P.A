import { Ma5CheckoutDetailPage } from "../../../../../components/admin/ma5-checkout-webhook-pages";
import { loadMa5CheckoutDetail } from "../../../../../lib/admin/load-ma5-checkout";

export const dynamic = "force-dynamic";

export default async function Page({
  params
}: {
  params: Promise<{ sessionId: string }> | { sessionId: string };
}) {
  const { sessionId } = await Promise.resolve(params);
  const detail = await loadMa5CheckoutDetail(decodeURIComponent(sessionId));
  return (
    <Ma5CheckoutDetailPage
      row={detail.row}
      lifecycle={detail.lifecycle}
      job={detail.job}
      degraded={detail.degraded}
      limitations={detail.limitations}
    />
  );
}
