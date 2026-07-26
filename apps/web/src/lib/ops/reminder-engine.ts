/**
 * OPS-001 Slice B — Reminder Engine.
 * Idempotent fire via (organization_id, idempotency_key). Prefer emit fact event then notify.
 */

import { createServiceRoleServerClient } from "../auth/server";
import type { NotificationCategory, NotificationPriority } from "../notifications/contracts";
import { consolidateDueReminders, type ReminderForConsolidation } from "./consolidation";
import { emitOpsDomainEvent } from "./emit";
import {
  deliverViaNotificationCenter,
  NOTIFY_ELIGIBLE_EVENT_TYPES
} from "./notification-center";
import type { OpsDbClient } from "./types";

export type ReminderType = "absolute" | "relative" | "recurring" | "snooze" | "escalation";
export type ReminderAction = "emit_event" | "notify" | "emit_and_notify";
export type ReminderStatus = "scheduled" | "processing" | "fired" | "canceled" | "error";

export type ScheduleReminderInput = {
  organizationId: string;
  reminderType: ReminderType;
  subjectType: string;
  subjectId: string;
  fireAt: string | Date;
  idempotencyKey: string;
  action?: ReminderAction;
  eventType?: string | null;
  recipientPrincipalId?: string | null;
  notifyCategory?: NotificationCategory | null;
  notifyPriority?: NotificationPriority;
  title?: string | null;
  body?: string | null;
  href?: string | null;
  propertyId?: string | null;
  unitId?: string | null;
  cadence?: string | null;
  rrule?: string | null;
  consolidationKey?: string | null;
  payload?: Record<string, unknown>;
};

export type OpsReminderRow = {
  reminder_id: string;
  organization_id: string;
  reminder_type: ReminderType;
  subject_type: string;
  subject_id: string;
  recipient_principal_id: string | null;
  fire_at: string;
  cadence: string | null;
  rrule: string | null;
  action: ReminderAction;
  event_type: string | null;
  notify_category: string | null;
  notify_priority: NotificationPriority;
  title: string | null;
  body: string | null;
  href: string | null;
  property_id: string | null;
  unit_id: string | null;
  payload: Record<string, unknown>;
  status: ReminderStatus;
  idempotency_key: string;
  consolidation_key: string | null;
};

function serviceClient(): OpsDbClient {
  return createServiceRoleServerClient() as unknown as OpsDbClient;
}

function toIso(value: string | Date): string {
  return typeof value === "string" ? value : value.toISOString();
}

/**
 * Schedule a reminder. Idempotent on (organization_id, idempotency_key).
 */
export async function scheduleReminder(
  input: ScheduleReminderInput,
  client?: OpsDbClient
): Promise<{ reminderId: string; created: boolean }> {
  const db = client ?? serviceClient();
  const fireAt = toIso(input.fireAt);

  const row = {
    organization_id: input.organizationId,
    reminder_type: input.reminderType,
    subject_type: input.subjectType,
    subject_id: input.subjectId,
    recipient_principal_id: input.recipientPrincipalId ?? null,
    fire_at: fireAt,
    cadence: input.cadence ?? null,
    rrule: input.rrule ?? null,
    action: input.action ?? "emit_and_notify",
    event_type: input.eventType ?? null,
    notify_category: input.notifyCategory ?? null,
    notify_priority: input.notifyPriority ?? "normal",
    title: input.title ?? null,
    body: input.body ?? null,
    href: input.href ?? null,
    property_id: input.propertyId ?? null,
    unit_id: input.unitId ?? null,
    payload: input.payload ?? {},
    status: "scheduled" as const,
    idempotency_key: input.idempotencyKey,
    consolidation_key: input.consolidationKey ?? null
  };

  const { data, error } = await db
    .from("ops_reminders")
    .upsert(row, { onConflict: "organization_id,idempotency_key", ignoreDuplicates: true })
    .select("reminder_id")
    .maybeSingle();

  if (error) {
    // Unique conflict with ignoreDuplicates may return null — fetch existing
    const { data: existing, error: fetchError } = await db
      .from("ops_reminders")
      .select("reminder_id")
      .eq("organization_id", input.organizationId)
      .eq("idempotency_key", input.idempotencyKey)
      .maybeSingle();
    if (fetchError || !existing) throw new Error(error.message);
    return { reminderId: (existing as { reminder_id: string }).reminder_id, created: false };
  }

  if (!data) {
    const { data: existing } = await db
      .from("ops_reminders")
      .select("reminder_id")
      .eq("organization_id", input.organizationId)
      .eq("idempotency_key", input.idempotencyKey)
      .maybeSingle();
    if (!existing) throw new Error("Failed to schedule reminder");
    return { reminderId: (existing as { reminder_id: string }).reminder_id, created: false };
  }

  const reminderId = (data as { reminder_id: string }).reminder_id;

  await emitOpsDomainEvent(
    db,
    {
      eventType: "ops.reminder.scheduled",
      organizationId: input.organizationId,
      subject: { type: input.subjectType, id: input.subjectId },
      actor: { actor_type: "system" },
      summary: `Reminder scheduled (${input.reminderType})`,
      payload: {
        summary: `Reminder scheduled (${input.reminderType})`,
        reminderId,
        reminderType: input.reminderType,
        fireAt,
        idempotencyKey: input.idempotencyKey
      },
      visibility: "ops",
      propertyId: input.propertyId ?? null,
      unitId: input.unitId ?? null,
      href: input.href ?? null
    },
    { dispatchNow: false }
  );

  return { reminderId, created: true };
}

/**
 * Cancel all scheduled reminders for a subject (terminal state).
 */
export async function cancelRemindersForSubject(
  organizationId: string,
  subjectType: string,
  subjectId: string,
  reason: string,
  client?: OpsDbClient
): Promise<number> {
  const db = client ?? serviceClient();
  const now = new Date().toISOString();

  const { data, error } = await db
    .from("ops_reminders")
    .update({
      status: "canceled",
      terminal_cancel_reason: reason.slice(0, 500),
      canceled_at: now,
      updated_at: now
    })
    .eq("organization_id", organizationId)
    .eq("subject_type", subjectType)
    .eq("subject_id", subjectId)
    .eq("status", "scheduled")
    .select("reminder_id");

  if (error) throw new Error(error.message);

  const rows = (data ?? []) as Array<{ reminder_id: string }>;
  for (const row of rows) {
    await emitOpsDomainEvent(
      db,
      {
        eventType: "ops.reminder.canceled",
        organizationId,
        subject: { type: subjectType, id: subjectId },
        actor: { actor_type: "system" },
        summary: "Reminder canceled",
        payload: {
          summary: "Reminder canceled",
          reminderId: row.reminder_id,
          reasonCode: reason.slice(0, 100)
        },
        visibility: "ops"
      },
      { dispatchNow: false }
    );
  }

  return rows.length;
}

async function fireReminder(db: OpsDbClient, reminder: OpsReminderRow): Promise<void> {
  const eventType = reminder.event_type ?? "ops.reminder.fired";
  const title = reminder.title?.trim() || `Reminder: ${reminder.subject_type}`;
  const body = reminder.body?.trim() || title;

  if (reminder.action === "emit_event" || reminder.action === "emit_and_notify") {
    await emitOpsDomainEvent(
      db,
      {
        eventType,
        organizationId: reminder.organization_id,
        subject: { type: reminder.subject_type, id: reminder.subject_id },
        actor: { actor_type: "system" },
        summary: title,
        payload: {
          summary: title,
          reminderId: reminder.reminder_id,
          reminderType: reminder.reminder_type,
          idempotencyKey: reminder.idempotency_key,
          recipientPrincipalId: reminder.recipient_principal_id,
          title,
          body,
          ...(reminder.payload ?? {})
        },
        visibility: "ops",
        propertyId: reminder.property_id,
        unitId: reminder.unit_id,
        href: reminder.href
      },
      { dispatchNow: true }
    );
  }

  // Prefer bus fan-out when the fact event is Notification Center–eligible (avoid double notify).
  const busWillNotify =
    reminder.action === "emit_and_notify" && NOTIFY_ELIGIBLE_EVENT_TYPES.has(eventType);

  if (
    (reminder.action === "notify" || reminder.action === "emit_and_notify") &&
    !busWillNotify
  ) {
    const recipients = reminder.recipient_principal_id ? [reminder.recipient_principal_id] : [];
    if (recipients.length > 0) {
      await deliverViaNotificationCenter(
        {
          organizationId: reminder.organization_id,
          recipientUserIds: recipients,
          category: (reminder.notify_category as NotificationCategory) ?? "system",
          priority: reminder.notify_priority ?? "normal",
          title,
          body,
          eventKey: `reminder:${reminder.idempotency_key}`,
          sourceEntityType: reminder.subject_type,
          sourceEntityId: reminder.subject_id,
          propertyId: reminder.property_id,
          unitId: reminder.unit_id,
          href: reminder.href,
          metadata: { reminderId: reminder.reminder_id }
        },
        db
      );
    }
  }

  if (eventType !== "ops.reminder.fired") {
    await emitOpsDomainEvent(
      db,
      {
        eventType: "ops.reminder.fired",
        organizationId: reminder.organization_id,
        subject: { type: reminder.subject_type, id: reminder.subject_id },
        actor: { actor_type: "system" },
        summary: "Reminder fired",
        payload: {
          summary: "Reminder fired",
          reminderId: reminder.reminder_id,
          reminderType: reminder.reminder_type,
          idempotencyKey: reminder.idempotency_key,
          factEventType: eventType
        },
        visibility: "ops"
      },
      { dispatchNow: false }
    );
  }

  const now = new Date().toISOString();
  const { error } = await db
    .from("ops_reminders")
    .update({ status: "fired", fired_at: now, updated_at: now, last_error: null })
    .eq("reminder_id", reminder.reminder_id)
    .in("status", ["processing", "scheduled"]);

  if (error) throw new Error(error.message);
}

/**
 * Process due reminders (claimed via SKIP LOCKED). Retry-safe / idempotent.
 */
export async function processDueReminders(limit = 50): Promise<{
  claimed: number;
  fired: number;
  failed: number;
  consolidated: number;
}> {
  const db = serviceClient();
  const { data, error } = await db.rpc("ops_claim_due_reminders", {
    p_limit: limit,
    p_claimer: "reminder-engine"
  });

  if (error) throw new Error(error.message ?? "Failed to claim due reminders");

  const claimed = (data ?? []) as OpsReminderRow[];
  if (claimed.length === 0) {
    return { claimed: 0, fired: 0, failed: 0, consolidated: 0 };
  }

  const forConsolidation: ReminderForConsolidation[] = claimed.map((r) => ({
    reminderId: r.reminder_id,
    organizationId: r.organization_id,
    recipientPrincipalId: r.recipient_principal_id,
    priority: r.notify_priority ?? "normal",
    consolidationKey: r.consolidation_key,
    title: r.title,
    fireAt: r.fire_at
  }));

  const plan = consolidateDueReminders(forConsolidation);
  let fired = 0;
  let failed = 0;
  let consolidated = 0;

  const byId = new Map(claimed.map((r) => [r.reminder_id, r]));

  for (const discreteId of plan.discreteReminderIds) {
    const reminder = byId.get(discreteId);
    if (!reminder) continue;
    try {
      await fireReminder(db, reminder);
      fired += 1;
    } catch (err) {
      failed += 1;
      const message = err instanceof Error ? err.message : "fire_failed";
      await db
        .from("ops_reminders")
        .update({
          status: "error",
          last_error: message.slice(0, 2000),
          updated_at: new Date().toISOString()
        })
        .eq("reminder_id", reminder.reminder_id);
    }
  }

  for (const digest of plan.digests) {
    const members = digest.reminderIds
      .map((id) => byId.get(id))
      .filter((r): r is OpsReminderRow => Boolean(r));
    if (members.length === 0) continue;

    const orgId = digest.organizationId;
    const recipient = digest.recipientPrincipalId;
    try {
      if (recipient) {
        await deliverViaNotificationCenter(
          {
            organizationId: orgId,
            recipientUserIds: [recipient],
            category: "system",
            priority: "normal",
            title: digest.title,
            body: digest.body,
            eventKey: `reminder-digest:${digest.consolidationKey}:${digest.reminderIds[0]}`,
            sourceEntityType: "reminder_digest",
            sourceEntityId: digest.consolidationKey,
            metadata: { reminderIds: digest.reminderIds, consolidated: true }
          },
          db
        );
      }

      const now = new Date().toISOString();
      for (const member of members) {
        await emitOpsDomainEvent(
          db,
          {
            eventType: "ops.reminder.fired",
            organizationId: orgId,
            subject: { type: member.subject_type, id: member.subject_id },
            actor: { actor_type: "system" },
            summary: "Reminder fired (consolidated digest)",
            payload: {
              summary: "Reminder fired (consolidated digest)",
              reminderId: member.reminder_id,
              consolidated: true,
              consolidationKey: digest.consolidationKey,
              idempotencyKey: member.idempotency_key
            },
            visibility: "ops"
          },
          { dispatchNow: false }
        );
        await db
          .from("ops_reminders")
          .update({ status: "fired", fired_at: now, updated_at: now, last_error: null })
          .eq("reminder_id", member.reminder_id);
        fired += 1;
        consolidated += 1;
      }
    } catch (err) {
      failed += 1;
      const message = err instanceof Error ? err.message : "digest_failed";
      for (const member of members) {
        await db
          .from("ops_reminders")
          .update({
            status: "error",
            last_error: message.slice(0, 2000),
            updated_at: new Date().toISOString()
          })
          .eq("reminder_id", member.reminder_id);
      }
    }
  }

  return { claimed: claimed.length, fired, failed, consolidated };
}
