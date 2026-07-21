import type { ReactNode } from "react";
import { AppPage } from "./app-page";

export function DetailPageLayout({
  breadcrumbs,
  banner,
  hero,
  toolbelt,
  relationshipChain,
  main,
  contextRail
}: {
  breadcrumbs: Array<{ href?: string; label: string }>;
  banner?: ReactNode;
  hero: ReactNode;
  /** UX-009 entity action toolbelt (80/20 primary actions) */
  toolbelt?: ReactNode;
  relationshipChain?: ReactNode;
  main: ReactNode;
  contextRail: ReactNode;
}) {
  return (
    <AppPage wide breadcrumbs={breadcrumbs}>
      {banner}
      {relationshipChain}
      {hero}
      {toolbelt}
      <div className="mpa-workspace-grid">
        <div className="mpa-workspace-main min-w-0 space-y-4">{main}</div>
        {contextRail}
      </div>
    </AppPage>
  );
}
