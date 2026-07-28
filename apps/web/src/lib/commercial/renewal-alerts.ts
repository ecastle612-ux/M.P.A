/**
 * COM-001 Slice D — renewal alert hooks (BILL period end · secret-free · retry-safe).
 */
import { createServiceRoleServerClient } from "../auth/server";
import { getOrgSaasSnapshot } from "../saas/server";
import { getHealthScore } from "./health";
import { emitCommercialOpsEvent } from "./ops-events";
import { appendCommunicationTimeline } from "./timeline";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

/** Minimum required: t90, t30, t7 — also schedule t60/t14 when available. */
export const RENEWAL_MILESTONE_KEYS = ["t90", "t60", "t30", "t14", "t7"] as const;
export type RenewalMilestoneKey = (typeof RENEWAL_MILESTONE_KEYS)[number];

const DAYS_BEFORE: Record<RenewalMilestoneKey, number> = {
  t90: 90,
  t60: 60,
  t30: 30,
  t14: 14,
  t7: 7
};

export type RenewalAlertSnapshot = {
  organizationId: string;
  milestoneKey: RenewalMilestoneKey;
  periodEndAt: string;
  dueAt: string;
  status: "pending" | "due" | "emitted" | "dismissed";
  emittedAt: string | null;
};

function serviceClient(): AnyClient {
  const client = createServiceRoleServerClient();
  if (!client) throw new Error("Renewal alerts require SUPABASE_SERVICE_ROLE_KEY");
  return client;
}

function mapRow(row: Record<string, unknown>): RenewalAlertSnapshot {
  return {
    organizationId: String(row["organization_id"]),
    milestoneKey: String(row["milestone_key"]) as RenewalMilestoneKey,
    periodEndAt: String(row["period_end_at"]),
    dueAt: String(row["due_at"]),
    status: String(row["status"] ?? "pending") as RenewalAlertSnapshot["status"],
    emittedAt: row["emitted_at"] != null ? String(row["emitted_at"]) : null
  };
}

function dueAtFor(periodEndIso: string, key: RenewalMilestoneKey): string {
  const end = new Date(periodEndIso);
  end.setUTCDate(end.getUTCDate() - DAYS_BEFORE[key]);
  return end.toISOString();
}

/**
 * Sync renewal alert rows from BILL current_period_end. Idempotent per period.
 */
export async function syncRenewalAlerts(input: {
  organizationId: string;
  actorUserId?: string | null;
}): Promise<RenewalAlertSnapshot[]> {
  const admin = serviceClient();
  const snapshot = await getOrgSaasSnapshot(input.organizationId);
  const periodEnd = snapshot.subscription?.currentPeriodEnd;
  if (!periodEnd || !snapshot.subscription) {
    return [];
  }
  if (
    snapshot.subscription.status === "canceled" ||
    snapshot.subscription.cancelAtPeriodEnd
  ) {
    // Still allow alerts for the current period end; cancel-at-period-end is a renewal event.
  }

  const out: RenewalAlertSnapshot[] = [];
  for (const key of RENEWAL_MILESTONE_KEYS) {
    const dueAt = dueAtFor(periodEnd, key);
    const { data: existing } = await admin
      .from("commercial_renewal_alerts")
      .select("*")
      .eq("organization_id", input.organizationId)
      .eq("milestone_key", key)
      .eq("period_end_at", periodEnd)
      .maybeSingle();
    if (existing) {
      out.push(mapRow(existing as Record<string, unknown>));
      continue;
    }
    const { data, error } = await admin
      .from("commercial_renewal_alerts")
      .insert({
        organization_id: input.organizationId,
        milestone_key: key,
        period_end_at: periodEnd,
        due_at: dueAt,
        status: "pending",
        updated_at: new Date().toISOString()
      })
      .select("*")
      .single();
    if (error || !data) throw new Error(error?.message ?? "Failed to sync renewal alert");
    out.push(mapRow(data as Record<string, unknown>));
  }
  return out;
}

export async function listRenewalAlerts(
  organizationId: string
): Promise<RenewalAlertSnapshot[]> {
  const admin = serviceClient();
  const { data, error } = await admin
    .from("commercial_renewal_alerts")
    .select("*")
    .eq("organization_id", organizationId)
    .order("due_at", { ascending: true });
  if (error) throw new Error(error.message);
  return ((data ?? []) as Array<Record<string, unknown>>).map(mapRow);
}

/**
 * Mark due milestones and emit OPS once (retry-safe via emitted_at).
 */
export async function refreshRenewalAlertDueHooks(input: {
  organizationId: string;
  actorUserId?: string | null;
  nowMs?: number;
}): Promise<RenewalAlertSnapshot[]> {
  const admin = serviceClient();
  const nowMs = input.nowMs ?? Date.now();
  await syncRenewalAlerts({
    organizationId: input.organizationId,
    ...(input.actorUserId !== undefined ? { actorUserId: input.actorUserId } : {})
  });
  const alerts = await listRenewalAlerts(input.organizationId);

  let healthBand: string | null = null;
  try {
    healthBand = (await getHealthScore(input.organizationId, { refresh: false })).band;
  } catch {
    healthBand = null;
  }

  const out: RenewalAlertSnapshot[] = [];
  for (const alert of alerts) {
    if (alert.status === "emitted" || alert.status === "dismissed") {
      out.push(alert);
      continue;
    }
    const dueMs = Date.parse(alert.dueAt);
    if (!Number.isFinite(dueMs) || dueMs > nowMs) {
      out.push(alert);
      continue;
    }

    const nowIso = new Date(nowMs).toISOString();
    const { data, error } = await admin
      .from("commercial_renewal_alerts")
      .update({
        status: "emitted",
        emitted_at: alert.emittedAt ?? nowIso,
        updated_at: nowIso
      })
      .eq("organization_id", input.organizationId)
      .eq("milestone_key", alert.milestoneKey)
      .eq("period_end_at", alert.periodEndAt)
      .select("*")
      .single();
    if (error || !data) throw new Error(error?.message ?? "Failed to emit renewal alert");
    const updated = mapRow(data as Record<string, unknown>);
    out.push(updated);

    if (!alert.emittedAt) {
      await emitCommercialOpsEvent({
        eventType: "commercial.renewal.alert_due",
        organizationId: input.organizationId,
        subjectType: "organization",
        subjectId: input.organizationId,
        actorUserId: input.actorUserId ?? null,
        summary: `Renewal alert ${alert.milestoneKey}`,
        payload: {
          milestone_key: alert.milestoneKey,
          period_end_at: alert.periodEndAt,
          health_band: healthBand
        }
      });
      await appendCommunicationTimeline({
        organizationId: input.organizationId,
        channel: "system",
        entryType: "renewal_notice",
        templateKey: `renewal.${alert.milestoneKey}.due`,
        direction: "outbound",
        actorType: "system",
        deliveryStatus: "n_a",
        summary: `Renewal reminder ${alert.milestoneKey.toUpperCase()}`,
        metadata: {
          milestone_key: alert.milestoneKey,
          period_end_at: alert.periodEndAt
        },
        actorEmitUserId: input.actorUserId ?? null
      });
    }
  }
  return out;
}
