import { Ma6WorkOrderDetailPage } from "../../../../../../components/admin/ma6-operations-pages";
import { loadMa6WorkOrderDetail } from "../../../../../../lib/admin/load-ma6-operations";

export const dynamic = "force-dynamic";

export default async function Page({
  params
}: {
  params: Promise<{ workOrderId: string }> | { workOrderId: string };
}) {
  const { workOrderId } = await Promise.resolve(params);
  const detail = await loadMa6WorkOrderDetail(workOrderId);
  return (
    <Ma6WorkOrderDetailPage
      workOrder={detail.workOrder}
      notifications={detail.notifications}
      auditEvents={detail.auditEvents}
      degraded={detail.degraded}
    />
  );
}
