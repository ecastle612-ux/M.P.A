import type { ReactNode } from "react";
import { AppPage } from "./app-page";

export function CreatePageLayout({
  breadcrumbs,
  banner,
  form,
  contextRail
}: {
  breadcrumbs: Array<{ href?: string; label: string }>;
  banner?: ReactNode;
  form: ReactNode;
  contextRail: ReactNode;
}) {
  return (
    <AppPage wide breadcrumbs={breadcrumbs}>
      {banner}
      <div className="mpa-workspace-grid">
        <div className="mpa-workspace-main min-w-0 space-y-5">{form}</div>
        {contextRail}
      </div>
    </AppPage>
  );
}
