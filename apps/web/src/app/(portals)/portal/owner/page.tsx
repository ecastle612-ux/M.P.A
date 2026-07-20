import { AppPage } from "../../../../components/presentation/app-page";
import { FutureReleaseNotice } from "../../../../components/experience/future-release-notice";

export default function OwnerPortalPage() {
  return (
    <AppPage breadcrumbs={[{ href: "/portal", label: "Portals" }, { label: "Owner" }]}>
      <FutureReleaseNotice
        title="Owner Portal"
        description="The Owner Portal will become available during a future release. Property owners can use shared reporting and statements from the main workspace when granted access."
        primaryHref="/portal"
        primaryLabel="Back to Portals"
      />
    </AppPage>
  );
}
