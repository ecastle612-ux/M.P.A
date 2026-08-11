import { Ma3AuditDetailPage } from "../../../../../components/admin/ma3-audit-page";
import { loadMa3AuditEvent } from "../../../../../lib/admin/load-ma3-audit";

export default async function Page({
  params
}: {
  params: Promise<{ eventId: string }> | { eventId: string };
}) {
  const { eventId } = await Promise.resolve(params);
  const { event, degraded } = await loadMa3AuditEvent(eventId);
  return <Ma3AuditDetailPage event={event} degraded={degraded} />;
}
