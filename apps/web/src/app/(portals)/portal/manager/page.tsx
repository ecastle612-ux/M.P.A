import { AppPage } from "../../../../components/presentation/app-page";
import { FutureReleaseNotice } from "../../../../components/experience/future-release-notice";

export default function ManagerPortalPage() {
  return (
    <AppPage breadcrumbs={[{ href: "/portal", label: "Portals" }, { label: "Manager" }]}>
      <FutureReleaseNotice
        title="Manager Portal"
        description="A dedicated Manager Portal will become available during a future release. Property managers should use the Operations Center for day-to-day work."
        primaryHref="/dashboard"
        primaryLabel="Open Operations Center"
      />
    </AppPage>
  );
}
