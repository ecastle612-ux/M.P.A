import type { ReactNode } from "react";
import { AppPage } from "../../../components/presentation/app-page";
import { MasterAdminSubnav } from "../../../components/master-admin/master-admin-subnav";
import { requireMasterAdminPageAccess } from "../../../lib/master-admin/access";

export default async function MasterAdminLayout({ children }: { children: ReactNode }) {
  await requireMasterAdminPageAccess();

  return (
    <AppPage
      wide
      breadcrumbs={[
        { href: "/master-admin", label: "Operations Center" }
      ]}
    >
      <MasterAdminSubnav />
      {children}
    </AppPage>
  );
}
