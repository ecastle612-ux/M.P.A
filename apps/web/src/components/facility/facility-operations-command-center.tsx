"use client";

import { Suspense } from "react";
import {
  FacilityOperationsWorkspace,
  type FacilityWorkspaceDomain
} from "./facility-operations-workspace";

/** STAB-004 command center — corrective facility work home. */
export function FacilityOperationsCommandCenter() {
  return (
    <Suspense fallback={<main className="p-6 text-sm">Loading operations…</main>}>
      <FacilityOperationsWorkspace domain="operations" />
    </Suspense>
  );
}

export type FacilityDomainWorkspaceProps = {
  title?: string;
  description?: string;
  domain: Exclude<FacilityWorkspaceDomain, "operations">;
};

/** Category-scoped live facility queue (no honesty shells). */
export function FacilityDomainWorkspace({ domain }: FacilityDomainWorkspaceProps) {
  return (
    <Suspense fallback={<main className="p-6 text-sm">Loading facility work…</main>}>
      <FacilityOperationsWorkspace domain={domain} />
    </Suspense>
  );
}
