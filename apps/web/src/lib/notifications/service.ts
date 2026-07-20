import { createAuthServerComponentClient } from "../auth/server";
import {
  sendWorkflowEmail,
  templateKeyForNotify
} from "../integrations/email/delivery";
import { resolveUserEmailAddress } from "../integrations/email/resolve-recipient";
import { getNotificationProvider } from "../integrations/notifications/registry";
import {
  buildIdempotencyKey,
  type CreateInAppNotificationInput,
  type InAppNotificationRecord,
  type NotifyInput,
  type PushDeliveryStatus
} from "./contracts";
import { listActiveDevicesForUser } from "./devices";
import { evaluateDeliveryChannels } from "./preferences";
import {
  insertInAppNotificationRow,
  loadEvaluatedPreferences,
  updatePushDeliveryStatus,
  type NotificationDbClient
} from "./server";

type SupabaseClientType = Awaited<ReturnType<typeof createAuthServerComponentClient>>;

function buildInsertInput(
  input: NotifyInput,
  recipientUserId: string,
  idempotencyKey: string,
  reasons: string[],
  pushDeliveryStatus: PushDeliveryStatus,
  extraMetadata?: Record<string, unknown>
): CreateInAppNotificationInput & {
  pushDeliveryStatus?: PushDeliveryStatus;
  idempotencyKey?: string | null;
} {
  const row: CreateInAppNotificationInput & {
    pushDeliveryStatus?: PushDeliveryStatus;
    idempotencyKey?: string | null;
  } = {
    userId: recipientUserId,
    category: input.category,
    priority: input.priority,
    title: input.title,
    body: input.body,
    idempotencyKey,
    metadata: {
      ...(input.metadata ?? {}),
      deliveryReasons: reasons,
      ...(extraMetadata ?? {})
    },
    pushDeliveryStatus
  };
  if (input.href !== undefined) row.href = input.href;
  if (input.sourceEntityType !== undefined) row.sourceEntityType = input.sourceEntityType;
  if (input.sourceEntityId !== undefined) row.sourceEntityId = input.sourceEntityId;
  if (input.propertyId !== undefined) row.propertyId = input.propertyId;
  if (input.unitId !== undefined) row.unitId = input.unitId;
  return row;
}

/**
 * NotificationService — sole public entrypoint for creating notifications.
 * Business modules must call `notify` and never import OneSignal / provider adapters.
 */
export async function notify(
  input: NotifyInput,
  client?: NotificationDbClient | SupabaseClientType
): Promise<InAppNotificationRecord[]> {
  const uniqueRecipients = [...new Set(input.recipientUserIds.filter(Boolean))];
  const results: InAppNotificationRecord[] = [];
  const provider = getNotificationProvider();
  const db =
    client && typeof client === "object" && "from" in client
      ? client
      : await createAuthServerComponentClient();

  for (const recipientUserId of uniqueRecipients) {
    const preferences = await loadEvaluatedPreferences(input.organizationId, recipientUserId, client);
    const decision = evaluateDeliveryChannels({
      preferences,
      category: input.category,
      priority: input.priority,
      propertyId: input.propertyId ?? null,
      ...(input.channels ? { channelOverrides: input.channels } : {})
    });

    // Announcement email fan-out is owned by publishAnnouncement (tenant emails + delivery rows).
    const emailRequested =
      decision.email && input.sourceEntityType !== "announcement";

    if (!decision.inApp && !decision.push && !emailRequested) {
      continue;
    }

    const idempotencyKey = buildIdempotencyKey(input.organizationId, input.eventKey, recipientUserId);
    let record: InAppNotificationRecord | null = null;

    if (decision.inApp) {
      try {
        record = await insertInAppNotificationRow(
          input.organizationId,
          input.actorUserId ?? null,
          buildInsertInput(input, recipientUserId, idempotencyKey, decision.reasons, decision.push ? "pending" : "skipped"),
          client
        );
      } catch (error) {
        console.error("[NotificationService] in-app insert failed", error);
        throw error instanceof Error ? error : new Error("in-app notification insert failed");
      }
    }

    if (decision.push) {
      const devices = await listActiveDevicesForUser(input.organizationId, recipientUserId, client);
      const subscriptionIds = devices
        .map((device) => device.externalSubscriptionId)
        .filter((id): id is string => Boolean(id));

      if (!record) {
        try {
          record = await insertInAppNotificationRow(
            input.organizationId,
            input.actorUserId ?? null,
            buildInsertInput(input, recipientUserId, idempotencyKey, decision.reasons, "pending", {
              inAppSkipped: true
            }),
            client
          );
        } catch {
          continue;
        }
      }

      if (subscriptionIds.length === 0) {
        await updatePushDeliveryStatus(
          input.organizationId,
          record.id,
          { pushDeliveryStatus: "skipped", pushLastError: "no_active_devices" },
          client
        );
        record = { ...record, pushDeliveryStatus: "skipped", pushLastError: "no_active_devices" };
      } else {
        const sendResult = await provider.send({
          organizationId: input.organizationId,
          notificationId: record.id,
          idempotencyKey,
          userId: recipientUserId,
          externalSubscriptionIds: subscriptionIds,
          title: input.title,
          body: input.body,
          category: input.category,
          priority: input.priority,
          href: input.href ?? null,
          data: {
            event_key: input.eventKey
          }
        });

        const status =
          sendResult.status === "queued" || sendResult.status === "sent"
            ? "sent"
            : sendResult.status === "skipped"
              ? "skipped"
              : "failed";

        await updatePushDeliveryStatus(
          input.organizationId,
          record.id,
          {
            pushDeliveryStatus: status,
            pushExternalId: sendResult.externalId ?? null,
            pushLastError: sendResult.errorMessage ?? null
          },
          client
        );
        record = {
          ...record,
          pushDeliveryStatus: status,
          pushExternalId: sendResult.externalId ?? null,
          pushLastError: sendResult.errorMessage ?? null
        };
      }
    }

    if (emailRequested) {
      const recipient = await resolveUserEmailAddress(
        input.organizationId,
        recipientUserId,
        db
      ).catch(() => null);

      if (recipient) {
        if (!record && decision.inApp === false) {
          // Ensure we have a row when only email (+ optional push) was requested.
          try {
            record = await insertInAppNotificationRow(
              input.organizationId,
              input.actorUserId ?? null,
              buildInsertInput(
                input,
                recipientUserId,
                idempotencyKey,
                decision.reasons,
                decision.push ? "pending" : "skipped",
                { emailChannel: true }
              ),
              client
            );
          } catch {
            // Best-effort — email can still send without an in-app row.
          }
        }

        const templateKey = templateKeyForNotify({
          category: input.category,
          eventKey: input.eventKey,
          sourceEntityType: input.sourceEntityType ?? null
        });
        const emailResult = await sendWorkflowEmail({
          organizationId: input.organizationId,
          templateKey,
          idempotencyKey: `${idempotencyKey}:email`,
          to: { email: recipient.email, name: recipient.name },
          subject: input.title,
          body: input.body,
          href: input.href ?? null,
          correlation: {
            notificationId: record?.id ?? null,
            sourceEntityType: input.sourceEntityType ?? null,
            sourceEntityId: input.sourceEntityId ?? null
          }
        });

        if (record) {
          record = {
            ...record,
            metadata: {
              ...record.metadata,
              emailDeliveryStatus: emailResult.status,
              emailExternalId: emailResult.externalId ?? null,
              emailRequestId: emailResult.requestId ?? null,
              emailErrorCode: emailResult.errorCode ?? null
            }
          };
        }
      }
    }

    if (record) results.push(record);
  }

  return results;
}

export const NotificationService = { notify };
