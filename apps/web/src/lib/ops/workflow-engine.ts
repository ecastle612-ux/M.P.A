import { createServiceRoleServerClient } from "../auth/server";
import { emitOpsDomainEvent } from "./emit";
import {
  opsPriorityToNotifyPriority,
  resolveOpsPriority,
  type OpsPriority
} from "./priority-engine";
import { scheduleReminder } from "./reminder-engine";
import { createOpsTask } from "./task-engine";
import type { OpsDbClient } from "./types";
import {
  isWorkflowAdvanceEvent,
  isWorkflowTriggerEvent,
  MAINTENANCE_STANDARD_DEFINITION,
  MAINTENANCE_STANDARD_TEMPLATE_ID,
  type WorkflowTemplateDefinition,
  type WorkflowTransition
} from "./workflows/maintenance-standard";

export const WORKFLOW_CONSUMER = "workflow_orchestrator";

type DomainEventLike = {
  event_id: string;
  event_type: string;
  organization_id: string | null;
  subject: { type?: string; id?: string };
  payload: Record<string, unknown>;
  correlation_id?: string;
};

function serviceClient(): OpsDbClient {
  return createServiceRoleServerClient() as unknown as OpsDbClient;
}

async function alreadyConsumed(
  client: OpsDbClient,
  eventId: string
): Promise<boolean> {
  const { data } = await client
    .from("ops_event_consumer_receipts")
    .select("event_id")
    .eq("event_id", eventId)
    .eq("consumer_name", WORKFLOW_CONSUMER)
    .maybeSingle();
  return Boolean(data);
}

async function markConsumed(client: OpsDbClient, eventId: string): Promise<void> {
  await client.from("ops_event_consumer_receipts").upsert(
    {
      event_id: eventId,
      consumer_name: WORKFLOW_CONSUMER,
      processed_at: new Date().toISOString()
    },
    { onConflict: "event_id,consumer_name" }
  );
}

function deepLinkForWorkOrder(workOrderId: string): string {
  return `/maintenance/${workOrderId}`;
}

/** exactOptionalPropertyTypes: omit key when undefined */
function withCorrelationId(correlationId?: string): { correlationId?: string } {
  return correlationId ? { correlationId } : {};
}

function findTransition(
  definition: WorkflowTemplateDefinition,
  fromStep: string,
  eventType: string
): WorkflowTransition | undefined {
  // Prefer exact from+on; allow vendor.accepted as alias for post-assign confirmation.
  const exact = definition.transitions.find((t) => t.from === fromStep && t.on === eventType);
  if (exact) return exact;
  if (eventType === "maintenance.vendor.accepted") {
    return definition.transitions.find(
      (t) => t.from === fromStep && t.on === "maintenance.vendor.assigned"
    );
  }
  return undefined;
}

async function recordStepEvent(
  client: OpsDbClient,
  input: {
    organizationId: string;
    instanceId: string;
    stepId: string;
    action: "entered" | "exited" | "skipped";
    causationEventId: string;
    payload?: Record<string, unknown>;
  }
): Promise<void> {
  const { error } = await client.from("ops_workflow_step_events").upsert(
    {
      organization_id: input.organizationId,
      instance_id: input.instanceId,
      step_id: input.stepId,
      action: input.action,
      causation_event_id: input.causationEventId,
      payload: input.payload ?? {}
    },
    { onConflict: "instance_id,step_id,action,causation_event_id", ignoreDuplicates: true }
  );
  if (error && !/duplicate|unique/i.test(error.message)) {
    throw new Error(error.message);
  }
}

async function emitStepFact(
  client: OpsDbClient,
  input: {
    organizationId: string;
    instanceId: string;
    stepId: string;
    action: "entered" | "exited";
    eventId: string;
    correlationId?: string;
    workOrderId: string;
    priority: OpsPriority;
  }
): Promise<void> {
  await emitOpsDomainEvent(client, {
    eventType: input.action === "entered" ? "ops.workflow.step.entered" : "ops.workflow.step.exited",
    organizationId: input.organizationId,
    subject: { type: "ops_workflow_instance", id: input.instanceId },
    actor: { actor_type: "system" },
    summary: `Workflow step ${input.action}: ${input.stepId}`,
    payload: {
      summary: `Workflow step ${input.action}: ${input.stepId}`,
      instanceId: input.instanceId,
      templateId: MAINTENANCE_STANDARD_TEMPLATE_ID,
      stepId: input.stepId,
      action: input.action,
      workOrderId: input.workOrderId,
      priority: input.priority,
      href: deepLinkForWorkOrder(input.workOrderId)
    },
    correlationId: input.correlationId ?? input.eventId,
    causationId: input.eventId
  });
}

async function createStepTask(
  client: OpsDbClient,
  input: {
    organizationId: string;
    workOrderId: string;
    instanceId: string;
    stepId: string;
    title: string;
    priority: OpsPriority;
    sourceEventId: string;
    correlationId?: string;
  }
): Promise<void> {
  await createOpsTask(
    {
      organizationId: input.organizationId,
      title: input.title,
      priority: input.priority,
      eventType: "ops.workflow.step.entered",
      subjectType: "maintenance_work_order",
      subjectId: input.workOrderId,
      deepLink: deepLinkForWorkOrder(input.workOrderId),
      sourceEventId: input.sourceEventId,
      workflowInstanceId: input.instanceId,
      workflowStepId: input.stepId,
      idempotencyKey: `wf:${input.instanceId}:${input.stepId}:${input.sourceEventId}`,
      createdBy: "workflow",
      correlationId: input.correlationId ?? input.sourceEventId
    },
    client
  );
}

/**
 * Start maintenance.standard.v1 on maintenance.request.created.
 */
export async function startMaintenanceStandardWorkflow(
  client: OpsDbClient,
  input: {
    organizationId: string;
    workOrderId: string;
    eventId: string;
    correlationId?: string;
    domainPriority?: string | null;
    safetyText?: string | null;
    ownerPrincipalId?: string | null;
  }
): Promise<{ instanceId: string; created: boolean }> {
  const priority = resolveOpsPriority({
    eventType: "maintenance.request.created",
    domainPriority: input.domainPriority,
    safetyText: input.safetyText
  });

  const { data: existing } = await client
    .from("ops_workflow_instances")
    .select("instance_id")
    .eq("organization_id", input.organizationId)
    .eq("template_id", MAINTENANCE_STANDARD_TEMPLATE_ID)
    .eq("subject_type", "maintenance_work_order")
    .eq("subject_id", input.workOrderId)
    .maybeSingle();

  if (existing?.["instance_id"]) {
    return { instanceId: String(existing["instance_id"]), created: false };
  }

  const definition = MAINTENANCE_STANDARD_DEFINITION;
  const { data, error } = await client
    .from("ops_workflow_instances")
    .insert({
      organization_id: input.organizationId,
      template_id: MAINTENANCE_STANDARD_TEMPLATE_ID,
      template_version: 1,
      subject_type: "maintenance_work_order",
      subject_id: input.workOrderId,
      status: "active",
      current_step_id: definition.startStep,
      priority,
      correlation_id: input.correlationId ?? input.eventId,
      trigger_event_id: input.eventId,
      last_event_id: input.eventId
    })
    .select("instance_id")
    .single();

  if (error) {
    const { data: raced } = await client
      .from("ops_workflow_instances")
      .select("instance_id")
      .eq("organization_id", input.organizationId)
      .eq("template_id", MAINTENANCE_STANDARD_TEMPLATE_ID)
      .eq("subject_type", "maintenance_work_order")
      .eq("subject_id", input.workOrderId)
      .maybeSingle();
    if (raced?.["instance_id"]) {
      return { instanceId: String(raced["instance_id"]), created: false };
    }
    throw new Error(error.message ?? "Failed to start workflow");
  }

  const instanceId = String(data["instance_id"]);

  await recordStepEvent(client, {
    organizationId: input.organizationId,
    instanceId,
    stepId: definition.startStep,
    action: "entered",
    causationEventId: input.eventId
  });

  await emitStepFact(client, {
    organizationId: input.organizationId,
    instanceId,
    stepId: definition.startStep,
    action: "entered",
    eventId: input.eventId,
    ...withCorrelationId(input.correlationId),
    workOrderId: input.workOrderId,
    priority
  });

  if (definition.startTask) {
    await createStepTask(client, {
      organizationId: input.organizationId,
      workOrderId: input.workOrderId,
      instanceId,
      stepId: definition.startStep,
      title: definition.startTask,
      priority,
      sourceEventId: input.eventId,
      ...withCorrelationId(input.correlationId)
    });
  }

  // SLA-style reminder via Slice B (pilot timer) — 24h after open if still assignable.
  try {
    const fireAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    await scheduleReminder({
      organizationId: input.organizationId,
      reminderType: "absolute",
      subjectType: "maintenance_work_order",
      subjectId: input.workOrderId,
      fireAt,
      idempotencyKey: `wf-sla-assign:${instanceId}`,
      action: "emit_and_notify",
      eventType: "ops.reminder.fired",
      recipientPrincipalId: input.ownerPrincipalId ?? null,
      notifyCategory: "maintenance",
      notifyPriority: opsPriorityToNotifyPriority(priority),
      title: "Work order still awaiting vendor",
      body: "Maintenance workflow pilot: assign a vendor if still open.",
      href: deepLinkForWorkOrder(input.workOrderId),
      payload: { instanceId, stepId: definition.startStep }
    });
  } catch {
    // Reminder schedule is best-effort for pilot; do not fail workflow start.
  }

  await emitOpsDomainEvent(client, {
    eventType: "ops.workflow.started",
    organizationId: input.organizationId,
    subject: { type: "ops_workflow_instance", id: instanceId },
    actor: { actor_type: "system" },
    summary: "Maintenance workflow started",
    payload: {
      summary: "Maintenance workflow started",
      instanceId,
      templateId: MAINTENANCE_STANDARD_TEMPLATE_ID,
      workOrderId: input.workOrderId,
      priority,
      href: deepLinkForWorkOrder(input.workOrderId)
    },
    correlationId: input.correlationId ?? input.eventId,
    causationId: input.eventId
  });

  return { instanceId, created: true };
}

/**
 * Advance pilot workflow on vendor / WO catalog events.
 */
export async function advanceMaintenanceStandardWorkflow(
  client: OpsDbClient,
  input: {
    organizationId: string;
    workOrderId: string;
    eventType: string;
    eventId: string;
    correlationId?: string;
  }
): Promise<"advanced" | "noop" | "completed"> {
  const { data: instance } = await client
    .from("ops_workflow_instances")
    .select("*")
    .eq("organization_id", input.organizationId)
    .eq("template_id", MAINTENANCE_STANDARD_TEMPLATE_ID)
    .eq("subject_type", "maintenance_work_order")
    .eq("subject_id", input.workOrderId)
    .eq("status", "active")
    .maybeSingle();

  if (!instance) return "noop";

  const definition = MAINTENANCE_STANDARD_DEFINITION;
  const currentStep = String(instance["current_step_id"]);
  const priority = (instance["priority"] as OpsPriority) ?? "medium";
  const instanceId = String(instance["instance_id"]);
  const transition = findTransition(definition, currentStep, input.eventType);
  if (!transition) return "noop";

  await recordStepEvent(client, {
    organizationId: input.organizationId,
    instanceId,
    stepId: currentStep,
    action: "exited",
    causationEventId: input.eventId,
    payload: { to: transition.to, on: input.eventType }
  });

  await emitStepFact(client, {
    organizationId: input.organizationId,
    instanceId,
    stepId: currentStep,
    action: "exited",
    eventId: input.eventId,
    ...withCorrelationId(input.correlationId),
    workOrderId: input.workOrderId,
    priority
  });

  const terminal = Boolean(transition.terminal);
  const now = new Date().toISOString();
  const { error: updateError } = await client
    .from("ops_workflow_instances")
    .update({
      current_step_id: transition.to,
      last_event_id: input.eventId,
      updated_at: now,
      ...(terminal
        ? { status: "completed", completed_at: now }
        : {})
    })
    .eq("instance_id", instanceId)
    .eq("organization_id", input.organizationId)
    .eq("status", "active");

  if (updateError) throw new Error(updateError.message);

  await recordStepEvent(client, {
    organizationId: input.organizationId,
    instanceId,
    stepId: transition.to,
    action: "entered",
    causationEventId: input.eventId
  });

  await emitStepFact(client, {
    organizationId: input.organizationId,
    instanceId,
    stepId: transition.to,
    action: "entered",
    eventId: input.eventId,
    ...withCorrelationId(input.correlationId),
    workOrderId: input.workOrderId,
    priority
  });

  if (transition.task) {
    await createStepTask(client, {
      organizationId: input.organizationId,
      workOrderId: input.workOrderId,
      instanceId,
      stepId: transition.to,
      title: transition.task,
      priority,
      sourceEventId: input.eventId,
      ...withCorrelationId(input.correlationId)
    });
  }

  if (terminal) {
    await emitOpsDomainEvent(client, {
      eventType: "ops.workflow.completed",
      organizationId: input.organizationId,
      subject: { type: "ops_workflow_instance", id: instanceId },
      actor: { actor_type: "system" },
      summary: "Maintenance workflow completed",
      payload: {
        summary: "Maintenance workflow completed",
        instanceId,
        templateId: MAINTENANCE_STANDARD_TEMPLATE_ID,
        workOrderId: input.workOrderId,
        priority,
        href: deepLinkForWorkOrder(input.workOrderId)
      },
      correlationId: input.correlationId ?? input.eventId,
      causationId: input.eventId
    });
    return "completed";
  }

  return "advanced";
}

/**
 * Dispatcher consumer — start/advance maintenance pilot from catalog events.
 */
export async function consumeEventForWorkflowOrchestration(
  client: OpsDbClient,
  row: DomainEventLike
): Promise<"processed" | "skipped"> {
  if (!row.organization_id) return "skipped";
  if (await alreadyConsumed(client, row.event_id)) return "skipped";

  const subjectType = row.subject?.type;
  const subjectId = row.subject?.id;
  if (subjectType !== "maintenance_work_order" || !subjectId) {
    await markConsumed(client, row.event_id);
    return "skipped";
  }

  const safetyText = [
    typeof row.payload["summary"] === "string" ? row.payload["summary"] : "",
    typeof row.payload["title"] === "string" ? row.payload["title"] : ""
  ]
    .filter(Boolean)
    .join(" ");

  if (isWorkflowTriggerEvent(row.event_type)) {
    await startMaintenanceStandardWorkflow(client, {
      organizationId: row.organization_id,
      workOrderId: subjectId,
      eventId: row.event_id,
      ...withCorrelationId(row.correlation_id),
      domainPriority:
        typeof row.payload["priority"] === "string" ? row.payload["priority"] : null,
      safetyText,
      ownerPrincipalId:
        typeof row.payload["ownerPrincipalId"] === "string"
          ? row.payload["ownerPrincipalId"]
          : typeof row.payload["createdBy"] === "string"
            ? row.payload["createdBy"]
            : null
    });
  } else if (isWorkflowAdvanceEvent(row.event_type)) {
    await advanceMaintenanceStandardWorkflow(client, {
      organizationId: row.organization_id,
      workOrderId: subjectId,
      eventType: row.event_type,
      eventId: row.event_id,
      ...withCorrelationId(row.correlation_id)
    });
  }

  await markConsumed(client, row.event_id);
  return "processed";
}

/** Convenience for API / tests using service role. */
export async function consumeEventForWorkflowOrchestrationDefault(
  row: DomainEventLike
): Promise<"processed" | "skipped"> {
  return consumeEventForWorkflowOrchestration(serviceClient(), row);
}
