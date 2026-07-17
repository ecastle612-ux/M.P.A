import { redirect } from "next/navigation";
import { Breadcrumbs } from "../../../../../components/shell/breadcrumbs";
import { AnnouncementForm } from "../../../../../components/communication/announcement-form";
import { createAuthServerComponentClient } from "../../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../../lib/organization/server";
import { getPropertiesForOrganization } from "../../../../../lib/property/server";
import { fetchAuthedApi } from "../../../../../lib/communication/server-fetch";
import type { AnnouncementRecord } from "../../../../../lib/communication/contracts";

export default async function EditAnnouncementPage({ params }: { params: Promise<{ announcementId: string }> }) {
  const { announcementId } = await params;
  const supabase = await createAuthServerComponentClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const organizationId = await resolveActiveOrganizationIdForUser(user.id);
  if (!organizationId) {
    redirect("/dashboard");
  }

  const authorization = await resolveAuthorizationContext(user, organizationId);
  if (!evaluatePermission(authorization, "communication:update")) {
    redirect("/unauthorized");
  }

  const [announcementResult, properties] = await Promise.all([
    fetchAuthedApi<{ announcement: AnnouncementRecord }>(`/api/announcements/${announcementId}`),
    getPropertiesForOrganization(organizationId)
  ]);

  if (!announcementResult.ok || !announcementResult.data.announcement) {
    redirect("/communications");
  }

  const announcement = announcementResult.data.announcement;
  if (announcement.status !== "draft") {
    redirect(`/communications/${announcement.id}`);
  }

  return (
    <main className="mpa-page flex-1 space-y-5">
      <Breadcrumbs
        items={[
          { href: "/dashboard", label: "Dashboard" },
          { href: "/communications", label: "Communications" },
          { href: `/communications/${announcement.id}`, label: announcement.title },
          { label: "Edit" }
        ]}
      />
      <AnnouncementForm
        mode="edit"
        announcement={announcement}
        properties={properties.map((property) => ({ id: property.id, name: property.name }))}
      />
    </main>
  );
}
