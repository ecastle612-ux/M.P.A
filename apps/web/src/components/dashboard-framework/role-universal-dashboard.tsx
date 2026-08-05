"use client";

import { UniversalDashboard } from "./universal-dashboard";
import type { UniversalDashboardViewModel } from "./types";

/** Slice B — render a pre-built role view model (no Ops polling). */
export function RoleUniversalDashboard({ model }: { model: UniversalDashboardViewModel }) {
  return <UniversalDashboard model={model} />;
}
