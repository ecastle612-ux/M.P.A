/**
 * CORE-004 Phase 4 — Resident workflow transitions (server).
 * Single carrier: tenants.workflow_stage. One resident identity for all domains.
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
  canTransitionResidentWorkflow,
  evaluateResidentAdvanceGates,
  isResidentWorkflowStage,
  legacyLifecycleStatusToWorkflowStage,
  RESIDENT_WORKFLOW_DEFINITIONS,
  workflowStageToLegacyLifecycleStatus,
  workflowStageToTenantStatus,
  type ResidentAdvanceGateContext,
  type ResidentWorkflowStage
} from "./workflow";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type UntypedDb = { from: (table: string) => any };
type SupabaseClientType = Awaited<ReturnType<typeof createAuthServerComponentClient>>;

function privilegedClient(fallback: SupabaseClientType): SupabaseClientType {
  return (createServiceRoleServerClient() as SupabaseClientType | null) ?? fallback;
}

type TenantRow = {
  id: string;
  organization_id: string;
  property_id: string | null;
  unit_id: string | null;
  status: string;
  lifecycle_status: string;
  workflow_stage?: string | null;
  email: string;
  first_name: string;
  last_name: string;
  move_in_date: string | null;
  move_out_date: string | null;
  user_id: string | null;
  metadata: Json | null;
};

function metadataOf(value: Json | null): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return { ...(value as Record<string, unknown>) };
  }
  return {};
}

function tenantStage(row: TenantRow): ResidentWorkflowStage {
  if (isResidentWorkflowStage(row.workflow_stage)) return row.workflow_stage;
  return legacyLifecycleStatusToWorkflowStage(row.lifecycle_status);
}

async function loadTenant(
  organizationId: string,
  tenantId: string,
  supabase: SupabaseClientType
): Promise<TenantRow | null> {
  const { data, error } = await (supabase as unknown as UntypedDb)
    .from("tenants")
    .select(
      "id, organization_id, property_id, unit_id, status, lifecycle_status, workflow_stage, email, first_name, last_name, move_in_date, move_out_date, user_id, metadata"
    )
    .eq("organization_id", organizationId)
    .eq("id", tenantId)
    .is("deleted_at", null)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as TenantRow | null) ?? null;
}

async function insertWorkflowEvent(input: {
  organizationId: string;
  tenantId: string;
  propertyId: string | null;
  actorUserId: string;
  fromStage: ResidentWorkflowStage | null;
  toStage: ResidentWorkflowStage;
  reason: string | null;
  automation: Record<string, unknown>;
  payload: Record<string, unknown>;
  supabase: SupabaseClientType;
}): Promise<void> {
  const { error } = await (input.supabase as unknown as UntypedDb)
    .from("resident_workflow_events")
    .insert({
      organization_id: input.organizationId,
      tenant_id: input.tenantId,
      property_id: input.propertyId,
      from_stage: input.fromStage,
      to_stage: input.toStage,
      actor_user_id: input.actorUserId,
      reason: input.reason,
      automation: input.automation as Json,
      payload: input.payload as Json
    });
  if (error) throw new Error(error.message ?? "Resident workflow audit insert failed.");
}

async function emitAndNotify(input: {
  organizationId: string;
  actorUserId: string;
  fromStage: ResidentWorkflowStage;
  toStage: ResidentWorkflowStage;
  tenantId: string;
  propertyId?: string | null;
  summary: string;
  supabase: SupabaseClientType;
}): Promise<void> {
  const definition = RESIDENT_WORKFLOW_DEFINITIONS[input.toStage];
  const href = `/tenants/${input.tenantId}`;
  try {
    await emitOpsDomainEvent(input.supabase as unknown as OpsDbClient, {
      eventType: "resident.workflow.transitioned",
      organizationId: input.organizationId,
      actor: { actor_type: "user", principal_id: input.actorUserId },
      subject: { type: "tenant", id: input.tenantId },
      ...(input.propertyId ? { propertyId: input.propertyId } : {}),
      href,
      summary: input.summary,
      payload: {
        fromStage: input.fromStage,
        toStage: input.toStage,
        notifyCategory: "residents"
      },
      visibility: "ops",
      sensitivity: "normal"
    });
  } catch {
    /* bus optional */
  }

  const notifyStages: ResidentWorkflowStage[] = [
    "approved",
    "lease_signed",
    "move_in_scheduled",
    "move_in_complete",
    "active_resident",
    "renewal",
    "move_out_scheduled",
    "former_resident"
  ];
  if (notifyStages.includes(input.toStage)) {
    try {
      await notify({
        organizationId: input.organizationId,
        recipientUserIds: [input.actorUserId],
        category: "residents",
        priority:
          input.toStage === "lease_signed" || input.toStage === "move_out_scheduled"
            ? "high"
            : "normal",
        title: `Resident: ${definition.label}`,
        body: `Workflow moved to ${definition.label}.`,
        eventKey: `resident.workflow.${input.toStage}.${input.tenantId}.${Date.now()}`,
        ...(input.propertyId ? { propertyId: input.propertyId } : {}),
        href,
        sourceEntityType: "tenant",
        sourceEntityId: input.tenantId,
        actorUserId: input.actorUserId,
        channels: { inApp: true }
      });
    } catch {
      /* optional */
    }
  }
}

function gateContextFromTenant(
  tenant: TenantRow,
  extras?: Partial<ResidentAdvanceGateContext>
): ResidentAdvanceGateContext {
  const meta = metadataOf(tenant.metadata);
  return {
    hasProperty: Boolean(tenant.property_id),
    hasUnit: Boolean(tenant.unit_id),
    leaseSigned: Boolean(meta["leaseSignedAt"] || meta["leaseSignaturePackageId"] || extras?.leaseSigned),
    moveInDateSet: Boolean(tenant.move_in_date),
    moveInAcknowledged: Boolean(
      meta["moveInAcknowledgementCompletedAt"] || meta["moveInCompletedAt"] || extras?.moveInAcknowledged
    ),
    hasOpenMaintenance: Boolean(extras?.hasOpenMaintenance),
    hasPaymentAttention: Boolean(extras?.hasPaymentAttention)
  };
}

export type TransitionResidentWorkflowInput = {
  organizationId: string;
  tenantId: string;
  actorUserId: string;
  toStage: ResidentWorkflowStage;
  reason?: string | null;
  force?: boolean;
  gates?: Partial<ResidentAdvanceGateContext>;
};

export async function transitionResidentWorkflow(
  input: TransitionResidentWorkflowInput,
  client?: SupabaseClientType
): Promise<{
  fromStage: ResidentWorkflowStage;
  toStage: ResidentWorkflowStage;
  tenantId: string;
  automation: Record<string, unknown>;
}> {
  const supabase = privilegedClient(client ?? (await createAuthServerComponentClient()));
  const tenant = await loadTenant(input.organizationId, input.tenantId, supabase);
  if (!tenant) throw new Error("Resident not found.");

  const fromStage = tenantStage(tenant);
  const toStage = input.toStage;

  if (fromStage === toStage) {
    return { fromStage, toStage, tenantId: tenant.id, automation: {} };
  }

  if (!input.force && !canTransitionResidentWorkflow(fromStage, toStage)) {
    throw new Error(
      `Transition ${fromStage} → ${toStage} is not allowed. No undocumented transitions.`
    );
  }

  const gate = input.force
    ? ({ ok: true } as const)
    : evaluateResidentAdvanceGates(toStage, gateContextFromTenant(tenant, input.gates));
  if (!gate.ok) throw new Error(gate.message);

  const nowIso = new Date().toISOString();
  const automation: Record<string, unknown> = {};
  const nextMeta: Record<string, unknown> = {
    ...metadataOf(tenant.metadata),
    residentWorkflowStage: toStage,
    residentWorkflowUpdatedAt: nowIso
  };

  if (toStage === "lease_signed") {
    automation["portalActivationQueuedAt"] = nowIso;
    automation["moveInChecklist"] = [
      "keys",
      "utilities",
      "welcome_packet",
      "orientation",
      "acknowledgement"
    ];
    nextMeta["moveInChecklist"] = automation["moveInChecklist"];
    nextMeta["portalActivationQueuedAt"] = nowIso;
    nextMeta["leaseSignedAt"] = nextMeta["leaseSignedAt"] ?? nowIso;
  }
  if (toStage === "move_in_scheduled") {
    automation["moveInScheduledAt"] = nowIso;
    nextMeta["moveInScheduledAt"] = nowIso;
  }
  if (toStage === "move_in_complete" || toStage === "active_resident") {
    nextMeta["moveInCompletedAt"] = nextMeta["moveInCompletedAt"] ?? nowIso;
    nextMeta["moveInPendingAcknowledgement"] = false;
  }
  if (toStage === "former_resident" || toStage === "archive") {
    nextMeta["formerResidentAt"] = nowIso;
  }

  const patch: Record<string, unknown> = {
    workflow_stage: toStage,
    lifecycle_status: workflowStageToLegacyLifecycleStatus(toStage),
    status: workflowStageToTenantStatus(toStage),
    metadata: nextMeta as Json,
    updated_by: input.actorUserId,
    updated_at: nowIso
  };
  if (toStage === "archive") {
    patch["archived_at"] = nowIso;
  }

  const { error } = await (supabase as unknown as UntypedDb)
    .from("tenants")
    .update(patch)
    .eq("organization_id", input.organizationId)
    .eq("id", tenant.id)
    .is("deleted_at", null);
  if (error) throw new Error(error.message ?? "Resident workflow update failed.");

  await insertWorkflowEvent({
    organizationId: input.organizationId,
    tenantId: tenant.id,
    propertyId: tenant.property_id,
    actorUserId: input.actorUserId,
    fromStage,
    toStage,
    reason: input.reason ?? null,
    automation,
    payload: { definition: RESIDENT_WORKFLOW_DEFINITIONS[toStage].label },
    supabase
  });

  await emitAndNotify({
    organizationId: input.organizationId,
    actorUserId: input.actorUserId,
    fromStage,
    toStage,
    tenantId: tenant.id,
    propertyId: tenant.property_id,
    summary: `${fromStage} → ${toStage}`,
    supabase
  });

  return { fromStage, toStage, tenantId: tenant.id, automation };
}

/**
 * SignWell lease completion → lease_signed → move_in_scheduled
 * (activate resident path, checklist, welcome/notify via transition).
 */
export async function advanceResidentAfterLeaseSigned(input: {
  organizationId: string;
  tenantId: string;
  actorUserId: string;
  leaseId?: string | null;
  client?: SupabaseClientType;
}): Promise<void> {
  const supabase = privilegedClient(input.client ?? (await createAuthServerComponentClient()));
  const tenant = await loadTenant(input.organizationId, input.tenantId, supabase);
  if (!tenant) return;

  const meta = {
    ...metadataOf(tenant.metadata),
    leaseSignedAt: new Date().toISOString(),
    ...(input.leaseId ? { linkedLeaseId: input.leaseId } : {})
  };
  await (supabase as unknown as UntypedDb)
    .from("tenants")
    .update({
      metadata: meta as Json,
      updated_at: new Date().toISOString(),
      updated_by: input.actorUserId
    })
    .eq("organization_id", input.organizationId)
    .eq("id", input.tenantId);

  const stage = tenantStage({ ...tenant, metadata: meta as Json });
  const early: ResidentWorkflowStage[] = ["applicant", "approved", "lease_signed"];
  if (!early.includes(stage) && stage !== "move_in_scheduled") return;

  if (stage === "applicant" || stage === "approved") {
    await transitionResidentWorkflow(
      {
        organizationId: input.organizationId,
        tenantId: input.tenantId,
        actorUserId: input.actorUserId,
        toStage: "lease_signed",
        reason: "signwell_lease_completed",
        force: true,
        gates: { leaseSigned: true }
      },
      supabase
    );
  }

  const after = await loadTenant(input.organizationId, input.tenantId, supabase);
  if (!after) return;
  if (tenantStage(after) === "lease_signed") {
    await transitionResidentWorkflow(
      {
        organizationId: input.organizationId,
        tenantId: input.tenantId,
        actorUserId: input.actorUserId,
        toStage: "move_in_scheduled",
        reason: "lease_signed_automation",
        force: true,
        gates: { leaseSigned: true, moveInDateSet: Boolean(after.move_in_date) }
      },
      supabase
    );
  }
}

/** Move-in acknowledgement → move_in_complete → active_resident. */
export async function advanceResidentAfterMoveInComplete(input: {
  organizationId: string;
  tenantId: string;
  actorUserId: string;
  client?: SupabaseClientType;
}): Promise<void> {
  const supabase = privilegedClient(input.client ?? (await createAuthServerComponentClient()));
  const tenant = await loadTenant(input.organizationId, input.tenantId, supabase);
  if (!tenant) return;
  const stage = tenantStage(tenant);
  if (
    stage !== "move_in_scheduled" &&
    stage !== "lease_signed" &&
    stage !== "move_in_complete"
  ) {
    return;
  }

  if (stage === "lease_signed") {
    await transitionResidentWorkflow(
      {
        organizationId: input.organizationId,
        tenantId: input.tenantId,
        actorUserId: input.actorUserId,
        toStage: "move_in_scheduled",
        reason: "move_in_ack_prep",
        force: true
      },
      supabase
    );
  }

  await transitionResidentWorkflow(
    {
      organizationId: input.organizationId,
      tenantId: input.tenantId,
      actorUserId: input.actorUserId,
      toStage: "move_in_complete",
      reason: "move_in_acknowledgement",
      force: true,
      gates: { moveInAcknowledged: true }
    },
    supabase
  );

  await transitionResidentWorkflow(
    {
      organizationId: input.organizationId,
      tenantId: input.tenantId,
      actorUserId: input.actorUserId,
      toStage: "active_resident",
      reason: "move_in_complete_automation",
      force: true
    },
    supabase
  );
}

export async function listResidentWorkflowEvents(
  organizationId: string,
  options: { tenantId?: string; limit?: number } = {},
  client?: SupabaseClientType
): Promise<
  Array<{
    id: string;
    fromStage: string | null;
    toStage: string;
    reason: string | null;
    createdAt: string;
    tenantId: string;
  }>
> {
  const supabase = client ?? (await createAuthServerComponentClient());
  let query = (supabase as unknown as UntypedDb)
    .from("resident_workflow_events")
    .select("id, from_stage, to_stage, reason, created_at, tenant_id")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(options.limit ?? 50);
  if (options.tenantId) query = query.eq("tenant_id", options.tenantId);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return ((data as Array<Record<string, unknown>>) ?? []).map((row) => ({
    id: String(row["id"]),
    fromStage: (row["from_stage"] as string | null) ?? null,
    toStage: String(row["to_stage"]),
    reason: (row["reason"] as string | null) ?? null,
    createdAt: String(row["created_at"]),
    tenantId: String(row["tenant_id"])
  }));
}
