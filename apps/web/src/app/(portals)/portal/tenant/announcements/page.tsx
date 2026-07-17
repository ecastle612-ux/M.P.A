import { Breadcrumbs } from "../../../../../components/shell/breadcrumbs";
import {
  ResidentAnnouncementsInbox,
  type ResidentAnnouncementItem
} from "../../../../../components/communication/resident-announcements-inbox";
import { fetchAuthedApi } from "../../../../../lib/communication/server-fetch";

export default async function TenantAnnouncementsPage() {
  const result = await fetchAuthedApi<{ items: ResidentAnnouncementItem[] }>("/api/resident/announcements");
  const items = result.ok ? result.data.items : [];

  return (
    <div className="space-y-5">
      <Breadcrumbs
        items={[
          { href: "/portal/tenant", label: "Tenant home" },
          { label: "Announcements" }
        ]}
      />
      <ResidentAnnouncementsInbox initialItems={items} />
    </div>
  );
}
