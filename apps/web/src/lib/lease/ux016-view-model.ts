/**
 * CORE-004 Phase 3 — Leasing Operations Command Center (STD-001 UDF).
 */

import type { LeaseListItem } from "./server";
import type { ApplicantListItem } from "../applicant/server";
import {
  isLeasingWorkflowStage,
  LEASING_WORKFLOW_DEFINITIONS,
  primaryNextLeasingStage,
  toLeasingWorkflowLabel,
  type LeasingWorkflowStage
} from "./workflow";
import type {
  UniversalActivityItem,
  UniversalAttentionItem,
  UniversalDashboardViewModel,
  UniversalInsightItem,
  UniversalMissionItem,
  UniversalQuickAction
} from "../dashboard/ux016-view-model";
import type { AssistantWaitingItem } from "../dashboard/ux016-assistant";
import {
  assembleUniversalHome,
  dateLabelFromNow,
  timeGreetingFromNow
} from "../std001/assemble-universal-home";

function stageOfLease(lease: LeaseListItem): LeasingWorkflowStage {
  return isLeasingWorkflowStage(lease.workflowStage)
    ? lease.workflowStage
    : "lease_generation";
}

function stageOfApplicant(applicant: ApplicantListItem): LeasingWorkflowStage {
  return isLeasingWorkflowStage(applicant.workflowStage)
    ? applicant.workflowStage
    : "prospect";
}

export function buildLeasingCommandCenterViewModel(input: {
  leases: LeaseListItem[];
  applicants: ApplicantListItem[];
  canCreateLease: boolean;
  canCreateApplicant: boolean;
  userName?: string | null;
  organizationName?: string | null;
}): UniversalDashboardViewModel {
  const activeLeases = input.leases.filter((lease) => stageOfLease(lease) !== "archive");
  const pipelineApplicants = input.applicants.filter((applicant) => {
    const stage = stageOfApplicant(applicant);
    return stage !== "archive" && stage !== "resident";
  });

  const awaitingSignature = activeLeases.filter(
    (lease) => stageOfLease(lease) === "signwell_signature"
  );
  const moveInPrep = activeLeases.filter((lease) =>
    ["move_in_preparation", "move_in"].includes(stageOfLease(lease))
  );
  const renewals = activeLeases.filter((lease) => stageOfLease(lease) === "renewal");
  const expiringSoon = activeLeases.filter((lease) => {
    if (!lease.endDate) return false;
    const end = new Date(`${lease.endDate}T00:00:00.000Z`).getTime();
    const now = Date.now();
    const days = (end - now) / (1000 * 60 * 60 * 24);
    return days >= 0 && days <= 60 && stageOfLease(lease) === "resident";
  });
  const screening = pipelineApplicants.filter((applicant) =>
    ["application", "screening", "approval"].includes(stageOfApplicant(applicant))
  );
  const tours = pipelineApplicants.filter((applicant) =>
    ["tour_scheduling", "property_showing"].includes(stageOfApplicant(applicant))
  );

  const attention: UniversalAttentionItem[] = [];
  if (awaitingSignature.length > 0) {
    attention.push({
      id: "lease-signwell",
      title: "Awaiting SignWell",
      reason: `${awaitingSignature.length} lease${awaitingSignature.length === 1 ? "" : "s"} in signature`,
      href: `/leases/${awaitingSignature[0]!.id}`,
      actionLabel: "Track",
      severity: "critical"
    });
  }
  if (screening.length > 0) {
    attention.push({
      id: "lease-screening",
      title: "Applications in review",
      reason: `${screening.length} applicant${screening.length === 1 ? "" : "s"} in application/screening/approval`,
      href: `/applicants/${screening[0]!.id}`,
      actionLabel: "Review",
      severity: "high"
    });
  }
  if (renewals.length > 0 || expiringSoon.length > 0) {
    attention.push({
      id: "lease-renewals",
      title: "Renewals & expirations",
      reason: `${renewals.length} renewal · ${expiringSoon.length} expiring ≤60d`,
      href: renewals[0] ? `/leases/${renewals[0].id}` : `/leases/${expiringSoon[0]!.id}`,
      actionLabel: "Open",
      severity: "high"
    });
  }
  if (moveInPrep.length > 0) {
    attention.push({
      id: "lease-move-in",
      title: "Move-in preparation",
      reason: `${moveInPrep.length} lease${moveInPrep.length === 1 ? "" : "s"} preparing to move in`,
      href: `/leases/${moveInPrep[0]!.id}`,
      actionLabel: "Prepare",
      severity: "normal"
    });
  }

  const waitingOnMe: AssistantWaitingItem[] = [];
  for (const lease of [...awaitingSignature, ...moveInPrep, ...renewals].slice(0, 6)) {
    const stage = stageOfLease(lease);
    const next = primaryNextLeasingStage(stage);
    const def = LEASING_WORKFLOW_DEFINITIONS[stage];
    waitingOnMe.push({
      id: `me-lease-${lease.id}`,
      label: lease.leaseNumber,
      detail:
        def.waitingOnMe[0] ??
        `${toLeasingWorkflowLabel(stage)}${next ? ` → ${toLeasingWorkflowLabel(next)}` : ""}`,
      href: `/leases/${lease.id}`
    });
  }
  for (const applicant of [...screening, ...tours].slice(0, 4)) {
    const stage = stageOfApplicant(applicant);
    const def = LEASING_WORKFLOW_DEFINITIONS[stage];
    waitingOnMe.push({
      id: `me-app-${applicant.id}`,
      label: applicant.applicationNumber,
      detail: def.waitingOnMe[0] ?? toLeasingWorkflowLabel(stage),
      href: `/applicants/${applicant.id}`
    });
  }

  const waitingOnOthers: AssistantWaitingItem[] = [
    ...awaitingSignature.map((lease) => ({
      id: `other-sign-${lease.id}`,
      label: lease.leaseNumber,
      detail: "Waiting on SignWell signatures",
      href: `/leases/${lease.id}`
    })),
    ...pipelineApplicants
      .filter((applicant) => stageOfApplicant(applicant) === "application")
      .map((applicant) => ({
        id: `other-app-${applicant.id}`,
        label: applicant.applicationNumber,
        detail: "Waiting on applicant documents",
        href: `/applicants/${applicant.id}`
      }))
  ].slice(0, 6);

  const mission: UniversalMissionItem[] = [
    {
      id: "m-pipeline",
      label: "pipeline applicants",
      count: pipelineApplicants.length,
      href: "/applicants"
    },
    {
      id: "m-active-leases",
      label: "active leases",
      count: activeLeases.length,
      href: "/leases"
    },
    {
      id: "m-signwell",
      label: "SignWell",
      count: awaitingSignature.length,
      href: "/leases"
    },
    {
      id: "m-renewals",
      label: "renewals",
      count: renewals.length + expiringSoon.length,
      href: "/leases"
    }
  ];

  const quickActions: UniversalQuickAction[] = [];
  if (input.canCreateApplicant) {
    quickActions.push({ id: "qa-applicant", label: "New applicant", href: "/applicants/new" });
  }
  if (input.canCreateLease) {
    quickActions.push({ id: "qa-lease", label: "New lease", href: "/leases/new" });
  }
  quickActions.push(
    { id: "qa-applicants", label: "Applicants", href: "/applicants" },
    { id: "qa-properties", label: "Properties", href: "/properties" }
  );

  const recentActivity: UniversalActivityItem[] = [
    ...activeLeases.slice(0, 5).map((lease) => ({
      id: lease.id,
      summary: `${lease.leaseNumber} · ${lease.tenantName ?? "Resident"}`,
      meta: `${toLeasingWorkflowLabel(stageOfLease(lease))} · ${lease.status}`,
      href: `/leases/${lease.id}`
    })),
    ...pipelineApplicants.slice(0, 3).map((applicant) => ({
      id: applicant.id,
      summary: `${applicant.applicationNumber} · ${applicant.firstName} ${applicant.lastName}`,
      meta: toLeasingWorkflowLabel(stageOfApplicant(applicant)),
      href: `/applicants/${applicant.id}`
    }))
  ];

  const insights: UniversalInsightItem[] = [
    {
      id: "i-pipeline",
      label: "Pipeline",
      value: String(pipelineApplicants.length),
      href: "/applicants"
    },
    {
      id: "i-signwell",
      label: "SignWell",
      value: String(awaitingSignature.length),
      href: "/leases"
    },
    {
      id: "i-move-in",
      label: "Move-in",
      value: String(moveInPrep.length),
      href: "/leases"
    },
    {
      id: "i-renewal",
      label: "Renewal",
      value: String(renewals.length + expiringSoon.length),
      href: "/leases"
    }
  ];

  return assembleUniversalHome({
    surfaceLabel: "Leasing Operations",
    timeGreeting: timeGreetingFromNow(),
    userName: input.userName ?? null,
    organizationName: input.organizationName ?? null,
    placeLabel: "Leasing pipeline",
    dateLabel: dateLabelFromNow(),
    supportingLine:
      awaitingSignature.length > 0
        ? "Prioritize SignWell completions, then move-in preparation."
        : screening.length > 0
          ? "Advance screening and approvals into lease generation."
          : "Canonical leasing lifecycle · prospect through archive",
    attention,
    mission,
    quickActions,
    recentActivity,
    insights,
    waitingOnMe: waitingOnMe.slice(0, 8),
    waitingOnOthers
  });
}
