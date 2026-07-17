import { redirect } from "next/navigation";
import { Card } from "@mpa/ui";
import { AppPage } from "../../../components/presentation/app-page";
import { AnnouncementsTable } from "../../../components/communication/announcements-table";
import { createAuthServerComponentClient } from "../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../lib/organization/server";
import { fetchAuthedApi } from "../../../lib/communication/server-fetch";
import type { AnnouncementRecord } from "../../../lib/communication/contracts";

export default async function CommunicationsPage() {
  const supabase = await createAuthServerComponentClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const organizationId = await resolveActiveOrganizationIdForUser(user.id);
  if (!organizationId) {
    return (
      <AppPage wide breadcrumbs={[{ href: "/dashboard", label: "Dashboard" }, { label: "Communications" }]}>
        <Card>
          <h1 className="text-xl font-semibold text-[var(--mpa-color-text-primary)]">No active organization</h1>
          <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
            Select or create an organization before managing announcements.
          </p>
        </Card>
      </AppPage>
    );
  }

  const authorization = await resolveAuthorizationContext(user, organizationId);
  if (!evaluatePermission(authorization, "communication:read")) {
    redirect("/unauthorized");
  }

  const result = await fetchAuthedApi<{ items: AnnouncementRecord[] }>("/api/announcements");
  const items = result.ok ? result.data.items : [];

  const permissions = {
    canCreate: evaluatePermission(authorization, "communication:create"),
    canUpdate: evaluatePermission(authorization, "communication:update"),
    canArchive: evaluatePermission(authorization, "communication:archive"),
    canDelete: evaluatePermission(authorization, "communication:delete"),
    canPublish: evaluatePermission(authorization, "communication:publish")
  };

  return (
    <AppPage wide breadcrumbs={[{ href: "/dashboard", label: "Dashboard" }, { label: "Communications" }]}>
      <AnnouncementsTable initialItems={items} permissions={permissions} />
    </AppPage>
  );
}
