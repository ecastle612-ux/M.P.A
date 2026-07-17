import { Card } from "@mpa/ui";
import { Breadcrumbs } from "../../../../../../components/shell/breadcrumbs";
import {
  ResidentAnnouncementDetail,
  type ResidentAnnouncementItem
} from "../../../../../../components/communication/resident-announcements-inbox";
import { fetchAuthedApi } from "../../../../../../lib/communication/server-fetch";

export default async function TenantAnnouncementDetailPage({
  params
}: {
  params: Promise<{ announcementId: string }>;
}) {
  const { announcementId } = await params;
  const result = await fetchAuthedApi<{ items: ResidentAnnouncementItem[] }>("/api/resident/announcements");
  const items = result.ok ? result.data.items : [];
  const announcement = items.find((item) => item.id === announcementId);

  if (!announcement) {
    return (
      <div className="space-y-5">
        <Breadcrumbs
          items={[
            { href: "/portal/tenant", label: "Tenant home" },
            { href: "/portal/tenant/announcements", label: "Announcements" },
            { label: "Not found" }
          ]}
        />
        <Card>
          <p className="text-sm text-[var(--mpa-color-text-secondary)]">Announcement not found or no longer available.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <Breadcrumbs
        items={[
          { href: "/portal/tenant", label: "Tenant home" },
          { href: "/portal/tenant/announcements", label: "Announcements" },
          { label: announcement.title }
        ]}
      />
      <ResidentAnnouncementDetail announcement={announcement} />
    </div>
  );
}
