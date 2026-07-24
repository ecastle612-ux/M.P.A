/**
 * FIN-003 Phase D/E — paid / failed / remittance notifications.
 * Uses Notification Service with intent-scoped eventKey idempotency.
 * Phase E: remittance notify is idempotent even when record already existed (R-D2).
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@mpa/supabase";
import { createServiceRoleServerClient } from "../auth/server";
import { ownerFinancialsHref, settingsPayoutsHref } from "../notifications/deep-links";
import { notify } from "../notifications/service";
import { writeConnectAudit } from "./connect-audit";
import { ensureRemittanceRecord } from "./projections";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

function formatCents(amountCents: number, currency = "usd"): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase()
    }).format(amountCents / 100);
  } catch {
    return `$${(amountCents / 100).toFixed(2)}`;
  }
}

async function loadIntent(organizationId: string, transferIntentId: string): Promise<AnyClient> {
  const admin = createServiceRoleServerClient() as AnyClient;
  const { data, error } = await admin
    .from("transfer_intents")
    .select("*")
    .eq("id", transferIntentId)
    .eq("organization_id", organizationId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

async function propertyName(admin: AnyClient, propertyId: string): Promise<string> {
  const { data } = await admin.from("properties").select("name").eq("id", propertyId).maybeSingle();
  return (data?.name as string | undefined) ?? "your property";
}

/**
 * Notify owner. Idempotent per intent + outcome.
 * Remittance record should already exist from paid persistence (R-D2); ensure is a safety net.
 */
export async function notifyTransferOutcome(input: {
  organizationId: string;
  transferIntentId: string;
  outcome: "paid" | "failed";
  client?: SupabaseClient<Database>;
}): Promise<{ notified: boolean }> {
  const admin = createServiceRoleServerClient() as AnyClient;
  const intent = await loadIntent(input.organizationId, input.transferIntentId);
  if (!intent) return { notified: false };

  const name = await propertyName(admin, intent.property_id);
  const amountLabel = formatCents(intent.amount_cents, intent.currency);
  const client = input.client ?? admin;

  if (input.outcome === "paid") {
    await notify(
      {
        organizationId: input.organizationId,
        category: "financial",
        priority: "normal",
        title: "Owner payout paid",
        body: `${amountLabel} was transferred for ${name}. This reflects a recorded Connect transfer — open Financials for history and remittance details.`,
        eventKey: `payout.transfer.paid:${intent.id}:owner`,
        recipientUserIds: [intent.owner_user_id],
        href: ownerFinancialsHref(),
        sourceEntityType: "transfer_intent",
        sourceEntityId: intent.id,
        channels: { inApp: true, push: false, email: false },
        metadata: {
          purpose: "owner_payout_paid",
          amountCents: intent.amount_cents,
          propertyId: intent.property_id,
          externalTransferId: intent.external_transfer_id
        }
      },
      client
    );

    await writeConnectAudit(
      input.organizationId,
      "transfer_intent",
      intent.id,
      "payout.notify.paid",
      `Paid payout notification for ${amountLabel}`,
      null,
      { ownerUserId: intent.owner_user_id },
      admin
    ).catch((err) => {
      console.error("[FIN-003 Phase E] paid notify audit failed", err);
    });

    // R-D2 — ensure remittance even if paid-path ensure was skipped; notify idempotently
    const remittance = await ensureRemittanceRecord({
      organizationId: input.organizationId,
      transferIntentId: intent.id
    });
    if (remittance) {
      await notify(
        {
          organizationId: input.organizationId,
          category: "financial",
          priority: "normal",
          title: "Payout remittance available",
          body: `A remittance record for ${amountLabel} (${name}) is available in Owner Financials.`,
          eventKey: `payout.remittance.issued:${intent.id}:owner`,
          recipientUserIds: [intent.owner_user_id],
          href: `${ownerFinancialsHref()}#payout-history`,
          sourceEntityType: "payout_remittance_record",
          sourceEntityId: remittance.id,
          channels: { inApp: true, push: false, email: false },
          metadata: {
            purpose: "owner_payout_remittance",
            transferIntentId: intent.id
          }
        },
        client
      );

      await writeConnectAudit(
        input.organizationId,
        "payout_remittance_record",
        remittance.id,
        "payout.notify.remittance",
        `Remittance notification for ${amountLabel}`,
        null,
        { transferIntentId: intent.id, remittanceCreated: remittance.created },
        admin
      ).catch((err) => {
        console.error("[FIN-003 Phase E] remittance notify audit failed", err);
      });
    }
    return { notified: true };
  }

  await notify(
    {
      organizationId: input.organizationId,
      category: "financial",
      priority: "high",
      title: "Owner payout failed",
      body: `A payout of ${amountLabel} for ${name} failed or was reversed. Your property manager can review the payout run. This notification does not retry the transfer.`,
      eventKey: `payout.transfer.failed:${intent.id}:owner`,
      recipientUserIds: [intent.owner_user_id],
      href: ownerFinancialsHref(),
      sourceEntityType: "transfer_intent",
      sourceEntityId: intent.id,
      channels: { inApp: true, push: false, email: false },
      metadata: {
        purpose: "owner_payout_failed",
        amountCents: intent.amount_cents,
        propertyId: intent.property_id,
        failureReason: intent.failure_reason
      }
    },
    client
  );

  await writeConnectAudit(
    input.organizationId,
    "transfer_intent",
    intent.id,
    "payout.notify.failed",
    `Failed payout notification for ${amountLabel}`,
    null,
    { ownerUserId: intent.owner_user_id, failureReason: intent.failure_reason },
    admin
  ).catch((err) => {
    console.error("[FIN-003 Phase E] failed notify audit failed", err);
  });

  return { notified: true };
}

/** Optional PM in-app tip when a run finishes with failures (idempotent per run). */
export async function notifyPmRunAttention(input: {
  organizationId: string;
  payoutRunId: string;
  actorUserId: string | null;
  failedCount: number;
  needsReconcileCount: number;
  client?: SupabaseClient<Database>;
}): Promise<void> {
  if (input.failedCount <= 0 && input.needsReconcileCount <= 0) return;
  if (!input.actorUserId) return;
  const client = input.client ?? (createServiceRoleServerClient() as AnyClient);
  await notify(
    {
      organizationId: input.organizationId,
      category: "financial",
      priority: "high",
      title: "Payout run needs attention",
      body: `Payout run ${input.payoutRunId.slice(0, 8)}… has ${input.failedCount} failed and ${input.needsReconcileCount} needing reconcile. Open Owner payouts settings to review.`,
      eventKey: `payout.run.attention:${input.payoutRunId}:pm`,
      recipientUserIds: [input.actorUserId],
      href: settingsPayoutsHref(),
      sourceEntityType: "payout_run",
      sourceEntityId: input.payoutRunId,
      channels: { inApp: true, push: false, email: false },
      metadata: {
        purpose: "pm_payout_run_attention",
        failedCount: input.failedCount,
        needsReconcileCount: input.needsReconcileCount
      }
    },
    client
  );
}
