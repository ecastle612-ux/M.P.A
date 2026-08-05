"use client";

import type { ReactNode } from "react";
import { RoleUniversalDashboard } from "../dashboard-framework/role-universal-dashboard";
import type { UniversalDashboardViewModel } from "../../lib/dashboard/ux016-view-model";

export function OwnerUniversalDashboard({
  model,
  demoPanel
}: {
  model: UniversalDashboardViewModel;
  demoPanel?: ReactNode;
}) {
  return (
    <div className="space-y-4">
      {demoPanel}
      <RoleUniversalDashboard model={model} />
    </div>
  );
}
