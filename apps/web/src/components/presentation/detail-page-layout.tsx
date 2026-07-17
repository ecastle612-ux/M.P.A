import type { ReactNode } from "react";
import { AppPage } from "./app-page";

export function DetailPageLayout({
  breadcrumbs,
  banner,
  hero,
  relationshipChain,
  main,
  contextRail
}: {
  breadcrumbs: Array<{ href?: string; label: string }>;
  banner?: ReactNode;
  hero: ReactNode;
  relationshipChain?: ReactNode;
  main: ReactNode;
  contextRail: ReactNode;
}) {
  return (
    <AppPage wide breadcrumbs={breadcrumbs}>
      {banner}
      {relationshipChain}
      {hero}
      <div className="mpa-workspace-grid">
        <div className="mpa-workspace-main min-w-0 space-y-5">{main}</div>
        {contextRail}
      </div>
    </AppPage>
  );
}
