import type { ReactNode } from "react";
import { AppPage } from "../../../components/presentation/app-page";
import { SettingsSubnav } from "../../../components/settings/settings-subnav";

export default function SettingsLayout({ children }: { children: ReactNode }) {
  return (
    <AppPage
      wide
      breadcrumbs={[{ href: "/dashboard", label: "Operations" }, { label: "Settings" }]}
    >
      <SettingsSubnav />
      {children}
    </AppPage>
  );
}
