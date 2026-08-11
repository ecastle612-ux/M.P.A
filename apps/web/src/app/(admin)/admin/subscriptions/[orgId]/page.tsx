import { Ma4SubscriptionDetailPage } from "../../../../../components/admin/ma4-commercial-pages";
import { loadMa4SubscriptionDetail } from "../../../../../lib/admin/load-ma4-subscriptions";

export const dynamic = "force-dynamic";

export default async function Page({
  params
}: {
  params: Promise<{ orgId: string }> | { orgId: string };
}) {
  const { orgId } = await Promise.resolve(params);
  const { detail, degraded } = await loadMa4SubscriptionDetail(orgId);
  return <Ma4SubscriptionDetailPage detail={detail} degraded={degraded} mode="subscription" />;
}
