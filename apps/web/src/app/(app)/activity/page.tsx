import { PageHeader } from "@mpa/ui";
import { createAuthServerComponentClient } from "../../../lib/auth/server";
import { resolveActiveOrganizationIdForUser } from "../../../lib/organization/server";
import { listOrgActivityTimeline } from "../../../lib/ops/timeline-query";
import { getSchedulerTelemetry } from "../../../lib/ops/scheduler";
import { ActivityTimeline } from "../../../components/ops/activity-timeline";
import { SchedulerStatusPanel } from "../../../components/ops/scheduler-status-panel";

export default async function OrgActivityPage() {
  const supabase = await createAuthServerComponentClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  const organizationId = user ? await resolveActiveOrganizationIdForUser(user.id) : null;
  const items =
    organizationId != null
      ? await listOrgActivityTimeline(organizationId, { limit: 50 }, supabase as never).catch(
          () => []
        )
      : [];

  const telemetry =
    organizationId != null
      ? await getSchedulerTelemetry().catch(() => null)
      : null;

  return (
    <div className="mpa-page space-y-[var(--mpa-space-6)]">
      <PageHeader
        overline="Operations"
        title="Activity"
        description="Organization activity timeline from the OPS event bus, with Notification Center and scheduler foundation (OPS-001 Slice A + B)."
      />
      <section className="max-w-3xl space-y-[var(--mpa-space-4)]">
        <SchedulerStatusPanel telemetry={telemetry} />
        <ActivityTimeline items={items} />
      </section>
    </div>
  );
}
