/**
 * OPS-001 Slice D — AI Operations Director.
 * Detect → recommend/draft/alert within decision boundaries; mutating/outbound require human gate.
 */

import { createServiceRoleServerClient } from "../auth/server";
import { emitOpsDomainEvent } from "./emit";
import { createOpsTask } from "./task-engine";
import type { OpsDbClient } from "./types";

export const AI_DIRECTOR_CONSUMER = "ai_operations_director";

export type ConfidenceBand = "high" | "medium" | "low";
export type RecommendationActionClass =
  | "label"
  | "recommend"
  | "draft"
  | "alert"
  | "escalate"
  | "reassign"
  | "create_task"
  | "outbound_message";

export type RecommendationStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "applied"
  | "expired"
  | "canceled";

export type OpsAiRecommendation = {
  recommendationId: string;
  organizationId: string;
  sourceEventId: string | null;
  situationKey: string;
  actionClass: RecommendationActionClass;
  title: string;
  summary: string;
  confidence: number;
  confidenceBand: ConfidenceBand;
  requiresHumanGate: boolean;
  status: RecommendationStatus;
  subjectType: string;
  subjectId: string;
  proposedAction: Record<string, unknown>;
  deepLink: string | null;
  approvedByPrincipalId: string | null;
  approvedAt: string | null;
  createdAt: string;
};

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

export function confidenceBand(confidence: number): ConfidenceBand {
  if (confidence >= 0.85) return "high";
  if (confidence >= 0.6) return "medium";
  return "low";
}

/** Mutating / outbound classes always require server-side human gate (OD-02). */
export function requiresHumanGate(actionClass: RecommendationActionClass): boolean {
  return (
    actionClass === "escalate" ||
    actionClass === "reassign" ||
    actionClass === "create_task" ||
    actionClass === "outbound_message" ||
    actionClass === "draft"
  );
}

/** Financial write-offs are never AI-alone. */
export function isForbiddenAiAloneAction(actionKey: string): boolean {
  return /write.?off|credit|refund|payment|grant.?permission|reset.?admin/i.test(actionKey);
}

function mapRow(row: Record<string, unknown>): OpsAiRecommendation {
  return {
    recommendationId: String(row["recommendation_id"]),
    organizationId: String(row["organization_id"]),
    sourceEventId:
      typeof row["source_event_id"] === "string" ? row["source_event_id"] : null,
    situationKey: String(row["situation_key"]),
    actionClass: row["action_class"] as RecommendationActionClass,
    title: String(row["title"]),
    summary: String(row["summary"]),
    confidence: Number(row["confidence"] ?? 0),
    confidenceBand: row["confidence_band"] as ConfidenceBand,
    requiresHumanGate: Boolean(row["requires_human_gate"]),
    status: row["status"] as RecommendationStatus,
    subjectType: String(row["subject_type"]),
    subjectId: String(row["subject_id"]),
    proposedAction: (row["proposed_action"] as Record<string, unknown>) ?? {},
    deepLink: typeof row["deep_link"] === "string" ? row["deep_link"] : null,
    approvedByPrincipalId:
      typeof row["approved_by_principal_id"] === "string"
        ? row["approved_by_principal_id"]
        : null,
    approvedAt: typeof row["approved_at"] === "string" ? row["approved_at"] : null,
    createdAt: String(row["created_at"])
  };
}

export type CreateRecommendationInput = {
  organizationId: string;
  sourceEventId?: string | null;
  situationKey: string;
  actionClass: RecommendationActionClass;
  title: string;
  summary: string;
  confidence: number;
  subjectType: string;
  subjectId: string;
  proposedAction?: Record<string, unknown>;
  payload?: Record<string, unknown>;
  deepLink?: string | null;
  idempotencyKey: string;
  correlationId?: string | null;
  forceHumanGate?: boolean;
};

export async function createAiRecommendation(
  input: CreateRecommendationInput,
  client?: OpsDbClient
): Promise<{ recommendation: OpsAiRecommendation; created: boolean }> {
  const db = client ?? serviceClient();
  const band = confidenceBand(input.confidence);
  const gate =
    input.forceHumanGate === true || requiresHumanGate(input.actionClass) || band !== "high";

  const actionKey = String(input.proposedAction?.["action"] ?? input.actionClass);
  if (isForbiddenAiAloneAction(actionKey)) {
    throw new Error("AI-alone financial/permission actions are forbidden");
  }

  const { data: existing } = await db
    .from("ops_ai_recommendations")
    .select("*")
    .eq("organization_id", input.organizationId)
    .eq("idempotency_key", input.idempotencyKey)
    .maybeSingle();

  if (existing) {
    return { recommendation: mapRow(existing as Record<string, unknown>), created: false };
  }

  const { data, error } = await db
    .from("ops_ai_recommendations")
    .insert({
      organization_id: input.organizationId,
      source_event_id: input.sourceEventId ?? null,
      situation_key: input.situationKey,
      action_class: input.actionClass,
      title: input.title,
      summary: input.summary,
      confidence: input.confidence,
      confidence_band: band,
      requires_human_gate: gate,
      status: "pending",
      subject_type: input.subjectType,
      subject_id: input.subjectId,
      proposed_action: input.proposedAction ?? {},
      payload: input.payload ?? {},
      deep_link: input.deepLink ?? null,
      idempotency_key: input.idempotencyKey
    })
    .select("*")
    .single();

  if (error) {
    const { data: raced } = await db
      .from("ops_ai_recommendations")
      .select("*")
      .eq("organization_id", input.organizationId)
      .eq("idempotency_key", input.idempotencyKey)
      .maybeSingle();
    if (raced) return { recommendation: mapRow(raced as Record<string, unknown>), created: false };
    throw new Error(error.message ?? "Failed to create AI recommendation");
  }

  const recommendation = mapRow(data as Record<string, unknown>);

  await emitOpsDomainEvent(db, {
    eventType: "ai.recommendation.generated",
    organizationId: input.organizationId,
    subject: { type: "ops_ai_recommendation", id: recommendation.recommendationId },
    actor: { actor_type: "system" },
    summary: recommendation.title,
    payload: {
      summary: recommendation.title,
      recommendationId: recommendation.recommendationId,
      situationKey: recommendation.situationKey,
      actionClass: recommendation.actionClass,
      confidence: recommendation.confidence,
      confidenceBand: recommendation.confidenceBand,
      requiresHumanGate: recommendation.requiresHumanGate,
      status: recommendation.status,
      subjectType: recommendation.subjectType,
      subjectId: recommendation.subjectId,
      href: recommendation.deepLink
    },
    correlationId: input.correlationId ?? input.sourceEventId ?? recommendation.recommendationId,
    causationId: input.sourceEventId ?? null
  });

  return { recommendation, created: true };
}

/**
 * Server-side human approval gate (OD-02). UI approve alone is insufficient — this API path records actor.
 */
export async function approveAiRecommendation(input: {
  organizationId: string;
  recommendationId: string;
  actorPrincipalId: string;
}): Promise<OpsAiRecommendation> {
  const db = serviceClient();
  const { data: row, error } = await db
    .from("ops_ai_recommendations")
    .select("*")
    .eq("organization_id", input.organizationId)
    .eq("recommendation_id", input.recommendationId)
    .maybeSingle();

  if (error || !row) throw new Error(error?.message ?? "Recommendation not found");
  const current = mapRow(row as Record<string, unknown>);
  if (current.status === "applied") return current;
  if (current.status !== "pending" && current.status !== "approved") {
    throw new Error(`Cannot approve recommendation in status ${current.status}`);
  }

  const now = new Date().toISOString();
  const { data: updated, error: updateError } = await db
    .from("ops_ai_recommendations")
    .update({
      status: "approved",
      approved_by_principal_id: input.actorPrincipalId,
      approved_at: now,
      updated_at: now
    })
    .eq("organization_id", input.organizationId)
    .eq("recommendation_id", input.recommendationId)
    .eq("status", current.status)
    .select("*")
    .maybeSingle();

  if (updateError || !updated) {
    throw new Error(updateError?.message ?? "Approval conflict — retry");
  }

  const approved = mapRow(updated as Record<string, unknown>);
  await applyApprovedRecommendation(approved, input.actorPrincipalId, db);
  return approved;
}

export async function rejectAiRecommendation(input: {
  organizationId: string;
  recommendationId: string;
  actorPrincipalId: string;
  reason?: string | null;
}): Promise<OpsAiRecommendation> {
  const db = serviceClient();
  const now = new Date().toISOString();
  const { data, error } = await db
    .from("ops_ai_recommendations")
    .update({
      status: "rejected",
      approved_by_principal_id: input.actorPrincipalId,
      approved_at: now,
      rejection_reason: input.reason ?? null,
      updated_at: now
    })
    .eq("organization_id", input.organizationId)
    .eq("recommendation_id", input.recommendationId)
    .eq("status", "pending")
    .select("*")
    .maybeSingle();

  if (error || !data) throw new Error(error?.message ?? "Reject failed");
  const recommendation = mapRow(data as Record<string, unknown>);

  await emitOpsDomainEvent(db, {
    eventType: "ai.recommendation.rejected",
    organizationId: input.organizationId,
    subject: { type: "ops_ai_recommendation", id: recommendation.recommendationId },
    actor: { actor_type: "user", principal_id: input.actorPrincipalId },
    summary: `Recommendation rejected: ${recommendation.title}`,
    payload: {
      summary: `Recommendation rejected: ${recommendation.title}`,
      recommendationId: recommendation.recommendationId,
      status: "rejected"
    }
  });

  return recommendation;
}

async function applyApprovedRecommendation(
  recommendation: OpsAiRecommendation,
  actorPrincipalId: string,
  db: OpsDbClient
): Promise<void> {
  const action = recommendation.proposedAction;
  const actionType = String(action["type"] ?? recommendation.actionClass);

  if (actionType === "create_task" || recommendation.actionClass === "create_task") {
    await createOpsTask({
      organizationId: recommendation.organizationId,
      title: String(action["title"] ?? recommendation.title),
      priority: typeof action["priority"] === "string" ? action["priority"] : "high",
      subjectType: recommendation.subjectType,
      subjectId: recommendation.subjectId,
      deepLink: recommendation.deepLink,
      idempotencyKey: `ai-apply:${recommendation.recommendationId}`,
      createdBy: "automation",
      createdByPrincipalId: actorPrincipalId,
      actorPrincipalId,
      sourceEventId: recommendation.sourceEventId
    });
  }

  // escalate / reassign / draft: record applied outcome; domain mutation via future command APIs.
  // Creating a follow-up task is the safe Slice D apply path without raw SQL domain writes.

  const now = new Date().toISOString();
  await db
    .from("ops_ai_recommendations")
    .update({ status: "applied", applied_at: now, updated_at: now })
    .eq("recommendation_id", recommendation.recommendationId)
    .eq("organization_id", recommendation.organizationId);

  await emitOpsDomainEvent(db, {
    eventType: "ai.recommendation.applied",
    organizationId: recommendation.organizationId,
    subject: { type: "ops_ai_recommendation", id: recommendation.recommendationId },
    actor: { actor_type: "user", principal_id: actorPrincipalId },
    summary: `Recommendation applied: ${recommendation.title}`,
    payload: {
      summary: `Recommendation applied: ${recommendation.title}`,
      recommendationId: recommendation.recommendationId,
      actionClass: recommendation.actionClass,
      status: "applied",
      approvedByPrincipalId: actorPrincipalId
    },
    causationId: recommendation.sourceEventId
  });
}

export async function listAiRecommendations(input: {
  organizationId: string;
  status?: RecommendationStatus | RecommendationStatus[];
  limit?: number;
}): Promise<OpsAiRecommendation[]> {
  const db = serviceClient();
  let query = db
    .from("ops_ai_recommendations")
    .select("*")
    .eq("organization_id", input.organizationId)
    .order("created_at", { ascending: false })
    .limit(input.limit ?? 100);

  if (input.status) {
    const statuses = Array.isArray(input.status) ? input.status : [input.status];
    query = query.in("status", statuses);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return ((data ?? []) as Record<string, unknown>[]).map(mapRow);
}

type SituationSpec = {
  situationKey: string;
  actionClass: RecommendationActionClass;
  title: string;
  summary: string;
  confidence: number;
  proposedAction: Record<string, unknown>;
};

function detectSituations(row: DomainEventLike): SituationSpec[] {
  const safetyText = [
    typeof row.payload["summary"] === "string" ? row.payload["summary"] : "",
    typeof row.payload["title"] === "string" ? row.payload["title"] : ""
  ]
    .join(" ")
    .toLowerCase();

  const specs: SituationSpec[] = [];

  if (row.event_type === "maintenance.overdue") {
    specs.push({
      situationKey: "maintenance_overdue_escalate",
      actionClass: "escalate",
      title: "Escalate overdue work order",
      summary: "Work order is overdue; recommend priority escalation and supervisor follow-up.",
      confidence: 0.82,
      proposedAction: {
        type: "create_task",
        title: "Escalate overdue work order",
        priority: "critical",
        action: "escalate_priority"
      }
    });
  }

  if (row.event_type === "maintenance.vendor.declined") {
    specs.push({
      situationKey: "vendor_declined_reassign",
      actionClass: "reassign",
      title: "Recommend replacement vendor",
      summary: "Vendor declined; recommend reassignment shortlist.",
      confidence: 0.78,
      proposedAction: {
        type: "create_task",
        title: "Reassign vendor after decline",
        priority: "high",
        action: "reassign_vendor"
      }
    });
  }

  if (row.event_type === "lease.expiring") {
    specs.push({
      situationKey: "lease_expiring_draft",
      actionClass: "draft",
      title: "Draft lease renewal outreach",
      summary: "Lease is expiring; draft resident/PM renewal communication (human send).",
      confidence: 0.74,
      proposedAction: {
        type: "draft",
        action: "outbound_message",
        channel: "email"
      }
    });
  }

  if (/gas leak|fire|flood|smoke|carbon monoxide|life safety/.test(safetyText)) {
    specs.push({
      situationKey: "safety_critical_alert",
      actionClass: "alert",
      title: "Safety-critical situation detected",
      summary: "Safety keywords detected; force elevated handling and human notify.",
      confidence: 0.95,
      proposedAction: {
        type: "create_task",
        title: "Safety-critical follow-up",
        priority: "critical",
        action: "safety_escalate"
      }
    });
  }

  return specs;
}

async function alreadyConsumed(client: OpsDbClient, eventId: string): Promise<boolean> {
  const { data } = await client
    .from("ops_event_consumer_receipts")
    .select("event_id")
    .eq("event_id", eventId)
    .eq("consumer_name", AI_DIRECTOR_CONSUMER)
    .maybeSingle();
  return Boolean(data);
}

async function markConsumed(client: OpsDbClient, eventId: string): Promise<void> {
  await client.from("ops_event_consumer_receipts").upsert(
    {
      event_id: eventId,
      consumer_name: AI_DIRECTOR_CONSUMER,
      processed_at: new Date().toISOString()
    },
    { onConflict: "event_id,consumer_name" }
  );
}

export async function consumeEventForAiDirector(
  client: OpsDbClient,
  row: DomainEventLike
): Promise<"processed" | "skipped"> {
  if (!row.organization_id) return "skipped";
  if (await alreadyConsumed(client, row.event_id)) return "skipped";

  const subjectType = row.subject?.type;
  const subjectId = row.subject?.id;
  if (!subjectType || !subjectId) {
    await markConsumed(client, row.event_id);
    return "skipped";
  }

  const situations = detectSituations(row);
  for (const spec of situations) {
    const deepLink =
      subjectType === "maintenance_work_order"
        ? `/maintenance/${subjectId}`
        : subjectType === "lease"
          ? `/leases/${subjectId}`
          : null;

    await createAiRecommendation(
      {
        organizationId: row.organization_id,
        sourceEventId: row.event_id,
        situationKey: spec.situationKey,
        actionClass: spec.actionClass,
        title: spec.title,
        summary: spec.summary,
        confidence: spec.confidence,
        subjectType,
        subjectId,
        proposedAction: spec.proposedAction,
        deepLink,
        idempotencyKey: `ai:${spec.situationKey}:${row.event_id}`,
        correlationId: row.correlation_id ?? row.event_id,
        forceHumanGate: requiresHumanGate(spec.actionClass)
      },
      client
    );
  }

  await markConsumed(client, row.event_id);
  return "processed";
}
