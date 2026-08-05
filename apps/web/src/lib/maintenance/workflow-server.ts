/**
 * CORE-004 Phase 2 — Maintenance workflow transitions (server).
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
  canTransitionMaintenanceWorkflow,
  evaluateMaintenanceAdvanceGates,
  isMaintenanceWorkflowStage,
  MAINTENANCE_WORKFLOW_DEFINITIONS,
  workflowStageToLegacyStatus,
  type MaintenanceWorkflowStage
} from "./workflow";
import type { WorkOrderRecord } from "./contracts";
import { legacyStatusToWorkflowStage } from "./workflow";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type UntypedDb = { from: (table: string) => any };
type SupabaseClientType = Awaited<ReturnType<typeof createAuthServerComponentClient>>;

function privilegedClient(fallback: SupabaseClientType): SupabaseClientType {
  return (createServiceRoleServerClient() as SupabaseClientType | null) ?? fallback;
}

const WO_SELECT =
  "id, organization_id, property_id, unit_id, tenant_id, work_order_number, title, description, category, priority, status, workflow_stage, due_date, assigned_to_user_id, vendor_id, current_vendor_assignment_id, internal_notes, tenant_notes, photo_placeholder, document_placeholder, recurring_maintenance_placeholder, preventive_maintenance_placeholder, completed_at, metadata, created_by, updated_by, created_at, updated_at, archived_at, deleted_at";

type WorkOrderRow = {
  id: string;
  organization_id: string;
  property_id: string;
  unit_id: string | null;
  tenant_id: string | null;
  work_order_number: string;
  title: string;
  description: string | null;
  category: WorkOrderRecord["category"];
  priority: WorkOrderRecord["priority"];
  status: WorkOrderRecord["status"];
  workflow_stage?: string | null;
  due_date: string | null;
  assigned_to_user_id: string | null;
  vendor_id: string | null;
  current_vendor_assignment_id: string | null;
  internal_notes: string | null;
  tenant_notes: string | null;
  photo_placeholder: string | null;
  document_placeholder: string | null;
  recurring_maintenance_placeholder: string | null;
  preventive_maintenance_placeholder: string | null;
  completed_at: string | null;
  metadata: Json | null;
  created_by: string;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
  deleted_at: string | null;
};

function toWorkOrderRecord(row: WorkOrderRow): WorkOrderRecord {
  const workflowStage = isMaintenanceWorkflowStage(row.workflow_stage)
    ? row.workflow_stage
    : legacyStatusToWorkflowStage(row.status);
  return {
    id: row.id,
    organizationId: row.organization_id,
    propertyId: row.property_id,
    unitId: row.unit_id,
    tenantId: row.tenant_id,
    workOrderNumber: row.work_order_number,
    title: row.title,
    description: row.description,
    category: row.category,
    priority: row.priority,
    status: row.status,
    workflowStage,
    dueDate: row.due_date,
    assignedToUserId: row.assigned_to_user_id,
    vendorId: row.vendor_id,
    currentVendorAssignmentId: row.current_vendor_assignment_id,
    internalNotes: row.internal_notes,
    tenantNotes: row.tenant_notes,
    photoPlaceholder: row.photo_placeholder,
    documentPlaceholder: row.document_placeholder,
    recurringMaintenancePlaceholder: row.recurring_maintenance_placeholder,
    preventiveMaintenancePlaceholder: row.preventive_maintenance_placeholder,
    completedAt: row.completed_at,
    metadata:
      row.metadata && typeof row.metadata === "object" && !Array.isArray(row.metadata)
        ? (row.metadata as Record<string, unknown>)
        : {},
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    archivedAt: row.archived_at,
    deletedAt: row.deleted_at
  };
}

async function loadWorkOrder(
  organizationId: string,
  workOrderId: string,
  supabase: SupabaseClientType
): Promise<WorkOrderRecord | null> {
  const { data, error } = await (supabase as unknown as UntypedDb)
    .from("maintenance_work_orders")
    .select(WO_SELECT)
    .eq("organization_id", organizationId)
    .eq("id", workOrderId)
    .is("deleted_at", null)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? toWorkOrderRecord(data as WorkOrderRow) : null;
}

export type TransitionMaintenanceWorkflowInput = {
  organizationId: string;
  workOrderId: string;
  actorUserId: string;
  toStage: MaintenanceWorkflowStage;
  reason?: string | null;
  force?: boolean;
};

export async function transitionMaintenanceWorkflow(
  input: TransitionMaintenanceWorkflowInput,
  client?: SupabaseClientType
): Promise<{
  workOrder: WorkOrderRecord;
  fromStage: MaintenanceWorkflowStage;
  toStage: MaintenanceWorkflowStage;
  automation: Record<string, unknown>;
}> {
  const supabase = client ?? (await createAuthServerComponentClient());
  const workOrder = await loadWorkOrder(input.organizationId, input.workOrderId, supabase);
  if (!workOrder) throw new Error("Work order not found.");

  const fromStage = workOrder.workflowStage;
  const toStage = input.toStage;
  if (fromStage === toStage) {
    return { workOrder, fromStage, toStage, automation: {} };
  }
  if (!canTransitionMaintenanceWorkflow(fromStage, toStage)) {
    throw new Error(
      `Transition ${fromStage} → ${toStage} is not allowed. No undocumented transitions.`
    );
  }

  const gate = input.force
    ? ({ ok: true } as const)
    : evaluateMaintenanceAdvanceGates(toStage, {
        hasAssignee: Boolean(workOrder.assignedToUserId),
        hasDueDate: Boolean(workOrder.dueDate),
        hasVendor: Boolean(workOrder.vendorId),
        hasResident: Boolean(workOrder.tenantId),
        prioritySet: Boolean(workOrder.priority)
      });
  if (!gate.ok) throw new Error(gate.message);

  const nowIso = new Date().toISOString();
  const definition = MAINTENANCE_WORKFLOW_DEFINITIONS[toStage];
  const legacyStatus = workflowStageToLegacyStatus(toStage);
  const nextMetadata: Record<string, unknown> = { ...workOrder.metadata };
  let automation: Record<string, unknown> = {};

  if (toStage === "analytics") {
    automation = {
      completedAt: workOrder.completedAt ?? nowIso,
      outcomeCapturedAt: nowIso,
      priority: workOrder.priority,
      category: workOrder.category
    };
    nextMetadata["workflowAnalytics"] = automation;
  }
  if (toStage === "completion") {
    nextMetadata["workflowCompletedAt"] = nowIso;
  }

  const patch: Record<string, unknown> = {
    workflow_stage: toStage,
    status: legacyStatus,
    metadata: nextMetadata as Json,
    updated_by: input.actorUserId,
    updated_at: nowIso
  };
  if (toStage === "completion" || toStage === "analytics") {
    patch["completed_at"] = workOrder.completedAt ?? nowIso;
    patch["status"] = "completed";
  }

  const { data, error } = await (supabase as unknown as UntypedDb)
    .from("maintenance_work_orders")
    .update(patch)
    .eq("organization_id", input.organizationId)
    .eq("id", input.workOrderId)
    .is("deleted_at", null)
    .select(WO_SELECT)
    .maybeSingle();
  if (error || !data) {
    throw new Error(error?.message ?? "Workflow transition failed.");
  }

  const { error: auditError } = await (supabase as unknown as UntypedDb)
    .from("maintenance_workflow_events")
    .insert({
      organization_id: input.organizationId,
      work_order_id: input.workOrderId,
      property_id: workOrder.propertyId,
      from_stage: fromStage,
      to_stage: toStage,
      actor_user_id: input.actorUserId,
      reason: input.reason ?? null,
      automation: automation as Json,
      payload: { label: definition.label, legacyStatus } as Json
    });
  if (auditError) {
    throw new Error(auditError.message ?? "Workflow audit insert failed.");
  }

  try {
    await emitOpsDomainEvent(supabase as unknown as OpsDbClient, {
      eventType: "maintenance.workflow.transitioned",
      organizationId: input.organizationId,
      actor: { actor_type: "user", principal_id: input.actorUserId },
      subject: { type: "maintenance_work_order", id: input.workOrderId },
      propertyId: workOrder.propertyId,
      href: `/maintenance/${input.workOrderId}`,
      summary: `${workOrder.workOrderNumber}: ${fromStage} → ${toStage}`,
      payload: {
        fromStage,
        toStage,
        workOrderNumber: workOrder.workOrderNumber,
        notifyCategory: "maintenance"
      },
      visibility: "ops",
      sensitivity: "normal"
    });
  } catch {
    /* bus optional */
  }

  if (toStage === "completion") {
    try {
      await emitOpsDomainEvent(supabase as unknown as OpsDbClient, {
        eventType: "maintenance.work.completed",
        organizationId: input.organizationId,
        actor: { actor_type: "user", principal_id: input.actorUserId },
        subject: { type: "maintenance_work_order", id: input.workOrderId },
        propertyId: workOrder.propertyId,
        href: `/maintenance/${input.workOrderId}`,
        summary: `${workOrder.workOrderNumber} completed`,
        payload: { workOrderNumber: workOrder.workOrderNumber },
        visibility: "ops",
        sensitivity: "normal"
      });
    } catch {
      /* optional */
    }
  }

  const notifyStages: MaintenanceWorkflowStage[] = [
    "dispatch",
    "field_execution",
    "vendor_escalation",
    "quality_review",
    "resident_confirmation",
    "completion"
  ];
  if (notifyStages.includes(toStage)) {
    try {
      await notify({
        organizationId: input.organizationId,
        recipientUserIds: [input.actorUserId],
        category: "maintenance",
        priority: workOrder.priority === "emergency" ? "emergency" : "normal",
        title: `${workOrder.workOrderNumber}: ${definition.label}`,
        body: `Workflow moved to ${definition.label}.`,
        eventKey: `maintenance.workflow.${toStage}.${input.workOrderId}.${nowIso}`,
        propertyId: workOrder.propertyId,
        href: `/maintenance/${input.workOrderId}`,
        sourceEntityType: "maintenance_work_order",
        sourceEntityId: input.workOrderId,
        actorUserId: input.actorUserId,
        channels: { inApp: true }
      });
    } catch {
      /* optional */
    }
  }

  const updated = await loadWorkOrder(input.organizationId, input.workOrderId, supabase);
  if (!updated) throw new Error("Work order missing after transition.");
  return { workOrder: updated, fromStage, toStage, automation };
}

/** Emergency automation: advance request → triage quickly and notify. */
export async function runEmergencyIntakeAutomation(input: {
  organizationId: string;
  workOrderId: string;
  actorUserId: string;
  client?: SupabaseClientType;
}): Promise<void> {
  const supabase = privilegedClient(input.client ?? (await createAuthServerComponentClient()));
  const steps: MaintenanceWorkflowStage[] = ["intake", "triage", "priority_classification"];
  for (const toStage of steps) {
    await transitionMaintenanceWorkflow(
      {
        organizationId: input.organizationId,
        workOrderId: input.workOrderId,
        actorUserId: input.actorUserId,
        toStage,
        reason: "emergency_automation",
        force: true
      },
      supabase
    );
  }
}

/**
 * Resident confirmation path — tenants have create/read, not update.
 * Verified ownership + service-role write keeps one canonical state machine.
 */
export async function confirmMaintenanceByResident(input: {
  organizationId: string;
  workOrderId: string;
  actorUserId: string;
  tenantId: string;
  feedback?: string | null;
  rating?: number | null;
  client?: SupabaseClientType;
}): Promise<{
  workOrder: WorkOrderRecord;
  fromStage: MaintenanceWorkflowStage;
  toStage: MaintenanceWorkflowStage;
}> {
  const userClient = input.client ?? (await createAuthServerComponentClient());
  const workOrder = await loadWorkOrder(input.organizationId, input.workOrderId, userClient);
  if (!workOrder) throw new Error("Work order not found.");
  if (!workOrder.tenantId || workOrder.tenantId !== input.tenantId) {
    throw new Error("Only the linked resident can confirm this work order.");
  }
  if (workOrder.workflowStage !== "resident_confirmation") {
    throw new Error("Work order is not awaiting resident confirmation.");
  }

  const supabase = privilegedClient(userClient);
  const feedback = input.feedback?.trim() || null;
  const rating =
    typeof input.rating === "number" && input.rating >= 1 && input.rating <= 5
      ? Math.round(input.rating)
      : null;

  const nextMetadata: Record<string, unknown> = {
    ...workOrder.metadata,
    residentConfirmation: {
      confirmedAt: new Date().toISOString(),
      confirmedByUserId: input.actorUserId,
      feedback,
      rating
    }
  };

  const { error: metaError } = await (supabase as unknown as UntypedDb)
    .from("maintenance_work_orders")
    .update({
      metadata: nextMetadata as Json,
      updated_by: input.actorUserId,
      updated_at: new Date().toISOString()
    })
    .eq("organization_id", input.organizationId)
    .eq("id", input.workOrderId)
    .is("deleted_at", null);
  if (metaError) throw new Error(metaError.message);

  const result = await transitionMaintenanceWorkflow(
    {
      organizationId: input.organizationId,
      workOrderId: input.workOrderId,
      actorUserId: input.actorUserId,
      toStage: "completion",
      reason: feedback ? `resident_confirmed: ${feedback}` : "resident_confirmed"
    },
    supabase
  );
  return {
    workOrder: result.workOrder,
    fromStage: result.fromStage,
    toStage: result.toStage
  };
}

export async function listMaintenanceWorkflowEvents(
  organizationId: string,
  workOrderId: string,
  client?: SupabaseClientType
): Promise<
  Array<{
    id: string;
    fromStage: MaintenanceWorkflowStage | null;
    toStage: MaintenanceWorkflowStage;
    reason: string | null;
    createdAt: string;
  }>
> {
  const supabase = client ?? (await createAuthServerComponentClient());
  const { data, error } = await (supabase as unknown as UntypedDb)
    .from("maintenance_workflow_events")
    .select("id, from_stage, to_stage, reason, created_at")
    .eq("organization_id", organizationId)
    .eq("work_order_id", workOrderId)
    .order("created_at", { ascending: false })
    .limit(40);
  if (error) throw new Error(error.message);
  return ((data ?? []) as Array<Record<string, unknown>>).map((row) => ({
    id: String(row["id"]),
    fromStage: isMaintenanceWorkflowStage(row["from_stage"]) ? row["from_stage"] : null,
    toStage: isMaintenanceWorkflowStage(row["to_stage"]) ? row["to_stage"] : "request",
    reason: (row["reason"] as string | null) ?? null,
    createdAt: String(row["created_at"])
  }));
}
