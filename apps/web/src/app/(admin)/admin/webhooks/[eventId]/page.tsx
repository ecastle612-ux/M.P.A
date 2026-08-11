import { Ma5WebhookDetailPage } from "../../../../../components/admin/ma5-checkout-webhook-pages";
import { loadMa5WebhookDetail } from "../../../../../lib/admin/load-ma5-webhooks";

export const dynamic = "force-dynamic";

export default async function Page({
  params
}: {
  params: Promise<{ eventId: string }> | { eventId: string };
}) {
  const { eventId } = await Promise.resolve(params);
  const { event, degraded, limitations } = await loadMa5WebhookDetail(decodeURIComponent(eventId));
  return <Ma5WebhookDetailPage event={event} degraded={degraded} limitations={limitations} />;
}
