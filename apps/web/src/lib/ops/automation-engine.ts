/**
 * OPS-001 Slice D — Automation Engine.
 * Retry-safe, idempotent playbook fires; command-API actions only; org-isolated.
 * Schema: ops_automation_rules / ops_automation_fires (migration 20260726210000).
 */

import { createServiceRoleServerClient } from "../auth/server";
import { createAiRecommendation } from "./ai-director";
import { emitOpsDomainEvent } from "./emit";
import { deliverViaNotificationCenter } from "./notification-center";
import { scheduleReminder } from "./reminder-engine";
import { createOpsTask } from "./task-engine";
import type { OpsDbClient } from "./types";

export const AUTOMATION_ENGINE_CONSUMER = "automation_engine";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type AutomationAction = Record<string, unknown> & { type: string };

export type AutomationRuleRow = {
  rule_id: string;
  organization_id: string | null;
  template_key: string | null;
  name: string;
  trigger_kind: string;
  trigger_event_type: string | null;
  conditions: Record<string, unknown>;
  actions: AutomationAction[];
  human_gate: boolean;
  priority: number;
  enabled: boolean;
  max_depth: number;
};

type DomainEventLike = {
  event_id: string;
  event_type: string;
  organization_id: string | null;
  subject: { type?: string; id?: string };
  payload: Record<string, unknown>;
  correlation_id?: string;
  causation_id?: string | null;
};

function serviceClient(): OpsDbClient {
  return createServiceRoleServerClient() as unknown as OpsDbClient;
}

function asUuidOrEvent(id: string | undefined, eventId: string): string {
  if (id && UUID_RE.test(id)) return id;
  return eventId;
}

function matchesConditions(
  conditions: Record<string, unknown>,
  row: DomainEventLike
): boolean {
  for (const [key, expected] of Object.entries(conditions ?? {})) {
    if (key === "subjectType") {
      if (row.subject?.type !== expected) return false;
      continue;
    }
    if (row.payload[key] !== expected) return false;
  }
  return true;
}

async function resolveStaffRecipients(
  client: OpsDbClient,
  organizationId: string
): Promise<string[]> {
  const { data } = await client
    .from("organization_memberships")
    .select("user_id, roles")
    .eq("organization_id", organizationId)
    .eq("status", "active");

  return [
    ...new Set(
      ((data ?? []) as Array<{ user_id: string; roles: string[] | null }>)
        .filter((row) => {
          const roles = row.roles ?? [];
          return (
            roles.includes("property_manager") ||
            roles.includes("org_admin") ||
            roles.includes("organization_admin")
          );
        })
        .map((row) => row.user_id)
    )
  ];
}

async function loadMatchingRules(
  client: OpsDbClient,
  organizationId: string,
  eventType: string
): Promise<AutomationRuleRow[]> {
  const { data, error } = await client
    .from("ops_automation_rules")
    .select("*")
    .eq("enabled", true)
    .eq("trigger_kind", "event")
    .or(`organization_id.eq.${organizationId},organization_id.is.null`)
    .order("priority", { ascending: true });

  if (error) throw new Error(error.message);

  return ((data ?? []) as AutomationRuleRow[]).filter(
    (rule) =>
      rule.trigger_event_type === eventType || rule.trigger_event_type === "*"
  );
}

async function alreadyFired(
  client: OpsDbClient,
  ruleId: string,
  idempotencyKey: string
): Promise<boolean> {
  const { data } = await client
    .from("ops_automation_fires")
    .select("fire_id")
    .eq("rule_id", ruleId)
    .eq("idempotency_key", idempotencyKey)
    .maybeSingle();
  return Boolean(data);
}

async function recordFire(
  client: OpsDbClient,
  input: {
    ruleId: string;
    organizationId: string;
    eventId: string;
    idempotencyKey: string;
    status: "succeeded" | "failed" | "skipped" | "awaiting_approval";
    depth?: number;
    result?: Record<string, unknown>;
    errorMessage?: string | null;
  }
): Promise<void> {
  const now = new Date().toISOString();
  const { error } = await client.from("ops_automation_fires").insert({
    rule_id: input.ruleId,
    organization_id: input.organizationId,
    event_id: input.eventId,
    idempotency_key: input.idempotencyKey,
    status: input.status,
    depth: input.depth ?? 0,
    result: input.result ?? {},
    error_message: input.errorMessage ?? null,
    started_at: now,
    completed_at: now
  });

  if (error && !/duplicate|unique/i.test(error.message)) {
    throw new Error(error.message);
  }
}

function actionType(action: AutomationAction): string {
  return String(action.type ?? "").toLowerCase();
}

async function executeAction(
  client: OpsDbClient,
  rule: AutomationRuleRow,
  row: DomainEventLike,
  action: AutomationAction,
  index: number
): Promise<Record<string, unknown>> {
  const organizationId = row.organization_id!;
  const subjectType = row.subject?.type ?? "unknown";
  const subjectId = asUuidOrEvent(row.subject?.id, row.event_id);
  const deepLink =
    subjectType === "maintenance_work_order"
      ? `/maintenance/${subjectId}`
      : subjectType === "lease"
        ? `/leases/${subjectId}`
        : null;
  const type = actionType(action);

  if (type === "notify") {
    const recipients = await resolveStaffRecipients(client, organizationId);
    const title = String(action["title"] ?? rule.name);
    const body = String(action["body"] ?? title);
    const priority =
      action["priority"] === "emergency" ||
      action["priority"] === "high" ||
      action["priority"] === "normal" ||
      action["priority"] === "low"
        ? (action["priority"] as "emergency" | "high" | "normal" | "low")
        : "high";
    const categoryRaw =
      typeof action["category"] === "string" ? action["category"] : "system";
    const categoryMap: Record<string, string> = {
      leasing: "leases",
      lease: "leases",
      operations: "system",
      billing: "financial"
    };
    const category = (categoryMap[categoryRaw] ?? categoryRaw) as
      | "system"
      | "maintenance"
      | "leases"
      | "financial"
      | "ai_operations"
      | "emergency";

    const result = await deliverViaNotificationCenter(
      {
        organizationId,
        recipientUserIds: recipients,
        category,
        priority,
        title,
        body,
        eventKey: `automation:${rule.rule_id}:${row.event_id}:${index}`,
        sourceEntityType: "ops_automation_rule",
        sourceEntityId: rule.rule_id,
        sourceEventId: row.event_id,
        href: deepLink,
        channels: { inApp: true }
      },
      client
    );
    return { deliveredCount: result.deliveredCount, skipped: result.skipped };
  }

  if (type === "task.create" || type === "create_task") {
    const title = String(action["title"] ?? `Automation: ${rule.name}`);
    const priority =
      typeof action["priority"] === "string" ? action["priority"] : "high";
    const task = await createOpsTask(
      {
        organizationId,
        title,
        priority,
        subjectType,
        subjectId,
        deepLink,
        idempotencyKey: `auto:${rule.rule_id}:${row.event_id}:task:${index}`,
        createdBy: "automation",
        sourceEventId: row.event_id,
        correlationId: row.correlation_id ?? row.event_id,
        eventType: row.event_type
      },
      client
    );
    return { taskId: task.task.taskId, created: task.created };
  }

  if (type === "reminder.schedule" || type === "schedule_reminder") {
    const dueInHours =
      typeof action["dueInHours"] === "number" ? action["dueInHours"] : 24;
    const fireAt = new Date(Date.now() + dueInHours * 3600_000).toISOString();
    const reminder = await scheduleReminder(
      {
        organizationId,
        reminderType: "absolute",
        subjectType,
        subjectId,
        fireAt,
        title: String(action["title"] ?? rule.name),
        href: deepLink,
        idempotencyKey: `auto:${rule.rule_id}:${row.event_id}:reminder:${index}`,
        notifyCategory: "system",
        notifyPriority: "high",
        payload: { ruleId: rule.rule_id, sourceEventId: row.event_id }
      },
      client
    );
    return { reminderId: reminder.reminderId, created: reminder.created };
  }

  if (type === "ai.request" || type === "ai_request") {
    const situationKey = String(
      action["situation"] ?? action["situationKey"] ?? rule.template_key ?? rule.name
    );
    const actionClassRaw = String(action["action_class"] ?? "recommend");
    const actionClass =
      actionClassRaw === "draft" ||
      actionClassRaw === "escalate" ||
      actionClassRaw === "reassign" ||
      actionClassRaw === "alert" ||
      actionClassRaw === "create_task" ||
      actionClassRaw === "outbound_message" ||
      actionClassRaw === "label"
        ? actionClassRaw
        : "recommend";

    const rec = await createAiRecommendation(
      {
        organizationId,
        sourceEventId: row.event_id,
        situationKey,
        actionClass,
        title: String(action["title"] ?? `AI: ${situationKey}`),
        summary: String(
          action["summary"] ?? `Automation ${rule.name} requested AI handling.`
        ),
        confidence: typeof action["confidence"] === "number" ? action["confidence"] : 0.75,
        subjectType,
        subjectId,
        proposedAction: {
          type: actionClass,
          action: situationKey,
          fromAutomation: true,
          ruleId: rule.rule_id
        },
        deepLink,
        idempotencyKey: `auto:${rule.rule_id}:${row.event_id}:ai:${index}`,
        correlationId: row.correlation_id ?? row.event_id,
        forceHumanGate:
          action["requires_human_gate"] === true ||
          actionClass === "draft" ||
          actionClass === "escalate" ||
          actionClass === "outbound_message"
      },
      client
    );
    return {
      recommendationId: rec.recommendation.recommendationId,
      created: rec.created
    };
  }

  if (type === "event.emit" || type === "emit_event") {
    const eventType = String(action["eventType"] ?? action["event_type"] ?? "");
    if (!eventType) throw new Error("event.emit requires eventType");
    const summary = String(action["summary"] ?? `Automation emit from ${rule.name}`);
    const emitted = await emitOpsDomainEvent(client, {
      eventType,
      organizationId,
      subject: { type: subjectType, id: subjectId },
      actor: { actor_type: "system" },
      summary,
      payload: {
        summary,
        ruleId: rule.rule_id,
        templateKey: rule.template_key,
        sourceEventId: row.event_id
      },
      correlationId: row.correlation_id ?? row.event_id,
      causationId: row.event_id
    });
    return { eventId: emitted.eventId };
  }

  throw new Error(`Unsupported automation action type: ${type}`);
}

export async function fireAutomationRule(input: {
  rule: AutomationRuleRow;
  row: DomainEventLike;
  depth?: number;
  client?: OpsDbClient;
}): Promise<"fired" | "skipped" | "failed" | "awaiting_approval"> {
  const client = input.client ?? serviceClient();
  const { rule, row } = input;
  const depth = input.depth ?? 0;

  if (!row.organization_id) return "skipped";
  if (rule.trigger_event_type && rule.trigger_event_type !== row.event_type && rule.trigger_event_type !== "*") {
    return "skipped";
  }
  if (!matchesConditions(rule.conditions ?? {}, row)) return "skipped";
  if (depth > rule.max_depth) {
    await recordFire(client, {
      ruleId: rule.rule_id,
      organizationId: row.organization_id,
      eventId: row.event_id,
      idempotencyKey: `${rule.rule_id}:${row.event_id}`,
      status: "skipped",
      depth,
      result: { reason: "max_depth" }
    });
    return "skipped";
  }

  const idempotencyKey = `${rule.rule_id}:${row.event_id}`;
  if (await alreadyFired(client, rule.rule_id, idempotencyKey)) {
    return "skipped";
  }

  if (rule.human_gate) {
    try {
      const subjectType = row.subject?.type ?? "unknown";
      const subjectId = asUuidOrEvent(row.subject?.id, row.event_id);
      const rec = await createAiRecommendation(
        {
          organizationId: row.organization_id,
          sourceEventId: row.event_id,
          situationKey: rule.template_key ?? rule.name,
          actionClass: "recommend",
          title: `Approve automation: ${rule.name}`,
          summary: `Automation rule ${rule.name} requires human approval before actions run.`,
          confidence: 0.8,
          subjectType,
          subjectId,
          proposedAction: {
            type: "automation",
            ruleId: rule.rule_id,
            actions: rule.actions
          },
          idempotencyKey: `auto-gate:${idempotencyKey}`,
          correlationId: row.correlation_id ?? row.event_id,
          forceHumanGate: true
        },
        client
      );
      await recordFire(client, {
        ruleId: rule.rule_id,
        organizationId: row.organization_id,
        eventId: row.event_id,
        idempotencyKey,
        status: "awaiting_approval",
        depth,
        result: { gated: true, recommendationId: rec.recommendation.recommendationId }
      });
      await emitOpsDomainEvent(client, {
        eventType: "ops.automation.fired",
        organizationId: row.organization_id,
        subject: { type: "ops_automation_rule", id: rule.rule_id },
        actor: { actor_type: "system" },
        summary: `Automation gated: ${rule.name}`,
        payload: {
          summary: `Automation gated: ${rule.name}`,
          ruleId: rule.rule_id,
          templateKey: rule.template_key,
          gated: true,
          recommendationId: rec.recommendation.recommendationId,
          sourceEventId: row.event_id
        },
        correlationId: row.correlation_id ?? row.event_id,
        causationId: row.event_id
      });
      return "awaiting_approval";
    } catch (err) {
      await recordFire(client, {
        ruleId: rule.rule_id,
        organizationId: row.organization_id,
        eventId: row.event_id,
        idempotencyKey,
        status: "failed",
        depth,
        errorMessage: err instanceof Error ? err.message : "gate_failed"
      });
      await emitFailed(client, rule, row);
      return "failed";
    }
  }

  const results: Record<string, unknown>[] = [];
  try {
    for (let i = 0; i < rule.actions.length; i++) {
      results.push(await executeAction(client, rule, row, rule.actions[i]!, i));
    }
    await recordFire(client, {
      ruleId: rule.rule_id,
      organizationId: row.organization_id,
      eventId: row.event_id,
      idempotencyKey,
      status: "succeeded",
      depth,
      result: { actions: results }
    });
    await emitOpsDomainEvent(client, {
      eventType: "ops.automation.fired",
      organizationId: row.organization_id,
      subject: { type: "ops_automation_rule", id: rule.rule_id },
      actor: { actor_type: "system" },
      summary: `Automation fired: ${rule.name}`,
      payload: {
        summary: `Automation fired: ${rule.name}`,
        ruleId: rule.rule_id,
        templateKey: rule.template_key,
        actionCount: rule.actions.length,
        sourceEventId: row.event_id
      },
      correlationId: row.correlation_id ?? row.event_id,
      causationId: row.event_id
    });
    return "fired";
  } catch (err) {
    await recordFire(client, {
      ruleId: rule.rule_id,
      organizationId: row.organization_id,
      eventId: row.event_id,
      idempotencyKey,
      status: "failed",
      depth,
      result: { actions: results },
      errorMessage: err instanceof Error ? err.message : "fire_failed"
    });
    await emitFailed(client, rule, row);
    return "failed";
  }
}

async function emitFailed(
  client: OpsDbClient,
  rule: AutomationRuleRow,
  row: DomainEventLike
): Promise<void> {
  if (!row.organization_id) return;
  await emitOpsDomainEvent(client, {
    eventType: "ops.automation.failed",
    organizationId: row.organization_id,
    subject: { type: "ops_automation_rule", id: rule.rule_id },
    actor: { actor_type: "system" },
    summary: `Automation failed: ${rule.name}`,
    payload: {
      summary: `Automation failed: ${rule.name}`,
      ruleId: rule.rule_id,
      sourceEventId: row.event_id
    },
    correlationId: row.correlation_id ?? row.event_id,
    causationId: row.event_id
  });
}

async function alreadyConsumed(client: OpsDbClient, eventId: string): Promise<boolean> {
  const { data } = await client
    .from("ops_event_consumer_receipts")
    .select("event_id")
    .eq("event_id", eventId)
    .eq("consumer_name", AUTOMATION_ENGINE_CONSUMER)
    .maybeSingle();
  return Boolean(data);
}

async function markConsumed(client: OpsDbClient, eventId: string): Promise<void> {
  await client.from("ops_event_consumer_receipts").upsert(
    {
      event_id: eventId,
      consumer_name: AUTOMATION_ENGINE_CONSUMER,
      processed_at: new Date().toISOString()
    },
    { onConflict: "event_id,consumer_name" }
  );
}

export async function consumeEventForAutomation(
  client: OpsDbClient,
  row: DomainEventLike
): Promise<"processed" | "skipped"> {
  if (!row.organization_id) return "skipped";
  if (await alreadyConsumed(client, row.event_id)) return "skipped";

  // Loop protection: do not re-fire on automation/AI outcome events.
  if (
    row.event_type.startsWith("ops.automation.") ||
    row.event_type.startsWith("ai.recommendation.") ||
    row.event_type.startsWith("ops.kpi.")
  ) {
    await markConsumed(client, row.event_id);
    return "skipped";
  }

  const rules = await loadMatchingRules(client, row.organization_id, row.event_type);
  for (const rule of rules) {
    if (matchesConditions(rule.conditions ?? {}, row)) {
      await fireAutomationRule({ rule, row, client });
    }
  }

  await markConsumed(client, row.event_id);
  return "processed";
}

export async function listAutomationRules(input: {
  organizationId: string;
}): Promise<AutomationRuleRow[]> {
  const db = serviceClient();
  const { data, error } = await db
    .from("ops_automation_rules")
    .select("*")
    .or(`organization_id.eq.${input.organizationId},organization_id.is.null`)
    .order("priority", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as AutomationRuleRow[];
}

export async function setAutomationRuleEnabled(input: {
  organizationId: string;
  ruleId: string;
  enabled: boolean;
}): Promise<AutomationRuleRow> {
  const db = serviceClient();
  const { data, error } = await db
    .from("ops_automation_rules")
    .update({ enabled: input.enabled, updated_at: new Date().toISOString() })
    .eq("rule_id", input.ruleId)
    .eq("organization_id", input.organizationId)
    .select("*")
    .maybeSingle();
  if (error || !data) throw new Error(error?.message ?? "Rule not found or not org-owned");
  return data as AutomationRuleRow;
}

export async function listAutomationFires(input: {
  organizationId: string;
  limit?: number;
}): Promise<Record<string, unknown>[]> {
  const db = serviceClient();
  const { data, error } = await db
    .from("ops_automation_fires")
    .select("*")
    .eq("organization_id", input.organizationId)
    .order("created_at", { ascending: false })
    .limit(input.limit ?? 100);
  if (error) throw new Error(error.message);
  return (data ?? []) as Record<string, unknown>[];
}

/** Idempotency helper for tests — key format matches fire ledger. */
export function automationFireIdempotencyKey(ruleId: string, eventId: string): string {
  return `${ruleId}:${eventId}`;
}
