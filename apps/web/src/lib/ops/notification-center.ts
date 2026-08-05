/**
 * OPS-001 Slice B — Notification Center.
 * Sole fan-out origin for Push / Email / In-app (SMS/future = adapter slots).
 * Reuses API-001 / EML-001 / MHF paths via `lib/notifications/notify` — no direct SDK calls.
 */

import { randomUUID } from "crypto";
import { createServiceRoleServerClient } from "../auth/server";
import type {
  NotificationCategory,
  NotificationPriority,
  NotifyInput
} from "../notifications/contracts";
import { notify } from "../notifications/service";
import { CHANNEL_ADAPTER_HOOKS } from "./channel-adapters";
import { emitOpsDomainEvent } from "./emit";
import type { OpsDbClient } from "./types";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function asSubjectId(...candidates: Array<string | null | undefined>): string {
  for (const value of candidates) {
    if (typeof value === "string" && UUID_RE.test(value)) return value;
  }
  return randomUUID();
}

export const NOTIFICATION_CENTER_CONSUMER = "notification_center";

/** Event types that auto-fan-out through Notification Center when recipients are resolvable. */
export const NOTIFY_ELIGIBLE_EVENT_TYPES = new Set<string>([
  "maintenance.request.created",
  "maintenance.overdue",
  "maintenance.vendor.assigned",
  "lease.expiring",
  "commercial.trial.reminder_due",
  "commercial.renewal.alert_due",
  // CORE-004 Phase 1 — property lifecycle material transitions
  "property.activated",
  "property.lifecycle.transitioned",
  "property.archived"
  // ops.reminder.fired is not auto-fan-out — Reminder Engine notifies explicitly (avoid loops)
]);

export type NotificationCenterDeliverInput = {
  organizationId: string;
  recipientUserIds: string[];
  category: NotificationCategory;
  priority: NotificationPriority;
  title: string;
  body: string;
  eventKey: string;
  sourceEventId?: string | null;
  propertyId?: string | null;
  unitId?: string | null;
  href?: string | null;
  sourceEntityType?: string | null;
  sourceEntityId?: string | null;
  actorUserId?: string | null;
  channels?: NotifyInput["channels"];
  metadata?: Record<string, unknown>;
};

export type NotificationCenterDeliverResult = {
  deliveredCount: number;
  skipped: boolean;
  notificationIds: string[];
};

function serviceClient(): OpsDbClient {
  return createServiceRoleServerClient() as unknown as OpsDbClient;
}

function mapCategory(eventType: string, payload: Record<string, unknown>): NotificationCategory {
  const fromPayload = payload["notifyCategory"] ?? payload["notify_category"] ?? payload["category"];
  if (typeof fromPayload === "string") {
    const allowed: NotificationCategory[] = [
      "maintenance",
      "messages",
      "announcements",
      "residents",
      "applicants",
      "leases",
      "financial",
      "vendors",
      "inspections",
      "emergency",
      "ai_operations",
      "system"
    ];
    if (allowed.includes(fromPayload as NotificationCategory)) {
      return fromPayload as NotificationCategory;
    }
  }
  if (eventType.startsWith("maintenance.")) return "maintenance";
  if (eventType.startsWith("lease.")) return "leases";
  if (eventType.startsWith("commercial.")) return "system";
  return "system";
}

function mapPriority(payload: Record<string, unknown>): NotificationPriority {
  const raw = payload["notifyPriority"] ?? payload["notify_priority"] ?? payload["priority"];
  if (raw === "low" || raw === "normal" || raw === "high" || raw === "emergency") return raw;
  if (raw === "urgent") return "high";
  return "normal";
}

async function loadOrgPolicyFloors(
  client: OpsDbClient,
  organizationId: string
): Promise<{ requiredCategories: string[]; emergencyOverride: boolean }> {
  const { data } = await client
    .from("ops_notification_org_policies")
    .select("required_categories, emergency_override")
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (!data) {
    return { requiredCategories: ["emergency", "system"], emergencyOverride: true };
  }
  const row = data as { required_categories?: string[] | null; emergency_override?: boolean | null };
  return {
    requiredCategories: row.required_categories?.length
      ? row.required_categories
      : ["emergency", "system"],
    emergencyOverride: row.emergency_override !== false
  };
}

async function resolveRecipientUserIds(
  client: OpsDbClient,
  organizationId: string,
  payload: Record<string, unknown>,
  subject: { type: string; id: string }
): Promise<string[]> {
  const explicit = payload["recipientUserIds"] ?? payload["recipient_user_ids"];
  if (Array.isArray(explicit)) {
    return [...new Set(explicit.filter((id): id is string => typeof id === "string" && id.length > 0))];
  }
  const single =
    payload["recipientPrincipalId"] ??
    payload["recipient_principal_id"] ??
    payload["userId"] ??
    payload["user_id"];
  if (typeof single === "string" && single.length > 0) return [single];

  // Org-safe fallback: active property_manager / org_admin members (no cross-org).
  const { data } = await client
    .from("organization_memberships")
    .select("user_id, roles")
    .eq("organization_id", organizationId)
    .eq("status", "active");

  const ids = ((data ?? []) as Array<{ user_id: string; roles: string[] | null }>)
    .filter((row) => {
      const roles = row.roles ?? [];
      return (
        roles.includes("property_manager") ||
        roles.includes("org_admin") ||
        roles.includes("organization_admin")
      );
    })
    .map((row) => row.user_id);

  if (ids.length > 0) return [...new Set(ids)];

  // Last resort: subject actor if user-typed id in payload
  if (subject.type === "user" && subject.id) return [subject.id];
  return [];
}

/**
 * Deliver through Notification Center — preference-aware fan-out via existing notify().
 * Emits secret-free ops.notification.* outcomes on the Slice A bus.
 */
export async function deliverViaNotificationCenter(
  input: NotificationCenterDeliverInput,
  client?: OpsDbClient
): Promise<NotificationCenterDeliverResult> {
  const db = client ?? serviceClient();
  const recipients = [...new Set(input.recipientUserIds.filter(Boolean))];

  if (recipients.length === 0) {
    return { deliveredCount: 0, skipped: true, notificationIds: [] };
  }

  const floors = await loadOrgPolicyFloors(db, input.organizationId);
  const channels = { ...input.channels };
  if (floors.requiredCategories.includes(input.category) || input.priority === "emergency") {
    channels.inApp = true;
    if (floors.emergencyOverride && input.priority === "emergency") {
      channels.push = channels.push ?? true;
    }
  }

  const subjectId = asSubjectId(input.sourceEntityId, input.sourceEventId);

  await emitOpsDomainEvent(
    db,
    {
      eventType: "ops.notification.queued",
      organizationId: input.organizationId,
      subject: {
        type: input.sourceEntityType ?? "notification",
        id: subjectId
      },
      actor: { actor_type: "system", principal_id: input.actorUserId ?? null },
      summary: `Notification queued: ${input.category}`,
      payload: {
        summary: `Notification queued: ${input.category}`,
        category: input.category,
        priority: input.priority,
        recipientCount: recipients.length,
        sourceEventId: input.sourceEventId ?? null
      },
      causationId: input.sourceEventId ?? null,
      visibility: "ops",
      propertyId: input.propertyId ?? null,
      unitId: input.unitId ?? null,
      href: input.href ?? null
    },
    { dispatchNow: false }
  );

  try {
    const records = await notify(
      {
        organizationId: input.organizationId,
        category: input.category,
        priority: input.priority,
        title: input.title,
        body: input.body,
        eventKey: input.eventKey,
        recipientUserIds: recipients,
        propertyId: input.propertyId ?? null,
        unitId: input.unitId ?? null,
        href: input.href ?? null,
        sourceEntityType: input.sourceEntityType ?? null,
        sourceEntityId: input.sourceEntityId ?? null,
        actorUserId: input.actorUserId ?? null,
        channels,
        metadata: {
          ...(input.metadata ?? {}),
          opsSourceEventId: input.sourceEventId ?? null,
          via: "ops_notification_center"
        }
      },
      db as never
    );

    // Exercise SMS / future adapter slots (not_implemented) for hook wiring evidence.
    for (const recipientUserId of recipients.slice(0, 1)) {
      await CHANNEL_ADAPTER_HOOKS.sms({
        organizationId: input.organizationId,
        recipientUserId,
        notificationId: records[0]?.id ?? null,
        title: input.title,
        body: input.body,
        href: input.href ?? null,
        category: input.category,
        priority: input.priority
      });
    }

    await emitOpsDomainEvent(
      db,
      {
        eventType: "ops.notification.delivered",
        organizationId: input.organizationId,
        subject: {
          type: "notification_batch",
          id: asSubjectId(records[0]?.id, input.sourceEventId, subjectId)
        },
        actor: { actor_type: "system", principal_id: input.actorUserId ?? null },
        summary: `Notification delivered (${records.length})`,
        payload: {
          summary: `Notification delivered (${records.length})`,
          category: input.category,
          priority: input.priority,
          deliveredCount: records.length,
          sourceEventId: input.sourceEventId ?? null
        },
        causationId: input.sourceEventId ?? null,
        visibility: "ops",
        propertyId: input.propertyId ?? null,
        unitId: input.unitId ?? null,
        href: input.href ?? null
      },
      { dispatchNow: false }
    );

    return {
      deliveredCount: records.length,
      skipped: records.length === 0,
      notificationIds: records.map((r) => r.id)
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "notification_failed";
    await emitOpsDomainEvent(
      db,
      {
        eventType: "ops.notification.failed",
        organizationId: input.organizationId,
        subject: {
          type: "notification_batch",
          id: asSubjectId(input.sourceEventId, subjectId)
        },
        actor: { actor_type: "system" },
        summary: "Notification delivery failed",
        payload: {
          summary: "Notification delivery failed",
          category: input.category,
          priority: input.priority,
          reasonCode: message.slice(0, 200),
          sourceEventId: input.sourceEventId ?? null
        },
        causationId: input.sourceEventId ?? null,
        visibility: "ops"
      },
      { dispatchNow: false }
    );
    throw err;
  }
}

type DomainEventRow = {
  event_id: string;
  event_type: string;
  organization_id: string | null;
  subject: { type?: string; id?: string };
  payload: Record<string, unknown>;
  visibility: string;
};

/**
 * Bus consumer: fan-out eligible domain events through Notification Center.
 * Idempotent via ops_event_consumer_receipts.
 */
export async function consumeEventForNotificationCenter(
  client: OpsDbClient,
  row: DomainEventRow
): Promise<"processed" | "skipped"> {
  if (!row.organization_id) return "skipped";
  if (row.visibility === "staff_only") return "skipped";
  if (row.event_type.startsWith("ops.notification.")) return "skipped";
  if (!NOTIFY_ELIGIBLE_EVENT_TYPES.has(row.event_type)) return "skipped";

  const { data: existingReceipt } = await client
    .from("ops_event_consumer_receipts")
    .select("event_id")
    .eq("event_id", row.event_id)
    .eq("consumer_name", NOTIFICATION_CENTER_CONSUMER)
    .maybeSingle();

  if (existingReceipt) return "skipped";

  const payload = row.payload ?? {};
  const subject = {
    type: typeof row.subject?.type === "string" ? row.subject.type : "unknown",
    id: typeof row.subject?.id === "string" ? row.subject.id : row.event_id
  };

  const recipients = await resolveRecipientUserIds(client, row.organization_id, payload, subject);
  if (recipients.length === 0) {
    await client.from("ops_event_consumer_receipts").upsert(
      {
        event_id: row.event_id,
        consumer_name: NOTIFICATION_CENTER_CONSUMER,
        processed_at: new Date().toISOString()
      },
      { onConflict: "event_id,consumer_name" }
    );
    return "skipped";
  }

  const title =
    typeof payload["title"] === "string" && payload["title"].trim()
      ? payload["title"].trim()
      : typeof payload["summary"] === "string" && payload["summary"].trim()
        ? payload["summary"].trim()
        : row.event_type.replace(/\./g, " ");
  const body =
    typeof payload["body"] === "string" && payload["body"].trim()
      ? payload["body"].trim()
      : title;

  await deliverViaNotificationCenter(
    {
      organizationId: row.organization_id,
      recipientUserIds: recipients,
      category: mapCategory(row.event_type, payload),
      priority: mapPriority(payload),
      title,
      body,
      eventKey: `ops-bus:${row.event_id}`,
      sourceEventId: row.event_id,
      propertyId:
        typeof payload["propertyId"] === "string"
          ? payload["propertyId"]
          : typeof payload["property_id"] === "string"
            ? payload["property_id"]
            : null,
      unitId:
        typeof payload["unitId"] === "string"
          ? payload["unitId"]
          : typeof payload["unit_id"] === "string"
            ? payload["unit_id"]
            : null,
      href: typeof payload["href"] === "string" ? payload["href"] : null,
      sourceEntityType: subject.type,
      sourceEntityId: subject.id
    },
    client
  );

  await client.from("ops_event_consumer_receipts").upsert(
    {
      event_id: row.event_id,
      consumer_name: NOTIFICATION_CENTER_CONSUMER,
      processed_at: new Date().toISOString()
    },
    { onConflict: "event_id,consumer_name" }
  );

  return "processed";
}
