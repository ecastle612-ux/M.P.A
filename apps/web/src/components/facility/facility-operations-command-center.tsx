"use client";

import {
  FacilityOperationsWorkspace,
  type FacilityWorkspaceDomain
} from "./facility-operations-workspace";

/** STAB-004 command center — corrective facility work home. */
export function FacilityOperationsCommandCenter() {
  return <FacilityOperationsWorkspace domain="operations" />;
}

export type FacilityDomainWorkspaceProps = {
  title?: string;
  description?: string;
  domain: Exclude<FacilityWorkspaceDomain, "operations">;
};

/** Category-scoped live facility queue (no honesty shells). */
export function FacilityDomainWorkspace({ domain }: FacilityDomainWorkspaceProps) {
  return <FacilityOperationsWorkspace domain={domain} />;
}
