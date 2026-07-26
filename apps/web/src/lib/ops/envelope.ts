import { randomUUID } from "crypto";
import type { OpsSliceAEventType } from "./catalog";

export type OpsActorType = "user" | "system" | "vendor" | "tenant" | "ai" | "service";

export type OpsEventActor = {
  principal_id?: string | null;
  actor_type: OpsActorType;
  impersonation_id?: string | null;
  label?: string | null;
};

export type OpsEventSubject = {
  type: string;
  id: string;
};

export type OpsEventVisibility = "ops" | "tenant" | "staff_only";
export type OpsEventSensitivity = "normal" | "restricted" | "privileged";

/** OPS-001 / ADR-005 standard envelope (in-memory / API shape). */
export type OpsEventEnvelope = {
  eventId: string;
  eventType: OpsSliceAEventType | string;
  eventVersion: number;
  occurredAt: string;
  /** Null allowed for platform commercial events before org link (COM-001). */
  organizationId: string | null;
  actor: OpsEventActor;
  subject: OpsEventSubject;
  correlationId: string;
  causationId?: string | null;
  payload: Record<string, unknown>;
  visibility: OpsEventVisibility;
  sensitivity: OpsEventSensitivity;
};

export type EmitOpsEventInput = {
  eventType: OpsSliceAEventType | string;
  /** Null allowed for platform commercial events before org link (COM-001). */
  organizationId: string | null;
  subject: OpsEventSubject;
  actor: OpsEventActor;
  summary?: string;
  payload?: Record<string, unknown>;
  occurredAt?: string;
  correlationId?: string;
  causationId?: string | null;
  visibility?: OpsEventVisibility;
  sensitivity?: OpsEventSensitivity;
  eventVersion?: number;
  eventId?: string;
  /** Optional property/unit for timeline indexing */
  propertyId?: string | null;
  unitId?: string | null;
  href?: string | null;
};

const FORBIDDEN_PAYLOAD_KEYS = [
  "password",
  "tempPassword",
  "temp_password",
  "secret",
  "mfa",
  "cardNumber",
  "card_number",
  "cvv",
  "cvc",
  "ssn"
];

export function assertSafePayload(payload: Record<string, unknown>): void {
  const stack: unknown[] = [payload];
  while (stack.length > 0) {
    const current = stack.pop();
    if (!current || typeof current !== "object") continue;
    if (Array.isArray(current)) {
      stack.push(...current);
      continue;
    }
    for (const [key, value] of Object.entries(current as Record<string, unknown>)) {
      if (FORBIDDEN_PAYLOAD_KEYS.some((k) => key.toLowerCase().includes(k.toLowerCase()))) {
        throw new Error(`Forbidden secret-like key in event payload: ${key}`);
      }
      if (value && typeof value === "object") stack.push(value);
    }
  }
}

export function buildEnvelope(input: EmitOpsEventInput): OpsEventEnvelope {
  const payload = { ...(input.payload ?? {}) };
  if (input.summary) payload["summary"] = input.summary;
  if (input.propertyId) payload["propertyId"] = input.propertyId;
  if (input.unitId) payload["unitId"] = input.unitId;
  if (input.href) payload["href"] = input.href;
  assertSafePayload(payload);

  return {
    eventId: input.eventId ?? randomUUID(),
    eventType: input.eventType,
    eventVersion: input.eventVersion ?? 1,
    occurredAt: input.occurredAt ?? new Date().toISOString(),
    organizationId: input.organizationId,
    actor: input.actor,
    subject: input.subject,
    correlationId: input.correlationId ?? randomUUID(),
    causationId: input.causationId ?? null,
    payload,
    visibility: input.visibility ?? "ops",
    sensitivity: input.sensitivity ?? "normal"
  };
}

export function actorLabel(actor: OpsEventActor): string {
  if (actor.label?.trim()) return actor.label.trim();
  switch (actor.actor_type) {
    case "user":
      return "Team member";
    case "vendor":
      return "Vendor";
    case "tenant":
      return "Tenant";
    case "ai":
      return "AI";
    case "service":
      return "Service";
    default:
      return "System";
  }
}
