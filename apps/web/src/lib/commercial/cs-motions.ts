/**
 * COM-001 Slice D — CS 30/90 motion automation (idempotent due hooks).
 */
import { createServiceRoleServerClient } from "../auth/server";
import { getHealthScore } from "./health";
import { emitCommercialOpsEvent } from "./ops-events";
import { appendCommunicationTimeline } from "./timeline";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

export const CS_MOTION_KEYS = ["day_30", "day_90"] as const;
export type CsMotionKey = (typeof CS_MOTION_KEYS)[number];

export type CsMotionStatus = "scheduled" | "due" | "completed" | "skipped";

export type CsMotionSnapshot = {
  organizationId: string;
  motionKey: CsMotionKey;
  status: CsMotionStatus;
  dueAt: string;
  completedAt: string | null;
  dueEmittedAt: string | null;
  healthBandAtDue: string | null;
  notes: string | null;
};

function serviceClient(): AnyClient {
  const client = createServiceRoleServerClient();
  if (!client) throw new Error("CS motions require SUPABASE_SERVICE_ROLE_KEY");
  return client;
}

function addDays(iso: string, days: number): string {
  const d = new Date(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString();
}

function mapRow(row: Record<string, unknown>): CsMotionSnapshot {
  return {
    organizationId: String(row["organization_id"]),
    motionKey: String(row["motion_key"]) as CsMotionKey,
    status: String(row["status"] ?? "scheduled") as CsMotionStatus,
    dueAt: String(row["due_at"]),
    completedAt: row["completed_at"] != null ? String(row["completed_at"]) : null,
    dueEmittedAt: row["due_emitted_at"] != null ? String(row["due_emitted_at"]) : null,
    healthBandAtDue:
      row["health_band_at_due"] != null ? String(row["health_band_at_due"]) : null,
    notes: row["notes"] != null ? String(row["notes"]) : null
  };
}

/**
 * Schedule 30/90 motions from Active baseline (Finish Setup / Active).
 * Idempotent upsert — does not reset completed motions.
 */
export async function scheduleCsMotions(input: {
  organizationId: string;
  activeAt?: string;
  actorUserId?: string | null;
}): Promise<CsMotionSnapshot[]> {
  const admin = serviceClient();
  const baseline = input.activeAt ?? new Date().toISOString();
  const out: CsMotionSnapshot[] = [];

  for (const key of CS_MOTION_KEYS) {
    const days = key === "day_30" ? 30 : 90;
    const dueAt = addDays(baseline, days);

    const { data: existing } = await admin
      .from("commercial_cs_motions")
      .select("*")
      .eq("organization_id", input.organizationId)
      .eq("motion_key", key)
      .maybeSingle();

    if (existing && String(existing["status"]) === "completed") {
      out.push(mapRow(existing as Record<string, unknown>));
      continue;
    }

    const { data, error } = await admin
      .from("commercial_cs_motions")
      .upsert(
        {
          organization_id: input.organizationId,
          motion_key: key,
          status: existing ? String(existing["status"]) : "scheduled",
          due_at: existing?.["due_at"] ?? dueAt,
          updated_at: new Date().toISOString()
        },
        { onConflict: "organization_id,motion_key" }
      )
      .select("*")
      .single();
    if (error || !data) throw new Error(error?.message ?? "Failed to schedule CS motion");
    out.push(mapRow(data as Record<string, unknown>));
  }

  await emitCommercialOpsEvent({
    eventType: "commercial.cs_motion.scheduled",
    organizationId: input.organizationId,
    subjectType: "organization",
    subjectId: input.organizationId,
    actorUserId: input.actorUserId ?? null,
    summary: "CS 30/90 motions scheduled",
    payload: {
      motion_keys: CS_MOTION_KEYS,
      baseline
    }
  });

  return out;
}

export async function listCsMotions(
  organizationId: string
): Promise<CsMotionSnapshot[]> {
  const admin = serviceClient();
  const { data, error } = await admin
    .from("commercial_cs_motions")
    .select("*")
    .eq("organization_id", organizationId)
    .order("due_at", { ascending: true });
  if (error) throw new Error(error.message);
  return ((data ?? []) as Array<Record<string, unknown>>).map(mapRow);
}

/**
 * Refresh due status and emit secret-free OPS once per motion (retry-safe).
 */
export async function refreshCsMotionDueHooks(input: {
  organizationId: string;
  actorUserId?: string | null;
  nowMs?: number;
}): Promise<CsMotionSnapshot[]> {
  const admin = serviceClient();
  const nowMs = input.nowMs ?? Date.now();
  const motions = await listCsMotions(input.organizationId);
  if (!motions.length) {
    return scheduleCsMotions({
      organizationId: input.organizationId,
      ...(input.actorUserId !== undefined ? { actorUserId: input.actorUserId } : {})
    });
  }

  let healthBand: string | null = null;
  try {
    const health = await getHealthScore(input.organizationId, { refresh: false });
    healthBand = health.band;
  } catch {
    healthBand = null;
  }

  const out: CsMotionSnapshot[] = [];
  for (const motion of motions) {
    if (motion.status === "completed" || motion.status === "skipped") {
      out.push(motion);
      continue;
    }
    const dueMs = Date.parse(motion.dueAt);
    const isDue = Number.isFinite(dueMs) && dueMs <= nowMs;
    if (!isDue) {
      out.push(motion);
      continue;
    }

    const nowIso = new Date(nowMs).toISOString();
    const alreadyEmitted = Boolean(motion.dueEmittedAt);
    const { data, error } = await admin
      .from("commercial_cs_motions")
      .update({
        status: "due",
        due_emitted_at: motion.dueEmittedAt ?? nowIso,
        health_band_at_due: healthBand,
        updated_at: nowIso
      })
      .eq("organization_id", input.organizationId)
      .eq("motion_key", motion.motionKey)
      .select("*")
      .single();
    if (error || !data) throw new Error(error?.message ?? "Failed to mark CS motion due");
    const updated = mapRow(data as Record<string, unknown>);
    out.push(updated);

    if (!alreadyEmitted) {
      await emitCommercialOpsEvent({
        eventType: "commercial.cs_motion.due",
        organizationId: input.organizationId,
        subjectType: "organization",
        subjectId: input.organizationId,
        actorUserId: input.actorUserId ?? null,
        summary: `CS motion due ${motion.motionKey}`,
        payload: {
          motion_key: motion.motionKey,
          health_band: healthBand
        }
      });
      await appendCommunicationTimeline({
        organizationId: input.organizationId,
        channel: "system",
        entryType: "customer_success_check_in",
        templateKey: `cs_motion.${motion.motionKey}.due`,
        direction: "outbound",
        actorType: "system",
        deliveryStatus: "n_a",
        summary: `CS ${motion.motionKey.replace("_", "-")} check-in due`,
        metadata: { motion_key: motion.motionKey, health_band: healthBand },
        actorEmitUserId: input.actorUserId ?? null
      });
    }
  }
  return out;
}

export async function completeCsMotion(input: {
  organizationId: string;
  motionKey: CsMotionKey;
  notes?: string | null;
  actorUserId?: string | null;
  skip?: boolean;
}): Promise<CsMotionSnapshot> {
  if (!(CS_MOTION_KEYS as readonly string[]).includes(input.motionKey)) {
    throw new Error("Unknown CS motion key");
  }
  const admin = serviceClient();
  const now = new Date().toISOString();
  const { data: existing } = await admin
    .from("commercial_cs_motions")
    .select("*")
    .eq("organization_id", input.organizationId)
    .eq("motion_key", input.motionKey)
    .maybeSingle();

  const { data, error } = await admin
    .from("commercial_cs_motions")
    .upsert(
      {
        organization_id: input.organizationId,
        motion_key: input.motionKey,
        status: input.skip ? "skipped" : "completed",
        due_at: existing?.["due_at"] ?? now,
        due_emitted_at: existing?.["due_emitted_at"] ?? null,
        health_band_at_due: existing?.["health_band_at_due"] ?? null,
        completed_at: now,
        notes: input.notes ?? existing?.["notes"] ?? null,
        updated_at: now
      },
      { onConflict: "organization_id,motion_key" }
    )
    .select("*")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Failed to complete CS motion");

  const snap = mapRow(data as Record<string, unknown>);
  await emitCommercialOpsEvent({
    eventType: "commercial.cs_motion.completed",
    organizationId: input.organizationId,
    subjectType: "organization",
    subjectId: input.organizationId,
    actorUserId: input.actorUserId ?? null,
    summary: `CS motion ${input.skip ? "skipped" : "completed"} ${input.motionKey}`,
    payload: {
      motion_key: input.motionKey,
      status: snap.status
    }
  });
  return snap;
}
