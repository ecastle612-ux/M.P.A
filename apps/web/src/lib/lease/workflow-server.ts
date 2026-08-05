/**
 * CORE-004 Phase 3 — Leasing workflow transitions (server).
 * Extends applicants + leases; one canonical machine; SignWell as signature stage.
 */

import type { Json } from "@mpa/supabase";
import {
  createAuthServerComponentClient,
  createServiceRoleServerClient
} from "../auth/server";
import { emitOpsDomainEvent } from "../ops/emit";
import type { OpsDbClient } from "../ops/types";
import { notify } from "../notifications/service";
import {
  canTransitionLeasingWorkflow,
  evaluateLeasingAdvanceGates,
  isLeasingApplicantStage,
  isLeasingLeaseStage,
  isLeasingWorkflowStage,
  LEASING_WORKFLOW_DEFINITIONS,
  legacyApplicantStatusToWorkflowStage,
  legacyLeaseStatusToWorkflowStage,
  workflowStageToLegacyApplicantStatus,
  workflowStageToLegacyLeaseStatus,
  type LeasingAdvanceGateContext,
  type LeasingWorkflowStage
} from "./workflow";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type UntypedDb = { from: (table: string) => any };
type SupabaseClientType = Awaited<ReturnType<typeof createAuthServerComponentClient>>;

function privilegedClient(fallback: SupabaseClientType): SupabaseClientType {
  return (createServiceRoleServerClient() as SupabaseClientType | null) ?? fallback;
}

type ApplicantRow = {
  id: string;
  organization_id: string;
  property_id: string | null;
  unit_id: string | null;
  status: string;
  workflow_stage?: string | null;
  email: string | null;
  phone: string | null;
  first_name: string;
  last_name: string;
  planned_move_in_date: string | null;
  submitted_at: string | null;
  approved_at: string | null;
  metadata: Json | null;
  application_number: string;
};

type LeaseRow = {
  id: string;
  organization_id: string;
  property_id: string;
  unit_id: string;
  primary_tenant_id: string;
  status: string;
  workflow_stage?: string | null;
  renewal_status: string;
  move_in_date: string | null;
  lease_number: string;
  signed_at: string | null;
  metadata: Json | null;
};

function metadataOf(value: Json | null): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return { ...(value as Record<string, unknown>) };
  }
  return {};
}

async function loadApplicant(
  organizationId: string,
  applicantId: string,
  supabase: SupabaseClientType
): Promise<ApplicantRow | null> {
  const { data, error } = await (supabase as unknown as UntypedDb)
    .from("applicants")
    .select(
      "id, organization_id, property_id, unit_id, status, workflow_stage, email, phone, first_name, last_name, planned_move_in_date, submitted_at, approved_at, metadata, application_number"
    )
    .eq("organization_id", organizationId)
    .eq("id", applicantId)
    .is("deleted_at", null)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as ApplicantRow | null) ?? null;
}

async function loadLease(
  organizationId: string,
  leaseId: string,
  supabase: SupabaseClientType
): Promise<LeaseRow | null> {
  const { data, error } = await (supabase as unknown as UntypedDb)
    .from("leases")
    .select(
      "id, organization_id, property_id, unit_id, primary_tenant_id, status, workflow_stage, renewal_status, move_in_date, lease_number, signed_at, metadata"
    )
    .eq("organization_id", organizationId)
    .eq("id", leaseId)
    .is("deleted_at", null)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as LeaseRow | null) ?? null;
}

function applicantStage(row: ApplicantRow): LeasingWorkflowStage {
  return isLeasingWorkflowStage(row.workflow_stage)
    ? row.workflow_stage
    : legacyApplicantStatusToWorkflowStage(row.status);
}

function leaseStage(row: LeaseRow): LeasingWorkflowStage {
  return isLeasingWorkflowStage(row.workflow_stage)
    ? row.workflow_stage
    : legacyLeaseStatusToWorkflowStage(row.status, row.renewal_status);
}

function linkedLeaseId(meta: Record<string, unknown>): string | null {
  const value = meta["linkedLeaseId"] ?? meta["leaseId"];
  return typeof value === "string" && value.length > 0 ? value : null;
}

function linkedApplicantId(meta: Record<string, unknown>): string | null {
  const value = meta["linkedApplicantId"] ?? meta["applicantId"];
  return typeof value === "string" && value.length > 0 ? value : null;
}

async function writeLeasingWorkflowEvent(input: {
  organizationId: string;
  fromStage: LeasingWorkflowStage | null;
  toStage: LeasingWorkflowStage;
  actorUserId: string;
  reason?: string | null;
  automation: Record<string, unknown>;
  applicantId?: string | null;
  leaseId?: string | null;
  propertyId?: string | null;
  payload?: Record<string, unknown>;
  supabase: SupabaseClientType;
}): Promise<void> {
  const { error } = await (input.supabase as unknown as UntypedDb)
    .from("leasing_workflow_events")
    .insert({
      organization_id: input.organizationId,
      applicant_id: input.applicantId ?? null,
      lease_id: input.leaseId ?? null,
      property_id: input.propertyId ?? null,
      from_stage: input.fromStage,
      to_stage: input.toStage,
      actor_user_id: input.actorUserId,
      reason: input.reason ?? null,
      automation: input.automation as Json,
      payload: (input.payload ?? {}) as Json
    });
  if (error) throw new Error(error.message ?? "Leasing workflow audit insert failed.");
}

async function emitAndNotify(input: {
  organizationId: string;
  actorUserId: string;
  fromStage: LeasingWorkflowStage;
  toStage: LeasingWorkflowStage;
  href: string;
  subjectType: "applicant" | "lease";
  subjectId: string;
  propertyId?: string | null;
  summary: string;
  supabase: SupabaseClientType;
}): Promise<void> {
  const definition = LEASING_WORKFLOW_DEFINITIONS[input.toStage];
  try {
    await emitOpsDomainEvent(input.supabase as unknown as OpsDbClient, {
      eventType: "leasing.workflow.transitioned",
      organizationId: input.organizationId,
      actor: { actor_type: "user", principal_id: input.actorUserId },
      subject: { type: input.subjectType, id: input.subjectId },
      ...(input.propertyId ? { propertyId: input.propertyId } : {}),
      href: input.href,
      summary: input.summary,
      payload: {
        fromStage: input.fromStage,
        toStage: input.toStage,
        notifyCategory: "leases"
      },
      visibility: "ops",
      sensitivity: "normal"
    });
  } catch {
    /* bus optional */
  }

  const notifyStages: LeasingWorkflowStage[] = [
    "tour_scheduling",
    "application",
    "screening",
    "approval",
    "lease_generation",
    "signwell_signature",
    "move_in_preparation",
    "move_in",
    "renewal",
    "move_out"
  ];
  if (notifyStages.includes(input.toStage)) {
    try {
      await notify({
        organizationId: input.organizationId,
        recipientUserIds: [input.actorUserId],
        category: "leases",
        priority: input.toStage === "approval" ? "high" : "normal",
        title: `Leasing: ${definition.label}`,
        body: `Workflow moved to ${definition.label}.`,
        eventKey: `leasing.workflow.${input.toStage}.${input.subjectId}.${Date.now()}`,
        ...(input.propertyId ? { propertyId: input.propertyId } : {}),
        href: input.href,
        sourceEntityType: input.subjectType === "lease" ? "lease" : "applicant",
        sourceEntityId: input.subjectId,
        actorUserId: input.actorUserId,
        channels: { inApp: true }
      });
    } catch {
      /* optional */
    }
  }
}

function gateContextFromRows(input: {
  applicant?: ApplicantRow | null;
  lease?: LeaseRow | null;
  signatureComplete?: boolean;
}): LeasingAdvanceGateContext {
  const applicant = input.applicant ?? null;
  const lease = input.lease ?? null;
  const meta = metadataOf(applicant?.metadata ?? null);
  return {
    hasProperty: Boolean(applicant?.property_id || lease?.property_id),
    hasUnit: Boolean(applicant?.unit_id || lease?.unit_id),
    hasApplicantContact: Boolean(applicant?.email || applicant?.phone),
    applicationSubmitted: Boolean(applicant?.submitted_at) || applicant?.status === "submitted",
    screeningComplete:
      Boolean(meta["screeningComplete"]) ||
      applicant?.status === "screening_in_progress" ||
      applicant?.status === "pending_review" ||
      applicant?.status === "approved",
    approved: Boolean(applicant?.approved_at) || applicant?.status === "approved",
    leaseId: lease?.id ?? linkedLeaseId(meta),
    signatureComplete:
      Boolean(input.signatureComplete) ||
      Boolean(lease?.signed_at) ||
      lease?.status === "signed" ||
      lease?.status === "active",
    moveInDateSet: Boolean(lease?.move_in_date || applicant?.planned_move_in_date)
  };
}

export type TransitionLeasingWorkflowInput = {
  organizationId: string;
  actorUserId: string;
  toStage: LeasingWorkflowStage;
  reason?: string | null;
  force?: boolean;
  applicantId?: string | null;
  leaseId?: string | null;
};

export async function transitionLeasingWorkflow(
  input: TransitionLeasingWorkflowInput,
  client?: SupabaseClientType
): Promise<{
  fromStage: LeasingWorkflowStage;
  toStage: LeasingWorkflowStage;
  applicantId: string | null;
  leaseId: string | null;
  automation: Record<string, unknown>;
}> {
  const supabase = client ?? (await createAuthServerComponentClient());
  const toStage = input.toStage;

  let applicant = input.applicantId
    ? await loadApplicant(input.organizationId, input.applicantId, supabase)
    : null;
  let lease = input.leaseId
    ? await loadLease(input.organizationId, input.leaseId, supabase)
    : null;

  if (!applicant && lease) {
    const linked = linkedApplicantId(metadataOf(lease.metadata));
    if (linked) applicant = await loadApplicant(input.organizationId, linked, supabase);
  }
  if (!lease && applicant) {
    const linked = linkedLeaseId(metadataOf(applicant.metadata));
    if (linked) lease = await loadLease(input.organizationId, linked, supabase);
  }

  if (!applicant && !lease) {
    throw new Error("Applicant or lease is required for leasing workflow transitions.");
  }

  // Carrier-aware current stage: applicant owns early stages; lease owns later stages.
  let effectiveFrom: LeasingWorkflowStage;
  if (toStage === "lease_generation" && applicant) {
    effectiveFrom = applicantStage(applicant);
  } else if (lease && isLeasingLeaseStage(leaseStage(lease))) {
    effectiveFrom = leaseStage(lease);
  } else if (applicant) {
    effectiveFrom = applicantStage(applicant);
  } else {
    effectiveFrom = leaseStage(lease!);
  }

  if (effectiveFrom === toStage) {
    return {
      fromStage: effectiveFrom,
      toStage,
      applicantId: applicant?.id ?? null,
      leaseId: lease?.id ?? null,
      automation: {}
    };
  }

  if (!canTransitionLeasingWorkflow(effectiveFrom, toStage)) {
    throw new Error(
      `Transition ${effectiveFrom} → ${toStage} is not allowed. No undocumented transitions.`
    );
  }

  const gate = input.force
    ? ({ ok: true } as const)
    : evaluateLeasingAdvanceGates(toStage, gateContextFromRows({ applicant, lease }));
  if (!gate.ok) throw new Error(gate.message);

  if (toStage === "lease_generation" && !lease) {
    throw new Error(
      "Link or create a draft lease (metadata.linkedLeaseId) before advancing to Lease Generation."
    );
  }

  const nowIso = new Date().toISOString();
  const definition = LEASING_WORKFLOW_DEFINITIONS[toStage];
  let automation: Record<string, unknown> = {};

  if (isLeasingApplicantStage(toStage) && applicant) {
    const nextMeta: Record<string, unknown> = {
      ...metadataOf(applicant.metadata),
      leasingWorkflowStage: toStage,
      leasingWorkflowUpdatedAt: nowIso
    };
    if (toStage === "application" && !applicant.submitted_at) {
      nextMeta["workflowSubmittedAt"] = nowIso;
    }
    const patch: Record<string, unknown> = {
      workflow_stage: toStage,
      status: workflowStageToLegacyApplicantStatus(toStage),
      metadata: nextMeta as Json,
      updated_by: input.actorUserId,
      updated_at: nowIso
    };
    if (toStage === "application") patch["submitted_at"] = applicant.submitted_at ?? nowIso;
    if (toStage === "approval") {
      // pending_review until explicitly approved via automation/helper
      patch["status"] = "pending_review";
    }

    const { error } = await (supabase as unknown as UntypedDb)
      .from("applicants")
      .update(patch)
      .eq("organization_id", input.organizationId)
      .eq("id", applicant.id)
      .is("deleted_at", null);
    if (error) throw new Error(error.message ?? "Applicant workflow update failed.");
  }

  if (isLeasingLeaseStage(toStage)) {
    if (!lease) throw new Error("Lease carrier required for this stage.");
    const nextMeta: Record<string, unknown> = {
      ...metadataOf(lease.metadata),
      leasingWorkflowStage: toStage,
      leasingWorkflowUpdatedAt: nowIso,
      ...(applicant ? { linkedApplicantId: applicant.id } : {})
    };
    if (toStage === "move_in_preparation") {
      automation = {
        moveInChecklistSeededAt: nowIso,
        checklist: ["keys", "utilities", "welcome_packet", "orientation"]
      };
      nextMeta["moveInChecklist"] = automation["checklist"];
    }
    if (toStage === "archive") {
      nextMeta["archivedViaWorkflowAt"] = nowIso;
    }

    const patch: Record<string, unknown> = {
      workflow_stage: toStage,
      status: workflowStageToLegacyLeaseStatus(toStage),
      metadata: nextMeta as Json,
      updated_by: input.actorUserId,
      updated_at: nowIso
    };
    if (toStage === "signwell_signature" || toStage === "move_in_preparation") {
      if (lease.signed_at) patch["status"] = "signed";
    }
    if (toStage === "resident" || toStage === "move_in") {
      patch["status"] = "active";
      patch["activated_at"] = nowIso;
    }
    if (toStage === "renewal") {
      patch["renewal_status"] = "pending";
    }
    if (toStage === "archive") {
      patch["archived_at"] = nowIso;
      patch["status"] = "terminated";
    }

    const { error } = await (supabase as unknown as UntypedDb)
      .from("leases")
      .update(patch)
      .eq("organization_id", input.organizationId)
      .eq("id", lease.id)
      .is("deleted_at", null);
    if (error) throw new Error(error.message ?? "Lease workflow update failed.");

    // Keep applicant pointer in sync when linked
    if (applicant) {
      const applicantMeta = {
        ...metadataOf(applicant.metadata),
        linkedLeaseId: lease.id,
        leasingWorkflowStage: toStage
      };
      await (supabase as unknown as UntypedDb)
        .from("applicants")
        .update({
          workflow_stage: isLeasingApplicantStage(toStage) ? toStage : applicantStage(applicant),
          metadata: applicantMeta as Json,
          updated_at: nowIso,
          updated_by: input.actorUserId,
          ...(toStage === "resident" || toStage === "move_in"
            ? { status: "converted_to_resident", converted_at: nowIso }
            : {}),
          ...(toStage === "lease_generation" ||
          toStage === "signwell_signature" ||
          toStage === "move_in_preparation"
            ? { status: "approved", approved_at: applicant.approved_at ?? nowIso }
            : {})
        })
        .eq("organization_id", input.organizationId)
        .eq("id", applicant.id);
    }
  }

  await writeLeasingWorkflowEvent({
    organizationId: input.organizationId,
    fromStage: effectiveFrom,
    toStage,
    actorUserId: input.actorUserId,
    reason: input.reason ?? null,
    automation,
    applicantId: applicant?.id ?? null,
    leaseId: lease?.id ?? null,
    propertyId: lease?.property_id ?? applicant?.property_id ?? null,
    payload: { label: definition.label },
    supabase
  });

  const href = lease
    ? `/leases/${lease.id}`
    : applicant
      ? `/applicants/${applicant.id}`
      : "/leases";

  await emitAndNotify({
    organizationId: input.organizationId,
    actorUserId: input.actorUserId,
    fromStage: effectiveFrom,
    toStage,
    href,
    subjectType: lease && isLeasingLeaseStage(toStage) ? "lease" : "applicant",
    subjectId: (lease && isLeasingLeaseStage(toStage) ? lease.id : applicant?.id) as string,
    propertyId: lease?.property_id ?? applicant?.property_id ?? null,
    summary: `${effectiveFrom} → ${toStage}`,
    supabase
  });

  return {
    fromStage: effectiveFrom,
    toStage,
    applicantId: applicant?.id ?? null,
    leaseId: lease?.id ?? null,
    automation
  };
}

/**
 * Approval automation — generate lease stage, notify, seed move-in checklist path.
 * Requires applicant approved + linked draft lease (ARCH-001: reuse createLease).
 */
export async function runApprovalToLeaseAutomation(input: {
  organizationId: string;
  applicantId: string;
  actorUserId: string;
  leaseId: string;
  client?: SupabaseClientType;
}): Promise<void> {
  const supabase = privilegedClient(input.client ?? (await createAuthServerComponentClient()));
  const applicant = await loadApplicant(input.organizationId, input.applicantId, supabase);
  if (!applicant) throw new Error("Applicant not found.");

  const nowIso = new Date().toISOString();
  const meta = {
    ...metadataOf(applicant.metadata),
    linkedLeaseId: input.leaseId,
    screeningComplete: true
  };

  await (supabase as unknown as UntypedDb)
    .from("applicants")
    .update({
      status: "approved",
      approved_at: applicant.approved_at ?? nowIso,
      workflow_stage: "approval",
      metadata: meta as Json,
      updated_at: nowIso,
      updated_by: input.actorUserId
    })
    .eq("organization_id", input.organizationId)
    .eq("id", input.applicantId);

  await (supabase as unknown as UntypedDb)
    .from("leases")
    .update({
      workflow_stage: "lease_generation",
      status: "draft",
      metadata: {
        ...metadataOf((await loadLease(input.organizationId, input.leaseId, supabase))?.metadata ?? null),
        linkedApplicantId: input.applicantId
      } as Json,
      updated_at: nowIso,
      updated_by: input.actorUserId
    })
    .eq("organization_id", input.organizationId)
    .eq("id", input.leaseId);

  await transitionLeasingWorkflow(
    {
      organizationId: input.organizationId,
      actorUserId: input.actorUserId,
      applicantId: input.applicantId,
      leaseId: input.leaseId,
      toStage: "lease_generation",
      reason: "approval_automation",
      force: true
    },
    supabase
  );

  await transitionLeasingWorkflow(
    {
      organizationId: input.organizationId,
      actorUserId: input.actorUserId,
      applicantId: input.applicantId,
      leaseId: input.leaseId,
      toStage: "signwell_signature",
      reason: "approval_automation_queue_signwell",
      force: true
    },
    supabase
  );
}

/** SignWell completion → move-in preparation (certified signature path only). */
export async function advanceLeasingAfterSignWell(input: {
  organizationId: string;
  leaseId: string;
  actorUserId: string;
  client?: SupabaseClientType;
}): Promise<void> {
  const supabase = privilegedClient(input.client ?? (await createAuthServerComponentClient()));
  const lease = await loadLease(input.organizationId, input.leaseId, supabase);
  if (!lease) return;
  const stage = leaseStage(lease);
  if (stage !== "signwell_signature" && stage !== "lease_generation") return;

  if (stage === "lease_generation") {
    await transitionLeasingWorkflow(
      {
        organizationId: input.organizationId,
        actorUserId: input.actorUserId,
        leaseId: input.leaseId,
        applicantId: linkedApplicantId(metadataOf(lease.metadata)),
        toStage: "signwell_signature",
        reason: "signwell_sync",
        force: true
      },
      supabase
    );
  }

  await transitionLeasingWorkflow(
    {
      organizationId: input.organizationId,
      actorUserId: input.actorUserId,
      leaseId: input.leaseId,
      applicantId: linkedApplicantId(metadataOf(lease.metadata)),
      toStage: "move_in_preparation",
      reason: "signwell_completed",
      force: true
    },
    supabase
  );
}

export async function listLeasingWorkflowEvents(
  organizationId: string,
  options: { applicantId?: string; leaseId?: string; limit?: number } = {},
  client?: SupabaseClientType
): Promise<
  Array<{
    id: string;
    fromStage: string | null;
    toStage: string;
    reason: string | null;
    createdAt: string;
    applicantId: string | null;
    leaseId: string | null;
  }>
> {
  const supabase = client ?? (await createAuthServerComponentClient());
  let query = (supabase as unknown as UntypedDb)
    .from("leasing_workflow_events")
    .select("id, from_stage, to_stage, reason, created_at, applicant_id, lease_id")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(options.limit ?? 50);
  if (options.applicantId) query = query.eq("applicant_id", options.applicantId);
  if (options.leaseId) query = query.eq("lease_id", options.leaseId);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return ((data as Array<Record<string, unknown>>) ?? []).map((row) => ({
    id: String(row["id"]),
    fromStage: (row["from_stage"] as string | null) ?? null,
    toStage: String(row["to_stage"]),
    reason: (row["reason"] as string | null) ?? null,
    createdAt: String(row["created_at"]),
    applicantId: (row["applicant_id"] as string | null) ?? null,
    leaseId: (row["lease_id"] as string | null) ?? null
  }));
}
