import { redirect } from "next/navigation";
import { Card } from "@mpa/ui";
import { AppPage } from "../../../../components/presentation/app-page";
import { FacilityCalendar } from "../../../../components/facility/facility-calendar";
import { createAuthServerComponentClient } from "../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../lib/organization/server";
import { getFacilityCalendarItems } from "../../../../lib/facility/calendar";

export default async function FacilityCalendarPage({
  searchParams
}: {
  searchParams: Promise<{ year?: string; month?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createAuthServerComponentClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const organizationId = await resolveActiveOrganizationIdForUser(user.id);
  if (!organizationId) {
    return (
      <AppPage
        wide
        breadcrumbs={[
          { href: "/facility", label: "Facility" },
          { label: "Calendar" }
        ]}
      >
        <Card>
          <h1 className="text-xl font-semibold text-[var(--mpa-color-text-primary)]">No active organization</h1>
        </Card>
      </AppPage>
    );
  }

  const authorization = await resolveAuthorizationContext(user, organizationId);
  if (!evaluatePermission(authorization, "facility:calendar:read")) {
    redirect("/unauthorized");
  }

  const now = new Date();
  const year = Number.parseInt(params.year ?? String(now.getUTCFullYear()), 10);
  const month = Number.parseInt(params.month ?? String(now.getUTCMonth() + 1), 10);
  const safeYear = Number.isFinite(year) ? year : now.getUTCFullYear();
  const safeMonth = Number.isFinite(month) && month >= 1 && month <= 12 ? month : now.getUTCMonth() + 1;

  const items = await getFacilityCalendarItems(
    organizationId,
    { year: safeYear, month: safeMonth },
    supabase
  );

  return (
    <AppPage
      wide
      breadcrumbs={[
        { href: "/facility", label: "Facility" },
        { label: "Calendar" }
      ]}
    >
      <FacilityCalendar items={items} year={safeYear} month={safeMonth} />
    </AppPage>
  );
}
