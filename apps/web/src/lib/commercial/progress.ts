/**
 * COM-001 Slice B — org implementation score (0–100%), idempotent refresh.
 */
import { createServiceRoleServerClient } from "../auth/server";
import { organizationHasReadyRecoveryContact } from "../auth/recovery/recovery-contact";
import { emitCommercialOpsEvent } from "./ops-events";
import {
  IMPLEMENTATION_MILESTONES,
  MILESTONE_LABEL,
  MILESTONE_SCORE,
  type ImplementationMilestone,
  type ImplementationProgressSnapshot,
  type MilestoneState
} from "./progress-types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

function serviceClient(): AnyClient {
  const client = createServiceRoleServerClient();
  if (!client) throw new Error("Implementation progress requires SUPABASE_SERVICE_ROLE_KEY");
  return client;
}

function emptyMilestone(): MilestoneState {
  return { complete: false, waived: false, completedAt: null, deferralReason: null };
}

function emptyMilestones(): Record<ImplementationMilestone, MilestoneState> {
  return {
    purchased: emptyMilestone(),
    organization_created: emptyMilestone(),
    stripe_connected: emptyMilestone(),
    properties_imported: emptyMilestone(),
    units_imported: emptyMilestone(),
    tenants_imported: emptyMilestone(),
    team_invited: emptyMilestone(),
    production_ready: emptyMilestone()
  };
}

function markComplete(state: MilestoneState, at: string): MilestoneState {
  if (state.complete || state.waived) return state;
  return { ...state, complete: true, completedAt: at };
}

function parseStoredMilestones(
  raw: unknown
): Record<ImplementationMilestone, MilestoneState> {
  const base = emptyMilestones();
  if (!raw || typeof raw !== "object") return base;
  const obj = raw as Record<string, unknown>;
  for (const key of IMPLEMENTATION_MILESTONES) {
    const row = obj[key];
    if (!row || typeof row !== "object") continue;
    const r = row as Record<string, unknown>;
    base[key] = {
      complete: Boolean(r["complete"]),
      waived: Boolean(r["waived"]),
      completedAt: r["completedAt"] != null ? String(r["completedAt"]) : null,
      deferralReason: r["deferralReason"] != null ? String(r["deferralReason"]) : null
    };
  }
  return base;
}

function milestoneSatisfied(state: MilestoneState): boolean {
  return state.complete || state.waived;
}

function deriveHighest(
  milestones: Record<ImplementationMilestone, MilestoneState>
): { highest: ImplementationMilestone | "none"; score: number } {
  let highest: ImplementationMilestone | "none" = "none";
  let score = 0;
  for (const key of IMPLEMENTATION_MILESTONES) {
    if (!milestoneSatisfied(milestones[key])) break;
    highest = key;
    score = MILESTONE_SCORE[key];
  }
  // Production Ready hard gate: never report 100 without production_ready satisfied.
  if (highest === "production_ready" && !milestoneSatisfied(milestones.production_ready)) {
    highest = "team_invited";
    score = MILESTONE_SCORE.team_invited;
  }
  if (!milestoneSatisfied(milestones.production_ready) && score >= 100) {
    score = MILESTONE_SCORE.team_invited;
    highest = "team_invited";
  }
  return { highest, score };
}

function nextStepFor(
  milestones: Record<ImplementationMilestone, MilestoneState>
): { nextStep: string | null; blockers: string[] } {
  const blockers: string[] = [];
  for (const key of IMPLEMENTATION_MILESTONES) {
    if (milestoneSatisfied(milestones[key])) continue;
    if (key === "production_ready") {
      blockers.push("Finish Setup requires verified secondary recovery contact");
    }
    return {
      nextStep: `Complete: ${MILESTONE_LABEL[key]}`,
      blockers
    };
  }
  return { nextStep: null, blockers: [] };
}

function mapRow(row: Record<string, unknown>): ImplementationProgressSnapshot {
  const milestones = parseStoredMilestones(row["milestones"]);
  const highestRaw = String(row["highest_milestone"] ?? "none");
  const highest =
    highestRaw === "none" ||
    (IMPLEMENTATION_MILESTONES as readonly string[]).includes(highestRaw)
      ? (highestRaw as ImplementationMilestone | "none")
      : "none";
  const blockersRaw = row["blockers"];
  const blockers = Array.isArray(blockersRaw)
    ? blockersRaw.map((b) => String(b))
    : [];
  return {
    organizationId: String(row["organization_id"]),
    score: Number(row["score"] ?? 0),
    highestMilestone: highest,
    milestones,
    nextStep: row["next_step"] != null ? String(row["next_step"]) : null,
    blockers,
    computedAt: String(row["computed_at"] ?? "")
  };
}

async function countRows(
  admin: AnyClient,
  table: string,
  organizationId: string
): Promise<number> {
  const { count, error } = await admin
    .from(table)
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId);
  if (error) return 0;
  return count ?? 0;
}

async function loadSignals(organizationId: string): Promise<{
  purchased: boolean;
  organizationCreated: boolean;
  stripeConnected: boolean;
  properties: number;
  units: number;
  tenants: number;
  invitations: number;
  commercialActive: boolean;
  recoveryReady: boolean;
}> {
  const admin = serviceClient();
  const [
    { data: org },
    { data: activation },
    { data: connect },
    properties,
    units,
    tenants,
    invitations,
    subCount,
    recoveryReady,
    memberships
  ] = await Promise.all([
    admin
      .from("organizations")
      .select("id, commercial_status")
      .eq("id", organizationId)
      .maybeSingle(),
    admin
      .from("commercial_activation_requests")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("status", "completed")
      .limit(1)
      .maybeSingle(),
    admin
      .from("connect_accounts")
      .select("id, charges_enabled, status")
      .eq("organization_id", organizationId)
      .limit(5),
    countRows(admin, "properties", organizationId),
    countRows(admin, "units", organizationId),
    countRows(admin, "tenants", organizationId),
    admin
      .from("organization_invitations")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .neq("status", "revoked"),
    countRows(admin, "saas_subscriptions", organizationId),
    organizationHasReadyRecoveryContact(organizationId),
    admin
      .from("organization_memberships")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("status", "active")
  ]);

  if (!org) throw new Error("Organization not found");

  const stripeConnected = ((connect ?? []) as Array<Record<string, unknown>>).some(
    (row) =>
      row["charges_enabled"] === true ||
      String(row["status"] ?? "") === "eligible" ||
      String(row["status"] ?? "") === "connected"
  );

  const inviteCount = invitations.count ?? 0;
  const memberCount = memberships.count ?? 0;

  return {
    purchased: Boolean(activation) || subCount > 0,
    organizationCreated: true,
    stripeConnected,
    properties,
    units,
    tenants,
    invitations: Math.max(inviteCount, memberCount > 1 ? 1 : 0),
    commercialActive: String(org.commercial_status ?? "") === "active",
    recoveryReady
  };
}

/**
 * Recompute and persist implementation score from live signals + stored waivers.
 * Idempotent: same inputs yield the same stored snapshot.
 */
export async function refreshImplementationProgress(
  organizationId: string,
  options?: { actorUserId?: string | null | undefined }
): Promise<ImplementationProgressSnapshot> {
  const admin = serviceClient();
  const { data: existing } = await admin
    .from("commercial_implementation_progress")
    .select("*")
    .eq("organization_id", organizationId)
    .maybeSingle();

  const milestones = parseStoredMilestones(existing?.milestones);
  const signals = await loadSignals(organizationId);
  const now = new Date().toISOString();

  if (signals.purchased) milestones.purchased = markComplete(milestones.purchased, now);
  if (signals.organizationCreated) {
    milestones.organization_created = markComplete(milestones.organization_created, now);
  }
  if (signals.stripeConnected) {
    milestones.stripe_connected = markComplete(milestones.stripe_connected, now);
  }
  if (signals.properties > 0) {
    milestones.properties_imported = markComplete(milestones.properties_imported, now);
  }
  if (signals.units > 0) {
    milestones.units_imported = markComplete(milestones.units_imported, now);
  }
  if (signals.tenants > 0) {
    milestones.tenants_imported = markComplete(milestones.tenants_imported, now);
  }
  if (signals.invitations > 0) {
    milestones.team_invited = markComplete(milestones.team_invited, now);
  }

  // Production Ready: AUTH Finish Setup + recovery contact (IP-03 · IP-04).
  if (signals.commercialActive && signals.recoveryReady) {
    milestones.production_ready = markComplete(milestones.production_ready, now);
  } else if (milestones.production_ready.complete && !signals.commercialActive) {
    milestones.production_ready = {
      ...milestones.production_ready,
      complete: false,
      completedAt: null
    };
  }

  const { highest, score } = deriveHighest(milestones);
  const { nextStep, blockers } = nextStepFor(milestones);

  if (!signals.recoveryReady && milestoneSatisfied(milestones.team_invited)) {
    if (!blockers.includes("Secondary recovery contact not ready")) {
      blockers.push("Secondary recovery contact not ready");
    }
  }

  const previousScore = existing ? Number(existing.score ?? 0) : null;
  const previousHighest = existing ? String(existing.highest_milestone ?? "none") : null;

  const { data, error } = await admin
    .from("commercial_implementation_progress")
    .upsert(
      {
        organization_id: organizationId,
        score,
        highest_milestone: highest,
        milestones,
        next_step: nextStep,
        blockers,
        computed_at: now
      },
      { onConflict: "organization_id" }
    )
    .select("*")
    .single();

  if (error || !data) throw new Error(error?.message ?? "Failed to persist implementation progress");

  const snapshot = mapRow(data as Record<string, unknown>);

  if (previousScore !== score || previousHighest !== highest) {
    await emitCommercialOpsEvent({
      eventType: "commercial.implementation.score_updated",
      organizationId,
      subjectType: "organization",
      subjectId: organizationId,
      actorUserId: options?.actorUserId,
      summary: `Implementation score ${score}% (${highest})`,
      payload: {
        score,
        highestMilestone: highest,
        previousScore,
        previousHighest
      }
    });
  }

  // COM-001 Slice C — material event: refresh health (best-effort; avoid import cycle).
  void import("./health")
    .then(({ refreshHealthScore }) =>
      refreshHealthScore(organizationId, { actorUserId: options?.actorUserId ?? null })
    )
    .catch(() => undefined);

  return snapshot;
}

export async function getImplementationProgress(
  organizationId: string,
  options?: { refresh?: boolean | undefined; actorUserId?: string | null | undefined }
): Promise<ImplementationProgressSnapshot> {
  if (options?.refresh !== false) {
    return refreshImplementationProgress(organizationId, {
      actorUserId: options?.actorUserId
    });
  }
  const admin = serviceClient();
  const { data, error } = await admin
    .from("commercial_implementation_progress")
    .select("*")
    .eq("organization_id", organizationId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) {
    return refreshImplementationProgress(organizationId, {
      actorUserId: options?.actorUserId
    });
  }
  return mapRow(data as Record<string, unknown>);
}

export async function waiveOrDeferMilestone(input: {
  organizationId: string;
  milestone: ImplementationMilestone;
  mode: "waive" | "defer" | "solo_ack";
  reason?: string | null | undefined;
  actorUserId?: string | null | undefined;
}): Promise<ImplementationProgressSnapshot> {
  if (input.milestone === "production_ready") {
    throw new Error("Production Ready cannot be waived; complete Finish Setup + recovery contact");
  }
  if (input.milestone === "purchased" || input.milestone === "organization_created") {
    throw new Error("Purchased and Organization Created cannot be waived");
  }

  const admin = serviceClient();
  const current = await getImplementationProgress(input.organizationId, { refresh: true });
  const milestones = { ...current.milestones };
  const now = new Date().toISOString();
  const reason = input.reason?.trim() || null;

  if (input.mode === "solo_ack" && input.milestone !== "team_invited") {
    throw new Error("Solo admin acknowledgment applies only to Team Invited");
  }

  milestones[input.milestone] = {
    complete: input.mode === "solo_ack" ? true : milestones[input.milestone].complete,
    waived: input.mode === "waive" || input.mode === "defer",
    completedAt: now,
    deferralReason: reason ?? (input.mode === "solo_ack" ? "solo_admin_acknowledgment" : null)
  };

  const { highest, score } = deriveHighest(milestones);
  const { nextStep, blockers } = nextStepFor(milestones);

  const { error } = await admin.from("commercial_implementation_progress").upsert(
    {
      organization_id: input.organizationId,
      score,
      highest_milestone: highest,
      milestones,
      next_step: nextStep,
      blockers,
      computed_at: now
    },
    { onConflict: "organization_id" }
  );
  if (error) throw new Error(error.message);

  await emitCommercialOpsEvent({
    eventType: "commercial.implementation.milestone_updated",
    organizationId: input.organizationId,
    subjectType: "organization",
    subjectId: input.organizationId,
    actorUserId: input.actorUserId,
    summary: `Milestone ${input.milestone} ${input.mode}`,
    payload: {
      milestone: input.milestone,
      mode: input.mode,
      score
    }
  });

  return refreshImplementationProgress(input.organizationId, {
    actorUserId: input.actorUserId
  });
}

/** Pure helper for unit tests — highest completed milestone score. */
export function scoreFromMilestones(
  milestones: Record<ImplementationMilestone, MilestoneState>
): number {
  return deriveHighest(milestones).score;
}
