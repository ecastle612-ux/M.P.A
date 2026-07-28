/**
 * COM-001 Slice C — org health score (0–100), deterministic + idempotent refresh.
 */
import { createServiceRoleServerClient } from "../auth/server";
import { getEntitlementSnapshot } from "../auth/entitlements";
import { getImplementationProgress } from "./progress";
import { emitCommercialOpsEvent } from "./ops-events";
import {
  CS_CADENCE_BY_BAND,
  HEALTH_BAND_MIN_SCORE,
  HEALTH_FACTOR_KEYS,
  type HealthBand,
  type HealthDriver,
  type HealthFactorBreakdown,
  type HealthFactorKey,
  type HealthScoreSnapshot,
  type HealthSignalInput
} from "./health-types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

function serviceClient(): AnyClient {
  const client = createServiceRoleServerClient();
  if (!client) throw new Error("Health score requires SUPABASE_SERVICE_ROLE_KEY");
  return client;
}

export function bandFromScore(score: number): HealthBand {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  if (clamped >= HEALTH_BAND_MIN_SCORE.healthy) return "healthy";
  if (clamped >= HEALTH_BAND_MIN_SCORE.needs_attention) return "needs_attention";
  if (clamped >= HEALTH_BAND_MIN_SCORE.at_risk) return "at_risk";
  return "critical";
}

function emptyBreakdown(): HealthFactorBreakdown {
  return {
    login_frequency: { penalty: 0, available: false, note: "unavailable" },
    feature_adoption: { penalty: 0, available: false, note: "unavailable" },
    ai_usage: { penalty: 0, available: false, note: "unavailable" },
    property_setup: { penalty: 0, available: false, note: "unavailable" },
    payment_status: { penalty: 0, available: false, note: "unavailable" },
    support_requests: { penalty: 0, available: false, note: "unavailable" },
    outstanding_onboarding: { penalty: 0, available: false, note: "unavailable" },
    notification_engagement: { penalty: 0, available: false, note: "unavailable" }
  };
}

function setFactor(
  breakdown: HealthFactorBreakdown,
  factor: HealthFactorKey,
  penalty: number,
  note: string,
  available = true
) {
  breakdown[factor] = { penalty, available, note };
}

/**
 * Deterministic health compute from approved factor set only ([19]).
 * High-weight: payment_status + login_frequency.
 */
export function computeHealthFromSignals(signals: HealthSignalInput): {
  score: number;
  band: HealthBand;
  drivers: HealthDriver[];
  factorBreakdown: HealthFactorBreakdown;
} {
  const breakdown = emptyBreakdown();
  const drivers: HealthDriver[] = [];

  // --- payment_status (high weight) ---
  const saas = (signals.saasStatus ?? "").toLowerCase();
  let paymentPenalty = 0;
  let paymentNote = "active";
  if (saas === "past_due" || saas === "unpaid") {
    paymentPenalty = 35;
    paymentNote = saas === "past_due" ? "Past Due" : "Unpaid";
  } else if (saas === "canceled" || saas === "paused") {
    paymentPenalty = 40;
    paymentNote = saas === "canceled" ? "Canceled" : "Paused";
  } else if (saas === "trialing" || signals.commercialStatus === "trial") {
    paymentPenalty = 0;
    paymentNote = "Trial current";
  } else if (saas === "active") {
    paymentPenalty = 0;
    paymentNote = "Active";
  } else if (!saas) {
    paymentPenalty = 20;
    paymentNote = "No subscription";
  }
  if (signals.commercialStatus === "pending_setup" && paymentPenalty < 10) {
    paymentPenalty = Math.max(paymentPenalty, 8);
    paymentNote = "Pending setup";
  }
  setFactor(breakdown, "payment_status", paymentPenalty, paymentNote);
  if (paymentPenalty > 0) {
    drivers.push({
      code: paymentNote.replace(/\s+/g, "_").toLowerCase(),
      factor: "payment_status",
      label: paymentNote,
      penalty: paymentPenalty
    });
  }

  // --- login_frequency (high weight) ---
  let loginPenalty = 0;
  let loginNote = "unavailable";
  if (signals.orgAdminDaysSinceLogin == null) {
    loginPenalty = 25;
    loginNote = "No Org Admin login recorded";
    setFactor(breakdown, "login_frequency", loginPenalty, loginNote, true);
  } else {
    const days = signals.orgAdminDaysSinceLogin;
    if (days > 21) {
      loginPenalty = 30;
      loginNote = "No login 21d+";
    } else if (days > 14) {
      loginPenalty = 20;
      loginNote = "No login 15–21d";
    } else if (days > 7) {
      loginPenalty = 10;
      loginNote = "No login 8–14d";
    } else {
      loginPenalty = 0;
      loginNote = `Login within ${days}d`;
    }
    setFactor(breakdown, "login_frequency", loginPenalty, loginNote);
  }
  if (loginPenalty > 0) {
    drivers.push({
      code: "login_silence",
      factor: "login_frequency",
      label: loginNote,
      penalty: loginPenalty
    });
  }

  // --- property_setup (Slice B score) ---
  let setupPenalty = 0;
  let setupNote = `${signals.implementationScore}%`;
  if (signals.implementationScore < 25) {
    setupPenalty = 25;
    setupNote = "Setup stalled (<25%)";
  } else if (signals.implementationScore < 55) {
    setupPenalty = 15;
    setupNote = "Setup incomplete (<55%)";
  } else if (signals.implementationScore < 85) {
    setupPenalty = 8;
    setupNote = "Setup in progress (<85%)";
  } else if (!signals.productionReady) {
    setupPenalty = 5;
    setupNote = "Near ready — Finish Setup pending";
  } else {
    setupPenalty = 0;
    setupNote = "Production Ready";
  }
  setFactor(breakdown, "property_setup", setupPenalty, setupNote);
  if (setupPenalty > 0) {
    drivers.push({
      code: "setup_incomplete",
      factor: "property_setup",
      label: setupNote,
      penalty: setupPenalty
    });
  }

  // --- outstanding_onboarding ---
  let onboardingPenalty = 0;
  let onboardingNote = "Clear";
  if (!signals.productionReady && signals.orgAgeDays >= 14) {
    onboardingPenalty = 10;
    onboardingNote = "Aging onboarding tasks";
  }
  setFactor(breakdown, "outstanding_onboarding", onboardingPenalty, onboardingNote);
  if (onboardingPenalty > 0) {
    drivers.push({
      code: "aging_onboarding",
      factor: "outstanding_onboarding",
      label: onboardingNote,
      penalty: onboardingPenalty
    });
  }

  // --- feature_adoption ---
  let adoptionPenalty = 0;
  let adoptionNote = "Not evaluated";
  if (signals.maintenanceEntitled && signals.orgAgeDays >= 14) {
    if (signals.workOrderCount === 0) {
      adoptionPenalty = 10;
      adoptionNote = "Maintenance unused";
    } else {
      adoptionPenalty = 0;
      adoptionNote = "Maintenance adopted";
    }
    setFactor(breakdown, "feature_adoption", adoptionPenalty, adoptionNote);
  } else {
    setFactor(breakdown, "feature_adoption", 0, "Not entitled or too early", signals.maintenanceEntitled);
  }
  if (adoptionPenalty > 0) {
    drivers.push({
      code: "low_feature_adoption",
      factor: "feature_adoption",
      label: adoptionNote,
      penalty: adoptionPenalty
    });
  }

  // --- ai_usage ---
  let aiPenalty = 0;
  let aiNote = "Not entitled";
  if (signals.aiEntitled) {
    if (signals.orgAgeDays >= 14 && signals.aiConversationCount === 0) {
      aiPenalty = 8;
      aiNote = "AI never used";
    } else if (signals.aiConversationCount > 0) {
      aiPenalty = 0;
      aiNote = "AI used";
    } else {
      aiPenalty = 0;
      aiNote = "AI entitled — early org";
    }
    setFactor(breakdown, "ai_usage", aiPenalty, aiNote);
  } else {
    setFactor(breakdown, "ai_usage", 0, "Not entitled", false);
  }
  if (aiPenalty > 0) {
    drivers.push({
      code: "ai_never_used",
      factor: "ai_usage",
      label: aiNote,
      penalty: aiPenalty
    });
  }

  // --- support_requests (as available) ---
  if (signals.openSupportCount == null) {
    setFactor(breakdown, "support_requests", 0, "Signal unavailable", false);
  } else {
    let supportPenalty = 0;
    let supportNote = "Normal";
    if (signals.openSupportCount >= 5) {
      supportPenalty = 12;
      supportNote = "Elevated open support";
    } else if (signals.openSupportCount >= 3) {
      supportPenalty = 6;
      supportNote = "Rising support volume";
    }
    setFactor(breakdown, "support_requests", supportPenalty, supportNote);
    if (supportPenalty > 0) {
      drivers.push({
        code: "support_volume",
        factor: "support_requests",
        label: supportNote,
        penalty: supportPenalty
      });
    }
  }

  // --- notification_engagement (as available) ---
  if (signals.notificationChannelsEnabled == null) {
    setFactor(breakdown, "notification_engagement", 0, "Signal unavailable", false);
  } else if (!signals.notificationChannelsEnabled) {
    setFactor(breakdown, "notification_engagement", 5, "Notifications disabled");
    drivers.push({
      code: "notifications_off",
      factor: "notification_engagement",
      label: "Notifications disabled",
      penalty: 5
    });
  } else {
    setFactor(breakdown, "notification_engagement", 0, "Channels enabled");
  }

  const totalPenalty = HEALTH_FACTOR_KEYS.reduce(
    (sum, key) => sum + breakdown[key].penalty,
    0
  );
  const score = Math.max(0, Math.min(100, 100 - totalPenalty));
  const band = bandFromScore(score);
  drivers.sort((a, b) => b.penalty - a.penalty);

  return {
    score,
    band,
    drivers: drivers.slice(0, 5),
    factorBreakdown: breakdown
  };
}

function mapRow(row: Record<string, unknown>): HealthScoreSnapshot {
  const band = String(row["band"] ?? "healthy") as HealthBand;
  const cadence = CS_CADENCE_BY_BAND[band] ?? CS_CADENCE_BY_BAND.healthy;
  const driversRaw = row["drivers"];
  const drivers: HealthDriver[] = Array.isArray(driversRaw)
    ? (driversRaw as HealthDriver[])
    : [];
  const breakdownRaw = row["factor_breakdown"];
  const factorBreakdown =
    breakdownRaw && typeof breakdownRaw === "object"
      ? (breakdownRaw as HealthFactorBreakdown)
      : emptyBreakdown();
  return {
    organizationId: String(row["organization_id"]),
    score: Number(row["score"] ?? 0),
    band,
    drivers,
    factorBreakdown,
    csCadenceKey: cadence.key,
    csCadenceLabel: cadence.label,
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

async function loadOrgAdminDaysSinceLogin(
  admin: AnyClient,
  organizationId: string,
  nowMs: number
): Promise<number | null> {
  const { data: memberships, error } = await admin
    .from("organization_memberships")
    .select("user_id, roles")
    .eq("organization_id", organizationId)
    .eq("status", "active");
  if (error || !memberships?.length) return null;

  const adminIds = (memberships as Array<{ user_id: string; roles: unknown }>)
    .filter((row) => {
      const roles = Array.isArray(row.roles) ? row.roles.map(String) : [];
      return roles.includes("organization_admin") || roles.includes("property_manager");
    })
    .map((row) => row.user_id);

  if (!adminIds.length) return null;

  let bestMs: number | null = null;
  for (const userId of adminIds.slice(0, 8)) {
    try {
      const { data, error: userError } = await admin.auth.admin.getUserById(userId);
      if (userError || !data?.user?.last_sign_in_at) continue;
      const ts = Date.parse(data.user.last_sign_in_at);
      if (!Number.isFinite(ts)) continue;
      if (bestMs == null || ts > bestMs) bestMs = ts;
    } catch {
      // Best-effort per user.
    }
  }
  if (bestMs == null) return null;
  return Math.max(0, Math.floor((nowMs - bestMs) / 86_400_000));
}

async function loadNotificationChannelsEnabled(
  admin: AnyClient,
  organizationId: string
): Promise<boolean | null> {
  const { data, error } = await admin
    .from("notification_preferences")
    .select("email_enabled, push_enabled, sms_enabled, in_app_enabled")
    .eq("organization_id", organizationId)
    .limit(50);
  if (error) return null;
  if (!data?.length) return null;
  return (data as Array<Record<string, unknown>>).some(
    (row) =>
      Boolean(row["email_enabled"]) ||
      Boolean(row["push_enabled"]) ||
      Boolean(row["sms_enabled"]) ||
      Boolean(row["in_app_enabled"])
  );
}

async function loadSignals(
  organizationId: string,
  nowMs: number
): Promise<HealthSignalInput> {
  const admin = serviceClient();
  const { data: org, error: orgError } = await admin
    .from("organizations")
    .select("id, commercial_status, created_at")
    .eq("id", organizationId)
    .maybeSingle();
  if (orgError || !org) throw new Error("Organization not found");

  const [
    progress,
    entitlements,
    saasRow,
    woCount,
    aiCount,
    adminLoginDays,
    notificationsEnabled
  ] = await Promise.all([
    getImplementationProgress(organizationId, { refresh: false }),
    getEntitlementSnapshot(organizationId, admin),
    admin
      .from("saas_subscriptions")
      .select("status")
      .eq("organization_id", organizationId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then((r: { data: { status?: string } | null }) => r.data),
    countRows(admin, "maintenance_work_orders", organizationId),
    countRows(admin, "ai_conversations", organizationId),
    loadOrgAdminDaysSinceLogin(admin, organizationId, nowMs),
    loadNotificationChannelsEnabled(admin, organizationId)
  ]);

  const createdAt = org.created_at ? Date.parse(String(org.created_at)) : nowMs;
  const orgAgeDays = Number.isFinite(createdAt)
    ? Math.max(0, Math.floor((nowMs - createdAt) / 86_400_000))
    : 0;

  return {
    saasStatus: saasRow?.status != null ? String(saasRow.status) : null,
    commercialStatus:
      org.commercial_status != null ? String(org.commercial_status) : null,
    orgAdminDaysSinceLogin: adminLoginDays,
    implementationScore: progress.score,
    productionReady: progress.highestMilestone === "production_ready",
    workOrderCount: woCount,
    aiConversationCount: aiCount,
    aiEntitled: Boolean(entitlements?.features?.["ai_copilot"]),
    maintenanceEntitled: Boolean(entitlements?.features?.["maintenance"]),
    openSupportCount: null,
    notificationChannelsEnabled: notificationsEnabled,
    orgAgeDays
  };
}

export async function getHealthScore(
  organizationId: string,
  options?: { refresh?: boolean; actorUserId?: string | null }
): Promise<HealthScoreSnapshot> {
  const admin = serviceClient();
  if (options?.refresh !== false) {
    return refreshHealthScore(organizationId, {
      actorUserId: options?.actorUserId ?? null
    });
  }

  const { data, error } = await admin
    .from("commercial_health_scores")
    .select("*")
    .eq("organization_id", organizationId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) {
    return refreshHealthScore(organizationId, {
      actorUserId: options?.actorUserId ?? null
    });
  }
  return mapRow(data as Record<string, unknown>);
}

export async function refreshHealthScore(
  organizationId: string,
  options?: { actorUserId?: string | null }
): Promise<HealthScoreSnapshot> {
  const admin = serviceClient();
  const now = new Date();
  const signals = await loadSignals(organizationId, now.getTime());
  const computed = computeHealthFromSignals(signals);
  const cadence = CS_CADENCE_BY_BAND[computed.band];

  const { data: previous } = await admin
    .from("commercial_health_scores")
    .select("score, band")
    .eq("organization_id", organizationId)
    .maybeSingle();

  const row = {
    organization_id: organizationId,
    score: computed.score,
    band: computed.band,
    drivers: computed.drivers,
    factor_breakdown: computed.factorBreakdown,
    cs_cadence_key: cadence.key,
    computed_at: now.toISOString(),
    updated_at: now.toISOString()
  };

  const { data, error } = await admin
    .from("commercial_health_scores")
    .upsert(row, { onConflict: "organization_id" })
    .select("*")
    .single();
  if (error) throw new Error(error.message ?? "Failed to persist health score");

  const snapshot = mapRow(data as Record<string, unknown>);
  const prevScore = previous ? Number(previous["score"]) : null;
  const prevBand = previous ? String(previous["band"]) : null;
  if (prevScore !== snapshot.score || prevBand !== snapshot.band) {
    await emitCommercialOpsEvent({
      eventType: "commercial.health.score_updated",
      organizationId,
      subjectType: "organization",
      subjectId: organizationId,
      actorUserId: options?.actorUserId,
      summary: `Health ${snapshot.band} (${snapshot.score})`,
      payload: {
        score: snapshot.score,
        band: snapshot.band,
        cs_cadence_key: snapshot.csCadenceKey,
        driver_codes: snapshot.drivers.map((d) => d.code)
      }
    });
  }

  return snapshot;
}
