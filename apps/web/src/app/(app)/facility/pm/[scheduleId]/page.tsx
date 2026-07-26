import { redirect } from "next/navigation";
import { AppPage } from "../../../../../components/presentation/app-page";
import { PmScheduleDetail } from "../../../../../components/facility/pm-schedule-detail";
import { createAuthServerComponentClient } from "../../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../../lib/organization/server";
import { getPmSchedule } from "../../../../../lib/facility/pm-server";

export default async function FacilityPmDetailPage({
  params
}: {
  params: Promise<{ scheduleId: string }>;
}) {
  const { scheduleId } = await params;
  const supabase = await createAuthServerComponentClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const organizationId = await resolveActiveOrganizationIdForUser(user.id);
  if (!organizationId) redirect("/facility/pm");

  const authorization = await resolveAuthorizationContext(user, organizationId);
  if (!evaluatePermission(authorization, "facility:pm:read")) {
    redirect("/unauthorized");
  }

  const schedule = await getPmSchedule(organizationId, scheduleId, supabase);
  if (!schedule) redirect("/facility/pm");

  return (
    <AppPage
      wide
      breadcrumbs={[
        { href: "/facility/pm", label: "Preventive" },
        { label: schedule.title }
      ]}
    >
      <PmScheduleDetail
        schedule={schedule}
        canWrite={evaluatePermission(authorization, "facility:pm:write")}
      />
    </AppPage>
  );
}
