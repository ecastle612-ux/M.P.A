import { AppPage } from "../../../../../components/presentation/app-page";
import {
  OwnerSectionHeader,
  OwnerSimpleLinkList
} from "../../../../../components/portal/owner-section-placeholder";

/** Mobile “More” destination — Documents, Reports, Settings. */
export default function OwnerMorePage() {
  return (
    <AppPage
      breadcrumbs={[
        { href: "/portal/owner", label: "Owner" },
        { label: "More" }
      ]}
    >
      <div className="space-y-5">
        <OwnerSectionHeader
          title="More"
          description="Documents, reports, and account settings."
        />
        <OwnerSimpleLinkList
          items={[
            {
              href: "/portal/owner/documents",
              title: "Documents",
              description: "Statements, leases, inspections, and shared files."
            },
            {
              href: "/portal/owner/reports",
              title: "Reports",
              description: "Owner statements and reporting library."
            },
            {
              href: "/portal/owner/settings",
              title: "Settings",
              description: "Profile, notifications, security, and preferences."
            }
          ]}
        />
      </div>
    </AppPage>
  );
}
