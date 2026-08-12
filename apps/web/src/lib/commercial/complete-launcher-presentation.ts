import type {
  CompleteLauncherPriority,
  FoLauncherBrief,
  PmLauncherBrief,
  ProductSku
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

export function priorityBadgeVariant(
  tone: CompleteLauncherPriority["tone"]
): "danger" | "warning" | "neutral" | "success" | "info" {
  if (tone === "critical") return "danger";
  if (tone === "watch") return "warning";
  if (tone === "ok") return "success";
  return "neutral";
}

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
}) {
  const labels = completeWorkspaceLabels();
  const pm = pmBriefFromMissionControlApi(input.pmBody);
  const fo = foBriefFromMissionControlApi(input.foBody);
  const priorities = buildCompleteLauncherPriorities({ pm, fo });
  const handoffs = buildCompleteWorkspaceHandoffs(input.sku);
  const propertyCount = pm?.propertyCount ?? 0;
  const emptyGuidance = completeLauncherEmptyGuidance({
    propertyCount,
    foOpen: fo ? fo.open : null
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
    loadErrors: [input.pmError, input.foError].filter(Boolean) as string[]
  };
}
