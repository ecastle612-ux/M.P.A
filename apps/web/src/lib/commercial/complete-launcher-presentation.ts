import type {
  CompleteLauncherPriority,
  FoLauncherBrief,
  MemberOperatingScope,
  PmLauncherBrief,
  ProductSku,
  UserRole
} from "@mpa/shared";
import {
  buildCompleteLauncherPriorities,
  buildCompleteWorkspaceHandoffs,
  completeLauncherEmptyGuidance,
  completeWorkspaceLabels
} from "@mpa/shared";

export type PmMissionControlApiBody = {
  propertyCount?: number;
  nextAction?: { title: string; detail: string; href: string } | null;
  dailyOperations?: PmLauncherBrief["dailyOperations"];
  error?: string;
};

export type FoMissionControlApiBody = {
  snapshot?: FoLauncherBrief & { completedRecently?: number };
  error?: string;
};

export function pmBriefFromMissionControlApi(
  body: PmMissionControlApiBody | null
): PmLauncherBrief | null {
  if (!body || typeof body.propertyCount !== "number") {
    return null;
  }
  return {
    propertyCount: body.propertyCount,
    nextAction: body.nextAction ?? null,
    dailyOperations: body.dailyOperations ?? null
  };
}

export function foBriefFromMissionControlApi(
  body: FoMissionControlApiBody | null
): FoLauncherBrief | null {
  const snapshot = body?.snapshot;
  if (!snapshot) {
    return null;
  }
  return {
    todayOpen: snapshot.todayOpen,
    emergency: snapshot.emergency,
    open: snapshot.open,
    overdue: snapshot.overdue,
    waitingOnTechnician: snapshot.waitingOnTechnician,
    waitingOnVendor: snapshot.waitingOnVendor
  };
}

export { resolvePriorityToneVariant as priorityBadgeVariant } from "@mpa/ui";

export function workspaceSectionLabel(
  workspace: CompleteLauncherPriority["workspace"]
): string {
  const labels = completeWorkspaceLabels();
  return workspace === "property_operations"
    ? labels.propertyOperations
    : labels.facilityOperations;
}

/** Assemble Complete launcher model from authoritative PM + FO API payloads. */
export function buildCompleteLauncherViewModel(input: {
  sku: ProductSku;
  pmBody: PmMissionControlApiBody | null;
  foBody: FoMissionControlApiBody | null;
  pmError: string | null;
  foError: string | null;
  roles?: readonly UserRole[] | undefined;
  storedScope?: MemberOperatingScope | null | undefined;
}) {
  const labels = completeWorkspaceLabels();
  const member = { roles: input.roles, storedScope: input.storedScope };
  const handoffs = buildCompleteWorkspaceHandoffs(input.sku, member);
  const allowed = new Set(handoffs.map((item) => item.id));
  const pm = allowed.has("property_operations") ? pmBriefFromMissionControlApi(input.pmBody) : null;
  const fo = allowed.has("facility_operations") ? foBriefFromMissionControlApi(input.foBody) : null;
  const priorities = buildCompleteLauncherPriorities({ pm, fo }).filter((item) =>
    allowed.has(item.workspace)
  );
  const propertyCount = pm?.propertyCount ?? 0;
  const emptyGuidance = completeLauncherEmptyGuidance({
    propertyCount,
    foOpen: fo ? fo.open : null,
    sku: input.sku,
    roles: input.roles,
    storedScope: input.storedScope
  });

  return {
    labels,
    priorities,
    handoffs,
    emptyGuidance:
      propertyCount === 0
        ? emptyGuidance
        : priorities.length === 0
          ? emptyGuidance
          : null,
    propertyPriorities: priorities.filter((item) => item.workspace === "property_operations"),
    facilityPriorities: priorities.filter((item) => item.workspace === "facility_operations"),
    loadErrors: [
      allowed.has("property_operations") ? input.pmError : null,
      allowed.has("facility_operations") ? input.foError : null
    ].filter(Boolean) as string[]
  };
}
